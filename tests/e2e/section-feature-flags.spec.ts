import { test, expect } from '@playwright/test';

// En CI/dev local sans Firebase, StaticAdapter → tout ON. Cet E2E vérifie le
// chemin « tout visible » (non-régression). Le chemin « section OFF → 404 » est
// couvert par les tests unitaires de garde (section-route-guards) et vérifié
// manuellement sur l'environnement Firebase au déploiement.

test('toutes les sections visibles par défaut (StaticAdapter)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Vente véhicule' }).first()).toBeVisible();

  await page.goto('/reparation');
  await expect(page).toHaveURL(/\/reparation/);

  await page.goto('/pieces');
  await expect(page).toHaveURL(/\/pieces/);
});
