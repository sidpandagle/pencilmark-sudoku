import { expect, type Page } from '@playwright/test';

export const PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
export const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
export const EMPTY = [...PUZZLE].map((ch, i) => (ch === '0' ? i : -1)).filter((i) => i >= 0);

export const cell = (page: Page, i: number) => page.getByTestId(`cell-${i}`);

export async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('new-game')).toBeVisible({ timeout: 60_000 });
}

export async function importPuzzle(page: Page, puzzle = PUZZLE) {
  await page.getByTestId('nav-import').click();
  await page.getByTestId('import-input').fill(puzzle);
  await page.getByTestId('import-check').click();
  await expect(page.getByTestId('import-start')).toBeVisible();
  await page.getByTestId('import-start').click();
  await expect(page.getByTestId('play-screen')).toBeVisible();
}

/** Enter digits for the given cells via click + keyboard. */
export async function enterDigits(page: Page, cells: number[], solution = SOLUTION) {
  for (const i of cells) {
    await cell(page, i).click();
    await page.keyboard.press(solution[i]);
  }
}

export async function setTheme(page: Page, theme: 'System' | 'Light' | 'Dark') {
  await page.getByLabel(`Theme: ${theme}`, { exact: true }).click();
}
