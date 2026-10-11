// Real app captures: drives the exported web build (../dist) in headless Chrome and saves phone-size
// screenshots to marketing/captures/. Every image is the real app UI; nothing is drawn over it here.
//
//   (repo root)  npm run build:web        # once, if dist/ is missing or stale
//   (marketing/) node scripts/capture-app.mjs
//
// Viewport 390x844 CSS px at deviceScaleFactor 3 -> 1170x2532 PNG (a typical modern phone).
// The stats/achievements captures use a separate browser profile with Playwright's fake clock so that
// five real games (real puzzles, solved through the UI) land on four consecutive days with realistic
// solve times. That is scripted demo data and is labelled as such in MANIFEST.md.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const mk = resolve(here, '..');
const root = resolve(mk, '..');
const outDir = join(mk, 'captures');
mkdirSync(outDir, { recursive: true });
const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEW = { width: 390, height: 844 };
const DPR = 3;

if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.error('dist/ not found. Run `npm run build:web` in the repo root first.');
  process.exit(1);
}
const play = JSON.parse(readFileSync(join(mk, 'data', 'app-play.json'), 'utf8'));
const xw = JSON.parse(readFileSync(join(mk, 'data', 'explainers.json'), 'utf8'))['x-wing'];
const statsGames = JSON.parse(readFileSync(join(mk, 'data', 'stats-games.json'), 'utf8'));

const server = spawn(process.execPath, [join(root, 'e2e', 'serve.mjs'), join(root, 'dist'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const shots = [];
async function shot(page, name) {
  await page.waitForTimeout(450); // let 120-200 ms UI transitions settle
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  shots.push(name);
  console.log('captured', name);
}
const byId = (page, id) => page.getByTestId(id);
async function openHome(page) {
  await page.goto(BASE + '/');
  await byId(page, 'new-game').waitFor({ timeout: 60_000 });
}
async function importPuzzle(page, puzzle) {
  await byId(page, 'nav-import').click();
  await byId(page, 'import-input').fill(puzzle);
  await byId(page, 'import-check').click();
  await byId(page, 'import-start').waitFor();
  await byId(page, 'import-start').click();
  await byId(page, 'play-screen').waitFor();
}
async function setTheme(page, theme) {
  await page.getByLabel(`Theme: ${theme}`, { exact: true }).click();
}
async function enter(page, cells, solution) {
  for (const i of cells) {
    await byId(page, `cell-${i}`).click();
    await page.keyboard.press(solution[i]);
  }
}

try {
  // ---------- Profile A: fresh install ----------
  {
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR, colorScheme: 'light' });
    const page = await ctx.newPage();
    await openHome(page);
    await shot(page, 'home');

    await byId(page, 'learn-card').click();
    await byId(page, 'level-1').waitFor();
    await shot(page, 'learn-map');

    // X-Wing lesson: concept card, then the 4-part demonstration (units -> pattern -> effect -> result)
    await page.goto(BASE + '/learn/x-wing');
    await byId(page, 'concept-card').waitFor({ timeout: 60_000 });
    await shot(page, 'lesson-concept');
    for (let i = 0; i < 3; i++) await byId(page, 'card-next').click();
    await byId(page, 'step-demo').waitFor();
    await byId(page, 'demo-board').scrollIntoViewIfNeeded();
    await shot(page, 'lesson-demo-1-units');
    for (const part of ['2-pattern', '3-effect', '4-result']) {
      if (!(await byId(page, 'demo-next').isVisible())) break;
      await byId(page, 'demo-next').click();
      await byId(page, 'demo-board').scrollIntoViewIfNeeded();
      await shot(page, `lesson-demo-${part}`);
    }

    // Real play towards the explainer X-Wing position
    await openHome(page);
    await importPuzzle(page, play.puzzle);
    await shot(page, 'play-start');
    await enter(page, play.entries.map((e) => e.cell), play.solution);
    await byId(page, `cell-${play.entries[play.entries.length - 1].cell}`).click();
    await shot(page, 'play-entries');

    // Manual notes in one cell (Shift+digit toggles a note), for the notes sequence. The cell is one where the
    // solver had eliminated nothing yet, so its notes end up identical whether auto-fill merges or overwrites.
    const removalCells = new Set(play.removals.map((r) => r.cell));
    const filled = new Set(play.entries.map((e) => e.cell));
    const manualCell = xw.candidates.findIndex((ds, i) => ds.length >= 3 && !filled.has(i) && !removalCells.has(i));
    await byId(page, `cell-${manualCell}`).click();
    const ds = xw.candidates[manualCell];
    await page.keyboard.press(`Shift+Digit${ds[0]}`);
    await shot(page, 'notes-1-manual');
    for (const d of ds.slice(1)) await page.keyboard.press(`Shift+Digit${d}`);
    await shot(page, 'notes-1b-manual');

    await byId(page, 'menu').click();
    await byId(page, 'menu-autofill').click();
    await page.waitForTimeout(300);
    await shot(page, 'notes-2-autofill');
    for (const r of play.removals) {
      await byId(page, `cell-${r.cell}`).click();
      await page.keyboard.press(`Shift+Digit${r.digit}`);
    }
    await byId(page, `cell-${xw.step.patternCells[0]}`).click();
    await shot(page, 'play-notes');

    await byId(page, 'tool-hint').click();
    await byId(page, 'hint-panel').waitFor();
    await shot(page, 'hint-0-nudge');
    for (const n of ['1-technique', '2-where', '3-explain']) {
      await byId(page, 'hint-next').click();
      await shot(page, `hint-${n}`);
    }
    const panel = await byId(page, 'hint-panel').innerText();
    if (!panel.replace(/\s+/g, ' ').includes(play.expectedHint)) throw new Error('Hint panel does not show the expected X-Wing: ' + panel);
    await byId(page, 'hint-close').click();

    await byId(page, 'menu').click();
    await byId(page, 'menu-settings').click();
    await setTheme(page, 'Dark');
    await byId(page, 'back').click();
    await byId(page, 'play-screen').waitFor();
    await byId(page, `cell-${xw.step.patternCells[0]}`).click();
    await shot(page, 'play-dark');
    await byId(page, 'tool-hint').click();
    for (let i = 0; i < 2; i++) await byId(page, 'hint-next').click();
    await shot(page, 'hint-dark-where');
    await byId(page, 'hint-close').click();
    await ctx.close();
  }

  // ---------- Profile B: demo stats (fake clock, real games solved through the UI) ----------
  {
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR, colorScheme: 'light' });
    const page = await ctx.newPage();
    // day (October 2026), local start hour, solve minutes
    const plan = [
      ['2026-10-07T08:10:00', 6.7],
      ['2026-10-07T21:05:00', 12.3],
      ['2026-10-08T07:45:00', 10.1],
      ['2026-10-09T20:30:00', 21.6],
      ['2026-10-10T09:15:00', 5.85],
    ];
    await page.clock.install({ time: new Date(plan[0][0]) });
    await openHome(page);
    for (let k = 0; k < statsGames.length; k++) {
      const g = statsGames[k];
      await page.clock.setSystemTime(new Date(plan[k][0]));
      await importPuzzle(page, g.puzzle);
      const empty = [...g.puzzle].map((ch, i) => (ch === '.' || ch === '0' ? i : -1)).filter((i) => i >= 0);
      await enter(page, empty.slice(0, -1), g.solution);
      // The app adds at most 5 s per timer tick, so advance in 4.5 s jumps (each fires the 1 s tick once).
      for (let left = Math.round(plan[k][1] * 60_000); left > 0; left -= 4500) await page.clock.fastForward(Math.min(4500, left));
      await enter(page, empty.slice(-1), g.solution);
      await byId(page, 'completion').waitFor();
      if (k === statsGames.length - 1) await shot(page, 'completion-light');
      await byId(page, 'completion-home').click();
      await byId(page, 'new-game').waitFor();
    }
    await byId(page, 'nav-stats').click();
    await page.waitForTimeout(500);
    await shot(page, 'stats');
    await openHome(page);
    await byId(page, 'nav-achievements').click();
    await shot(page, 'achievements');
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`done: ${shots.length} captures in marketing/captures/`);
process.exit(0);
