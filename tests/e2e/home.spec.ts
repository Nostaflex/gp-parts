import { test, expect } from '@playwright/test';

/**
 * Smoke test — home CarPerformance.
 * Vérifie que la home charge et affiche la navbar CP.
 */
test.describe('Home page — smoke', () => {
  test('charge et affiche le hero avec lien Pièces', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/GP Parts|Car Performance/i);

    // La navbar CP expose un lien vers /pieces
    await expect(page.locator('a[href="/pieces"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
