import { test, expect } from '@playwright/test';

/**
 * Smoke test — home CarPerformance.
 * Vérifie que la home charge et affiche la navbar CP.
 */
test.describe('Home page — smoke', () => {
  test('charge et affiche le hero avec lien Pièces', async ({ page }) => {
    await page.goto('/');

    // Title is "Accueil" (template not applied to root route in Next.js 14 prod build)
    await expect(page).toHaveTitle(/Accueil|Car Performance/i);

    // La navbar CP expose un lien vers /pieces
    await expect(page.locator('a[href="/pieces"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
