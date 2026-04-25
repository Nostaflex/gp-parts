# claude-mem Installation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Installer claude-mem pour une mémoire automatique cross-projets, cost-efficient, avec injection de contexte au démarrage de chaque session.

**Architecture:** claude-mem s'installe via `npx claude-mem install` et injecte 5 hooks dans `~/.claude/settings.json`. Il tourne un service local (port 37777) via Bun, compresse les observations en fin de session via Claude Agent SDK, et stocke tout dans SQLite local (`~/.claude-mem/db.sqlite`). Les hooks projet dans `.claude/settings.local.json` (Prettier) ne sont pas touchés.

**Tech Stack:** Node.js 24, Bun (service worker), SQLite (stockage local), Claude Agent SDK (compression), hooks natifs Claude Code.

---

## Fichiers touchés

| Fichier                       | Action                 | Contenu ajouté                                                          |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `~/.claude/settings.json`     | Modifié par claude-mem | 5 hooks (SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd) |
| `~/.claude-mem/`              | Créé par claude-mem    | Base SQLite + config                                                    |
| `.claude/settings.local.json` | Non touché             | —                                                                       |

---

## Task 1 : Installer Bun

**Fichiers :**

- Aucun fichier projet — installation système globale

- [ ] **Step 1 : Installer Bun**

```bash
curl -fsSL https://bun.sh/install | bash
```

Expected output :

```
bun was installed successfully to ~/.bun/bin/bun
```

- [ ] **Step 2 : Recharger le PATH dans le terminal**

```bash
source ~/.zshrc
```

- [ ] **Step 3 : Vérifier l'installation**

```bash
bun --version
```

Expected : `1.x.x` (toute version ≥ 1.0)

- [ ] **Step 4 : Commit N/A — installation système, rien à commiter**

---

## Task 2 : Installer claude-mem

**Fichiers :**

- Modifié : `~/.claude/settings.json`
- Créé : `~/.claude-mem/` (géré par claude-mem)

- [ ] **Step 1 : Snapshot des hooks existants avant installation**

```bash
cat ~/.claude/settings.json
```

Expected : fichier actuel avec `enabledPlugins` + `env` + `model` — noter l'absence de clé `hooks` au niveau global.

- [ ] **Step 2 : Lancer l'installation**

```bash
npx claude-mem install
```

Expected output :

```
✓ claude-mem installed successfully
✓ Hooks registered in ~/.claude/settings.json
✓ Service configured on port 37777
```

- [ ] **Step 3 : Vérifier que les hooks ont été ajoutés sans écraser l'existant**

```bash
cat ~/.claude/settings.json
```

Expected : le fichier contient toujours `enabledPlugins`, `env`, `model` ET les nouveaux hooks claude-mem (SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd). Si `enabledPlugins` ou `env` ont disparu → Task 3 (merge manuel).

- [ ] **Step 4 : Vérifier que le hook Prettier projet n'est pas touché**

```bash
cat "/Users/djemildavid/Documents/Claude/Projects/Boutique en ligne Stephane/gpparts/.claude/settings.local.json"
```

Expected : fichier identique à avant — hook `PostToolUse` Prettier présent, aucun ajout claude-mem.

---

## Task 3 (conditionnelle) : Merge manuel si settings.json écrasé

> **Ne faire cette task que si la Step 3 de Task 2 révèle que `enabledPlugins` ou `env` ont disparu.**

**Fichiers :**

- Modifié : `~/.claude/settings.json`

- [ ] **Step 1 : Lire le fichier actuel**

```bash
cat ~/.claude/settings.json
```

- [ ] **Step 2 : Éditer pour restaurer les sections manquantes**

Le fichier doit contenir **toutes** ces sections fusionnées :

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "playwright@claude-plugins-official": true
  },
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<token existant — ne pas changer>"
  },
  "model": "sonnet",
  "hooks": {
    "<hooks claude-mem tels qu'installés>"
  }
}
```

- [ ] **Step 3 : Valider le JSON**

```bash
jq . ~/.claude/settings.json
```

Expected : sortie JSON sans erreur. Si erreur `parse error` → corriger la syntaxe (virgule manquante, accolade non fermée).

---

## Task 4 : Vérifier le service claude-mem

**Fichiers :** Aucun fichier projet.

- [ ] **Step 1 : Redémarrer Claude Code**

Fermer et rouvrir Claude Code (ou le terminal VS Code). Le service Bun doit démarrer automatiquement au premier hook SessionStart.

- [ ] **Step 2 : Vérifier que le service tourne**

```bash
curl -s http://localhost:37777/health 2>/dev/null && echo "SERVICE_UP" || echo "SERVICE_DOWN"
```

Expected : `SERVICE_UP`

Si `SERVICE_DOWN` → lancer manuellement :

```bash
npx claude-mem start
```

- [ ] **Step 3 : Vérifier la base SQLite**

```bash
ls ~/.claude-mem/
```

Expected : présence d'un fichier `db.sqlite` (créé à la première session).

---

## Task 5 : Test end-to-end

**Fichiers :** Aucun.

- [ ] **Step 1 : Ouvrir une session Claude Code, faire 2-3 échanges courts**

Par exemple : demander "quel est le statut de gp-parts ?" et répondre à 2 questions.

- [ ] **Step 2 : Fermer la session (SessionEnd hook doit se déclencher)**

Fermer le terminal ou la fenêtre Claude Code.

- [ ] **Step 3 : Vérifier que des observations ont été enregistrées**

```bash
ls -la ~/.claude-mem/db.sqlite
```

Expected : fichier avec une taille > 0 et une date de modification récente.

- [ ] **Step 4 : Ouvrir une nouvelle session et vérifier l'injection**

Au démarrage, Claude doit mentionner spontanément le contexte de la session précédente, ou le contexte doit apparaître dans le prompt système initial.

- [ ] **Step 5 : Confirmer que Prettier fonctionne toujours**

Dans gp-parts, éditer un fichier `.ts` via Claude → vérifier que le formatage automatique s'applique toujours (hook Prettier projet toujours actif).

---

## Critères de succès (récap spec)

- [ ] `npx claude-mem install` complète sans erreur
- [ ] 5 hooks claude-mem présents dans `~/.claude/settings.json`
- [ ] `enabledPlugins`, `env`, `model` toujours présents dans `~/.claude/settings.json`
- [ ] Hook Prettier dans `.claude/settings.local.json` inchangé
- [ ] Après une session test → SQLite contient des entrées
- [ ] Nouvelle session → contexte de la session précédente injecté automatiquement
