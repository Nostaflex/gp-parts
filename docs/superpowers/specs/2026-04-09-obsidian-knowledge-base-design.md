# Obsidian Knowledge Base — Design Spec (v2)

Date : 2026-04-09
Statut : Approuvé — architecture éprouvée contre les patterns terrain (Karpathy, Zettelkasten,
LYT, retours communauté Obsidian 2025-2026)

---

## Contexte

Djemil gère 4+ projets simultanés avec Claude Code. Chaque session repart de zéro sur les
décisions transversales (stack, UX, design, business). Le besoin est un cerveau secondaire :

- **Cross-projets** — accessible depuis n'importe quelle session Claude Code
- **Token-sobre** — injection sélective en deux vitesses, jamais de dump complet
- **Autonome** — enrichi automatiquement la nuit, sans intervention manuelle
- **Sécurisé** — données sensibles protégées, hallucinations LLM contenues (quarantine)
- **Auto-tuning** — s'améliore selon l'utilité réelle mesurée en session
- **Esprit Obsidian** — structure émergente (tags + liens), pas top-down planifiée

---

## Architecture retenue : Hybride (Algo plomberie + LLM jugement)

Résultat d'une comparaison exhaustive A vs B + épreuve contre les patterns terrain.

### Principe directeur

| Responsabilité                         | Méthode                   | Coût           |
| -------------------------------------- | ------------------------- | -------------- |
| Backup avant run                       | rsync Bash                | 0 token        |
| Rebuild INDEX.md depuis fichiers réels | Bash + find               | 0 token        |
| Vérifier wikilinks cassés              | Bash grep                 | 0 token        |
| Logger les accès vault                 | Hook PostToolUse          | 0 token        |
| Tracking état run nocturne             | last-nightly.json         | 0 token        |
| Sélectionner notes pertinentes         | LLM (INDEX.md + tags)     | ~200t          |
| Juger fiabilité d'une source           | LLM (consensus/pattern)   | ~300t          |
| Rédiger + classifier les notes         | LLM (agent nocturne)      | ~55-75K t/nuit |
| Régénérer context-cards                | LLM (fin de run nocturne) | ~2K t/nuit     |
| Décisions auto-tuning watchlist        | LLM (signals → verdict)   | ~200t          |

### Les deux lecteurs du vault

Le vault a deux utilisateurs avec des capabilities radicalement différentes.
L'architecture en tient compte explicitement.

| Feature                   | Claude (MCP filesystem)  | Djemil (Obsidian app)     |
| ------------------------- | ------------------------ | ------------------------- |
| Fichiers markdown bruts   | ✅                       | ✅                        |
| Wiki-links `[[note]]`     | ✅ suit le lien via MCP  | ✅ navigation graphe      |
| Tags `#tag` dans le texte | ✅ lisibles              | ✅ filtrables             |
| Graph view                | ❌                       | ✅ maintenance visuelle   |
| Dataview queries          | ❌ (voit le code source) | ✅ (tags only, sans YAML) |
| Embeds `![[note]]`        | ❌ (texte brut)          | ✅ (rendu)                |
| Canvas                    | ❌                       | ✅ project dashboards     |
| Auto Note Mover           | ❌                       | ✅ validation \_inbox     |
| Backlinks sidebar         | ❌                       | ✅ navigation             |

---

## Structure du vault

Emplacement : `~/Documents/Obsidian/KnowledgeBase/`

```
KnowledgeBase/
├── universal/               # Connaissances cross-projets validées
│   (pas de sous-dossiers forcés — tags font ce travail)
├── projects/                # Connaissances spécifiques projet
│   └── gpparts/             # Décisions, patterns, anti-bugs GP Parts
│       └── decisions/       # ADRs et décisions d'architecture
├── sensitive/               # Données sensibles (chmod 700, exclu MCP)
│   └── .gitignore
├── _inbox/                  # Zone de quarantine
│   ├── agent/               # Notes nocturnes en attente de validation
│   │   └── YYYY-MM-DD/      # Groupées par nuit
│   ├── review/              # Notes basse confiance (validation humaine)
│   │   └── superseded/      # Notes remplacées par une version plus récente
│   └── session/             # Dumps de fin de session Claude
├── _logs/
│   ├── access-log.jsonl     # Accès vault (hook, append-only)
│   ├── last-nightly.json    # Résumé du dernier run nocturne
│   ├── broken-links.txt     # Wikilinks cassés détectés
│   └── maintenance-report.md # Rapport hebdomadaire (lisible par Djemil)
├── _meta/
│   ├── INDEX.md             # Index sémantique — DÉRIVÉ (recalculé, pas source de vérité)
│   ├── watchlist.md         # Thèmes de surveillance (🔴🟡⚪)
│   ├── signals.md           # Signaux auto-tuning (rolling 30 jours)
│   ├── context-gpparts.md   # Context-card GP Parts (200 tokens max)
│   └── context-<projet>.md  # Context-card par projet actif
├── _archive/                # Notes retirées (0 hit depuis 90j)
│   └── YYYY/
└── VAULT.md                 # Règles, conventions, arbre de décision filing
```

### Sécurité

- `sensitive/` : `chmod 700` — jamais accessible via MCP
- macOS FileVault activé (chiffrement disque entier)
- MCP filesystem limité aux dossiers `universal/`, `projects/`, `_meta/`
- `_inbox/`, `_logs/`, `sensitive/` exclus du MCP

---

## Format des notes

### Principes fondamentaux

1. **Markdown pur** — pas de YAML frontmatter (corrompt silencieusement lors des writes partiels)
2. **Atomicité Zettelkasten** — 1 note = 1 concept testable indépendamment. Test : peut-on supprimer une section sans que le reste soit incomplet ? Si oui → deux notes.
3. **Wikilinks write-time** — un `[[lien]]` n'est écrit que si la note cible est confirmée dans INDEX.md au moment de l'écriture. Sinon → texte simple sans brackets.
4. **Tags dans le corps** — jamais en frontmatter YAML

### Template de note (obligatoire)

```markdown
# Titre du concept (une seule idée)

Source: [nom ou URL] | Vérifié: YYYY-MM-DD | Confiance: haute/moyenne/basse
Tags: #tag1 #tag2 #tag3

## Essentiel

[Ce qu'il faut savoir en 3 lignes max — lu en priorité par Claude, ~50 tokens]

## Détail

[Explication complète, exemples, code si pertinent — lu seulement si nécessaire]

## Liens

- [[note-connexe-existante]]
- [[autre-note-confirmée]]

<!-- generated: YYYY-MM-DD -->
```

### Niveaux de confiance

| Confiance | Critère                                          | Destination                            |
| --------- | ------------------------------------------------ | -------------------------------------- |
| haute     | Documentation officielle OU consensus ≥3 sources | `_inbox/agent/` → 72h → `universal/`   |
| moyenne   | Source reconnue, consensus partiel               | `_inbox/agent/` → 72h → `universal/`   |
| basse     | Journalistique, early-adopter, signal faible     | `_inbox/review/` (validation manuelle) |

### Convention succession (remplacement de note)

Quand une note remplace une ancienne version :

```markdown
# Tailwind v4 — Custom Tokens

Source: tailwindcss.com/docs | Vérifié: 2026-05-01 | Confiance: haute
Tags: #tailwind #css #tokens #design-system
Remplace: [[tailwind-v3-custom-tokens]]

## Essentiel

...
```

L'ancienne note est déplacée vers `_inbox/review/superseded/`.

### Arbre de décision filing (dans le prompt agent)

```
Est-ce que cette connaissance est vraie indépendamment du projet ?
  └─ OUI → universal/
  └─ NON → projects/<projet>/

Est-ce que cette note référence du code spécifique au projet ?
  └─ OUI → projects/<projet>/

Est-ce une décision d'architecture (ADR) ?
  └─ OUI → projects/<projet>/decisions/
```

Décision déterministe — pas de jugement LLM sur la catégorie.

---

## INDEX.md

**Principe clé : INDEX.md est DÉRIVÉ, pas source de vérité.** Il est recalculé depuis les
fichiers réels avant chaque run nocturne par `integrity-check.sh`. Si INDEX.md diverge du
vault réel → il est écrasé, jamais corrigé manuellement.

### Format

```markdown
# INDEX — Knowledge Base

Mis à jour : YYYY-MM-DD | Notes actives : N | Plafond : 300

---

## universal/ — #stack

- [Titre de la note](universal/note.md) — #nextjs #ssr — résumé en 10 mots

## universal/ — #ux

...

## projects/gpparts

...
```

Index organisé par **tags dominants**, pas par dossier. Une note `#nextjs #performance`
apparaît dans la section `#nextjs`. Les tags sont la vraie structure.

---

## Context-cards par projet

Fichier : `_meta/context-<projet>.md`
Généré/régénéré par l'agent nocturne à la fin de chaque run.

### Structure (quota dur)

```markdown
# Context — GP Parts

## Fondations (toujours utiles — max 5 liens)

- [[prix-centimes-convention]] — règle de base des prix
- [[vat-guadeloupe-8-5]] — TVA DOM-TOM 8.5%
- [[anti-bug-checkout-race-condition]] — bug critique documenté

## Stack actuelle (max 5 liens)

- [[nextjs-14-app-router-patterns]]
- [[firebase-auth-ssr-cookies]]

## Focus session en cours (mis à jour par Claude en session)

_(vide au démarrage — Claude remplit selon la demande utilisateur)_
```

**Quota :** max 3 sections × 5 liens = 15 liens max. 200 tokens maximum.
Si une note doit entrer → une autre sort. La context-card reste chirurgicale.

### Règle de lecture au démarrage

Claude détecte le projet depuis le `pwd` au démarrage :

- `pwd` contient `gpparts` → lire `context-gpparts.md` (200t)
- `pwd` contient `<autre-projet>` → lire `context-<autre-projet>.md`
- Aucun match → lire INDEX.md sélectivement (section pertinente uniquement)
- INDEX.md < 10 notes → injection complète acceptable

### Retrieval à deux vitesses

```
1. context-<projet>.md    (~200t)  → toujours lu au démarrage
2. INDEX.md (section tag) (~100t)  → si besoin d'élargir
3. ## Essentiel ciblé     (~50t/note) → survol rapide
4. ## Détail              (~500t/note) → seulement si nécessaire
```

---

## Quarantine et promotion des notes

### Workflow quarantine

Toutes les notes générées par l'agent nocturne atterrissent dans `_inbox/agent/YYYY-MM-DD/`.

```
Agent nocturne
     │
     └─ Écrit dans _inbox/agent/YYYY-MM-DD/note.md
          │
          ├─ 72h sans rejet → auto-promotion vers universal/ ou projects/
          │    (approbation silencieuse = workflow fluide)
          │
          └─ Djemil ouvre Obsidian → balayage rapide
               ├─ Ajoute #validated → Auto Note Mover déplace vers bon dossier
               └─ Laisse tel quel → promotion automatique après 72h
```

### Context-cards pendant la quarantine

Les context-cards incluent les notes validées + les notes récentes en quarantine
avec marquage clair :

```markdown
## Stack actuelle

- [[firebase-auth-ssr-cookies]] ← validée
- [nextjs-15-breaking-changes] [A] ← agent, pending 72h
```

`[A]` = agent, pas encore validé. Claude sait que c'est non confirmé.

---

## watchlist.md

```markdown
# Watchlist — Thèmes de surveillance

Mis à jour : YYYY-MM-DD

## 🔴 Priorité haute (traités en premier par l'agent)

- Next.js App Router — évolutions, breaking changes (source: nextjs.org/blog)
- Firebase Firestore — quotas, nouvelles API (source: firebase.google.com/docs)
- E-commerce DOM-TOM — Guadeloupe, TVA, logistique (source: impots.gouv.fr, ladom.fr)

## 🟡 Priorité normale

- TypeScript strict — nouvelles règles, deprecations
- Tailwind v4 — migration, nouvelles utilities
- Patterns checkout UX — conversion, ergonomie formulaires
- Core Web Vitals — évolutions métriques Google
- Design systems open source — shadcn/ui, Radix UI

## ⚪ Veille légère (si budget restant)

- Micro-SaaS web — modèles freemium, stack minimale
- IA dans le dev web — outils, workflows, adoption
- Typographie web — variable fonts, tendances 2026
```

L'agent traite 🔴 → 🟡 → ⚪. Budget épuisé = arrêt propre, jamais au milieu d'une section 🔴.

---

## signals.md

Rolling window 30 jours. Compressé chaque semaine par l'agent.

```markdown
# Signaux auto-tuning

Fenêtre active : 30 derniers jours
Compression hebdomadaire : agrégat des 30 jours précédents conservé (1 ligne/thème)

---

## Hits (notes consultées et utiles)

YYYY-MM-DD — universal/note.md — contexte court

## Misses (notes consultées, non pertinentes)

YYYY-MM-DD — universal/note.md — raison

## Thèmes émergents (2+ mentions sans note dédiée)

NomThème — Nx mentionné — projet(s)

---

## Règles auto-tuning

- Thème émergent ≥3 mentions → créer note prioritaire au prochain run 🔴
- Note sans hit depuis 30 jours → signaler dans maintenance-report.md
- Note sans hit depuis 90 jours → déplacer vers \_archive/YYYY/
- Thème watchlist non mentionné depuis 60 jours → proposer passage ⚪ ou suppression
- Budget >80K tokens sur 3 nuits → supprimer le thème ⚪ le moins consulté

## Agrégat mois précédent

firebase — 8 hits mars 2026
nextjs — 5 hits mars 2026
```

---

## integrity-check.sh

Script Bash exécuté **avant** chaque run nocturne. Coût : 0 token.

```bash
#!/bin/bash
# integrity-check.sh — exécuté avant chaque run nocturne agent
set -e

VAULT="$HOME/Documents/Obsidian/KnowledgeBase"
LOGS="$VAULT/_logs"
META="$VAULT/_meta"

# 1. Backup atomique
rsync -a --quiet "$VAULT/" "$VAULT.bak/"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) backup ok" >> "$LOGS/access-log.jsonl"

# 2. Vérifier si le run précédent a crashé
STATUS=$(jq -r '.status' "$LOGS/last-nightly.json" 2>/dev/null || echo "unknown")
if [ "$STATUS" = "in_progress" ]; then
  echo "Run précédent interrompu — restore depuis backup"
  rsync -a --quiet "$VAULT.bak/" "$VAULT/"
  jq '.status = "restored"' "$LOGS/last-nightly.json" > /tmp/nightly.tmp \
    && mv /tmp/nightly.tmp "$LOGS/last-nightly.json"
fi

# 3. Reconstruire INDEX.md depuis les fichiers réels
{
  echo "# INDEX — Knowledge Base"
  echo ""
  echo "Mis à jour : $(date +%Y-%m-%d) | Notes actives : $(
    find "$VAULT/universal" "$VAULT/projects" -name "*.md" \
      ! -name "INDEX.md" ! -name "VAULT.md" | wc -l | tr -d ' '
  ) | Plafond : 300"
  echo ""
  echo "---"
  echo ""
  find "$VAULT/universal" "$VAULT/projects" -name "*.md" \
    ! -name "INDEX.md" ! -name "VAULT.md" | sort | while read -r f; do
    title=$(head -1 "$f" | sed 's/^# //')
    tags=$(grep "^Tags:" "$f" 2>/dev/null | sed 's/Tags: //' || echo "—")
    relpath="${f#$VAULT/}"
    echo "- [$title]($relpath) — $tags"
  done
} > /tmp/INDEX_rebuilt.md
# L'agent enrichit /tmp/INDEX_rebuilt.md avec les résumés sémantiques
# puis le copie vers $META/INDEX.md en fin de run

# 4. Vérifier wikilinks cassés
> "$LOGS/broken-links.txt"
grep -roh '\[\[[^\]]*\]\]' "$VAULT/universal" "$VAULT/projects" 2>/dev/null | \
  sed 's/.*:\[\[//;s/\]\]//' | sort -u | while read -r link; do
  found=$(grep -rl "^# $link" "$VAULT/universal" "$VAULT/projects" 2>/dev/null | head -1)
  if [ -z "$found" ]; then
    echo "BROKEN: [[$link]]" >> "$LOGS/broken-links.txt"
  fi
done

BROKEN=$(wc -l < "$LOGS/broken-links.txt" | tr -d ' ')
echo "integrity-check done — $BROKEN broken links"
```

---

## Agent nocturne — workflow complet

### Déclenchement

RemoteTrigger cron : `17 2 * * *` (2h17 — heure non standard)

### Write order atomique (résistance aux crashes)

```
1. Écrire STATUS "in_progress" dans last-nightly.json
2. Écrire notes dans _inbox/agent/YYYY-MM-DD/  (si crash → orphelines, aucun dommage)
3. Vérifier wikilinks écrits contre /tmp/INDEX_rebuilt.md
4. Corriger liens cassés dans _logs/broken-links.txt
5. Enrichir /tmp/INDEX_rebuilt.md avec résumés sémantiques → copier vers _meta/INDEX.md
6. Régénérer context-cards (_meta/context-*.md)
7. Compresser signals.md si >100 lignes
8. Écrire STATUS "success" + métriques dans last-nightly.json  ← commit final
```

Si l'agent reçoit STATUS "in_progress" au démarrage → restore depuis `.bak/` et recommencer.

### Budget tokens

| Phase     | Budget        | Action si dépassé                                 |
| --------- | ------------- | ------------------------------------------------- |
| Nominal   | 55-75K tokens | Continue                                          |
| Alerte    | 75K tokens    | Terminer le thème en cours, passer aux étapes 5-8 |
| Hard stop | 80K tokens    | Arrêt immédiat, écrire last-nightly.json partiel  |

### Vérification des sources

| Type de source                 | Vérification                  | Destination             |
| ------------------------------ | ----------------------------- | ----------------------- |
| Documentation officielle       | Déterministe (URL officielle) | `_inbox/agent/` haute   |
| Consensus ≥3 sources           | Consensus LLM                 | `_inbox/agent/` haute   |
| Source reconnue partielle      | Normative LLM                 | `_inbox/agent/` moyenne |
| Journalistique / early-adopter | Pattern-observation           | `_inbox/review/` basse  |
| Institutionnel DOM-TOM         | Déterministe                  | `_inbox/agent/` haute   |

---

## Capabilities Obsidian intégrées

### Pour Claude ET Djemil

- **Wiki-links `[[note]]`** — navigation graphe + retrieval MCP
- **Tags `#tag`** — structure émergente (remplace sous-dossiers forcés)
- **Templates** — structure de note cohérente (Essentiel / Détail / Liens)

### Pour Djemil uniquement

- **Graph view** — maintenance visuelle : notes isolées = candidates à l'archivage
- **Auto Note Mover** — validation `_inbox/agent/` : tag `#validated` → dossier final
- **Canvas** — project dashboards (`_meta/canvas-gpparts.canvas`)
- **Dataview (tags only, sans YAML)** — listes filtrées par tag dans Obsidian
- **Calendar plugin** — navigation des session dumps par date
- **Periodic Notes** — structure naturelle pour `_inbox/session/YYYY-MM-DD.md`

### Features délibérément exclues

- **YAML frontmatter** — corrompt silencieusement lors de writes partiels MCP
- **Embeds `![[]]`** — Claude voit le texte brut, pas le rendu
- **Obsidian Sync** — hors périmètre (FileVault local suffit)
- **Smart Connections** — redondant avec retrieval LLM natif

---

## MCP Filesystem — configuration

Fichier `~/.mcp.json` :

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

Dossiers exclus intentionnellement : `sensitive/`, `_inbox/`, `_logs/`, `_archive/`.

Référence implémentation : `sjvandy/obsidian-mcp` — accès stdio direct aux `.md`,
sans plugin Local REST API intermédiaire (zéro point de défaillance supplémentaire).

---

## Instruction globale Claude (CLAUDE.md global)

```markdown
## Knowledge Base Vault

### Au démarrage de chaque session

1. Détecter le projet depuis `pwd`
2. Si match → lire `_meta/context-<projet>.md` (~200 tokens)
3. Si besoin d'élargir → lire la section tags pertinente dans `_meta/INDEX.md`
4. Lire `## Essentiel` des notes ciblées (~50t chacune) avant `## Détail`
5. Si INDEX.md < 10 notes → injection complète acceptable

### En cours de session

- Notes marquées `[A]` dans les context-cards = agent, pending 72h. Citer avec réserve.
- Si découverte importante → écrire dans `_inbox/session/session-YYYY-MM-DD.md`
- Enrichir une note existante via MCP si la valeur ajoutée est claire et factuelle

### En fin de session (si pertinent)

- Ajouter signal dans `_meta/signals.md` :
  - Hit : `YYYY-MM-DD — chemin/note.md — contexte`
  - Miss : `YYYY-MM-DD — chemin/note.md — pourquoi non pertinent`
  - Thème émergent : `NomThème — Nx mentionné — projet`

### Règles de sobriété

- Jamais de dump complet du vault
- Jamais écrire dans `sensitive/` (accès humain uniquement)
- Jamais inventer du contenu — seulement synthétiser des sources vérifiables
- Filtrer tokens, clés API, URLs admin avant tout écrit dans `_inbox/session/`
```

---

## Références terrain

| Concept                        | Source                   | Application dans notre architecture      |
| ------------------------------ | ------------------------ | ---------------------------------------- |
| Wiki structuré bypasse RAG     | Karpathy llm-wiki gist   | INDEX.md navigation vs embeddings        |
| Limite ~100 articles fiable    | Karpathy (400K mots)     | Plafond 300 notes (bien en dessous)      |
| Write-time wikilink resolution | Karpathy (documenté)     | Vérification dans integrity-check.sh     |
| Vault agent séparé             | Communauté Obsidian 2025 | Quarantine \_inbox/agent/ → 72h          |
| 1 note = 1 idée                | Zettelkasten / Luhmann   | Règle d'atomicité dans VAULT.md + prompt |
| MOC quota + structure          | LYT / Nick Milo          | Context-cards 3×5 = 15 liens max         |
| Émergence > planification      | Ahrens (Smart Notes)     | Tags remplacent sous-dossiers forcés     |
| stdio direct sans plugin       | sjvandy/obsidian-mcp     | Config MCP filesystem sans REST API      |
| Write partiel = corruption     | MCP issues #4201, #267   | Write order atomique + backup rsync      |

---

## Critères de succès

- [ ] Vault créé avec structure complète + `chmod 700 sensitive/`
- [ ] `integrity-check.sh` tourne sans erreur + backup créé
- [ ] MCP knowledge-base accessible depuis Claude (INDEX.md lisible)
- [ ] Premier run nocturne : ≥5 notes dans `_inbox/agent/`, `last-nightly.json` status success
- [ ] 72h après → notes auto-promues dans `universal/`
- [ ] context-gpparts.md généré (≤200 tokens)
- [ ] signals.md : ≥1 signal enregistré après session test
- [ ] Hook access-log : entrée dans `access-log.jsonl` après lecture vault
- [ ] Wikilinks dans les notes créées : tous résolus dans INDEX.md (0 broken-links)
- [ ] Auto Note Mover Obsidian : tag `#validated` → déplacement vers bon dossier

---

## Hors périmètre

- RAG / embeddings distants (overkill, échoue sur cross-références)
- Obsidian Sync cloud (FileVault local suffit)
- Plugin Local REST API Obsidian (point de défaillance supplémentaire évité)
- YAML frontmatter (corruption silencieuse sur write partiel)
- Auto-dream Anthropic (feature flag non disponible)
