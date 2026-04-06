import { test, expect } from '@playwright/test';

/**
 * Test e2e — Smoke admin.
 * Vérifie que /admin est accessible, affiche les 4 KPIs,
 * la table produits, et que les actions déclenchent le toast démo.
 *
 * En CI, ADMIN_USER et ADMIN_PASS doivent être définis comme secrets GitHub.
 * En local, .env.local fournit les credentials.
 */

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'gpparts2026!';
const basicAuth = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

test.describe('Admin — smoke back-office', () => {
  // Envoyer le header Basic Auth pour chaque requête
  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  test('la page /admin charge et affiche les 4 KPIs', async ({ page }) => {
    await page.goto('/admin');

    // Les 4 KPIs par texte exact du label
    await expect(page.getByText('Produits en catalogue')).toBeVisible();
    // "Stock faible" est un KPI label — on cible le paragraph, pas le bouton filtre
    await expect(page.getByRole('paragraph').filter({ hasText: /^Stock faible$/ })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: /^En promotion$/ })).toBeVisible();
    await expect(page.getByText('Valeur du stock')).toBeVisible();
  });

  test('la table produits est affichée avec au moins 1 ligne', async ({ page }) => {
    await page.goto('/admin');

    // Les headers de la table
    await expect(page.getByText(/référence/i).first()).toBeVisible();
    await expect(page.getByText(/catégorie/i).first()).toBeVisible();

    // Au moins un produit visible (on en a 10 en démo)
    await expect(page.getByText(/PEU-208/i).first()).toBeVisible();
  });

  test('les filtres fonctionnent (Stock faible)', async ({ page }) => {
    await page.goto('/admin');

    // Cliquer sur le bouton filtre "Stock faible"
    await page.getByRole('button', { name: /stock faible/i }).click();

    // La page doit toujours avoir des résultats
    await expect(page.getByText(/référence/i).first()).toBeVisible();
  });

  test('le bouton Modifier déclenche le toast démo', async ({ page }) => {
    await page.goto('/admin');

    // Cliquer sur le premier bouton "Modifier"
    const editBtn = page.getByLabel(/modifier/i).first();
    await editBtn.click();

    // Le toast "disponible en v2" doit apparaître
    await expect(page.getByText(/disponible en v2/i)).toBeVisible({ timeout: 5_000 });
  });
});
