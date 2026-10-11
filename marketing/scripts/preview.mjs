// Render single frames of a scene to PNG for checking: node scripts/preview.mjs <scene.html> <w> <h> <out-dir> <t1,t2,...> [query]
import { chromium } from 'playwright-core';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { serve } from './lib.mjs';
const [scene, w, h, out, times, q] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { srv, base } = await serve(4181);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await page.goto(`${base}/src/scenes/${scene}?w=${w}&h=${h}${q ? '&' + q : ''}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
for (const t of times.split(',')) {
  await page.evaluate((t) => window.renderFrame(t), +t);
  const f = join(out, `${scene.replace('.html', '')}-${w}x${h}-${q ? q.replace(/\W/g, '') + '-' : ''}t${t}.png`);
  await page.screenshot({ path: f });
  console.log(f);
}
await browser.close();
srv.closeAllConnections(); srv.close(); process.exit(0);
