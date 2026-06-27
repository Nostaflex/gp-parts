import { test, expect } from '@playwright/test';

// Smoke : la route admin existe (l'auth gère la redirection si non connecté).
test('la route /admin/demandes répond (pas de 500)', async ({ page }) => {
  const res = await page.goto('/admin/demandes');
  expect(res?.status()).toBeLessThan(500);
});
