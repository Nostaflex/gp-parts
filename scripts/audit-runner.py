#!/usr/bin/env python3
"""
Audit Runner v3 — Script déterministe pour l'audit qualité GP Parts.

Deux modes :
  1. Code only (défaut) : audite le repo GP Parts depuis la racine du projet
     python3 scripts/audit-runner.py
  2. Full : audite aussi l'écosystème Cowork (mémoire, skills, tokens, WCAG)
     python3 scripts/audit-runner.py --workspace /chemin/vers/Claude

Produit un JSON structuré en sortie.
"""

import json, csv, re, os, subprocess, sys
from datetime import datetime

# === CONFIG ===
THRESHOLDS = {
    "console_log_max": 3,
    "any_type_max": 10,
    "eslint_disable_max": 5,
    "placeholder_max": 3,
    "wcag_fails_max": 0,
    "token_file_max": 5000,
    "token_ecosystem_max": 50000,
}

results = {
    "timestamp": datetime.now().isoformat(),
    "version": "3.0",
    "score": 10.0,
    "checks": [],
    "errors": [],
    "warnings": [],
    "token_report": {},
    "history_comparison": None,
}

def check(name, status, detail="", severity="info", deduction=0):
    results["checks"].append({"name": name, "status": status, "detail": detail})
    if status == "FAIL":
        results["errors"].append({"check": name, "detail": detail, "severity": severity})
        results["score"] -= deduction
    elif status == "WARN":
        results["warnings"].append({"check": name, "detail": detail})
        results["score"] -= deduction * 0.5

def run_cmd(cmd, cwd=None, timeout=120):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, timeout=timeout)
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except Exception as e:
        return -1, "", str(e)


# ═══════════════════════════════════════════════
# PARTIE 1 — CODE GP PARTS
# ═══════════════════════════════════════════════

def audit_code(project_dir):
    """Checks TypeScript, Build, Tests, Lint, Security."""

    # Install deps if needed
    if not os.path.isdir(os.path.join(project_dir, "node_modules")):
        print("  Installing dependencies...")
        run_cmd("npm install --silent", cwd=project_dir, timeout=120)

    # Last commit
    _, commit_info, _ = run_cmd("git log -1 --format='%h %s (%ar)'", cwd=project_dir)
    check("Dernier commit", "OK", commit_info)

    # TypeScript
    code, stdout, stderr = run_cmd("npx tsc --noEmit", cwd=project_dir, timeout=180)
    if code == 0:
        check("TypeScript", "OK", "0 erreur")
    else:
        errors = len(re.findall(r'error TS\d+', stderr + stdout))
        check("TypeScript", "FAIL", f"{errors} erreurs: {(stderr or stdout)[:200]}", "bloquant", 1.5)

    # Build
    code, stdout, stderr = run_cmd("npm run build", cwd=project_dir, timeout=180)
    if code == 0:
        routes = len(re.findall(r'[○●λ/ƒ]\s+/', stdout))
        check("Build", "OK", f"{routes} routes compilées")
    else:
        check("Build", "FAIL", f"{(stderr or stdout)[:200]}", "bloquant", 1.5)

    # Tests (try test:unit first, then npm test, then vitest direct)
    code, stdout, stderr = run_cmd(
        "npm run test:unit 2>&1 || npm test -- --run 2>&1 || npx vitest --run 2>&1",
        cwd=project_dir, timeout=180
    )
    if code == 0:
        # Vitest: "Tests  111 passed (111)" — priorité sur "Test Files  8 passed"
        m = re.search(r'Tests\s+(\d+)\s+passed', stdout)
        if not m:
            m = re.search(r'(\d+)\s+(?:tests?\s+)?pass', stdout, re.IGNORECASE)
        detail = f"{m.group(1)} tests passés" if m else "OK"
        check("Tests", "OK", detail)
    elif code == -1:
        check("Tests", "WARN", "Timeout (>3 min)", deduction=0.3)
    else:
        m = re.search(r'(\d+)\s+fail', stderr + stdout, re.IGNORECASE)
        detail = f"{m.group(1)} tests échoués" if m else (stderr or stdout)[:200]
        check("Tests", "FAIL", detail, "bloquant", 1.5)

    # Lint
    code, stdout, stderr = run_cmd("npx next lint", cwd=project_dir, timeout=120)
    if code == 0:
        check("Lint", "OK", "0 warning")
    else:
        warnings = len(re.findall(r'Warning:', stdout + stderr))
        errors = len(re.findall(r'Error:', stdout + stderr))
        if errors > 0:
            check("Lint", "FAIL", f"{errors} erreurs, {warnings} warnings", "important", 0.5)
        elif warnings > 0:
            check("Lint", "WARN", f"{warnings} warnings", deduction=0.3)

    # Security
    code, stdout, stderr = run_cmd("npm audit", cwd=project_dir, timeout=60)
    output = stdout + stderr
    critical = len(re.findall(r'critical', output, re.IGNORECASE))
    high = len(re.findall(r'\bhigh\b', output, re.IGNORECASE))
    if critical > 0:
        check("Sécurité npm", "FAIL", f"{critical} critical, {high} high", "important", 0.5)
    elif high > 0:
        check("Sécurité npm", "WARN", f"{high} high vulnérabilités", deduction=0.3)
    elif code != 0:
        check("Sécurité npm", "WARN", "Vulnérabilités non-critiques", deduction=0.2)
    else:
        check("Sécurité npm", "OK", "0 vulnérabilité")


def audit_patterns(project_dir):
    """Grep-based code quality checks."""

    grep_checks = {
        "console.log": {
            "cmd": "grep -r --include='*.ts' --include='*.tsx' -c 'console\\.log(' . | grep -v ':0$' | grep -v node_modules | grep -v '.next/' | grep -v 'scripts/'",
            "max": THRESHOLDS["console_log_max"], "severity": "important", "deduction": 0.5
        },
        "any types": {
            "cmd": "grep -r --include='*.ts' --include='*.tsx' -c ': any' . | grep -v ':0$' | grep -v node_modules | grep -v '.next/' | grep -v '__tests__/' | grep -v '.test.'",
            "max": THRESHOLDS["any_type_max"], "severity": "important", "deduction": 0.5
        },
        "eslint-disable": {
            "cmd": "grep -r --include='*.ts' --include='*.tsx' -c 'eslint-disable' . | grep -v ':0$' | grep -v node_modules",
            "max": THRESHOLDS["eslint_disable_max"], "severity": "warning", "deduction": 0.3
        },
        "native <img>": {
            "cmd": "grep -r --include='*.tsx' -c '<img ' . | grep -v ':0$' | grep -v node_modules | grep -v '.next/' | grep -v '__tests__/' | grep -v '.test.'",
            "max": 0, "severity": "important", "deduction": 0.5
        },
        "native <a href>": {
            "cmd": "grep -r --include='*.tsx' -c '<a href=\"/' . | grep -v ':0$' | grep -v node_modules | grep -v '.next/'",
            "max": 0, "severity": "important", "deduction": 0.5
        },
        "placeholders/TODO": {
            "cmd": "grep -rn --include='*.ts' --include='*.tsx' -E '(XXXXXXXXX|TODO.*Phase|FIXME|HACK)' . | grep -v node_modules | grep -v '.next/'",
            "max": THRESHOLDS["placeholder_max"], "severity": "warning", "deduction": 0.3
        },
    }

    for name, cfg in grep_checks.items():
        _, stdout, _ = run_cmd(cfg["cmd"], cwd=project_dir)
        lines = [l for l in stdout.strip().split('\n') if l.strip()] if stdout.strip() else []
        count = len(lines)

        if count > cfg["max"]:
            detail = f"{count} occurrences (max: {cfg['max']})"
            if count <= 5:
                detail += " — " + "; ".join(l.strip() for l in lines[:5])
            status = "FAIL" if cfg["severity"] == "important" else "WARN"
            check(name, status, detail, cfg["severity"], cfg["deduction"])
        else:
            check(f"{name} ({count})", "OK")


# ═══════════════════════════════════════════════
# PARTIE 2 — ÉCOSYSTÈME COWORK (optionnel)
# ═══════════════════════════════════════════════

def audit_memory(workspace):
    """Validate memory.json, session-latest.json, MEMORY.md, CLAUDE.md"""

    mem_path = os.path.join(workspace, "memory.json")
    if os.path.exists(mem_path):
        try:
            with open(mem_path) as f:
                mem = json.load(f)
            check("memory.json valide", "OK")

            decs = mem.get("decisions", [])
            bad = [d["id"] for d in decs if len(d.get("keywords", [])) < 1]
            if bad:
                check("Decisions sans keywords", "FAIL", f"{len(bad)}: {bad}", "bloquant", 0.5)
            else:
                check(f"Decisions keywords ({len(decs)} dec)", "OK")

            prefs = mem.get("user", {}).get("preferences", [])
            if any("haiku" in p.get("rule", "").lower() for p in prefs):
                check("Préférence Haiku obsolète", "WARN", "Référence à Haiku (dec-010)", deduction=0.3)
            else:
                check("Préférences cohérentes", "OK")

        except json.JSONDecodeError as e:
            check("memory.json valide", "FAIL", str(e), "bloquant", 2)
    else:
        check("memory.json", "FAIL", "Fichier manquant", "bloquant", 2)

    # session-latest.json
    sl_path = os.path.join(workspace, "session-latest.json")
    if os.path.exists(sl_path):
        try:
            with open(sl_path) as f:
                json.load(f)
            check("session-latest.json valide", "OK")
        except json.JSONDecodeError as e:
            check("session-latest.json", "FAIL", str(e), "bloquant", 1)

    # MEMORY.md
    md_path = os.path.join(workspace, "MEMORY.md")
    if os.path.exists(md_path):
        with open(md_path) as f:
            content = f.read()
        required = ["Projets", "Décisions", "Bugs", "Leçons", "Prochaines actions", "Préférences"]
        missing = [s for s in required if f"## {s}" not in content]
        if missing:
            check("MEMORY.md sections", "FAIL", f"Manquantes: {missing}", "important", 0.5)
        else:
            check("MEMORY.md sections complètes", "OK")

    # CLAUDE.md
    claude_path = os.path.join(workspace, "CLAUDE.md")
    if os.path.exists(claude_path):
        with open(claude_path) as f:
            cc = f.read()
        haiku_refs = len(re.findall(r'(?i)\bhaiku\b', cc))
        if haiku_refs > 0:
            check("CLAUDE.md refs Haiku", "WARN", f"{haiku_refs} références", deduction=0.3)
        else:
            check("CLAUDE.md nettoyé", "OK")


def audit_skills(workspace):
    """Validate skills have proper SKILL.md with frontmatter."""
    skills_dir = os.path.join(workspace, "skills")
    if not os.path.isdir(skills_dir):
        return

    for name in os.listdir(skills_dir):
        path = os.path.join(skills_dir, name)
        if not os.path.isdir(path):
            continue
        skill_md = os.path.join(path, "SKILL.md")
        if not os.path.exists(skill_md):
            check(f"Skill {name}/SKILL.md", "FAIL", "Manquant", "important", 0.3)
            continue
        with open(skill_md) as f:
            content = f.read()
        if not content.startswith("---"):
            check(f"Skill {name} frontmatter", "FAIL", "Pas de frontmatter YAML", "important", 0.3)
        else:
            check(f"Skill {name} frontmatter", "OK")


def audit_wcag(workspace):
    """WCAG contrast validation on Design Intelligence archetype CSVs."""
    data_dir = os.path.join(workspace, "design-intelligence", "skills",
                            "design-intelligence", "references", "data")
    if not os.path.isdir(data_dir):
        return

    def hex_to_rgb(h):
        h = h.lstrip('#')
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    def luminance(rgb):
        vals = []
        for c in rgb:
            s = c / 255.0
            vals.append(s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4)
        return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]

    def contrast(h1, h2):
        l1, l2 = luminance(hex_to_rgb(h1)), luminance(hex_to_rgb(h2))
        return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

    hex_pat = re.compile(r'^#[0-9A-Fa-f]{6}$')
    pairs = [
        ('Primary', 'On Primary', 4.5), ('Secondary', 'On Secondary', 4.5),
        ('Accent', 'On Accent', 3.0), ('Background', 'Foreground', 4.5),
        ('Card', 'Card Foreground', 4.5), ('Muted', 'Muted Foreground', 4.5),
        ('Destructive', 'On Destructive', 4.5),
    ]

    fails = 0
    for fn in os.listdir(data_dir):
        if not fn.startswith('product-') or fn == 'product-index.csv' or not fn.endswith('.csv'):
            continue
        with open(os.path.join(data_dir, fn)) as f:
            for row in csv.DictReader(f):
                for bg, fg, minr in pairs:
                    b, fv = row.get(bg, '').strip(), row.get(fg, '').strip()
                    if b and fv and hex_pat.match(b) and hex_pat.match(fv):
                        try:
                            if contrast(b, fv) < minr:
                                fails += 1
                        except:
                            fails += 1

    if fails > THRESHOLDS["wcag_fails_max"]:
        check("WCAG contraste", "FAIL", f"{fails} paires en échec", "bloquant", 1.5)
    else:
        check("WCAG contraste (0 échec)", "OK")


def audit_tokens(workspace):
    """Measure token cost of the ecosystem."""
    categories = {
        "memory": ["memory.json", "session-latest.json", "MEMORY.md", "CLAUDE.md"],
        "skills": [], "plugins": [],
    }
    skills_dir = os.path.join(workspace, "skills")
    if os.path.isdir(skills_dir):
        for root, _, files in os.walk(skills_dir):
            for f in files:
                categories["skills"].append(os.path.join(root, f))

    plugin_dir = os.path.join(workspace, "design-intelligence")
    if os.path.isdir(plugin_dir):
        for root, _, files in os.walk(plugin_dir):
            for f in files:
                if not f.startswith('.'):
                    categories["plugins"].append(os.path.join(root, f))

    report = {}
    total = 0
    for cat, files in categories.items():
        cat_total = 0
        for fpath in files:
            full = fpath if os.path.isabs(fpath) else os.path.join(workspace, fpath)
            if os.path.exists(full):
                cat_total += os.path.getsize(full) // 4
        report[cat] = cat_total
        total += cat_total

    report["total"] = total
    results["token_report"] = report

    if total > THRESHOLDS["token_ecosystem_max"]:
        check("Token budget", "WARN", f"{total:,} tok (seuil: {THRESHOLDS['token_ecosystem_max']:,})", deduction=0.3)
    else:
        check(f"Token budget ({total:,} tok)", "OK")


# ═══════════════════════════════════════════════
# PARTIE 3 — HISTORIQUE
# ═══════════════════════════════════════════════

def save_and_compare(history_path):
    """Save results and compare with previous run."""
    previous = None
    if os.path.exists(history_path):
        try:
            with open(history_path) as f:
                history = json.load(f)
            if history.get("runs"):
                previous = history["runs"][-1]
        except:
            history = {"runs": []}
    else:
        history = {"runs": []}

    if previous:
        prev_score = previous.get("score", 0)
        curr_score = max(0, results["score"])
        delta = curr_score - prev_score
        results["history_comparison"] = {
            "previous_score": prev_score,
            "current_score": round(curr_score, 1),
            "delta": round(delta, 1),
            "trend": "↑" if delta > 0 else ("↓" if delta < 0 else "→"),
            "previous_errors": len(previous.get("errors", [])),
            "current_errors": len(results["errors"]),
        }

    results["score"] = round(max(0, min(10, results["score"])), 1)

    history["runs"].append({
        "timestamp": results["timestamp"],
        "score": results["score"],
        "errors": results["errors"],
        "warnings": results["warnings"],
        "token_report": results.get("token_report", {}),
    })
    history["runs"] = history["runs"][-30:]

    os.makedirs(os.path.dirname(history_path), exist_ok=True)
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


# ═══════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="GP Parts Audit Runner v3")
    parser.add_argument("--workspace", "-w", help="Chemin vers le workspace Cowork (active les checks mémoire/skills/tokens/WCAG)")
    parser.add_argument("--project", "-p", default=".", help="Chemin vers le repo GP Parts (défaut: répertoire courant)")
    args = parser.parse_args()

    project_dir = os.path.abspath(args.project)
    print(f"🔍 Audit Runner v3 — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"   Projet : {project_dir}")
    if args.workspace:
        print(f"   Workspace : {args.workspace}")
    print()

    # Partie 1 — Code
    print("── Code GP Parts ──")
    audit_code(project_dir)
    audit_patterns(project_dir)

    # Partie 2 — Écosystème (optionnel)
    if args.workspace:
        ws = os.path.abspath(args.workspace)
        print("\n── Écosystème Cowork ──")
        audit_memory(ws)
        audit_skills(ws)
        audit_wcag(ws)
        audit_tokens(ws)

    # Partie 3 — Historique
    history_dir = args.workspace if args.workspace else project_dir
    history_path = os.path.join(history_dir, ".audit-history.json")
    save_and_compare(history_path)

    # Output JSON
    print("\n" + json.dumps(results, indent=2, ensure_ascii=False))
