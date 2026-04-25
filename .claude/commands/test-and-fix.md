Lance les tests et fixe les failures en autonomie.

## Étapes

1. **TypeScript** — `npm run typecheck`
   - Si erreurs → analyse, fixe, relance jusqu'à 0 erreur

2. **Lint** — `npm run lint`
   - Si warnings → fixe, relance jusqu'à 0 warning

3. **Tests unitaires** — `npm run test:unit`
   - Si failures → lis les messages d'erreur, fixe le code (pas les tests sauf si le test est manifestement faux), relance
   - Si tu modifies la logique, vérifie que tu n'as pas cassé d'autres tests

4. **Build** — `npm run build`
   - Si erreurs → fixe, relance jusqu'à build green

5. **E2E (si demandé)** — `CI=true npx playwright test`
   - Lance les tests Playwright, fixe les failures

## Règles

- Ne désactive jamais un test pour le faire passer
- Ne change pas le comportement attendu d'un test sans en comprendre la raison
- Si un test révèle un vrai bug → fixe le bug, pas le test
- Après chaque fix, note le pattern dans `tasks/lessons.md` si c'est une erreur répétable

## Fin

Rapport final : quels tests passaient, quels tests ont été fixés, et pourquoi ils échouaient.
