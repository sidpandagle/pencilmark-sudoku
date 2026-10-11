// Render HTML motion scenes to MP4 (H.264, yuv420p, CRF 20, +faststart) with ffmpeg-static.
//   node scripts/render-video.mjs all            # every job below, sequentially
//   node scripts/render-video.mjs logo-reveal    # jobs whose name starts with this
// Each scene exposes window.SCENE {duration,fps} and window.renderFrame(t). Frames are captured with
// Chrome DevTools Page.captureScreenshot and piped straight into ffmpeg (no frame folders on disk).
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { FFMPEG, MK, probe, run, serve } from './lib.mjs';

const OUT = join(MK, 'renders');
mkdirSync(OUT, { recursive: true });

import { VIDEO_SPECS as JOBS } from './specs.mjs';

async function renderJob(browser, base, job) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('  page error:', e.message));
  await page.goto(`${base}/src/scenes/${job.scene}?w=${job.w}&h=${job.h}${job.q ? '&' + job.q : ''}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 });
  const { duration, fps } = await page.evaluate(() => window.SCENE);
  const frames = Math.round(duration * fps);
  const out = join(OUT, `${job.name}.mp4`);
  const ff = spawn(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-tune', 'animation',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', '-r', String(fps), out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, bad) => ff.on('close', (c) => (c === 0 ? ok() : bad(new Error('ffmpeg exit ' + c)))));
  const cdp = await page.context().newCDPSession(page);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.renderFrame(t), i / fps);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 90 === 0) process.stdout.write(`  ${job.name}: frame ${i}/${frames}\r`);
  }
  ff.stdin.end();
  await done;
  await page.close();
  const p = probe(out);
  console.log(`  ${job.name}.mp4  ${p.width}x${p.height}  ${p.duration.toFixed(2)}s  ${(p.bytes / 1e6).toFixed(2)} MB  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (job.webm) {
    run(['-i', out, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', '-an', join(OUT, `${job.name}.webm`)]);
    console.log(`  ${job.name}.webm`);
  }
  if (job.gif) {
    const gif = join(OUT, `${job.name.replace(/-\d+x\d+$/, '')}-${job.gif}w.gif`);
    run(['-i', out, '-vf', `fps=15,scale=${job.gif}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', gif]);
    console.log(`  ${gif.split(/[\\/]/).pop()}`);
  }
}

const which = process.argv[2] || 'all';
const jobs = which === 'all' ? JOBS : JOBS.filter((j) => j.name.startsWith(which));
if (!jobs.length) { console.error('no job matches', which); process.exit(1); }
const { srv, base } = await serve();
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars', '--font-render-hinting=none'] });
try {
  for (const j of jobs) await renderJob(browser, base, j); // sequential: one page at a time keeps memory modest
} finally {
  await browser.close();
  srv.closeAllConnections(); srv.close();
}
process.exit(0);
