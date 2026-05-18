import { test, expect } from '@playwright/test';

/**
 * Tests E2E admin — 3 groupes :
 *
 * 1. Admin — auth (toujours actifs) : redirect, bad credentials
 * 2. Admin — login flow (conditionnel HAS_AUTH_CREDENTIALS) : login UI complet via émulateur
 * 3. Admin — smoke back-office (conditionnel HAS_AUTH_CREDENTIALS) : dashboard via cookie injection
 *
 * Pourquoi cookie injection pour le smoke ? Les smoke tests valident le dashboard,
 * pas l'auth. L'injection de cookie bypass le login UI pour des tests plus fiables en CI.
 *
 * Phase P0 security fix : GET /api/admin/products est maintenant protégé par requireAdmin().
 * Le beforeEach du smoke back-office utilise donc emulator-login pour obtenir un vrai UID
 * cookie et seed meta/admins dans le Firestore émulateur via l'API REST.
 * Pour les pages Server Component (admin-vehicules, admin-motos), injectSessionCookie
 * (cookie statique) reste suffisant car le middleware vérifie seulement la présence du cookie.
 */

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const HAS_AUTH_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

// --- Helpers ---

/** Injecte un session cookie valide pour bypasser le middleware sans passer par l'UI.
 *  Suffisant pour les pages Server Component (middleware = présence cookie seulement).
 *  NE PAS utiliser pour les routes API protégées par requireAdmin() — utiliser
 *  loginViaEmulator() à la place.
 */
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

/**
 * Login complet via l'API emulator-login : obtient un vrai UID cookie Firebase Auth.
 * Seed aussi meta/admins dans le Firestore émulateur pour que requireAdmin() passe
 * la vérification whitelist.
 *
 * Requis pour les routes API protégées par requireAdmin() (ex: /api/admin/products).
 * L'appel fetch depuis le browser (credentials:'include') pose le cookie __session=uid
 * directement dans le jar du contexte navigateur.
 */
async function loginViaEmulator(page: import('@playwright/test').Page) {
  // 1. Seed meta/admins via l'API REST du Firestore émulateur (Node.js context)
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-gp-parts';
  await fetch(
    `http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/meta/admins`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          emails: {
            arrayValue: { values: [{ stringValue: TEST_EMAIL }] },
          },
        },
      }),
    }
  );

  // 2. Login via emulator-login API depuis le browser (credentials:'include' pose le cookie)
  await page.goto('/admin/login'); // Initialise le contexte browser sur le bon origin
  await page.evaluate(
    async ({ email, password }) => {
      const res = await fetch('/api/admin/emulator-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`emulator-login failed: ${res.status}`);
    },
    { email: TEST_EMAIL, password: TEST_PASSWORD }
  );
}

/** Login complet via UI Firebase Auth + redirection */
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  // Dismiss cookie banner if present (may cover the submit button)
  const acceptBtn = page.getByRole('button', { name: /tout refuser|accepter/i }).first();
  if (await acceptBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await acceptBtn.click();
  }
  await page.fill('input[name="email"]', TEST_EMAIL!);
  await page.fill('input[name="password"]', TEST_PASSWORD!);
  await page.click('button[type="submit"]');
  // Admin CMS v3 Phase 1 : login redirige vers /admin/dashboard (shell route group).
  // 25s pour absorber la latence émulateur en CI.
  await page.waitForURL(/\/admin\/dashboard$/, { timeout: 25_000 });
}

// --- Tests ---

test.describe('Admin — auth', () => {
  test('accès /admin sans login redirige vers /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/admin/login', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /admin gp parts/i })).toBeVisible();
  });

  test('login avec mauvais credentials affiche erreur', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Admin — login flow', () => {
  test.skip(
    !HAS_AUTH_CREDENTIALS,
    'Requires TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD (Firebase Auth emulator)'
  );

  test('emulator-login API retourne 200 pour credentials valides', async ({ page }) => {
    // Vérifie l'API directement — diagnostique si FIREBASE_AUTH_EMULATOR_HOST est injecté
    const res = await page.request.post('/api/admin/emulator-login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const body = await res.text();
    // Inclure le body dans le message d'erreur pour diagnostiquer depuis les logs CI
    expect(res.status(), `emulator-login status ${res.status()}: ${body}`).toBe(200);
  });

  test('login complet avec credentials valides redirige vers /admin', async ({ page }) => {
    test.setTimeout(60_000); // emulator auth can be slow in CI
    await adminLogin(page);
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('Admin — smoke back-office', () => {
  test.skip(
    !HAS_AUTH_CREDENTIALS,
    'Requires TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD (Firebase Auth emulator — Phase 4.5)'
  );

  test.beforeEach(async ({ page }) => {
    // Login via émulateur : obtient un vrai UID cookie pour que requireAdmin() passe
    // (middleware présence + Auth getUser + whitelist meta/admins).
    await loginViaEmulator(page);
    await page.goto('/admin/dashboard');
    // Attendre que le dashboard soit chargé (données Firestore et produits visibles)
    await expect(page.getByText('Produits en catalogue')).toBeVisible({ timeout: 15_000 });
  });

  test('la page /admin charge et affiche les 4 KPIs', async ({ page }) => {
    await expect(page.getByText('Produits en catalogue')).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: /^Stock faible$/ })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: /^En promotion$/ })).toBeVisible();
    await expect(page.getByText('Valeur du stock')).toBeVisible();
  });

  test('la table produits est affichée avec au moins 1 ligne', async ({ page }) => {
    await expect(page.getByText(/référence/i).first()).toBeVisible();
    await expect(page.getByText(/catégorie/i).first()).toBeVisible();
    await expect(page.getByText(/PEU-208/i).first()).toBeVisible();
  });

  test('les filtres fonctionnent (Stock faible)', async ({ page }) => {
    await page.getByRole('button', { name: /stock faible/i }).click();
    await expect(page.getByText(/référence/i).first()).toBeVisible();
  });

  test('le bouton Modifier déclenche le toast démo', async ({ page }) => {
    const editBtn = page.getByLabel(/modifier/i).first();
    await editBtn.click();
    await expect(page.getByText(/disponible en v2/i)).toBeVisible({ timeout: 5_000 });
  });
});
