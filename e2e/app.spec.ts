import { expect, test } from '@playwright/test';
import { EMPTY, cell, enterDigits, importPuzzle, openHome, setTheme } from './helpers';

test('start an easy game: the board renders 81 labelled cells', async ({ page }) => {
  await openHome(page);
  await page.getByTestId('new-game').click();
  await page.getByTestId('difficulty-easy').click();
  await expect(page.getByTestId('play-screen')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid^="cell-"]')).toHaveCount(81);
  await expect(page.getByLabel(/^Row 1, column 1, /)).toHaveCount(1);
  await expect(page.getByTestId('play-title')).toHaveText('Easy');
});

test('import a puzzle, solve it with the keyboard, see the completion screen', async ({ page }) => {
  await openHome(page);
  await importPuzzle(page);
  await expect(page.getByTestId('play-title')).toHaveText(/Easy|Medium|Hard|Expert|Custom/);
  await enterDigits(page, EMPTY);
  await expect(page.getByTestId('completion')).toBeVisible();
  await expect(page.getByText('Puzzle solved')).toBeVisible();
  await expect(page.getByTestId('best-badge')).toBeVisible();
  // Stats were recorded once.
  await page.getByTestId('completion-home').click();
  await page.getByTestId('nav-stats').click();
  await expect(page.getByLabel('Solved: 1', { exact: true })).toBeVisible();
});

test('reload resumes the game with entries and notes intact', async ({ page }) => {
  await openHome(page);
  await importPuzzle(page);
  await enterDigits(page, [2]); // r1c3 = 4
  await cell(page, 3).click(); // r1c4
  await page.keyboard.press('n'); // notes mode on
  await page.keyboard.press('1');
  await page.keyboard.press('2');
  await page.keyboard.press('n');
  await expect(page.getByLabel('Row 1, column 4, empty, notes 1, 2', { exact: true })).toBeVisible();
  await page.waitForTimeout(1200); // debounced save
  await page.reload();
  await expect(page.getByTestId('continue-card').or(page.getByTestId('play-screen'))).toBeVisible({ timeout: 60_000 });
  if (await page.getByTestId('continue-card').isVisible()) await page.getByTestId('continue-card').click();
  await expect(page.getByLabel('Row 1, column 3, 4', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Row 1, column 4, empty, notes 1, 2', { exact: true })).toBeVisible();
  // Undo history survived too: undo removes the notes one by one.
  await page.keyboard.press('Control+z');
  await expect(page.getByLabel('Row 1, column 4, empty, notes 1', { exact: true })).toBeVisible();
});

test('theme switch applies dark palette and persists', async ({ page }) => {
  await openHome(page);
  await page.getByTestId('nav-settings').click();
  await setTheme(page, 'Dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 21, 27)');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Theme: Dark', { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 21, 27)');
  await setTheme(page, 'Light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 241, 234)');
});
