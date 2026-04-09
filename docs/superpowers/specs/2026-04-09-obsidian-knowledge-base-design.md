# Obsidian Knowledge Base — Design Spec

Date : 2026-04-09
Statut : Approuvé

---

## Contexte

Djemil gère 4+ projets simultanés avec Claude Code. Chaque session repart de zéro sur les
décisions transversales (stack, UX, design, business). Le besoin est une base de connaissance :

- **Cross-projets** — accessible depuis n'importe quelle session
- **Token-sobre** — injection sélective, pas dump total
- **Auto-alimentée** — enrichie automatiquement (nuit), sans intervention manuelle
- **Sécurisée** — données sensibles protégées, non accessibles au système de fichiers public
- **Auto-tuning** — s'améliore selon l'utilité réelle perçue pendant les sessions

---

## Architecture retenue : Hybride (Algo + LLM-native)

Résultat d'une comparaison exhaustive entre Architecture A (algorithmes purs, YAML,
scoring Python) et Architecture B (LLM-native, markdown pur, sans algorithmes).

**Principe directeur :**

- **Algo pour le plomberie** — ce qui est déterministe, répétitif, 0 token
- **LLM pour le jugement** — ce qui requiert pertinence, fiabilité, classification

### Répartition des responsabilités

| Tâche                              | Méthode                          | Coût           |
| ---------------------------------- | -------------------------------- | -------------- |
| Logger les accès vault             | Hook + access-log.jsonl          | 0 token        |
| Vérifier l'intégrité vault         | integrity-check.sh (Bash)        | 0 token        |
| Tracker le résumé nightly          | last-nightly.json (minimal JSON) | 0 token        |
| Sélectionner les notes pertinentes | LLM (INDEX.md sémantique)        | ~500t          |
| Juger la fiabilité d'une source    | LLM (consensus/pattern)          | ~300t          |
| Classifier + écrire les notes      | LLM (agent nocturne)             | ~55-75K t/nuit |
| Décider auto-tuning watchlist      | LLM (signals → verdict)          | ~200t          |

---

## Structure du vault

Emplacement : `~/Documents/Obsidian/KnowledgeBase/`

```
KnowledgeBase/
├── universal/               # Connaissances transversales (tous projets)
│   ├── stack/               # Next.js, Firebase, TypeScript, Tailwind…
│   ├── ux/                  # Patterns UX, accessibilité, ergonomie
│   ├── design/              # Design systems, typographie, couleur
│   └── trends/              # Tendances web, business, DOM-TOM
├── projects/                # Connaissances spécifiques projets
│   └── gpparts/             # GP Parts — décisions, patterns, anti-bugs
├── sensitive/               # Données sensibles (chmod 700)
│   └── .gitignore           # Exclure ce dossier de tout VCS
├── _inbox/
│   └── review/              # Notes en attente de validation (score < 0.7)
├── _logs/
│   ├── access-log.jsonl     # Accès vault (hook, append-only)
│   └── last-nightly.json    # Résumé du dernier run nocturne
├── _meta/
│   ├── INDEX.md             # Index sémantique de tout le vault
│   ├── watchlist.md         # Thèmes de surveillance (prose markdown)
│   └── signals.md           # Signaux d'auto-tuning (markdown)
└── VAULT.md                 # README vault — règles + conventions
```

### Sécurité

- `sensitive/` : `chmod 700 ~/Documents/Obsidian/KnowledgeBase/sensitive/`
- macOS FileVault activé (chiffrement disque entier)
- Vault exclu des backups cloud non chiffrés (iCloud optionnel, non automatique)
- MCP filesystem limité aux dossiers `universal/`, `projects/`, `_meta/` uniquement

---

## Format des notes

### Principe

Markdown pur — pas de frontmatter YAML. LLM-native = lisible par Claude sans parsing.

### Structure d'une note

```markdown
# Titre de la connaissance

Source: MDN Web Docs | Vérifié: 2026-04-09 | Confiance: haute

Contenu de la note rédigé directement, en prose ou listes markdown.
Pas de structure formelle imposée — chaque note choisit son format naturel.
```

### Convention `Confiance`

- `haute` — source officielle, consensus multi-sources, ou vérification déterministe
- `moyenne` — source reconnue, consensus partiel, ou pattern observé
- `basse` — journalistique, early-adopter, ou signal faible non confirmé

Notes avec `basse` → vont dans `_inbox/review/` jusqu'à confirmation.

---

## INDEX.md

Index sémantique, mis à jour par l'agent nocturne.

Format par entrée (une ligne) :

```
- [Titre de la note](chemin/relatif.md) — mot-clé-1, mot-clé-2 — résumé en 10 mots max
```

Utilisé par Claude en SessionStart pour sélection sémantique (~500 tokens total pour
l'INDEX complet, vs injection de toutes les notes).

---

## watchlist.md

Liste des thèmes de surveillance actifs pour l'agent nocturne. Format prose markdown.

Structure :

```markdown
# Watchlist — Thèmes de surveillance

Mis à jour : 2026-04-09

## Stack technique

- Next.js App Router (évolutions, breaking changes, nouvelles features)
- Firebase Firestore (quotas, nouvelles API, patterns community)
- TypeScript strict (nouvelles règles, patterns, deprecations)
- Tailwind v4 (migration, nouvelles utilities)

## UX & Accessibilité

- Patterns de navigation e-commerce (mobile-first)
- WCAG 2.2 — nouvelles règles accessibilité
- Core Web Vitals — évolutions métriques Google
- Ergonomie formulaires checkout

## Design

- Design systems open source (shadcn/ui, Radix, Headless UI)
- Typographie web (variable fonts, nouvelles tendances)
- Dark mode patterns et tokens systems

## Trends & Business

- E-commerce DOM-TOM (Guadeloupe, contraintes logistiques, fiscalité)
- Micro-business web (tarification, modèles freemium)
- IA dans le dev web (outils, workflows, adoption)
```

L'agent peut proposer des ajouts/suppressions basés sur les signaux de sessions récentes.
Toute modification passe par `_inbox/review/` avant injection dans watchlist.

---

## signals.md

Fichier de signaux d'auto-tuning. Alimenté par les hooks de session.

```markdown
# Signaux auto-tuning

## Hits récents (notes consultées et utiles)

- 2026-04-09 — universal/stack/nextjs-app-router.md — session gpparts (phase4)

## Misses récents (notes consultées, non utiles)

- 2026-04-09 — universal/trends/web-animations.md — hors contexte

## Thèmes émergents (mentionnés 2+ fois sans note dédiée)

- "Resend transactional emails" — mentionné 3x (gpparts sessions)
- "Stripe DOM-TOM" — mentionné 2x
```

L'agent nocturne lit signals.md pour décider :

1. Notes avec 0 hit en 30 jours → proposer archivage
2. Thèmes émergents avec 3+ hits → créer note prioritaire
3. Watchlist outdated (thème non mentionné en 60j) → proposer suppression

---

## Tier 3 : claude-mem (mémoire de session)

claude-mem est déjà installé. Il capture automatiquement :

- Actions outils pendant la session
- Échanges utilisateur ↔ Claude
- Tâches complétées / restantes

**Interaction avec le vault :** aucune collision. claude-mem gère la mémoire
éphémère de session (SQLite local). Le vault gère la connaissance distillée
(markdown durable). Les deux sont complémentaires, non redondants.

---

## Tier 2 : CLAUDE.md projet

Chaque projet garde son propre `CLAUDE.md` avec :

- Anti-patterns spécifiques
- Décisions d'architecture (ADRs)
- Conventions de code
- Phase actuelle et scope

Ces informations ne migrent PAS dans le vault (elles sont dans le repo, versionnées).
Le vault contient uniquement les connaissances universelles réutilisables cross-projets.

---

## Tier 1 : Vault Obsidian (connaissance distillée)

Claude injecte le contenu du vault de manière sélective :

1. Au démarrage de session : lire INDEX.md (~500 tokens)
2. Sur demande implicite : lire les notes pertinentes identifiées dans l'INDEX
3. Jamais : dump complet du vault

---

## Agent nocturne

### Déclenchement

RemoteTrigger cron : `17 2 * * *` (2h17 du matin — heure non standard pour éviter
congestion)

### Workflow d'un run nocturne

```
1. Lire watchlist.md (liste des thèmes)
2. Pour chaque thème → recherche web ciblée (3-5 sources)
3. Pour chaque source → vérification fiabilité (LLM)
   - Confiance haute/moyenne → note dans vault (dossier correct)
   - Confiance basse → note dans _inbox/review/
4. Lire signals.md → décisions auto-tuning
5. Mettre à jour INDEX.md (nouvelles entrées)
6. Écrire last-nightly.json (résumé: N notes ajoutées, N en review, thèmes traités)
7. Si anomalie → ne pas déclencher, logger dans _logs/
```

### Budget tokens

- Budget nominal : 55K-75K tokens/nuit
- Hard stop : 80K tokens (arrêt immédiat, log partiel)
- Si >80K sur 3 nuits consécutives → réduire watchlist automatiquement (supprimer
  le thème le moins consulté)

### Vérification des sources

| Type de source                 | Mode de vérification             | Destination              |
| ------------------------------ | -------------------------------- | ------------------------ |
| Documentation officielle       | Déterministe (URL officielle)    | vault direct             |
| Consensus multi-sources (≥3)   | Consensus LLM                    | vault si ≥0.7            |
| Article expert reconnu         | Normative LLM                    | \_inbox/review/ si < 0.7 |
| Journalistique / early-adopter | Pattern-observation              | \_inbox/review/ toujours |
| Institutionnel DOM-TOM         | Déterministe (source officielle) | vault direct             |

### Guards avant injection vault

Avant d'écrire une note dans le vault (hors `_inbox/review/`) :

1. **Validation structurelle** : note contient titre + ligne Source/Vérifié/Confiance
2. **Machine tag** : ajout automatique `<!-- generated: YYYY-MM-DD -->` en bas de note
3. **Log nightly** : entrée dans last-nightly.json

---

## MCP Filesystem

Configuration à ajouter dans `~/.mcp.json` :

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
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

`sensitive/` est intentionnellement exclu du MCP.

---

## Instruction globale Claude

À ajouter dans `~/Documents/Claude/CLAUDE.md` :

```markdown
## Knowledge Base Vault

Au démarrage de chaque session :

1. Lire `~/Documents/Obsidian/KnowledgeBase/_meta/INDEX.md` via MCP knowledge-base
2. Identifier les notes pertinentes au contexte de la demande
3. Lire uniquement ces notes (pas de dump complet)

En fin de session (si connaissances nouvelles ou signaux d'utilité) :

- Ajouter un signal dans `_meta/signals.md` (hit ou miss, thème émergent)
```

---

## Estimation coût mensuel

| Composant                           | Tokens/mois         | Notes                    |
| ----------------------------------- | ------------------- | ------------------------ |
| INDEX.md au démarrage (30 sessions) | ~15K                | 500t × 30                |
| Lecture notes pertinentes           | ~30K                | ~1K t/note × 30 sessions |
| Agent nocturne (30 nuits × 65K t)   | ~1 950K             | Budget nominal           |
| Auto-tuning signals (30 sessions)   | ~6K                 | 200t × 30                |
| **Total**                           | **~2M tokens/mois** |                          |

Comparatif : Architecture A (algo pur) = 1.29M/mois, Architecture B (LLM pur) = 3.02M/mois.
L'hybride est le meilleur équilibre qualité/coût.

---

## Critères de succès

- [ ] Vault créé avec structure complète
- [ ] MCP filesystem configuré et accessible depuis Claude
- [ ] INDEX.md initial généré (vide structuré)
- [ ] watchlist.md initialisé avec les 4 domaines
- [ ] RemoteTrigger nocturne configuré (2h17)
- [ ] Premier run nocturne : ≥5 notes créées, budget respecté
- [ ] Session suivante : INDEX.md lu automatiquement au démarrage
- [ ] signals.md : au moins 1 hit ou miss enregistré après une session test
- [ ] `sensitive/` : chmod 700 vérifié, exclu du MCP

---

## Hors périmètre

- Obsidian Sync (cloud Obsidian) — hors scope, non nécessaire
- Embeddings distants / RAG cloud — overkill pour usage personnel
- Interface Obsidian graphique — optionnel, le vault fonctionne sans ouvrir Obsidian
- Partage du vault avec d'autres utilisateurs
