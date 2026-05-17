import { test, expect } from '@playwright/test';

/**
 * Flow admin véhicules (Phase 4a CRUD) — émulateur Firestore + Auth.
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
 * Le CI seed les 7 véhicules de lib/vehicules.ts dans Firestore via
 * scripts/seed-firestore.ts ; peugeot-308sw → marque "Peugeot".
 *
 * Sélecteurs réels (vérifiés sur app/admin/(shell)/vehicules/ +
 * components/admin/VehiculeForm.tsx) :
 *   - liste : <h1>Véhicules</h1>, lien "+ Nouveau véhicule"
 *   - form  : <label for="marque">Marque</label>, <label for="prix">Prix (€)</label>
 *   - submit (create) : bouton "Créer le véhicule"
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

test.describe('Admin véhicules (émulateur)', () => {
  test.skip(
    !HAS_AUTH_CREDENTIALS,
    'Requires TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD (Firebase Auth emulator — Phase 4a)'
  );

  test.beforeEach(async ({ context }) => {
    // Injection du cookie de session → bypass login UI, middleware autorise l'accès
    await injectSessionCookie(context);
  });

  test('liste /admin/vehicules accessible après login', async ({ page }) => {
    await page.goto('/admin/vehicules');
    await expect(page.getByRole('heading', { name: 'Véhicules' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nouveau véhicule/i })).toBeVisible();
  });

  test('page nouveau véhicule affiche le formulaire', async ({ page }) => {
    await page.goto('/admin/vehicules/new');
    await expect(page.getByLabel('Marque')).toBeVisible();
    await expect(page.getByLabel('Prix (€)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer le véhicule/i })).toBeVisible();
  });

  test("édition d'un véhicule seedé pré-remplit le formulaire", async ({ page }) => {
    await page.goto('/admin/vehicules/peugeot-308sw');
    await expect(page.getByLabel('Marque')).toHaveValue('Peugeot');
  });
});
