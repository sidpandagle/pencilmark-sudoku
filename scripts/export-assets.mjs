#!/usr/bin/env node
/**
 * Pencilmark asset exporter.
 *
 * Renders the editable SVG sources in assets/source/ to the PNGs the app, Expo prebuild and the
 * Play Store listing need. Reproducible: same sources + same fonts => same PNGs.
 *
 *   node scripts/export-assets.mjs
 *
 * Renderer: @resvg/resvg-js (devDependency, prebuilt native binary, no system install).
 * Text (wordmark, feature graphic) uses system fonts: Segoe UI on Windows, falling back to
 * Roboto / Helvetica Neue / Arial elsewhere, so text PNGs can differ slightly between machines.
 * The PNGs in the repo were exported on Windows 11 with Segoe UI.
 *
 * Opaque outputs (icon.png, feature graphic) are re-encoded as 24-bit RGB PNGs (no alpha channel),
 * because Expo wants an opaque square icon and Google Play rejects alpha in the feature graphic.
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => path.join(root, 'assets', 'source', p);
const out = (p) => path.join(root, p);

const FONT_OPTS = {
  loadSystemFonts: true,
  defaultFontFamily: 'Segoe UI',
};

// ---------------------------------------------------------------- PNG helpers

/** Render an SVG string to { width, height, pixels(RGBA) } at a given output width. */
function rasterize(svg, width) {
  const r = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: FONT_OPTS,
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
  });
  const img = r.render();
  return { width: img.width, height: img.height, pixels: Buffer.from(img.pixels) };
}

function crc32(buf) {
  return zlib.crc32(buf) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Encode raw RGBA pixels as PNG. rgb=true drops the alpha channel (colour type 2). */
function encodePng({ width, height, pixels }, { rgb = false } = {}) {
  const bpp = rgb ? 3 : 4;
  const raw = Buffer.alloc((width * bpp + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * bpp + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = rowStart + 1 + x * bpp;
      raw[di] = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
      if (!rgb) raw[di + 3] = pixels[si + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = rgb ? 2 : 6; // colour type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Composite RGBA pixels over a solid colour so the result is fully opaque. */
function flatten(img, hex) {
  const [br, bg, bb] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const p = img.pixels;
  for (let i = 0; i < p.length; i += 4) {
    const a = p[i + 3] / 255;
    p[i] = Math.round(p[i] * a + br * (1 - a));
    p[i + 1] = Math.round(p[i + 1] * a + bg * (1 - a));
    p[i + 2] = Math.round(p[i + 2] * a + bb * (1 - a));
    p[i + 3] = 255;
  }
  return img;
}

/** Crop transparent margins, then add `pad` px of transparent padding. */
function trim(img, pad) {
  const { width, height, pixels } = img;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return img;
  const w = maxX - minX + 1 + pad * 2;
  const h = maxY - minY + 1 + pad * 2;
  const outPx = Buffer.alloc(w * h * 4);
  for (let y = minY; y <= maxY; y++) {
    pixels.copy(outPx, ((y - minY + pad) * w + pad) * 4, (y * width + minX) * 4, (y * width + maxX + 1) * 4);
  }
  return { width: w, height: h, pixels: outPx };
}

function write(rel, img, opts) {
  const file = out(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(img, opts));
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${rel.padEnd(52)} ${img.width}x${img.height} ${opts?.rgb ? 'RGB ' : 'RGBA'} ${kb} KB`);
}

const read = (p) => fs.readFileSync(src(p), 'utf8');

// ------------------------------------------------- wordmark "i" dot placement

/**
 * The wordmark uses a dotless i (U+0131) inside <tspan id="dotless"> and draws the dot as
 * <rect id="idot">. Font metrics vary by machine, so measure the dotless i by rendering it alone
 * in magenta and move the rect so it is centred above the stem.
 */
function placeIDot(svg) {
  if (!svg.includes('id="dotless"') || !svg.includes('id="idot"')) return svg;
  const probe = svg
    .replace(/<rect id="idot"[^>]*\/>/, '')
    .replace(/(<text id="wordtext"[^>]*?)fill="[^"]*"/, '$1fill="none"')
    .replace('<tspan id="dotless">', '<tspan id="dotless" fill="#FF00FF">');
  // Hide everything that is not the wordmark text so other magenta-ish pixels cannot interfere.
  const img = rasterize(probe, 0);
  const { width, height, pixels } = img;
  let minX = width, maxX = -1, minY = height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
      if (a > 200 && r > 200 && b > 200 && g < 80) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('could not locate dotless i in wordmark');
  const rectTag = svg.match(/<rect id="idot"[^>]*\/>/)[0];
  const size = parseFloat(rectTag.match(/width="([\d.]+)"/)[1]);
  // Pixel coords equal user units only when the SVG renders at its viewBox size.
  const vbW = parseFloat(svg.match(/viewBox="[\d.\s-]+?\s([\d.]+)\s[\d.]+"/)[1]);
  const scale = vbW / width;
  const stemCentre = ((minX + maxX + 1) / 2) * scale;
  const top = minY * scale;
  const gap = size * 0.35;
  const x = (stemCentre - size / 2).toFixed(2);
  const y = (top - gap - size).toFixed(2);
  const newTag = rectTag.replace(/ x="[^"]*"/, ` x="${x}"`).replace(/ y="[^"]*"/, ` y="${y}"`);
  return svg.replace(rectTag, newTag);
}

// ------------------------------------------------------------------- exports

console.log('Exporting Pencilmark assets');

// App icon (opaque, full bleed). Expo: 1024x1024 square, no transparency.
write('assets/icon.png', rasterize(read('brand/icon.svg'), 1024), { rgb: true });

// Android adaptive icon layers. Foreground and background must share dimensions.
write('assets/android-icon-foreground.png', rasterize(read('brand/android-icon-foreground.svg'), 1024));
write('assets/android-icon-background.png', rasterize(read('brand/android-icon-background.svg'), 1024), { rgb: true });
write('assets/android-icon-monochrome.png', rasterize(read('brand/android-icon-monochrome.svg'), 1024));

// Splash icon: 1024 transparent, rendered at imageWidth in app.json.
write('assets/splash-icon.png', rasterize(read('brand/splash-icon.svg'), 1024));

// Web favicon.
write('assets/favicon.png', rasterize(read('brand/mark.svg'), 48));

// Brand mark for in-app / docs use.
write('assets/brand/mark-512.png', rasterize(read('brand/mark.svg'), 512));

// Wordmark (light + dark variants), trimmed.
{
  const svg = placeIDot(read('brand/wordmark.svg'));
  write('assets/brand/wordmark.png', trim(rasterize(svg, 0), 8));
  const dark = svg.replace('fill="#1E2733"', 'fill="#E8ECF1"').replace('fill="#2F5DA8"', 'fill="#8DB2FF"');
  write('assets/brand/wordmark-dark.png', trim(rasterize(dark, 0), 8));
}

// Difficulty badges (96 px = 24 dp @ 4x) and achievement icons.
for (const f of fs.readdirSync(src('badges')).filter((f) => f.endsWith('.svg'))) {
  write(`assets/badges/${f.replace('.svg', '.png')}`, rasterize(read(`badges/${f}`), 96));
}
for (const f of fs.readdirSync(src('achievements')).filter((f) => f.endsWith('.svg'))) {
  write(`assets/achievements/${f.replace('.svg', '.png')}`, rasterize(read(`achievements/${f}`), 96));
}

// Illustrations (2x of 240x180 viewBox).
for (const f of fs.readdirSync(src('illustrations')).filter((f) => f.endsWith('.svg'))) {
  write(`assets/illustrations/${f.replace('.svg', '.png')}`, rasterize(read(`illustrations/${f}`), 480));
}

// Google Play store listing.
// Play icon: 512x512, 32-bit PNG, max 1024 KB. Feature graphic: 1024x500, JPEG or 24-bit PNG, no alpha.
write('store/play-icon-512.png', rasterize(read('brand/icon.svg'), 512));
write('store/feature-graphic-1024x500.png', flatten(rasterize(placeIDot(read('store/feature-graphic.svg')), 1024), '#F4F1EA'), { rgb: true });

console.log('Done.');
