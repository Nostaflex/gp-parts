# Mémoire Globale Cross-Sessions — Design Spec

Date : 2026-04-09  
Statut : À valider

---

## Contexte

Claude Code stocke nativement les transcriptions complètes de chaque session (`.jsonl`, ~1-2 Mo/session) mais ces fichiers sont illisibles et non consultables. L'auto-memory natif (`~/.claude/projects/*/memory/`) est actif mais limité à un projet à la fois.

**Besoin :** Mémoire automatique, cross-projets (4+), focalisée sur progression/tâches/décisions, cost-efficient.

---

## Décisions de design

### Solution retenue : claude-mem (Option B)

Plugin open source (46K stars) qui :

1. Capture les actions et échanges pendant la session via hooks natifs Claude Code
2. Compresse via Claude Agent SDK en fin de session
3. Stocke dans SQLite local (`~/.claude-mem/db.sqlite`)
4. Injecte le contexte pertinent au démarrage de la session suivante via recherche 3 couches

**Pourquoi pas claude-memory-compiler :** Coût API à chaque SessionEnd + PreCompact — incompatible avec l'objectif cost-efficient.

**Pourquoi pas hook custom seul :** Pas d'injection automatique au démarrage, pas de recherche cross-projets.

---

## Architecture

```
Session active
     │
     ├── PostToolUse hook  → capture actions outils
     ├── UserPromptSubmit hook → capture échanges
     │
SessionEnd / Stop hook
     │
     ▼
claude-mem service (localhost:37777)
     │
     ├── Compression Claude Agent SDK
     └── Stockage SQLite (~/.claude-mem/db.sqlite)
          └── tags : projet, date, type

SessionStart hook (session suivante)
     │
     ▼
Recherche 3 couches
  1. Index léger     (~50-100 tokens/résultat)
  2. Contexte chrono (si pertinent)
  3. Détail complet  (seulement si nécessaire)
     │
     ▼
Injection contexte → session active
```

---

## Coexistence avec l'existant

| Système existant                                 | Rôle                         | Interaction avec claude-mem  |
| ------------------------------------------------ | ---------------------------- | ---------------------------- |
| Auto-memory natif `~/.claude/projects/*/memory/` | Notes Claude → Claude        | Aucune — indépendant         |
| `tasks/lessons.md` gp-parts                      | Anti-patterns projet         | Aucune — géré manuellement   |
| `session-latest.json`                            | Reprise d'urgence            | Aucune — complémentaire      |
| Hook Prettier `.claude/settings.local.json`      | Format auto après Edit/Write | Aucun conflit — scope projet |
| Commandes `/grill` `/techdebt` `/test-and-fix`   | Qualité code                 | Aucune                       |

**Règle :** claude-mem écrit dans `~/.claude/settings.json` (global). Les hooks projet restent dans `.claude/settings.local.json`. Pas de collision.

---

## Périmètre d'installation

| Scope                 | Fichier modifié           | Contenu ajouté       |
| --------------------- | ------------------------- | -------------------- |
| Global (tous projets) | `~/.claude/settings.json` | 5 hooks claude-mem   |
| Global                | `~/.claude-mem/`          | Base SQLite + config |
| Projet gp-parts       | Rien                      | Inchangé             |

---

## Ce qui est capturé

**Priorité haute (objectif principal) :**

- Tâches complétées pendant la session
- Tâches restantes / prochaines étapes
- Décisions techniques prises

**Capturé automatiquement :**

- Actions outils (fichiers créés/modifiés, commandes exécutées)
- Échanges utilisateur ↔ Claude

**Non capturé (intentionnel) :**

- Secrets, tokens, clés API (balise `<private>` disponible)
- Contenu déjà dans CLAUDE.md (doublon inutile)

---

## Prérequis installation

- Node.js 18.0.0+ → `node --version`
- Bun (service worker claude-mem) → `curl -fsSL https://bun.sh/install | bash`
- npx disponible → inclus avec Node.js

---

## Installation (à exécuter)

```bash
# 1. Installer Bun si absent
curl -fsSL https://bun.sh/install | bash

# 2. Installer claude-mem globalement
npx claude-mem install

# 3. Vérifier les hooks dans ~/.claude/settings.json
cat ~/.claude/settings.json
```

---

## Critères de succès

- [ ] `npx claude-mem install` complète sans erreur
- [ ] 5 hooks présents dans `~/.claude/settings.json` (SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd)
- [ ] Aucun conflit avec le hook Prettier existant dans `.claude/settings.local.json`
- [ ] Après une session test, SQLite contient des entrées
- [ ] Démarrage d'une nouvelle session → contexte de la session précédente injecté automatiquement

---

## Hors périmètre

- Auto-dream Anthropic (feature flag non disponible publiquement)
- Embeddings distants / RAG (overkill pour usage personnel)
- Compilation de knowledge base (claude-memory-compiler) — coût trop élevé
