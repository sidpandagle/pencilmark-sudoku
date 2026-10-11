// Render static compositions (src/stills/*.html) to PNG in marketing/exports/.
//   node scripts/render-stills.mjs all        # or a name prefix, e.g. "play-screenshot"
// Chrome screenshots are converted with ffmpeg-static to 24-bit RGB PNG (no alpha channel), as Google
// Play requires for screenshots and feature graphics.
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { MK, probe, run, serve } from './lib.mjs';

const OUT = join(MK, 'exports');
const TMP = join(MK, 'exports', '.tmp');
mkdirSync(TMP, { recursive: true });

import { STILL_NAMES as STILLS } from './specs.mjs';

const which = process.argv[2] || 'all';
const jobs = which === 'all' ? STILLS : STILLS.filter((j) => j.name.startsWith(which));
const { srv, base } = await serve(4183);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
try {
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('  page error:', e.message));
    await page.goto(`${base}/src/stills/${j.page}?w=${j.w}&h=${j.h}${j.q ? '&' + j.q : ''}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 });
    const raw = join(TMP, `${j.name}.png`);
    await page.screenshot({ path: raw, omitBackground: false });
    await page.close();
    const out = join(OUT, `${j.name}.png`);
    run(['-i', raw, '-pix_fmt', 'rgb24', out]); // 24-bit RGB, no alpha
    const p = probe(out);
    console.log(`  ${j.name}.png  ${p.width}x${p.height}  ${p.pix_fmt}  ${(p.bytes / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
  srv.closeAllConnections();
  srv.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(0);
