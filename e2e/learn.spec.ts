import { expect, test, type Page } from '@playwright/test';
import { examplePosition, masteryPositions } from '../src/learn/positions';
import { openHome } from './helpers';

const shot = (name: string) => ({ path: `e2e/screenshots/learn-${name}.png`, fullPage: false });

async function openLearn(page: Page) {
  await openHome(page);
  await page.getByTestId('learn-card').click();
  await expect(page.getByTestId('level-1')).toBeVisible();
}

async function next(page: Page, times = 1) {
  for (let i = 0; i < times; i++) await page.getByTestId('card-next').click();
}

test('open Learn, open Hidden Single, complete the guided step, see completion', async ({ page }) => {
  await openLearn(page);
  await page.getByTestId('lesson-hidden-single').click();
  // Locked (prerequisite not done): a gentle sheet offers a preview.
  await expect(page.getByTestId('locked-sheet')).toBeVisible();
  await page.getByTestId('preview-anyway').click();
  await expect(page.getByTestId('lesson-screen')).toBeVisible();
  await expect(page.getByTestId('card-title')).toHaveText('What it is');
  await next(page, 4); // why, watch out, demo, guided
  await expect(page.getByTestId('exercise-guided')).toBeVisible();
  const g = examplePosition('hidden-single', 1)!;
  const { cell, digit } = g.step.placements[0];
  await page.getByTestId(`cell-${cell}`).click();
  await page.getByTestId(`exchip-${digit}`).click();
  await page.getByTestId('exercise-check').click();
  await expect(page.getByTestId('verdict-correct')).toBeVisible();
  await next(page);
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  // Back on the map the lesson shows as completed.
  await page.getByTestId('lesson-screen').getByTestId('back').click();
  await expect(page.getByLabel(/^Hidden Single, Completed/)).toBeVisible();
});

test('guided solve shows at least 3 explained steps', async ({ page }) => {
  await openLearn(page);
  await page.getByTestId('explore').click();
  await page.getByTestId('explore-easy').click();
  await expect(page.getByTestId('solve-screen')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('solve-counter')).toHaveText(/^Step 1 of \d+/);
  for (let i = 0; i < 4; i++) await page.getByTestId('solve-next').click();
  await expect(page.getByTestId('solve-counter')).toHaveText(/^Step 3 of \d+/);
  await expect(page.getByTestId('solve-caption')).not.toBeEmpty();
});

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'small', width: 360, height: 640 },
];

for (const vp of VIEWPORTS) {
  test(`learning screenshots @ ${vp.name} ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await openLearn(page);
    await page.screenshot(shot(`${vp.name}-map`));

    // Concept card + demo with overlay (X-Wing).
    await page.goto('/learn/x-wing');
    await expect(page.getByTestId('concept-card')).toBeVisible({ timeout: 60_000 });
    await page.screenshot(shot(`${vp.name}-concept`));
    await next(page, 3);
    await expect(page.getByTestId('step-demo')).toBeVisible();
    await page.getByTestId('demo-next').click(); // pattern
    await page.getByTestId('demo-next').click(); // effect
    await page.getByTestId('demo-board').scrollIntoViewIfNeeded();
    await page.screenshot(shot(`${vp.name}-demo-xwing`));

    // Guided candidate-tap step with one mark and the chips open.
    await next(page);
    const g = examplePosition('x-wing', 1)!;
    const e = g.step.eliminations[0];
    await page.getByTestId(`cand-${e.cell}-${e.digit}`).click();
    await page.getByTestId('exercise-board').scrollIntoViewIfNeeded();
    await page.screenshot(shot(`${vp.name}-guided-candidates`));
    await page.getByTestId('exercise-check').click();
    await expect(page.getByTestId('verdict-correct')).toBeVisible();

    // Mastery result (Hidden Single).
    await page.goto('/learn/hidden-single?card=mastery');
    await page.getByTestId('mastery-start').click();
    const positions = masteryPositions('hidden-single', 0);
    for (const p of positions) {
      const { cell, digit } = p.step.placements[0];
      await page.getByTestId(`cell-${cell}`).click();
      await page.getByTestId(`exchip-${digit}`).click();
      await page.getByTestId('exercise-check').click();
      await page.getByTestId('mastery-next').click();
    }
    await expect(page.getByTestId('mastery-result')).toBeVisible();
    await page.screenshot(shot(`${vp.name}-mastery-result`));

    // Guided solve.
    await page.goto('/learn/solve?source=random&difficulty=medium');
    await expect(page.getByTestId('solve-screen')).toBeVisible({ timeout: 60_000 });
    for (let i = 0; i < 3; i++) await page.getByTestId('solve-next').click();
    await page.screenshot(shot(`${vp.name}-solve`));
  });
}
