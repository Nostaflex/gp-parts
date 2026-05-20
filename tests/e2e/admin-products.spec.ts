import { test, expect } from '@playwright/test';

/**
 * Flow admin produits (Phase 5 CRUD) — émulateur Firestore + Auth.
 *
 * Réutilise EXACTEMENT le mécanisme d'admin-motos.spec.ts :
 *   - injectSessionCookie : pose le cookie __session (bypass login UI).
 *     Le middleware Edge ne vérifie que la présence du cookie ; les pages
 *     admin Server Components rendent sans appeler requireAdmin() — seules
 *     les Server Actions le font, et ces tests ne soumettent aucun form.
 *   - gating HAS_AUTH_CREDENTIALS : skip hors CI émulateur.
 *
 * Le CI seed les 40 produits de lib/products.ts dans Firestore via
 * scripts/seed-firestore.ts ; PRODUCTS[0] → slug "disque-de-frein-avant-peugeot".
 *
 * Sélecteurs réels (vérifiés sur app/admin/(shell)/products/ +
 * components/admin/ProductForm.tsx) :
 *   - liste : <h1>Produits</h1>, lien "+ Nouveau produit"
 *   - form  : <label for="name">Nom</label>, <label for="price">Prix (€)</label>
 *   - submit (create) : bouton "Créer le produit"
 */

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const HAS_AUTH_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function injectSessionCookie(context: import('@playwright/test').BrowserContext) {
  await context.addCookies([
    {
      name: '__session',
      value: 'e2e-test-session',
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

test.describe('Admin produits (émulateur)', () => {
  test.skip(
    !HAS_AUTH_CREDENTIALS,
    'Requires TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD (Firebase Auth emulator — Phase 5)'
  );

  test.beforeEach(async ({ context }) => {
    await injectSessionCookie(context);
  });

  test('liste /admin/products accessible après login', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: 'Produits' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nouveau produit/i })).toBeVisible();
  });

  test('page nouveau produit affiche le formulaire', async ({ page }) => {
    await page.goto('/admin/products/new');
    await expect(page.getByLabel('Nom')).toBeVisible();
    await expect(page.getByLabel('Prix (€)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer le produit/i })).toBeVisible();
  });

  test("édition d'un produit seedé pré-remplit le formulaire", async ({ page }) => {
    await page.goto('/admin/products/disque-de-frein-avant-peugeot');
    await expect(page.getByLabel('Nom')).toHaveValue('Disque de frein avant');
  });
});
