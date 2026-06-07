import { test, expect } from '@playwright/test';

/**
 * Smoke test — home CarPerformance.
 * Vérifie que la home charge et affiche la navbar CP.
 */
test.describe('Home page — smoke', () => {
  test('charge et affiche le hero avec lien Pièces', async ({ page }) => {
    await page.goto('/');

    // Titre home = "Garage auto & moto en Guadeloupe" (le template parent
    // "| Car Performance" n'est pas appliqué à la route racine en prod build).
    await expect(page).toHaveTitle(/Garage|Car Performance/i);

    // La navbar CP expose un lien vers /pieces
    await expect(page.locator('a[href="/pieces"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
