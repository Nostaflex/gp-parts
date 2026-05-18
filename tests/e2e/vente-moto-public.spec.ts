import { test, expect } from '@playwright/test';

/**
 * Anti-régression Phase 4b — pages publiques /vente-moto.
 *
 * Task 7b a basculé ces pages de données statiques vers Firestore via ISR
 * (getCachedMotos). Le risque #1 : catalogue vide en prod si la source
 * de données casse. Ces tests vérifient que la liste rend au moins une
 * moto et qu'une fiche détail s'affiche — sans dépendre d'un texte
 * fragile (les motos sont seedées depuis lib/motos.ts en CI).
 *
 * Sélecteurs réels (vérifiés sur app/vente-moto/) :
 *   - liste : HERO <h1> "VENTE MOTO", cartes = <Link href="/vente-moto/{id}">
 *   - détail : <h1> = modèle de la moto (ex. "MT-07")
 */
test.describe('Pages publiques motos (anti-régression Phase 4b)', () => {
  test('la liste /vente-moto rend au moins une moto', async ({ page }) => {
    await page.goto('/vente-moto');
    await expect(page).toHaveURL(/\/vente-moto$/);
    // Anti-régression critique Task 7b : le catalogue ne doit pas être vide.
    await expect(page.locator('a[href^="/vente-moto/"]').first()).toBeVisible();
  });

  test('une fiche moto rend (titre visible)', async ({ page }) => {
    await page.goto('/vente-moto');
    await page.locator('a[href^="/vente-moto/"]').first().click();
    await expect(page).toHaveURL(/\/vente-moto\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
