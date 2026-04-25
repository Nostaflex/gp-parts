import { test, expect } from '@playwright/test';

/**
 * Test e2e — Bug #2 : Sync URL ↔ filtres catalogue (/pieces).
 * Vérifie que les chips de filtre mettent à jour l'URL et vice versa,
 * sans boucle infinie (internalChange ref).
 *
 * Note : la navbar CP n'a plus de liens /pieces?type=moto directs —
 * les filtres sont des boutons chip dans la page /pieces.
 */
test.describe('Catalogue /pieces — sync URL ↔ filtres', () => {
  test("chip Moto met à jour l'URL et affiche les résultats", async ({ page }) => {
    await page.goto('/pieces');

    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();

    await page
      .getByRole('button', { name: /^moto$/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/pieces\?.*type=moto/);
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });

  test("chip Auto met à jour l'URL sans reload", async ({ page }) => {
    await page.goto('/pieces');

    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();

    await page
      .getByRole('button', { name: /^auto$/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/pieces\?.*type=auto/);
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });

  test('accès direct /pieces?type=moto affiche les bons résultats', async ({ page }) => {
    await page.goto('/pieces?type=moto');

    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });

  test('enchaîner Moto puis Tous remet le filtre à zéro', async ({ page }) => {
    await page.goto('/pieces');

    await page
      .getByRole('button', { name: /^moto$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/type=moto/);

    await page
      .getByRole('button', { name: /^tous$/i })
      .first()
      .click();
    // URL sans paramètre type (ou type absent)
    await expect(page).not.toHaveURL(/type=moto/);
    await expect(page.getByText(/pièces? disponibles?/i).first()).toBeVisible();
  });
});
