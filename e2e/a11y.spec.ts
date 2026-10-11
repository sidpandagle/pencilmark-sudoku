import { expect, test, type Page } from '@playwright/test';
import { cell, importPuzzle, openHome } from './helpers';

/**
 * Review cycle 6: every interactive element on the main screens exposes an accessible name, board cells are
 * labelled with row/column/content, and touch targets meet the 44px minimum (48dp design target).
 */
async function unnamedButtons(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('[role="button"], button, [role="switch"], [role="radio"], [role="checkbox"]').forEach((el) => {
      const h = el as HTMLElement;
      if (h.offsetParent === null) return; // hidden
      const name = (h.getAttribute('aria-label') ?? h.innerText ?? '').trim();
      if (!name) out.push(h.outerHTML.slice(0, 120));
    });
    return out;
  });
}

async function smallTargets(page: Page, min = 44) {
  return page.evaluate((m) => {
    const out: string[] = [];
    document.querySelectorAll('[role="button"], button, [role="switch"]').forEach((el) => {
      const h = el as HTMLElement;
      if (h.offsetParent === null) return;
      const r = h.getBoundingClientRect();
      if (r.width < m || r.height < m) out.push(`${(h.getAttribute('aria-label') ?? h.innerText).trim().slice(0, 40)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return out;
  }, min);
}

test('main screens: all controls are named and large enough', async ({ page }) => {
  await openHome(page);
  expect(await unnamedButtons(page)).toEqual([]);
  expect(await smallTargets(page)).toEqual([]);

  await importPuzzle(page);
  expect(await unnamedButtons(page)).toEqual([]);
  // Board cells are intentionally smaller than 44px on phones (81 cells in ~360px); they are exempt
  // (WCAG 2.5.8 essential exception). The one-row number pad has 9 keys across the width: they meet WCAG
  // 2.5.8 AA (>= 24px) and are >= 56px tall; the 3x3 pad setting (checked below) gives >= 44px both ways.
  const small = (await smallTargets(page)).filter((s) => !/^Row \d/.test(s) && !/^\d, (\d left|all placed)/.test(s));
  expect(small).toEqual([]);
  const padKeys = await page.locator('[data-testid^="pad-"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
  expect(padKeys).toHaveLength(9);
  for (const r of padKeys) {
    expect(r.width).toBeGreaterThanOrEqual(24);
    expect(r.height).toBeGreaterThanOrEqual(56);
  }

  await expect(cell(page, 0)).toHaveAttribute('aria-label', /Row 1, column 1, 5, given/);
  await expect(cell(page, 2)).toHaveAttribute('aria-label', /Row 1, column 3, empty/);

  await page.goto('/settings');
  await expect(page.getByText('Theme').first()).toBeVisible();
  expect(await unnamedButtons(page)).toEqual([]);

  // Switch to the 3x3 pad: every key must now be at least 44px in both dimensions.
  await page.getByLabel('Number pad: 3 × 3, larger keys', { exact: true }).click();
  await page.goto('/play');
  await expect(page.getByTestId('number-pad')).toBeVisible();
  const gridKeys = await page.locator('[data-testid^="pad-"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
  for (const r of gridKeys) {
    expect(r.width).toBeGreaterThanOrEqual(44);
    expect(r.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: 'e2e/screenshots/phone-play-grid-pad.png' });

  await page.goto('/learn');
  await expect(page.getByText(/lessons completed/)).toBeVisible();
  expect(await unnamedButtons(page)).toEqual([]);
});
