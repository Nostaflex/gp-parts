import { test, expect } from '@playwright/test';

/**
 * Test e2e — Bug #2 : Persistance panier via localStorage.
 * Vérifie que le panier survit à un rechargement de page
 * et que les données sont correctes.
 *
 * Note : CpHeader (utilisé sur /pieces) n'a pas de badge panier.
 * On vérifie l'ajout via le toast de confirmation, puis la persistance via /panier.
 */
test.describe('Panier — persistance localStorage', () => {
  test('ajouter un produit, recharger, le panier est conservé', async ({ page }) => {
    // 1. Aller sur le catalogue
    await page.goto('/pieces');

    // 2. Cliquer sur le PREMIER bouton "Ajouter au panier"
    // CatalogueClient est dans un Suspense (useSearchParams) — attendre l'hydratation
    const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15_000 });
    await addToCartBtn.click();

    // 3. Toast de confirmation — l'article a bien été ajouté
    await expect(page.getByRole('status').filter({ hasText: /ajouté au panier/i })).toBeVisible({
      timeout: 5_000,
    });

    // 4. Recharger la page (test de persistance localStorage)
    await page.reload();

    // 5. Aller sur /panier — l'article doit toujours être là
    await page.goto('/panier');
    await expect(page.getByText(/votre panier est vide/i)).not.toBeVisible({ timeout: 10_000 });
  });

  test('vider le panier supprime les données de localStorage', async ({ page }) => {
    // 1. Pré-remplir le panier via localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const mockCart = JSON.stringify([
        {
          id: 'prod-001-default',
          productId: 'prod-001',
          slug: 'disque-de-frein-avant-peugeot',
          name: 'Disque de frein avant',
          reference: 'PEU-208-DBF-001',
          price: 6500,
          quantity: 2,
          image: '/images/categories/freinage.svg',
          stock: 12,
        },
      ]);
      localStorage.setItem('gpparts-cart', mockCart);
    });

    // 2. Recharger pour que CartProvider lise le localStorage
    await page.reload();

    // 3. Aller au panier — l'article devrait apparaître
    await page.goto('/panier');
    await expect(page.getByText(/disque de frein/i)).toBeVisible();

    // 4. Supprimer l'article (bouton supprimer)
    const removeBtn = page.getByRole('button', { name: /supprimer/i }).first();
    await removeBtn.click();

    // 5. Le panier doit être vide
    await expect(page.getByText(/votre panier est vide/i)).toBeVisible();

    // 6. Vérifier que localStorage est vidé
    const storageData = await page.evaluate(() => localStorage.getItem('gpparts-cart'));
    const parsed = JSON.parse(storageData || '[]');
    expect(parsed).toHaveLength(0);
  });
});
