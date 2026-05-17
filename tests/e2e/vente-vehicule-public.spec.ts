import { test, expect } from '@playwright/test';

/**
 * Anti-régression Phase 4 — pages publiques /vente-vehicule.
 *
 * Task 7 a basculé ces pages de données statiques vers Firestore via ISR
 * (getCachedVehicules). Le risque #1 : catalogue vide en prod si la source
 * de données casse. Ces tests vérifient que la liste rend au moins un
 * véhicule et qu'une fiche détail s'affiche — sans dépendre d'un texte
 * fragile (les véhicules sont seedés depuis lib/vehicules.ts en CI).
 *
 * Sélecteurs réels (vérifiés sur app/vente-vehicule/) :
 *   - liste : HERO <h1> "VENTE OCCASION", cartes = <Link href="/vente-vehicule/{id}">
 *   - détail : <h1> = modèle du véhicule (ex. "308 SW GT Line")
 */
test.describe('Pages publiques véhicules (anti-régression Phase 4)', () => {
  test('la liste /vente-vehicule rend au moins un véhicule', async ({ page }) => {
    await page.goto('/vente-vehicule');
    await expect(page).toHaveURL(/\/vente-vehicule$/);
    // Anti-régression critique Task 7 : le catalogue ne doit pas être vide.
    await expect(page.locator('a[href^="/vente-vehicule/"]').first()).toBeVisible();
  });

  test('une fiche véhicule rend (titre visible)', async ({ page }) => {
    await page.goto('/vente-vehicule');
    await page.locator('a[href^="/vente-vehicule/"]').first().click();
    await expect(page).toHaveURL(/\/vente-vehicule\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
