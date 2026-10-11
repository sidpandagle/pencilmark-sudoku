// Verify every rendered video and exported still: exists, non-zero size, expected resolution, duration
// and pixel format (yuv420p H.264 for MP4, rgb24 = 24-bit PNG without alpha for exports).
// Writes marketing/verification.json and exits non-zero on any failure.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MK, probe } from './lib.mjs';
import { STILL_NAMES, VIDEO_SPECS } from './specs.mjs';

const rows = [];
let bad = 0;
const check = (file, exp) => {
  const path = join(MK, file);
  const p = existsSync(path) ? probe(path) : null;
  const errs = [];
  if (!p || !p.bytes) errs.push('missing or empty');
  else {
    if (p.width !== exp.w || p.height !== exp.h) errs.push(`size ${p.width}x${p.height} != ${exp.w}x${exp.h}`);
    if (exp.min !== undefined && !(p.duration >= exp.min && p.duration <= exp.max)) errs.push(`duration ${p.duration}s not in ${exp.min}-${exp.max}`);
    if (exp.pix && p.pix_fmt !== exp.pix) errs.push(`pix_fmt ${p.pix_fmt} != ${exp.pix}`);
    if (exp.codec && p.codec !== exp.codec) errs.push(`codec ${p.codec} != ${exp.codec}`);
  }
  if (errs.length) bad++;
  rows.push({ file, ok: !errs.length, ...(p || {}), errors: errs });
  console.log(`${errs.length ? 'FAIL' : ' ok '}  ${file.padEnd(52)} ${p ? `${p.width}x${p.height}` : ''} ${p?.duration ? p.duration.toFixed(2) + 's' : ''} ${p?.pix_fmt || ''} ${p ? (p.bytes / 1024).toFixed(0) + ' KB' : ''} ${errs.join('; ')}`);
};
for (const v of VIDEO_SPECS) {
  check(`renders/${v.name}.mp4`, { w: v.w, h: v.h, min: v.min, max: v.max, pix: 'yuv420p', codec: 'h264' });
  for (const extra of v.extras || []) check(`renders/${extra.file}`, { w: extra.w, h: extra.h, min: v.min, max: v.max });
}
for (const s of STILL_NAMES) check(`exports/${s.name}.png`, { w: s.w, h: s.h, pix: 'rgb24' });
// anything unexpected lying around?
for (const dir of ['renders', 'exports']) for (const f of readdirSync(join(MK, dir))) if (!rows.some((r) => r.file === `${dir}/${f}`)) console.log(`note  unlisted file ${dir}/${f}`);
writeFileSync(join(MK, 'verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), failures: bad, files: rows }, null, 1));
console.log(bad ? `\n${bad} problem(s)` : `\nall ${rows.length} files verified`);
process.exit(bad ? 1 : 0);
