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
 */

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const HAS_AUTH_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

// --- Helpers ---

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

/** Login complet via UI Firebase Auth + redirection */
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', TEST_EMAIL!);
  await page.fill('input[name="password"]', TEST_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 15_000 });
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

  test('login complet avec credentials valides redirige vers /admin', async ({ page }) => {
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

  test.beforeEach(async ({ page, context }) => {
    // Injection du cookie de session → bypass login UI, middleware autorise l'accès
    await injectSessionCookie(context);
    await page.goto('/admin');
    // Attendre que le dashboard soit chargé (données Firestore visibles)
    await expect(page.getByText('Produits en catalogue')).toBeVisible({ timeout: 10_000 });
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
