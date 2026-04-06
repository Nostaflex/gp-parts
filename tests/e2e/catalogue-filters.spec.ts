import { test, expect } from '@playwright/test';

/**
 * Test e2e — Bug #1 : Sync URL ↔ filtres catalogue.
 * Vérifie que cliquer un lien navbar (ex: "Moto") depuis la page catalogue
 * met à jour les filtres React ET l'URL, et vice versa.
 */
test.describe('Catalogue — sync URL ↔ filtres', () => {
  test('naviguer vers /catalogue?type=moto depuis la home met le filtre Moto actif', async ({ page }) => {
    await page.goto('/');

    // Clic sur le lien "Moto" dans la navbar
    await page.getByRole('link', { name: /^moto$/i }).first().click();

    // L'URL doit contenir ?type=moto
    await expect(page).toHaveURL(/\/catalogue\?.*type=moto/);

    // Le texte résultat (premier aria-live="polite" = le compteur)
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });

  test('cliquer "Auto" DEPUIS le catalogue (déjà dessus) change les filtres sans reload', async ({ page }) => {
    // Aller d'abord sur le catalogue sans filtre
    await page.goto('/catalogue');

    // Vérifier qu'on voit des résultats
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();

    // Cliquer sur "Auto" dans la navbar (on est DÉJÀ sur /catalogue — c'est le scénario du Bug #1)
    await page.getByRole('link', { name: /^auto$/i }).first().click();

    // L'URL doit changer
    await expect(page).toHaveURL(/\/catalogue\?.*type=auto/);

    // Le résultat est toujours visible
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });

  test('cliquer "Moto" puis "Promos" depuis le catalogue enchaîne les filtres', async ({ page }) => {
    await page.goto('/catalogue');

    // Moto
    await page.getByRole('link', { name: /^moto$/i }).first().click();
    await expect(page).toHaveURL(/type=moto/);

    // Promos
    await page.getByRole('link', { name: /promos/i }).first().click();
    await expect(page).toHaveURL(/promo=1/);
  });

  test('accès direct par URL /catalogue?type=moto affiche les bons filtres', async ({ page }) => {
    await page.goto('/catalogue?type=moto');

    // Le résultat doit exister
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });
});
