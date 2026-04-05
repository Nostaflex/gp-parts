import { test, expect } from '@playwright/test';

/**
 * Smoke test — Phase 2 setup.
 * Vérifie simplement que la home charge et affiche son hero.
 * C'est le minimum vital : si ce test passe, le wiring Playwright + Next dev
 * server + CI est validé. Les tests des bugs historiques (filtres URL,
 * checkout race, cart persist) viendront en Phase 2 complète.
 */
test.describe('Home page — smoke', () => {
  test('charge et affiche le hero GP Parts', async ({ page }) => {
    await page.goto('/');

    // Le <title> du layout racine contient "GP Parts"
    await expect(page).toHaveTitle(/GP Parts/i);

    // La navbar est présente (lien Catalogue visible depuis la home)
    await expect(
      page.getByRole('link', { name: /catalogue/i }).first()
    ).toBeVisible();
  });
});
