# Dette technique — GP Parts

> Dernière mise à jour : 2026-04-06 (audit complet)

## Items backlog (Score < 15)

| ID   | Finding                                                | Score | Action                                            | Phase cible  |
| ---- | ------------------------------------------------------ | ----- | ------------------------------------------------- | ------------ |
| A-06 | Admin utilise palette storefront au lieu d'iOS Clarity | 6     | Migrer les composants admin vers les tokens iOS   | v2           |
| A-07 | Pas de Server Actions pour le checkout                 | 10    | Valider les données côté serveur (Server Actions) | Phase 4+     |
| R-05 | Objets inline dans les props (re-renders potentiels)   | 8     | Extraire les objets constants hors du JSX         | Opportuniste |
| R-06 | Pas de maxLength sur les inputs formulaire checkout    | 6     | Ajouter maxLength sur tous les champs du form     | Opportuniste |
| R-07 | Checkout submit handler complexe                       | 8     | Extraire en custom hook useCheckoutSubmit         | Phase 4      |
| T-06 | 14/18 pages sans test E2E                              | 12    | Ajouter progressivement les tests Playwright      | Continu      |
| T-08 | Pas de tests accessibilité (axe-core)                  | 10    | Installer @axe-core/playwright, tester pages clés | Phase 3      |
| T-09 | Pas de visual regression tests                         | 5     | Playwright screenshots comparatives               | v2           |
| T-10 | Admin zéro tests E2E                                   | 8     | Smoke tests dashboard, navigation, responsive     | Phase 3      |
| S-04 | Pas de bundle analysis                                 | 8     | Installer @next/bundle-analyzer                   | Opportuniste |
| S-05 | Pas de rate limiting (API routes)                      | 5     | Middleware rate limiter sur les endpoints         | Phase 4+     |

## Scoring

```
Score = (Impact + Risk) × (6 − Effort)
```

- Impact (1-5) : ralentissement équipe
- Risk (1-5) : conséquences si non corrigé
- Effort (1-5) : difficulté (inversé)
- Score >= 30 : CRITIQUE
- Score 15-29 : IMPORTANT
- Score < 15 : BACKLOG (ce fichier)
