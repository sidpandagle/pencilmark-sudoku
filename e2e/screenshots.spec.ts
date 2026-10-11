import { expect, test } from '@playwright/test';
import { EMPTY, enterDigits, importPuzzle, openHome, setTheme } from './helpers';

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'small', width: 360, height: 640 },
  { name: 'landscape', width: 844, height: 390 },
];

const shot = (name: string) => ({ path: `e2e/screenshots/${name}.png`, fullPage: false });

for (const vp of VIEWPORTS) {
  test(`screenshots @ ${vp.name} ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await openHome(page);
    await page.screenshot(shot(`${vp.name}-home`));

    await page.getByTestId('nav-settings').click();
    await expect(page.getByLabel('Theme: Light', { exact: true })).toBeVisible();
    await setTheme(page, 'Light');
    await page.screenshot(shot(`${vp.name}-settings`));
    await page.getByTestId('back').click();

    await page.getByTestId('nav-import').click();
    await page.getByTestId('import-input').fill('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79');
    await page.getByTestId('import-check').click();
    await expect(page.getByTestId('import-start')).toBeVisible();
    await page.screenshot(shot(`${vp.name}-import`));
    await page.getByTestId('back').click();

    await importPuzzle(page);
    // some state: a digit, a selection, notes
    await enterDigits(page, [2, 3]);
    await page.getByTestId('cell-5').click();
    await page.keyboard.press('Shift+Digit2');
    await page.keyboard.press('Shift+Digit4');
    await page.keyboard.press('Shift+Digit8');
    await page.getByTestId('cell-12').click();
    await page.screenshot(shot(`${vp.name}-play-light`));

    // hint panel
    await page.getByTestId('tool-hint').click();
    await expect(page.getByTestId('hint-panel')).toBeVisible();
    await page.screenshot(shot(`${vp.name}-play-hint`));
    if (await page.getByTestId('hint-next').isVisible()) {
      await page.getByTestId('hint-next').click(); // technique
      await page.getByTestId('hint-next').click(); // where
      await page.screenshot(shot(`${vp.name}-play-hint-where`));
      await page.getByTestId('hint-next').click(); // explain
      await page.screenshot(shot(`${vp.name}-play-hint-explain`));
    }
    await page.getByTestId('hint-close').click();

    // dark
    await page.getByTestId('menu').click();
    await page.getByTestId('menu-settings').click();
    await setTheme(page, 'Dark');
    await page.getByTestId('back').click();
    await expect(page.getByTestId('play-screen')).toBeVisible();
    await page.screenshot(shot(`${vp.name}-play-dark`));

    // completion (dark)
    await enterDigits(page, EMPTY.filter((i) => i !== 2 && i !== 3));
    await expect(page.getByTestId('completion')).toBeVisible();
    await page.screenshot(shot(`${vp.name}-completion-dark`));
    await page.getByTestId('completion-home').click();
    await page.getByTestId('nav-settings').click();
    await setTheme(page, 'Light');
    await page.getByTestId('back').click();
    await page.getByTestId('completion-next').or(page.getByTestId('new-game')).first().waitFor();
  });
}
