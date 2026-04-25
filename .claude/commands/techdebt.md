Sweep de fin de session : traque et élimine la dette technique accumulée.

## Ce qu'il faut chercher

### Code dupliqué

- Logique répétée dans plusieurs composants qui pourrait être extraite dans `lib/utils.ts`
- Patterns identiques dans les pages → candidats à un composant partagé

### Code mort

- Imports inutilisés
- Variables déclarées mais jamais lues
- Fonctions jamais appelées
- Commentaires `// TODO` ou `// FIXME` oubliés

### Violations design system

- Tokens Volcanic Clarity dans `app/admin/` (bg-cream, text-volcanic, border-lin, bg-ivory, text-basalt)
- Tokens iOS Clarity dans `app/` (var(--blue), var(--bg), var(--surface), var(--text))
- Hardcoded colors (`#fff`, `red`, etc.) au lieu des tokens

### Conventions non respectées

- Prix en float au lieu de centimes
- Clés localStorage sans préfixe `gpparts-`
- Inputs sans `autoComplete`

### Fragilités

- `any` TypeScript non justifié
- `console.log` de debug oubliés
- Conditions toujours vraies ou jamais atteintes

## Rapport

Pour chaque problème trouvé :

- Fichier + ligne
- Problème exact
- Correction proposée

Fixe uniquement ce qui est sûr à corriger sans risque de régression. Pour les refactors plus larges, documente dans `tasks/lessons.md`.

Termine par : `npm run typecheck && npm run lint` pour confirmer que tout est propre.
