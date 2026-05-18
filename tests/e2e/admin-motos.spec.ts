import { test, expect } from '@playwright/test';

/**
 * Flow admin motos (Phase 4b CRUD) — émulateur Firestore + Auth.
 *
 * Réutilise EXACTEMENT le mécanisme de login des smoke tests existants
 * (tests/e2e/admin.spec.ts, describe « Admin — smoke back-office ») :
 *   - injectSessionCookie : pose le cookie __session (bypass login UI).
 *     Le middleware Edge ne vérifie que la *présence* du cookie ; les pages
 *     admin (Server Components) rendent sans appeler requireAdmin() —
 *     seules les Server Actions le font, et ces tests ne soumettent aucun
 *     formulaire. L'injection suffit donc, comme pour le smoke dashboard.
 *   - gating HAS_AUTH_CREDENTIALS : skip hors CI émulateur (mêmes vars que
 *     admin.spec.ts : TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD).
 *
 * Le CI seed les 7 motos de lib/motos.ts dans Firestore via
 * scripts/seed-firestore.ts ; yamaha-mt07 → marque "Yamaha".
 *
 * Sélecteurs réels (vérifiés sur app/admin/(shell)/motos/ +
 * components/admin/MotoForm.tsx) :
 *   - liste : <h1>Motos</h1>, lien "+ Nouvelle moto"
 *   - form  : <label for="marque">Marque</label>, <label for="prix">Prix (€)</label>
 *   - submit (create) : bouton "Créer la moto"
 */

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const HAS_AUTH_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

/** Injecte un session cookie valide pour bypasser le middleware sans passer par l'UI */
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

test.describe('Admin motos (émulateur)', () => {
  test.skip(
    !HAS_AUTH_CREDENTIALS,
    'Requires TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD (Firebase Auth emulator — Phase 4b)'
  );

  test.beforeEach(async ({ context }) => {
    // Injection du cookie de session → bypass login UI, middleware autorise l'accès
    await injectSessionCookie(context);
  });

  test('liste /admin/motos accessible après login', async ({ page }) => {
    await page.goto('/admin/motos');
    await expect(page.getByRole('heading', { name: 'Motos' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nouvelle moto/i })).toBeVisible();
  });

  test('page nouvelle moto affiche le formulaire', async ({ page }) => {
    await page.goto('/admin/motos/new');
    await expect(page.getByLabel('Marque')).toBeVisible();
    await expect(page.getByLabel('Prix (€)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer la moto/i })).toBeVisible();
  });

  test("édition d'une moto seedée pré-remplit le formulaire", async ({ page }) => {
    await page.goto('/admin/motos/yamaha-mt07');
    await expect(page.getByLabel('Marque')).toHaveValue('Yamaha');
  });
});
