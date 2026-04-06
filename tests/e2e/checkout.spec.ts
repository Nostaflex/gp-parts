import { test, expect } from '@playwright/test';

/**
 * Test e2e — Bug #3 : Flow checkout complet.
 * Vérifie que le checkout aboutit à la page de confirmation
 * avec un numéro de commande, SANS redirection vers /panier.
 *
 * Note : le checkout a un 5% mock fail rate.
 * On retry le submit jusqu'à ce que ça passe.
 */
test.describe('Checkout — flow complet', () => {
  test('panier → checkout → confirmation avec numéro de commande', async ({ page }) => {
    // 1. Pré-remplir le panier via localStorage pour gagner du temps
    await page.goto('/');
    await page.evaluate(() => {
      const mockCart = JSON.stringify([{
        id: 'prod-001-default',
        productId: 'prod-001',
        slug: 'disque-de-frein-avant-peugeot',
        name: 'Disque de frein avant',
        reference: 'PEU-208-DBF-001',
        price: 6500,
        quantity: 1,
        image: '/images/categories/freinage.svg',
        stock: 12,
      }]);
      localStorage.setItem('gpparts-cart', mockCart);
    });
    await page.reload();

    // 2. Aller au panier
    await page.goto('/panier');
    await expect(page.getByText(/disque de frein/i)).toBeVisible();

    // 3. Cliquer "Passer la commande"
    await page.getByRole('link', { name: /passer la commande/i }).click();
    await expect(page).toHaveURL('/commande');

    // 4. Remplir le formulaire checkout via dispatchEvent pour React contrôlé
    const fillInput = async (name: string, value: string) => {
      const input = page.locator(`input[name="${name}"]`);
      await input.click();
      await input.fill(value);
      // Trigger React onChange via blur
      await input.dispatchEvent('change');
    };

    await fillInput('firstName', 'Stéphane');
    await fillInput('lastName', 'Dupont');
    await fillInput('email', 'stephane@test.gp');
    await fillInput('phone', '0590123456');

    // Mode livraison : sélectionner "Retrait en boutique" explicitement
    await page.getByRole('button', { name: /retrait en boutique/i }).click();

    // Fermer la bannière cookies si elle apparaît
    const cookieRefuse = page.getByRole('button', { name: /tout refuser/i });
    if (await cookieRefuse.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await cookieRefuse.click();
    }

    // Cocher les CGV
    const cgvCheckbox = page.locator('input[type="checkbox"]').first();
    await cgvCheckbox.check();

    // 5. Soumettre — le bouton "Payer (simulation)"
    const submitBtn = page.getByRole('button', { name: /payer/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 6. Attendre la redirection vers /commande/confirmation
    // Si le 5% fail rate se déclenche, on retry
    // Le bug #3 faisait atterrir sur /panier au lieu de /confirmation
    try {
      await expect(page).toHaveURL('/commande/confirmation', { timeout: 10_000 });
    } catch {
      // Retry une fois si mock payment failed (5% chance)
      await submitBtn.click();
      await expect(page).toHaveURL('/commande/confirmation', { timeout: 10_000 });
    }

    // 7. La page de confirmation affiche un numéro de commande GP-XXXX
    await expect(page.getByText(/commande confirmée/i)).toBeVisible();
    await expect(page.getByText(/GP-/)).toBeVisible();

    // 8. Les boutons de navigation sont présents
    await expect(page.getByRole('link', { name: /retour à l'accueil/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continuer mes achats/i })).toBeVisible();
  });

  test('checkout avec panier vide redirige vers /panier', async ({ page }) => {
    // S'assurer que le panier est vide
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('gpparts-cart'));
    await page.reload();

    // Tenter d'accéder directement à /commande
    await page.goto('/commande');

    // Doit rediriger vers /panier
    await expect(page).toHaveURL('/panier', { timeout: 5_000 });
  });
});
