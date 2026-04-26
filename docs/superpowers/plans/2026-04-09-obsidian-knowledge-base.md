# Obsidian Knowledge Base — Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un vault Obsidian "second cerveau" alimenté automatiquement la nuit, accessible à Claude via MCP filesystem, avec quarantine anti-hallucination, integrity-check Bash, auto-tuning par signaux de session.

**Architecture:** Vault `~/Documents/Obsidian/KnowledgeBase/` — MCP filesystem stdio direct (sans plugin) — quarantine `_inbox/agent/` + promotion 72h — `integrity-check.sh` (backup + INDEX rebuild + wikilinks check) — Agent nocturne RemoteTrigger 2h17 — tags émergents remplacent sous-dossiers forcés — context-cards quota 200 tokens.

**Tech Stack:** MCP @modelcontextprotocol/server-filesystem, RemoteTrigger claude.ai API, hook PostToolUse ~/.claude/settings.json (access-log), Obsidian (Auto Note Mover + Calendar plugins), macOS chmod 700 + rsync backup.

**Spec de référence:** `docs/superpowers/specs/2026-04-09-obsidian-knowledge-base-design.md`

---

## Fichiers touchés

| Fichier                                                       | Action  | Responsabilité                                  |
| ------------------------------------------------------------- | ------- | ----------------------------------------------- |
| `~/Documents/Obsidian/KnowledgeBase/`                         | Créé    | Vault complet (arborescence)                    |
| `~/Documents/Obsidian/KnowledgeBase/VAULT.md`                 | Créé    | Règles + conventions + arbre de décision filing |
| `~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md`           | Créé    | Index sémantique (dérivé, recalculé)            |
| `~/Documents/Obsidian/KnowledgeBase/_meta/watchlist.md`       | Créé    | Thèmes surveillance 🔴🟡⚪                      |
| `~/Documents/Obsidian/KnowledgeBase/_meta/signals.md`         | Créé    | Signaux auto-tuning rolling 30j                 |
| `~/Documents/Obsidian/KnowledgeBase/_meta/context-gpparts.md` | Créé    | Context-card GP Parts (seed)                    |
| `~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json`  | Créé    | État run nocturne                               |
| `~/Documents/Obsidian/KnowledgeBase/integrity-check.sh`       | Créé    | Script Bash pré-run                             |
| `~/.mcp.json`                                                 | Modifié | Ajout serveur knowledge-base                    |
| `~/Documents/Claude/CLAUDE.md`                                | Modifié | Instruction vault au démarrage                  |
| `~/.claude/settings.json`                                     | Modifié | Hook access-log PostToolUse Read                |

---

## Task 0 : Seed initial — notes fondamentales

> Les notes seed permettent au système d'être utile dès le jour 1, avant le premier run nocturne.

**Fichiers :** `universal/`, `projects/gpparts/`

- [ ] **Step 1 : Créer la première note universelle (seed)**

Écrire `~/Documents/Obsidian/KnowledgeBase/universal/prix-centimes-convention.md` :

````markdown
# Convention — Prix stockés en centimes entiers

Source: GP Parts codebase (lib/utils.ts) | Vérifié: 2026-04-09 | Confiance: haute
Tags: #convention #prix #typescript #gpparts

## Essentiel

Tous les prix sont des entiers en centimes. Jamais de flottants.
Affichage via `formatPrice()` uniquement.

## Détail

```ts
const price = 2990; // 29,90 € — stocké en centimes
formatPrice(price); // → "29,90 €"

// ❌ INTERDIT
const price = 29.9; // erreurs d'arrondi flottant
```
````

Raison : évite les erreurs d'arrondi IEEE 754 sur les calculs de TVA.

## Liens

- [[vat-guadeloupe-8-5]]

````

- [ ] **Step 2 : Créer note TVA Guadeloupe (seed)**

Écrire `~/Documents/Obsidian/KnowledgeBase/universal/vat-guadeloupe-8-5.md` :

```markdown
# TVA Guadeloupe — Taux 8.5% (DOM-TOM)

Source: impots.gouv.fr | Vérifié: 2026-04-09 | Confiance: haute
Tags: #tva #dom-tom #guadeloupe #fiscal #gpparts

## Essentiel

TVA en Guadeloupe (971) : 8.5% — différent de la France métropolitaine (20%).
Déclaré dans `lib/config.ts` : `VAT_RATE = 0.085`.

## Détail

Les DOM utilisent un régime fiscal spécifique. Le code douanier 971 (Guadeloupe)
applique une TVA réduite sur l'ensemble des produits. Toute modification du taux
nécessite une mise à jour dans `lib/config.ts` uniquement (centralisé).

Calcul HT → TTC : `priceTTC = priceHT * (1 + VAT_RATE)`

## Liens

- [[prix-centimes-convention]]
````

- [ ] **Step 3 : Créer note anti-bug checkout (seed)**

Écrire `~/Documents/Obsidian/KnowledgeBase/projects/gpparts/anti-bug-checkout-race-condition.md` :

````markdown
# Anti-bug — Race condition checkout GP Parts

Source: GP Parts CLAUDE.md (Bug #3) | Vérifié: 2026-04-09 | Confiance: haute
Tags: #gpparts #bug #checkout #race-condition #react

## Essentiel

`setOrderPlaced(true)` AVANT `clearCart()`. Jamais l'inverse.
Inverser cet ordre redirige vers /panier au lieu de /commande/confirmation.

## Détail

```tsx
// ✅ CORRECT
setOrderPlaced(true);
clearCart();
router.push('/commande/confirmation');

// ❌ INTERDIT — clearCart() avant le flag déclenche une redirection /panier
clearCart();
router.push('/commande/confirmation'); // jamais atteint
```
````

## Liens

- [[anti-bug-nesting-a-button]]

````

- [ ] **Step 4 : Vérifier les 3 notes créées**

```bash
ls ~/Documents/Obsidian/KnowledgeBase/universal/
ls ~/Documents/Obsidian/KnowledgeBase/projects/gpparts/
````

Expected :

```
universal/ → prix-centimes-convention.md, vat-guadeloupe-8-5.md
projects/gpparts/ → anti-bug-checkout-race-condition.md
```

---

## Task 1 : Structure complète du vault

**Fichiers :** Arborescence `~/Documents/Obsidian/KnowledgeBase/`

- [ ] **Step 1 : Créer tous les répertoires**

```bash
mkdir -p ~/Documents/Obsidian/KnowledgeBase/universal
mkdir -p ~/Documents/Obsidian/KnowledgeBase/projects/gpparts/decisions
mkdir -p ~/Documents/Obsidian/KnowledgeBase/sensitive
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_inbox/agent
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_inbox/review/superseded
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_inbox/session
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_logs
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_meta
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_archive
```

- [ ] **Step 2 : Protéger sensitive/**

```bash
chmod 700 ~/Documents/Obsidian/KnowledgeBase/sensitive
cat > ~/Documents/Obsidian/KnowledgeBase/sensitive/.gitignore << 'EOF'
# Données sensibles — ne jamais versionner
*
!.gitignore
EOF
```

- [ ] **Step 3 : Vérifier permissions**

```bash
ls -la ~/Documents/Obsidian/KnowledgeBase/ | grep sensitive
```

Expected : `drwx------` (permission 700 uniquement)

---

## Task 2 : Fichiers meta et système

**Fichiers :** VAULT.md, INDEX.md, watchlist.md, signals.md, context-gpparts.md, last-nightly.json

- [ ] **Step 1 : Créer VAULT.md**

Écrire `~/Documents/Obsidian/KnowledgeBase/VAULT.md` :

````markdown
# Knowledge Base — Règles et conventions

## Template de note (obligatoire)

```markdown
# Titre du concept (une seule idée)

Source: [nom ou URL] | Vérifié: YYYY-MM-DD | Confiance: haute/moyenne/basse
Tags: #tag1 #tag2 #tag3

## Essentiel

[3 lignes max — lu en priorité par Claude]

## Détail

[Contenu complet, exemples, code]

## Liens

- [[note-cible-confirmée-dans-index]]

<!-- generated: YYYY-MM-DD -->
```
````

## Règle d'atomicité (Zettelkasten)

1 note = 1 concept testable indépendamment.
Test : peut-on supprimer une section sans que le reste soit incomplet ?
Si oui → deux notes distinctes.

## Règle des wikilinks

Un `[[lien]]` n'est écrit que si la note cible est confirmée dans INDEX.md
au moment de l'écriture. Sinon → texte simple sans brackets.

## Niveaux de confiance

- haute → documentation officielle OU consensus ≥3 sources → \_inbox/agent/
- moyenne → source reconnue, consensus partiel → \_inbox/agent/
- basse → journalistique, signal faible → \_inbox/review/

## Quarantine et promotion

Toutes les notes agent → \_inbox/agent/YYYY-MM-DD/
Promotion automatique après 72h sans rejet.
Validation manuelle : ajouter #validated dans Obsidian → Auto Note Mover.
Notes marquées [A] dans les context-cards = agent pending.

## Arbre de décision filing

Est-ce vrai indépendamment du projet ?
└─ OUI → universal/
└─ NON → projects/<projet>/

Référence du code spécifique au projet ?
└─ OUI → projects/<projet>/

Décision d'architecture (ADR) ?
└─ OUI → projects/<projet>/decisions/

## Convention succession (remplacement)

Ajouter dans la note remplaçante :
Remplace: [[ancienne-note]]
Déplacer l'ancienne vers \_inbox/review/superseded/

## Règles agent nocturne

- Ne jamais écrire dans sensitive/
- Filtrer tokens, clés API, URLs privées avant tout écrit
- Vérifier wikilinks contre INDEX.md avant écriture
- Write order : note → INDEX.md → context-cards → last-nightly.json

````

- [ ] **Step 2 : Créer INDEX.md initial**

Écrire `~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md` :

```markdown
# INDEX — Knowledge Base

Mis à jour : 2026-04-09 | Notes actives : 3 | Plafond : 300

_Dérivé — recalculé par integrity-check.sh avant chaque run nocturne._
_Ne pas éditer manuellement._

---

## #convention #prix

- [Convention — Prix stockés en centimes entiers](../universal/prix-centimes-convention.md) — #convention #prix #typescript — prix entiers centimes formatPrice

## #fiscal #dom-tom

- [TVA Guadeloupe — Taux 8.5% (DOM-TOM)](../universal/vat-guadeloupe-8-5.md) — #tva #dom-tom #guadeloupe — taux TVA Guadeloupe 8.5% lib/config.ts

## #gpparts #bug

- [Anti-bug — Race condition checkout GP Parts](../projects/gpparts/anti-bug-checkout-race-condition.md) — #gpparts #bug #checkout — setOrderPlaced avant clearCart obligatoire
````

- [ ] **Step 3 : Créer watchlist.md**

Écrire `~/Documents/Obsidian/KnowledgeBase/_meta/watchlist.md` :

```markdown
# Watchlist — Thèmes de surveillance

Mis à jour : 2026-04-09

## 🔴 Priorité haute (traités en premier)

- Next.js App Router — évolutions, breaking changes, nouvelles features (source: nextjs.org/blog)
- Firebase Firestore — quotas, nouvelles API, patterns community (source: firebase.google.com/docs)
- E-commerce DOM-TOM — Guadeloupe, TVA, contraintes logistiques (source: impots.gouv.fr)

## 🟡 Priorité normale

- TypeScript strict — nouvelles règles, patterns, deprecations (source: devblogs.microsoft.com/typescript)
- Tailwind v4 — migration, nouvelles utilities (source: tailwindcss.com/blog)
- Patterns checkout UX — ergonomie formulaires, conversion (source: baymard.com)
- Core Web Vitals — évolutions métriques (source: web.dev)
- Design systems open source — shadcn/ui, Radix UI mises à jour majeures

## ⚪ Veille légère (si budget restant)

- Micro-SaaS web — modèles freemium, stack minimale
- IA dans le dev web — outils Claude Code, adoption communauté
- Typographie web — variable fonts, tendances 2026
```

- [ ] **Step 4 : Créer signals.md**

Écrire `~/Documents/Obsidian/KnowledgeBase/_meta/signals.md` :

```markdown
# Signaux auto-tuning

Fenêtre active : 30 derniers jours
Compression hebdomadaire par l'agent nocturne.

---

## Hits (notes consultées et utiles)

_(vide — alimenté en session)_

## Misses (notes consultées, non pertinentes)

_(vide — alimenté en session)_

## Thèmes émergents (2+ mentions sans note dédiée)

_(vide — alimenté en session)_

---

## Règles auto-tuning pour l'agent nocturne

- Thème émergent ≥3 mentions → créer note prioritaire (passer en 🔴)
- Note sans hit depuis 30 jours → signaler dans maintenance-report.md
- Note sans hit depuis 90 jours → déplacer vers \_archive/YYYY/
- Thème watchlist non mentionné depuis 60 jours → proposer passage ⚪ ou suppression
- Budget >80K tokens sur 3 nuits consécutives → supprimer thème ⚪ le moins consulté

## Agrégat mois précédent

_(vide — rempli par compression hebdomadaire)_
```

- [ ] **Step 5 : Créer context-gpparts.md (seed)**

Écrire `~/Documents/Obsidian/KnowledgeBase/_meta/context-gpparts.md` :

```markdown
# Context — GP Parts

_Régénéré par l'agent nocturne. Max 200 tokens. Quota : 3 sections × 5 liens._

## Fondations (toujours utiles)

- [[prix-centimes-convention]] — tous les prix en centimes entiers
- [[vat-guadeloupe-8-5]] — TVA DOM-TOM 8.5% dans lib/config.ts
- [[anti-bug-checkout-race-condition]] — setOrderPlaced AVANT clearCart

## Stack actuelle

_(vide — alimenté par l'agent nocturne)_

## Focus session en cours

_(vide au démarrage — Claude remplit selon la demande)_
```

- [ ] **Step 6 : Créer last-nightly.json**

Écrire `~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json` :

```json
{
  "last_run": null,
  "status": "never_run",
  "notes_added": 0,
  "notes_in_review": 0,
  "themes_processed": [],
  "tokens_used": 0,
  "hit_rate_last_30d": null,
  "broken_links_fixed": 0,
  "errors": []
}
```

- [ ] **Step 7 : Vérifier tous les fichiers**

```bash
ls ~/Documents/Obsidian/KnowledgeBase/_meta/
ls ~/Documents/Obsidian/KnowledgeBase/_logs/
cat ~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json
```

Expected :

```
_meta/ → INDEX.md  context-gpparts.md  signals.md  watchlist.md
_logs/ → last-nightly.json
{"last_run":null,"status":"never_run",...}
```

---

## Task 3 : integrity-check.sh

**Fichiers :** `~/Documents/Obsidian/KnowledgeBase/integrity-check.sh`

- [ ] **Step 1 : Créer le script**

Écrire `~/Documents/Obsidian/KnowledgeBase/integrity-check.sh` :

```bash
#!/bin/bash
# integrity-check.sh — exécuté avant chaque run nocturne
# Coût : 0 token — Bash pur
set -euo pipefail

VAULT="$HOME/Documents/Obsidian/KnowledgeBase"
LOGS="$VAULT/_logs"
META="$VAULT/_meta"

echo "=== integrity-check $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# 1. Backup atomique
rsync -a --quiet "$VAULT/" "$VAULT.bak/" \
  --exclude=".bak" --exclude="*.bak"
echo "✓ Backup OK → $VAULT.bak/"

# 2. Détecter crash run précédent
if [ -f "$LOGS/last-nightly.json" ]; then
  STATUS=$(jq -r '.status // "unknown"' "$LOGS/last-nightly.json" 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "in_progress" ]; then
    echo "⚠️  Run précédent interrompu (status: in_progress) — restore depuis backup"
    rsync -a --quiet "$VAULT.bak/" "$VAULT/" --exclude=".bak"
    jq '.status = "restored_after_crash"' "$LOGS/last-nightly.json" > /tmp/nightly.tmp \
      && mv /tmp/nightly.tmp "$LOGS/last-nightly.json"
    echo "✓ Vault restauré"
  fi
fi

# 3. Reconstruire INDEX.md depuis fichiers réels
NOTE_COUNT=$(find "$VAULT/universal" "$VAULT/projects" -name "*.md" \
  ! -name "INDEX.md" ! -name "VAULT.md" ! -name "context-*.md" 2>/dev/null | wc -l | tr -d ' ')

{
  echo "# INDEX — Knowledge Base"
  echo ""
  echo "Mis à jour : $(date +%Y-%m-%d) | Notes actives : $NOTE_COUNT | Plafond : 300"
  echo ""
  echo "_Dérivé — recalculé par integrity-check.sh avant chaque run nocturne._"
  echo "_Ne pas éditer manuellement._"
  echo ""
  echo "---"
  echo ""
  find "$VAULT/universal" "$VAULT/projects" -name "*.md" \
    ! -name "INDEX.md" ! -name "VAULT.md" ! -name "context-*.md" \
    2>/dev/null | sort | while read -r f; do
    TITLE=$(head -1 "$f" 2>/dev/null | sed 's/^# //')
    TAGS=$(grep "^Tags:" "$f" 2>/dev/null | sed 's/^Tags: //' || echo "—")
    RELPATH="${f#$VAULT/}"
    echo "- [$TITLE]($RELPATH) — $TAGS"
  done
} > /tmp/INDEX_rebuilt.md

echo "✓ INDEX.md reconstruit ($NOTE_COUNT notes)"
# L'agent nocturne enrichit /tmp/INDEX_rebuilt.md avec les résumés sémantiques
# puis le copie vers $META/INDEX.md en step 5 du workflow nocturne

# 4. Vérifier wikilinks cassés
> "$LOGS/broken-links.txt"
find "$VAULT/universal" "$VAULT/projects" -name "*.md" 2>/dev/null | \
  xargs grep -oh '\[\[[^\]]*\]\]' 2>/dev/null | \
  sed 's/\[\[//;s/\]\]//' | sort -u | \
  while read -r LINK; do
    FOUND=$(find "$VAULT/universal" "$VAULT/projects" -name "*.md" \
      -exec grep -l "^# $LINK" {} \; 2>/dev/null | head -1)
    if [ -z "$FOUND" ]; then
      echo "BROKEN: [[$LINK]]" >> "$LOGS/broken-links.txt"
    fi
  done

BROKEN=$(wc -l < "$LOGS/broken-links.txt" | tr -d ' ')
if [ "$BROKEN" -gt "0" ]; then
  echo "⚠️  $BROKEN wikilink(s) cassé(s) → $LOGS/broken-links.txt"
else
  echo "✓ Aucun wikilink cassé"
fi

echo "=== integrity-check terminé ==="
```

- [ ] **Step 2 : Rendre le script exécutable**

```bash
chmod +x ~/Documents/Obsidian/KnowledgeBase/integrity-check.sh
```

- [ ] **Step 3 : Tester le script**

```bash
~/Documents/Obsidian/KnowledgeBase/integrity-check.sh
```

Expected :

```
=== integrity-check 2026-04-09T...Z ===
✓ Backup OK → /Users/djemildavid/Documents/Obsidian/KnowledgeBase.bak/
✓ INDEX.md reconstruit (3 notes)
✓ Aucun wikilink cassé
=== integrity-check terminé ===
```

- [ ] **Step 4 : Vérifier que le backup existe**

```bash
ls ~/Documents/Obsidian/KnowledgeBase.bak/_meta/
```

Expected : `INDEX.md`, `watchlist.md`, `signals.md`, `context-gpparts.md`

---

## Task 4 : Configurer MCP filesystem

**Fichiers :** `~/.mcp.json`

- [ ] **Step 1 : Lire l'état actuel**

```bash
cat ~/.mcp.json
```

- [ ] **Step 2 : Remplacer par la configuration complète**

Écrire `~/.mcp.json` :

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "knowledge-base": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/djemildavid/Documents/Obsidian/KnowledgeBase/universal",
        "/Users/djemildavid/Documents/Obsidian/KnowledgeBase/projects",
        "/Users/djemildavid/Documents/Obsidian/KnowledgeBase/_meta"
      ]
    }
  }
}
```

Dossiers exclus : `sensitive/`, `_inbox/`, `_logs/`, `_archive/`

- [ ] **Step 3 : Valider le JSON**

```bash
jq . ~/.mcp.json
```

Expected : sortie JSON valide sans erreur.

---

## Task 5 : CLAUDE.md global + hook access-log

**Fichiers :** `~/Documents/Claude/CLAUDE.md`, `~/.claude/settings.json`

- [ ] **Step 1 : Lire CLAUDE.md global**

```bash
cat ~/Documents/Claude/CLAUDE.md
```

- [ ] **Step 2 : Ajouter la section Knowledge Base**

Ajouter à la fin de `~/Documents/Claude/CLAUDE.md` :

```markdown
## Knowledge Base Vault

### Au démarrage de chaque session

1. Détecter le projet depuis `pwd`
2. Si match → lire `_meta/context-<projet>.md` via MCP knowledge-base (~200 tokens)
3. Si besoin d'élargir → lire la section tags pertinente dans `_meta/INDEX.md`
4. Lire `## Essentiel` des notes ciblées (~50t chacune) avant `## Détail`
5. Si INDEX.md < 10 notes → injection complète acceptable

### En cours de session

- Notes marquées `[A]` dans les context-cards = agent pending 72h. Citer avec réserve.
- Si découverte importante → écrire dans `_inbox/session/session-YYYY-MM-DD.md`
- Enrichir une note existante via MCP si la valeur ajoutée est claire et factuelle

### En fin de session (si pertinent)

Ajouter signal dans `_meta/signals.md` :

- Hit : `YYYY-MM-DD — chemin/note.md — contexte court`
- Miss : `YYYY-MM-DD — chemin/note.md — pourquoi non pertinent`
- Thème émergent : `NomThème — Nx mentionné — projet`

### Règles de sobriété

- Jamais de dump complet du vault
- Jamais écrire dans `sensitive/` (accès humain uniquement)
- Jamais inventer du contenu — seulement synthétiser des sources vérifiables
- Filtrer tokens, clés API, URLs admin avant tout écrit dans `_inbox/session/`
```

- [ ] **Step 3 : Lire ~/.claude/settings.json**

```bash
cat ~/.claude/settings.json
```

- [ ] **Step 4 : Ajouter hook access-log dans PostToolUse**

Dans `~/.claude/settings.json`, ajouter dans le tableau `hooks.PostToolUse` existant
(sans écraser les hooks claude-mem déjà présents) :

```json
{
  "matcher": "Read",
  "hooks": [
    {
      "type": "command",
      "command": "jq -r '.tool_input.file_path // \"\"' | { read -r f; echo \"$f\" | grep -q 'KnowledgeBase' && printf '{\"ts\":\"%s\",\"file\":\"%s\"}\\n' \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" \"$f\" >> \"$HOME/Documents/Obsidian/KnowledgeBase/_logs/access-log.jsonl\"; } 2>/dev/null || true",
      "statusMessage": "KB access logged"
    }
  ]
}
```

- [ ] **Step 5 : Valider le JSON**

```bash
jq . ~/.claude/settings.json
```

Expected : sortie JSON valide. Si erreur → vérifier virgules entre objets du tableau.

---

## Task 6 : Agent nocturne RemoteTrigger

**Fichiers :** Aucun fichier projet.

- [ ] **Step 1 : Vérifier les triggers existants**

Appeler `RemoteTrigger` action `"list"`.

Expected : liste vide ou sans trigger `nocturnal-kb-agent`.

- [ ] **Step 2 : Créer le trigger nocturne**

Appeler `RemoteTrigger` action `"create"` avec ce body :

````json
{
  "name": "nocturnal-kb-agent",
  "schedule": "17 2 * * *",
  "description": "Agent nocturne Knowledge Base — enrichissement vault Obsidian + auto-tuning",
  "prompt": "Tu es l'agent nocturne du Knowledge Base Obsidian de Djemil. Ton rôle : enrichir le vault avec des connaissances vérifiées, résistant aux hallucinations.\n\n## WORKFLOW OBLIGATOIRE (dans cet ordre strict)\n\n### Étape 0 — Pré-run\n1. Écrire dans `_logs/last-nightly.json` : `{\"status\": \"in_progress\", \"started\": \"<timestamp>\", ...}`\n2. Exécuter integrity-check.sh (disponible à `~/Documents/Obsidian/KnowledgeBase/integrity-check.sh`)\n3. Lire `/tmp/INDEX_rebuilt.md` (reconstruit par integrity-check.sh)\n4. Lire `_meta/watchlist.md` pour les thèmes (respecter ordre 🔴→🟡→⚪)\n5. Lire `_meta/signals.md` pour les signaux auto-tuning\n\n### Étape 1 — Traitement des thèmes (🔴 en premier)\nPour chaque thème watchlist, dans l'ordre de priorité :\n\na) **Déduplication** : vérifier dans /tmp/INDEX_rebuilt.md si une note similaire existe déjà (titre ou tags identiques). Si oui → enrichir la note existante plutôt que créer une nouvelle.\n\nb) **Recherche** : 3-5 requêtes WebSearch ciblées par thème\n\nc) **Vérification fiabilité** :\n- Documentation officielle → confiance haute\n- Consensus ≥3 sources indépendantes → confiance haute\n- Source reconnue, consensus partiel → confiance moyenne\n- Journalistique / early-adopter → confiance basse → `_inbox/review/` uniquement\n\nd) **Atomicité** : 1 note = 1 concept. Si le sujet couvre 3 idées → 3 notes distinctes.\n\ne) **Rédaction** avec ce template EXACT :\n```\n# Titre du concept (une seule idée)\n\nSource: [nom ou URL] | Vérifié: YYYY-MM-DD | Confiance: haute/moyenne/basse\nTags: #tag1 #tag2 #tag3\n\n## Essentiel\n[3 lignes max]\n\n## Détail\n[Contenu complet]\n\n## Liens\n- [[note-cible-si-confirmée-dans-index]]\n\n<!-- generated: YYYY-MM-DD -->\n```\n\nREGLE WIKILINKS : vérifier que chaque `[[lien]]` existe dans /tmp/INDEX_rebuilt.md avant de l'écrire. Si non confirmé → texte simple sans brackets.\n\nREGLE FILING (déterministe) :\n- Vrai indépendamment du projet ? → `universal/`\n- Spécifique à un projet ? → `projects/<projet>/`\n- ADR ? → `projects/<projet>/decisions/`\n\nf) **Écriture** dans `_inbox/agent/YYYY-MM-DD/` (jamais directement dans universal/)\n\n### Étape 2 — Signaux auto-tuning\nLire signals.md et appliquer :\n- Thème émergent ≥3 mentions → créer note prioritaire (ajouter en 🔴 watchlist)\n- Note sans hit depuis 90j → déplacer vers `_archive/YYYY/`\n\n### Étape 3 — Mise à jour INDEX.md\nEnrichir /tmp/INDEX_rebuilt.md avec les résumés sémantiques des nouvelles notes, puis copier vers `_meta/INDEX.md`.\n\n### Étape 4 — Régénérer context-cards\nPour chaque fichier `_meta/context-*.md` :\n- Lire les notes les plus récentes et pertinentes du projet\n- Régénérer avec quota strict : max 3 sections × 5 liens = 200 tokens max\n- Section 'Fondations' : notes universelles toujours utiles\n- Section 'Stack actuelle' : notes techniques récentes\n- Section 'Focus session' : vide (Claude remplit en session)\n\n### Étape 5 — Compression signals.md (si >100 lignes)\nGarder les 30 derniers jours. Agréger les mois précédents en 1 ligne/thème.\n\n### Étape 6 — Commit final (OBLIGATOIRE)\nÉcrire `_logs/last-nightly.json` avec status 'success' :\n```json\n{\n  \"last_run\": \"<timestamp ISO>\",\n  \"status\": \"success\",\n  \"notes_added\": N,\n  \"notes_in_review\": N,\n  \"themes_processed\": [\"🔴 nextjs\", \"🔴 firebase\"],\n  \"tokens_used\": N,\n  \"hit_rate_last_30d\": null,\n  \"broken_links_fixed\": N,\n  \"errors\": []\n}\n```\n\n## BUDGET TOKENS\n- Nominal : 65 000 tokens\n- Alerte à 75 000 : terminer le thème en cours, passer aux étapes 3-6\n- Hard stop à 80 000 : arrêt immédiat, écrire last-nightly.json avec status 'partial_budget'\n- Ne jamais écrire de note incomplète dans le vault\n\n## RÈGLES ABSOLUES\n- Ne jamais toucher à `sensitive/`\n- Ne jamais inventer du contenu — seulement synthétiser des sources vérifiables\n- Ne jamais écrire directement dans `universal/` ou `projects/` — toujours via `_inbox/agent/`\n- Si un wikilink n'est pas confirmé dans INDEX.md → texte simple, pas de brackets\n- Si le run précédent a status 'in_progress' au démarrage → integrity-check.sh restore le backup avant tout"
}
````

- [ ] **Step 3 : Vérifier le trigger créé**

Appeler `RemoteTrigger` action `"list"`.

Expected : trigger `nocturnal-kb-agent` avec schedule `17 2 * * *` visible.

- [ ] **Step 4 : Noter l'ID du trigger**

L'ID retourné (format `trigger_xxxxxxxxx`) est nécessaire pour le run manuel (Task 7)
et pour le supprimer/modifier ultérieurement.

---

## Task 7 : Test end-to-end

**Fichiers :** Aucun.

- [ ] **Step 1 : Redémarrer Claude Code**

Fermer et rouvrir Claude Code pour charger le nouveau MCP knowledge-base.

- [ ] **Step 2 : Vérifier accès MCP**

Demander à Claude de lire `_meta/INDEX.md` via le MCP knowledge-base.
Expected : contenu du fichier retourné correctement.

- [ ] **Step 3 : Vérifier hook access-log**

Demander à Claude de lire `_meta/context-gpparts.md`, puis :

```bash
cat ~/Documents/Obsidian/KnowledgeBase/_logs/access-log.jsonl
```

Expected : `{"ts":"2026-04-09T...","file":".../context-gpparts.md"}`

- [ ] **Step 4 : Lancer un run nocturne manuel**

Appeler `RemoteTrigger` action `"run"` avec `trigger_id: "<ID step 4 Task 6>"`.
Attendre 3-5 minutes.

- [ ] **Step 5 : Vérifier le résultat du run**

```bash
cat ~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json
ls ~/Documents/Obsidian/KnowledgeBase/_inbox/agent/
```

Expected :

```json
{"status": "success", "notes_added": 5, ...}
```

Et un dossier `_inbox/agent/YYYY-MM-DD/` avec des fichiers `.md`.

- [ ] **Step 6 : Vérifier INDEX.md mis à jour**

```bash
head -5 ~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md
wc -l ~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md
```

Expected : compteur de notes mis à jour, nouvelles entrées présentes.

- [ ] **Step 7 : Vérifier 0 wikilink cassé**

```bash
cat ~/Documents/Obsidian/KnowledgeBase/_logs/broken-links.txt
```

Expected : fichier vide.

- [ ] **Step 8 : Tester signal auto-tuning**

```bash
cat >> ~/Documents/Obsidian/KnowledgeBase/_meta/signals.md << 'EOF'

## Hits (notes consultées et utiles)
2026-04-09 — universal/prix-centimes-convention.md — session gpparts checkout
2026-04-09 — universal/vat-guadeloupe-8-5.md — session gpparts calcul TVA
EOF
```

Vérifier que le contenu est bien ajouté :

```bash
tail -5 ~/Documents/Obsidian/KnowledgeBase/_meta/signals.md
```

- [ ] **Step 9 : Vérifier Obsidian (optionnel)**

Ouvrir Obsidian, naviguer vers le vault `KnowledgeBase/`.
Expected :

- Les 3 notes seed visibles
- Les notes nocturnes dans `_inbox/agent/YYYY-MM-DD/`
- Le graph view montre les liens entre les notes seed

---

## Critères de succès (récap)

- [ ] `chmod 700 sensitive/` vérifié (`drwx------`)
- [ ] `integrity-check.sh` tourne sans erreur, backup créé dans `KnowledgeBase.bak/`
- [ ] MCP knowledge-base accessible (INDEX.md lisible depuis Claude)
- [ ] Hook access-log : entrée dans `access-log.jsonl` après lecture vault
- [ ] Run manuel nocturne : ≥5 notes dans `_inbox/agent/`, `status: "success"` dans last-nightly.json
- [ ] INDEX.md mis à jour après run (compteur correct)
- [ ] `broken-links.txt` vide après run
- [ ] context-gpparts.md régénéré (≤200 tokens)
- [ ] signals.md : ≥1 signal enregistré
- [ ] RemoteTrigger nocturne actif (schedule `17 2 * * *`)
