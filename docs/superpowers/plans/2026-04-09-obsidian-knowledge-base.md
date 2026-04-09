# Obsidian Knowledge Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un vault Obsidian 3-tiers alimenté automatiquement la nuit, accessible à Claude via MCP filesystem, avec auto-tuning basé sur les signaux de session.

**Architecture:** Vault markdown pur à `~/Documents/Obsidian/KnowledgeBase/` — MCP filesystem donne à Claude un accès sélectif (universal/, projects/, \_meta/) — Agent nocturne RemoteTrigger cron 2h17 — access-log hook PostToolUse — aucun YAML, aucun algorithme de scoring, jugement LLM uniquement.

**Tech Stack:** MCP @modelcontextprotocol/server-filesystem, RemoteTrigger claude.ai API, hook PostToolUse ~/.claude/settings.json, Obsidian (lecture optionnelle), macOS chmod 700.

---

## Fichiers touchés

| Fichier                                                      | Action  | Responsabilité                                 |
| ------------------------------------------------------------ | ------- | ---------------------------------------------- |
| `~/Documents/Obsidian/KnowledgeBase/`                        | Créé    | Vault complet                                  |
| `~/Documents/Obsidian/KnowledgeBase/VAULT.md`                | Créé    | Règles + conventions vault                     |
| `~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md`          | Créé    | Index sémantique (mis à jour chaque nuit)      |
| `~/Documents/Obsidian/KnowledgeBase/_meta/watchlist.md`      | Créé    | Thèmes de surveillance actifs                  |
| `~/Documents/Obsidian/KnowledgeBase/_meta/signals.md`        | Créé    | Signaux auto-tuning de session                 |
| `~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json` | Créé    | Résumé du dernier run nocturne                 |
| `~/.mcp.json`                                                | Modifié | Ajout serveur knowledge-base MCP filesystem    |
| `~/Documents/Claude/CLAUDE.md`                               | Modifié | Instruction de consultation vault au démarrage |
| `~/.claude/settings.json`                                    | Modifié | Hook access-log PostToolUse Read               |

---

## Task 1 : Créer la structure du vault

**Fichiers :**

- Créé : `~/Documents/Obsidian/KnowledgeBase/` (arborescence complète)

- [ ] **Step 1 : Créer les répertoires**

```bash
mkdir -p ~/Documents/Obsidian/KnowledgeBase/universal/stack
mkdir -p ~/Documents/Obsidian/KnowledgeBase/universal/ux
mkdir -p ~/Documents/Obsidian/KnowledgeBase/universal/design
mkdir -p ~/Documents/Obsidian/KnowledgeBase/universal/trends
mkdir -p ~/Documents/Obsidian/KnowledgeBase/projects/gpparts
mkdir -p ~/Documents/Obsidian/KnowledgeBase/sensitive
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_inbox/review
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_logs
mkdir -p ~/Documents/Obsidian/KnowledgeBase/_meta
```

Expected : aucune erreur.

- [ ] **Step 2 : Restreindre l'accès au dossier sensitive**

```bash
chmod 700 ~/Documents/Obsidian/KnowledgeBase/sensitive
```

- [ ] **Step 3 : Créer .gitignore dans sensitive**

```bash
cat > ~/Documents/Obsidian/KnowledgeBase/sensitive/.gitignore << 'EOF'
# Ce dossier contient des données sensibles — ne jamais versionner
*
!.gitignore
EOF
```

- [ ] **Step 4 : Vérifier la structure**

```bash
ls -la ~/Documents/Obsidian/KnowledgeBase/
ls -la ~/Documents/Obsidian/KnowledgeBase/sensitive/ | head -2
```

Expected :

```
drwx------  ...  sensitive/   ← permission 700
drwxr-xr-x  ...  universal/
drwxr-xr-x  ...  _meta/
drwxr-xr-x  ...  _logs/
```

---

## Task 2 : Créer les fichiers meta initiaux

**Fichiers :**

- Créé : `VAULT.md`, `_meta/INDEX.md`, `_meta/watchlist.md`, `_meta/signals.md`, `_logs/last-nightly.json`

- [ ] **Step 1 : Créer VAULT.md (règles du vault)**

Écrire à `~/Documents/Obsidian/KnowledgeBase/VAULT.md` :

```markdown
# Knowledge Base — Règles et conventions

## Format des notes

Markdown pur. Pas de YAML frontmatter. Première ligne = titre H1.
Deuxième ligne = ligne de contexte obligatoire :

Source: [nom source] | Vérifié: YYYY-MM-DD | Confiance: haute/moyenne/basse

## Niveaux de confiance

- haute — documentation officielle, consensus ≥3 sources indépendantes
- moyenne — source reconnue, consensus partiel
- basse — journalistique, early-adopter, signal faible → aller dans \_inbox/review/

## Structure

- universal/ — connaissances réutilisables tous projets
- projects/ — décisions et patterns spécifiques à un projet
- sensitive/ — données sensibles (chmod 700, exclu MCP)
- \_inbox/review/ — notes en attente de validation
- \_logs/ — journaux système (access-log.jsonl, last-nightly.json)
- \_meta/ — INDEX.md, watchlist.md, signals.md

## Qui écrit quoi

- Notes universal/ et projects/ → agent nocturne + Claude en session
- \_meta/INDEX.md → agent nocturne (mise à jour chaque nuit)
- \_meta/signals.md → Claude en session (hits/misses/thèmes émergents)
- \_meta/watchlist.md → agent nocturne sur proposition, Claude sur demande explicite

## Tag machine

Toute note générée automatiquement contient en dernière ligne :

<!-- generated: YYYY-MM-DD -->
```

- [ ] **Step 2 : Créer INDEX.md initial (vide structuré)**

Écrire à `~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md` :

```markdown
# INDEX — Knowledge Base

Mis à jour : 2026-04-09
Notes indexées : 0

Format : `- [Titre](chemin/relatif.md) — mot-clé-1, mot-clé-2 — résumé en 10 mots max`

---

## universal/stack

_(vide — alimenté par l'agent nocturne)_

## universal/ux

_(vide — alimenté par l'agent nocturne)_

## universal/design

_(vide — alimenté par l'agent nocturne)_

## universal/trends

_(vide — alimenté par l'agent nocturne)_

## projects/gpparts

_(vide — alimenté manuellement ou en session)_
```

- [ ] **Step 3 : Créer watchlist.md initial**

Écrire à `~/Documents/Obsidian/KnowledgeBase/_meta/watchlist.md` :

```markdown
# Watchlist — Thèmes de surveillance

Mis à jour : 2026-04-09

## Stack technique

- Next.js App Router — évolutions, breaking changes, nouvelles features (source: nextjs.org/blog)
- Firebase Firestore — quotas, nouvelles API, patterns community (source: firebase.google.com/docs)
- TypeScript strict — nouvelles règles, patterns, deprecations (source: devblogs.microsoft.com/typescript)
- Tailwind v4 — migration, nouvelles utilities (source: tailwindcss.com/blog)

## UX & Accessibilité

- Patterns navigation e-commerce mobile-first — best practices checkout, panier, catalogue
- WCAG 2.2 — nouvelles règles accessibilité web
- Core Web Vitals — évolutions métriques Google (source: web.dev)
- Ergonomie formulaires checkout — patterns conversion, autocomplete, validation

## Design

- Design systems open source — shadcn/ui, Radix UI, Headless UI (mises à jour majeures)
- Typographie web — variable fonts, nouvelles tendances 2026
- Dark mode — patterns de tokens, implémentations CSS (custom properties)

## Trends & Business

- E-commerce DOM-TOM — Guadeloupe, contraintes logistiques, fiscalité locale (TVA 8.5%)
- Micro-SaaS / micro-business web — tarification, modèles freemium, stack minimale
- IA dans le dev web — outils, workflows Claude Code, adoption communauté
```

- [ ] **Step 4 : Créer signals.md initial**

Écrire à `~/Documents/Obsidian/KnowledgeBase/_meta/signals.md` :

```markdown
# Signaux auto-tuning

Format hits/misses : `YYYY-MM-DD — chemin/note.md — contexte court`
Format thèmes émergents : `NomThème — Nx mentionné — projet(s)`

---

## Hits (notes consultées et utiles)

_(vide — alimenté en session)_

## Misses (notes consultées, non pertinentes)

_(vide — alimenté en session)_

## Thèmes émergents (mentionnés 2+ fois sans note dédiée)

_(vide — alimenté en session)_

---

## Règles auto-tuning pour l'agent nocturne

- Note avec 0 hit en 30 jours → proposer archivage dans \_inbox/review/
- Thème émergent avec 3+ mentions → créer note prioritaire dès le prochain run
- Thème watchlist non mentionné en 60 jours → proposer suppression de watchlist.md
- Budget >80K tokens sur 3 nuits consécutives → supprimer le thème watchlist le moins consulté
```

- [ ] **Step 5 : Créer last-nightly.json initial**

Écrire à `~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json` :

```json
{
  "last_run": null,
  "status": "never_run",
  "notes_added": 0,
  "notes_in_review": 0,
  "themes_processed": [],
  "tokens_used": 0,
  "errors": []
}
```

- [ ] **Step 6 : Vérifier les fichiers créés**

```bash
ls ~/Documents/Obsidian/KnowledgeBase/_meta/
ls ~/Documents/Obsidian/KnowledgeBase/_logs/
cat ~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json
```

Expected :

```
INDEX.md   signals.md   watchlist.md
last-nightly.json
{"last_run":null,"status":"never_run",...}
```

---

## Task 3 : Configurer MCP filesystem

**Fichiers :**

- Modifié : `~/.mcp.json`

- [ ] **Step 1 : Lire le fichier actuel**

```bash
cat ~/.mcp.json
```

Expected (état actuel) :

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

- [ ] **Step 2 : Ajouter le serveur knowledge-base**

Éditer `~/.mcp.json` — remplacer le contenu entier par :

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

Note : `sensitive/` et `_logs/` sont intentionnellement exclus du MCP.

- [ ] **Step 3 : Valider le JSON**

```bash
jq . ~/.mcp.json
```

Expected : sortie JSON sans erreur. Si `parse error` → vérifier virgules et accolades.

---

## Task 4 : Mettre à jour CLAUDE.md global + hook access-log

**Fichiers :**

- Modifié : `~/Documents/Claude/CLAUDE.md`
- Modifié : `~/.claude/settings.json`

- [ ] **Step 1 : Lire CLAUDE.md global**

```bash
cat ~/Documents/Claude/CLAUDE.md
```

- [ ] **Step 2 : Ajouter la section Knowledge Base à CLAUDE.md**

Ajouter à la fin du fichier `~/Documents/Claude/CLAUDE.md` :

```markdown
## Knowledge Base Vault

Au démarrage de chaque session :

1. Lire `~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md` via MCP knowledge-base
2. Identifier les 1-3 notes les plus pertinentes au contexte de la demande
3. Lire uniquement ces notes (jamais de dump complet du vault)

En fin de session (si connaissances nouvelles détectées ou utilité mesurée) :

- Ajouter un signal dans `_meta/signals.md` (hit ou miss, thème émergent si 2+ mentions)
- Format : `YYYY-MM-DD — chemin/note.md — contexte court`

Règle de sobriété : si INDEX.md contient <10 notes, l'injection complète est acceptable.
Au-delà, sélection sémantique obligatoire.
```

- [ ] **Step 3 : Lire ~/.claude/settings.json (état actuel avec hooks claude-mem)**

```bash
cat ~/.claude/settings.json
```

- [ ] **Step 4 : Ajouter le hook access-log dans PostToolUse**

Le hook doit s'ajouter **dans** le tableau `hooks.PostToolUse` existant (après les hooks claude-mem), sans écraser. La structure finale du fichier `~/.claude/settings.json` doit inclure le hook suivant dans `hooks.PostToolUse` :

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

Ce hook s'ajoute à la liste des hooks PostToolUse existants (ne pas supprimer les hooks claude-mem).

- [ ] **Step 5 : Valider le JSON**

```bash
jq . ~/.claude/settings.json
```

Expected : sortie JSON valide sans erreur.

---

## Task 5 : Configurer l'agent nocturne RemoteTrigger

**Fichiers :** Aucun fichier projet.

- [ ] **Step 1 : Vérifier les triggers existants**

Appeler `RemoteTrigger` avec `action: "list"`.

Expected : liste vide `[]` ou liste sans trigger `nocturnal-kb-agent`.

- [ ] **Step 2 : Créer le trigger nocturne**

Appeler `RemoteTrigger` avec `action: "create"` et le body suivant :

````json
{
  "name": "nocturnal-kb-agent",
  "schedule": "17 2 * * *",
  "description": "Agent nocturne Knowledge Base — enrichissement vault Obsidian + auto-tuning watchlist",
  "prompt": "Tu es l'agent nocturne du Knowledge Base. Ton rôle : enrichir le vault Obsidian avec des connaissances vérifiées, selon la watchlist active.\n\n## Workflow obligatoire\n\n1. Lire `_meta/watchlist.md` via MCP knowledge-base\n2. Lire `_meta/signals.md` pour les signaux auto-tuning\n3. Pour chaque thème watchlist (dans l'ordre) :\n   a. WebSearch ciblé (3-5 requêtes max par thème)\n   b. Évaluer la fiabilité de chaque source selon la grille :\n      - Documentation officielle → confiance haute → vault direct (universal/<domaine>/)\n      - Consensus ≥3 sources indépendantes → confiance haute → vault direct\n      - Source reconnue, partiel → confiance moyenne → vault direct\n      - Journalistique/early-adopter → confiance basse → _inbox/review/\n   c. Rédiger la note en markdown pur :\n      - Ligne 1 : # Titre descriptif\n      - Ligne 2 : `Source: [nom] | Vérifié: YYYY-MM-DD | Confiance: haute/moyenne/basse`\n      - Corps : contenu utile, listes, exemples concrets\n      - Dernière ligne : `<!-- generated: YYYY-MM-DD -->`\n   d. Nommer le fichier : `kebab-case-du-titre.md` dans le bon sous-dossier\n4. Appliquer les décisions auto-tuning depuis signals.md :\n   - Thème émergent ≥3 mentions sans note → créer note prioritaire maintenant\n   - Note sans hit depuis 30 jours → déplacer vers _inbox/review/\n5. Mettre à jour `_meta/INDEX.md` :\n   - Ajouter une ligne par nouvelle note : `- [Titre](chemin.md) — mots-clés — résumé 10 mots`\n   - Mettre à jour la date et le compteur en tête de fichier\n6. Écrire `_logs/last-nightly.json` avec le résumé du run :\n   ```json\n   {\n     \"last_run\": \"YYYY-MM-DDTHH:MM:SSZ\",\n     \"status\": \"success\",\n     \"notes_added\": N,\n     \"notes_in_review\": N,\n     \"themes_processed\": [\"stack\", \"ux\", \"design\", \"trends\"],\n     \"tokens_used\": N,\n     \"errors\": []\n   }\n   ```\n\n## Budget tokens\n\nBudget nominal : 65 000 tokens. Hard stop : 80 000 tokens.\nSi tu approches 80 000 tokens en cours de run :\n- Arrêter immédiatement le traitement\n- Écrire last-nightly.json avec status: 'partial_budget_exceeded'\n- Ne pas écrire de note incomplète dans le vault\n\n## Règles qualité\n\n- Ne jamais inventer du contenu — uniquement synthétiser des sources vérifiées\n- Chaque note doit avoir une valeur actionnable (pas de résumé vague)\n- Préférer 3 notes de qualité à 10 notes médiocres\n- Les notes DOM-TOM (Guadeloupe) ont priorité haute — peu de sources, haute valeur\n- Ne jamais toucher au dossier sensitive/"
}
````

- [ ] **Step 3 : Vérifier le trigger créé**

Appeler `RemoteTrigger` avec `action: "list"`.

Expected : le trigger `nocturnal-kb-agent` apparaît avec son ID et son schedule `17 2 * * *`.

- [ ] **Step 4 : Mémoriser l'ID du trigger**

Noter l'ID retourné (format `trigger_xxxxxxxxx`) — utile pour le supprimer ou le modifier ultérieurement.

---

## Task 6 : Test end-to-end

**Fichiers :** Aucun.

- [ ] **Step 1 : Redémarrer Claude Code pour charger le nouveau MCP**

Fermer et rouvrir Claude Code (ou le terminal VS Code). Le serveur MCP knowledge-base doit s'initialiser automatiquement.

- [ ] **Step 2 : Vérifier que le MCP est accessible**

Demander à Claude de lire `_meta/INDEX.md` via le serveur MCP knowledge-base. Expected : contenu du fichier retourné correctement.

- [ ] **Step 3 : Tester le hook access-log**

Demander à Claude de lire une note du vault (ex: `_meta/watchlist.md`), puis vérifier :

```bash
cat ~/Documents/Obsidian/KnowledgeBase/_logs/access-log.jsonl
```

Expected : une ligne JSON avec `ts` et `file` contenant le chemin lu.

- [ ] **Step 4 : Lancer un run nocturne manuel pour valider**

Appeler `RemoteTrigger` avec `action: "run"` et `trigger_id: "<ID du trigger créé en Task 5>"`

Expected : le run se déclenche. Attendre ~2-3 minutes.

- [ ] **Step 5 : Vérifier les résultats du run**

```bash
cat ~/Documents/Obsidian/KnowledgeBase/_logs/last-nightly.json
ls ~/Documents/Obsidian/KnowledgeBase/universal/stack/
ls ~/Documents/Obsidian/KnowledgeBase/universal/ux/
```

Expected :

```json
{
  "last_run": "2026-04-09T...",
  "status": "success",
  "notes_added": 5,
  ...
}
```

Et des fichiers `.md` présents dans les sous-dossiers.

- [ ] **Step 6 : Vérifier que INDEX.md a été mis à jour**

```bash
cat ~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md
```

Expected : lignes de notes ajoutées avec format `- [Titre](chemin.md) — mots-clés — résumé`.

- [ ] **Step 7 : Test signal auto-tuning**

Ajouter manuellement un hit dans signals.md (simuler une session) :

```bash
cat >> ~/Documents/Obsidian/KnowledgeBase/_meta/signals.md << 'EOF'

## Hits (notes consultées et utiles)
2026-04-09 — universal/stack/nextjs-app-router.md — session gpparts phase4.5
EOF
```

- [ ] **Step 8 : Commit — pas applicable (vault hors repo git)**

Le vault est à `~/Documents/Obsidian/` — hors de tout repo git. Aucun commit nécessaire.

Vérifier que `sensitive/` est bien exclu :

```bash
ls -la ~/Documents/Obsidian/KnowledgeBase/sensitive/
```

Expected : `drwx------` (permission 700, contenu uniquement `.gitignore`).

---

## Critères de succès (récap spec)

- [ ] Vault créé avec structure complète (7 dossiers)
- [ ] `sensitive/` en chmod 700, exclu du MCP
- [ ] MCP knowledge-base accessible depuis Claude (INDEX.md lisible)
- [ ] Hook access-log actif (entrée dans access-log.jsonl après lecture vault)
- [ ] RemoteTrigger nocturne créé (schedule 2h17)
- [ ] Premier run manuel : ≥5 notes créées, last-nightly.json mis à jour
- [ ] INDEX.md mis à jour après run
- [ ] CLAUDE.md global instruit Claude de lire INDEX.md au démarrage
