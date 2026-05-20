import { test, expect } from '@playwright/test';

/**
 * Anti-régression Phase 5 — pages publiques /pieces.
 *
 * Task 9 a basculé ces pages de PRODUCTS static vers adapter+cache via ISR
 * (getCachedProducts). Risque #1 : catalogue vide en prod si la source de
 * données casse. Ces tests vérifient que la liste rend au moins un produit
 * et qu'une fiche détail s'affiche — sans dépendre d'un texte fragile (les
 * 40 produits sont seedés depuis lib/products.ts en CI).
 *
 * Sélecteurs réels (vérifiés sur app/(boutique)/pieces/) :
 *   - liste : ProductCard contient un Link href="/pieces/{slug}"
 *   - détail : <h1> = product.name
 */
test.describe('Pages publiques pièces (anti-régression Phase 5)', () => {
  test('la liste /pieces rend au moins un produit', async ({ page }) => {
    await page.goto('/pieces');
    await expect(page).toHaveURL(/\/pieces(\?|$)/);
    await expect(page.locator('a[href^="/pieces/"]').first()).toBeVisible();
  });

  test('une fiche produit rend (titre visible)', async ({ page }) => {
    await page.goto('/pieces');
    await page.locator('a[href^="/pieces/"]').first().click();
    await expect(page).toHaveURL(/\/pieces\/.+/);
    // 2 H1 sur la page (layout HERO + fiche produit) — on cible le dernier
    await expect(page.getByRole('heading', { level: 1 }).last()).toBeVisible();
  });
});
