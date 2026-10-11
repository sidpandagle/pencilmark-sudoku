// Shared helpers for the render scripts: a tiny static server for marketing/, one headless Chrome,
// ffmpeg-static path and an ffmpeg -i based probe (ffmpeg-static ships no ffprobe).
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

export const MK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FFMPEG = ffmpegPath;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css' };

/** Serve marketing/ (and ../assets read-only under /assets) on 127.0.0.1. */
export function serve(port = 4180) {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      let url = decodeURIComponent((req.url || '/').split('?')[0]);
      let base = MK;
      if (url.startsWith('/assets/')) { base = resolve(MK, '..'); }
      const file = normalize(join(base, url));
      if (!file.startsWith(base) || !existsSync(file) || statSync(file).isDirectory()) return res.writeHead(404).end();
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      createReadStream(file).pipe(res);
    });
    srv.listen(port, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${port}` }));
  });
}

/** Probe a media file with `ffmpeg -i` (stderr parsing): width, height, duration (s), codec, pix_fmt, fps. */
export function probe(file) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const s = r.stderr || '';
  const v = /Stream #\S+.*?Video: (\w+)[^,]*?(?:\([^)]*\))?, (\w+)(?:\([^)]*\))?, (\d+)x(\d+)/.exec(s);
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(s);
  const f = /, ([\d.]+) fps/.exec(s);
  return {
    codec: v?.[1], pix_fmt: v?.[2], width: v ? +v[3] : 0, height: v ? +v[4] : 0,
    duration: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0, fps: f ? +f[1] : 0,
    bytes: existsSync(file) ? statSync(file).size : 0,
  };
}
export const run = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
