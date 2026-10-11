// Pencilmark motion library: brand tokens, deterministic timeline helpers, an SVG Sudoku board,
// the animated brand mark and wordmark. Every scene imports this and exposes
//   window.SCENE = { duration, fps }   and   window.renderFrame(t)   (t in seconds, pure function of t)
// so scripts/render-video.mjs can step time frame by frame. Open any scene in a browser via
// `npm run serve` and add ?t=3.2 to inspect a frame, or ?play to preview in real time.

export const TOKENS = {
  light: {
    bg: '#F4F1EA', surface: '#FFFDF8', surfaceAlt: '#ECE7DC', ink: '#1E2733', inkMuted: '#5E6B7A',
    line: '#C9C2B4', lineStrong: '#2E3946', accent: '#2F5DA8', accentSoft: '#DCE6F6', peer: '#ECEEF1',
    sameDigit: '#C8D7F1', hint: '#B27A18', hintSoft: '#FBEBC8', eliminate: '#C0392B', success: '#2E7D55',
    colorA: '#2D79AD', colorB: '#B45A19', conflict: '#B4382A',
  },
  dark: {
    bg: '#11151B', surface: '#1A2029', surfaceAlt: '#232B36', ink: '#E8ECF1', inkMuted: '#9AA6B4',
    line: '#38424F', lineStrong: '#AEB9C6', accent: '#8DB2FF', accentSoft: '#25385A', peer: '#1F2733',
    sameDigit: '#30466E', hint: '#F2C062', hintSoft: '#4A3A17', eliminate: '#FF7F72', success: '#6FD39F',
    colorA: '#7CC4F5', colorB: '#F5A66B', conflict: '#FF8A7A',
  },
  brand: { inkTop: '#2D5193', inkBottom: '#1B2B47', paper: '#F4F1EA', dot: '#8DB2FF', pencil: '#F2C062', pencilWood: '#F4E6C8' },
};
export const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Claims shown on end cards. Only what is true today. Add 'Free' here once pricing is confirmed by the owner.
export const CLAIMS = ['Offline', 'No ads', 'No account'];
export const AVAILABILITY = 'Coming soon to Google Play';
export const TAGLINE = 'Learn to see the logic.';

// ---------- timeline helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
/** progress 0..1 of t inside [a, b] */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  in: (p) => p * p * p,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: (p) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
/** fade in over [a, a+fi], hold, fade out over [b-fo, b]. */
export function env(t, a, b, fi = 0.3, fo = 0.3) {
  if (t < a || t > b) return 0;
  return Math.min(fi ? clamp((t - a) / fi) : 1, fo ? clamp((b - t) / fo) : 1);
}
export const pulse = (t, period = 1.2) => 0.5 - 0.5 * Math.cos((t / period) * Math.PI * 2);

// ---------- stage ----------
export const params = new URLSearchParams(location.search);
export function stage() {
  const W = Number(params.get('w') || 1080);
  const H = Number(params.get('h') || 1920);
  document.documentElement.style.cssText = `width:${W}px;height:${H}px;overflow:hidden;margin:0`;
  document.body.style.cssText = `width:${W}px;height:${H}px;overflow:hidden;margin:0;position:relative;font-family:${FONT};-webkit-font-smoothing:antialiased`;
  return { W, H, portrait: H > W, square: W === H };
}
export async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error('cannot load ' + path);
  return r.json();
}
/** Register the scene; supports ?t= (still) and ?play (live preview). */
export function register(duration, renderFrame, fps = 30) {
  window.SCENE = { duration, fps };
  window.renderFrame = renderFrame;
  const tq = params.get('t');
  if (params.has('play')) {
    const t0 = performance.now();
    const loop = () => { renderFrame(((performance.now() - t0) / 1000) % duration); requestAnimationFrame(loop); };
    loop();
  } else renderFrame(tq ? Number(tq) : 0);
  document.fonts.ready.then(() => { window.__ready = true; });
}

const SVGNS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
export function div(cls, parent, html) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (html !== undefined) d.innerHTML = html;
  (parent || document.body).appendChild(d);
  return d;
}
/** set a style/attr only when it changes (keeps per-frame DOM work small) */
function setA(e, k, v) {
  v = String(v);
  if (e.__a?.[k] === v) return;
  (e.__a ||= {})[k] = v;
  e.setAttribute(k, v);
}
export function css(e, props) {
  for (const k in props) {
    const v = String(props[k]);
    if ((e.__s ||= {})[k] === v) continue;
    e.__s[k] = v;
    e.style[k] = v;
  }
}

// ---------- cell geometry ----------
export const rowOf = (c) => Math.floor(c / 9);
export const colOf = (c) => c % 9;
export const boxOf = (c) => Math.floor(rowOf(c) / 3) * 3 + Math.floor(colOf(c) / 3);
export const unitCells = (u) => {
  const out = [];
  for (let i = 0; i < 9; i++) {
    if (u < 9) out.push(u * 9 + i);
    else if (u < 18) out.push(i * 9 + (u - 9));
    else { const b = u - 18; out.push((Math.floor(b / 3) * 3 + Math.floor(i / 3)) * 9 + (b % 3) * 3 + (i % 3)); }
  }
  return out;
};
export const cellName = (c) => `r${rowOf(c) + 1}c${colOf(c) + 1}`;

// ---------- Sudoku board (SVG, internal 900x900 units, 100 per cell) ----------
export class Board {
  constructor(parent, { x = 0, y = 0, size = 810, theme = 'light', candSize = 33, labels = false } = {}) {
    this.k = TOKENS[theme];
    this.svg = el('svg', { width: size, height: size, viewBox: '-8 -8 916 916', style: `position:absolute;left:${x}px;top:${y}px;overflow:visible` }, parent);
    this.size = size;
    this.x = x; this.y = y;
    const k = this.k;
    const g = (this.root = el('g', {}, this.svg));
    this.paper = el('rect', { x: 0, y: 0, width: 900, height: 900, rx: 14, fill: k.surface }, g);
    this.bg = []; this.ringEl = []; this.dig = []; this.cand = []; this.strike = []; this.xmark = [];
    const cells = el('g', {}, g);
    for (let c = 0; c < 81; c++) this.bg.push(el('rect', { x: colOf(c) * 100, y: rowOf(c) * 100, width: 100, height: 100, fill: 'none' }, cells));
    // grid lines
    this.thin = []; this.thick = [];
    const lines = el('g', { 'stroke-linecap': 'round' }, g);
    for (let i = 1; i < 9; i++) {
      const strong = i % 3 === 0;
      const attrs = { stroke: strong ? k.lineStrong : k.line, 'stroke-width': strong ? 5 : 2, fill: 'none' };
      const v = el('path', { ...attrs, d: `M${i * 100} 0V900` }, lines);
      const h = el('path', { ...attrs, d: `M0 ${i * 100}H900` }, lines);
      (strong ? this.thick : this.thin).push(v, h);
    }
    this.frame = el('rect', { x: 0, y: 0, width: 900, height: 900, rx: 14, fill: 'none', stroke: k.lineStrong, 'stroke-width': 7 }, lines);
    for (const p of [...this.thin, ...this.thick]) { p.setAttribute('pathLength', 1); p.setAttribute('stroke-dasharray', '1 1'); }
    this.frame.setAttribute('pathLength', 1); this.frame.setAttribute('stroke-dasharray', '1 1');
    const rings = el('g', {}, g);
    for (let c = 0; c < 81; c++)
      this.ringEl.push(el('rect', { x: colOf(c) * 100 + 2.5, y: rowOf(c) * 100 + 2.5, width: 95, height: 95, rx: 10, fill: 'none', stroke: k.hint, 'stroke-width': 5, opacity: 0 }, rings));
    this.overlay = el('g', { 'stroke-linecap': 'round', fill: 'none' }, g);
    const txt = el('g', { 'font-family': FONT, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'font-variant-numeric: tabular-nums' }, g);
    for (let c = 0; c < 81; c++) {
      const cx = colOf(c) * 100 + 50, cy = rowOf(c) * 100 + 52;
      this.dig.push(el('text', { x: cx, y: cy, 'font-size': 58, 'font-weight': 600, fill: k.ink, opacity: 0 }, txt));
      const cs = [], ss = [];
      for (let d = 1; d <= 9; d++) {
        const px = colOf(c) * 100 + 21 + ((d - 1) % 3) * 29, py = rowOf(c) * 100 + 21 + Math.floor((d - 1) / 3) * 29;
        const t = el('text', { x: px, y: py + 1, 'font-size': candSize, 'font-weight': 600, fill: k.inkMuted, opacity: 0 }, txt);
        t.textContent = d;
        cs.push(t);
        ss.push(el('path', { d: `M${px - 14} ${py + 12}L${px + 14} ${py - 12}`, stroke: k.eliminate, 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, opacity: 0 }, txt));
      }
      this.cand.push(cs); this.strike.push(ss);
      const xm = el('path', { d: `M${cx - 22} ${cy - 24}L${cx + 22} ${cy + 20}M${cx + 22} ${cy - 24}L${cx - 22} ${cy + 20}`, stroke: k.inkMuted, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, txt);
      this.xmark.push(xm);
    }
    if (labels) {
      // row / column numbers so viewers can follow r1c1 cell names
      this.labels = el('g', { 'font-family': FONT, 'font-size': 30, 'font-weight': 700, fill: k.inkMuted, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
      for (let i = 0; i < 9; i++) {
        el('text', { x: i * 100 + 50, y: -34 }, this.labels).textContent = i + 1;
        el('text', { x: -36, y: i * 100 + 52 }, this.labels).textContent = i + 1;
      }
    }
    this.ovl = new Map();
    this.begin();
  }
  /** cell centre in page pixels */
  center(c) {
    const s = this.size / 916;
    return { x: this.x + (8 + colOf(c) * 100 + 50) * s, y: this.y + (8 + rowOf(c) * 100 + 50) * s, cell: 100 * s };
  }
  begin() {
    this.s = {
      lines: 1, frame: 1, paper: 1,
      bg: Array.from({ length: 81 }, () => [null, 0]),
      ring: new Array(81).fill(0), ringColor: new Array(81).fill(null),
      dig: Array.from({ length: 81 }, () => null),
      cand: Array.from({ length: 81 }, () => new Array(9).fill(null)),
      strike: Array.from({ length: 81 }, () => new Array(9).fill(0)),
      xmark: new Array(81).fill(0),
      used: new Set(),
    };
  }
  lines(p, frameP = p) { this.s.lines = p; this.s.frame = frameP; }
  shade(c, color, a) { if (a > this.s.bg[c][1] || this.s.bg[c][0] === null) this.s.bg[c] = [color, a]; }
  shadeUnit(u, color, a) { for (const c of unitCells(u)) this.shade(c, color, a); }
  ring(c, a, color) { if (a <= 0.001 || a < this.s.ring[c]) return; this.s.ring[c] = a; if (color) this.s.ringColor[c] = color; }
  /** digit: {v, op, color, scale, weight} */
  digit(c, v, o = {}) { this.s.dig[c] = { v, op: 1, color: this.k.ink, scale: 1, weight: 600, ...o }; }
  /** candidate: {op, color, weight, scale} */
  candidate(c, d, o = {}) { this.s.cand[c][d - 1] = { op: 1, color: this.k.inkMuted, weight: 600, scale: 1, center: 0, ...o }; }
  cands(c, ds, o = {}) { for (const d of ds) this.candidate(c, d, o); }
  strikeCand(c, d, p) { this.s.strike[c][d - 1] = p; }
  cross(c, a) { this.s.xmark[c] = a; }
  /** keyed overlay path in board units (0..900). */
  path(key, d, o = {}) {
    let e = this.ovl.get(key);
    if (!e) { e = el('path', { pathLength: 1, 'stroke-dasharray': '1 1' }, this.overlay); this.ovl.set(key, e); }
    this.s.used.add(key);
    setA(e, 'd', d);
    setA(e, 'stroke', o.color || this.k.hint);
    setA(e, 'stroke-width', o.width || 8);
    setA(e, 'opacity', o.op ?? 1);
    setA(e, 'stroke-dashoffset', 1 - (o.p ?? 1));
    setA(e, 'fill', o.fill || 'none');
    if (o.dash) { setA(e, 'pathLength', 1000); setA(e, 'stroke-dasharray', o.dash); setA(e, 'stroke-dashoffset', 0); }
    else { setA(e, 'pathLength', 1); setA(e, 'stroke-dasharray', '1 1'); }
  }
  end() {
    const s = this.s, k = this.k;
    setA(this.paper, 'opacity', s.paper);
    if (this.labels) setA(this.labels, 'opacity', s.labelsOp ?? 1);
    for (const p of [...this.thin, ...this.thick]) setA(p, 'stroke-dashoffset', 1 - s.lines);
    setA(this.frame, 'stroke-dashoffset', 1 - s.frame);
    for (let c = 0; c < 81; c++) {
      const [col, a] = s.bg[c];
      setA(this.bg[c], 'fill', col || 'none');
      setA(this.bg[c], 'opacity', col ? a : 0);
      setA(this.ringEl[c], 'opacity', s.ring[c]);
      setA(this.ringEl[c], 'stroke', s.ringColor[c] || k.hint);
      const d = s.dig[c], t = this.dig[c];
      if (d && d.op > 0.001) {
        if (t.textContent !== String(d.v)) t.textContent = d.v;
        setA(t, 'opacity', d.op);
        setA(t, 'fill', d.color);
        setA(t, 'font-weight', d.weight);
        const cx = colOf(c) * 100 + 50, cy = rowOf(c) * 100 + 52;
        setA(t, 'transform', d.scale === 1 ? '' : `translate(${cx} ${cy}) scale(${d.scale}) translate(${-cx} ${-cy})`);
      } else setA(t, 'opacity', 0);
      for (let i = 0; i < 9; i++) {
        const o = s.cand[c][i], e = this.cand[c][i];
        if (o && o.op > 0.001) {
          setA(e, 'opacity', o.op);
          setA(e, 'fill', o.color);
          setA(e, 'font-weight', o.weight);
          const px = +e.getAttribute('x'), py = +e.getAttribute('y');
          // o.center (0..1) slides the candidate to the cell centre (used for single-digit focus views)
          const cp = o.center || 0, cx = colOf(c) * 100 + 50, cy = rowOf(c) * 100 + 51;
          const tx = (cx - px) * cp, ty = (cy - py) * cp;
          const tr = o.scale === 1 && !cp ? '' : `translate(${px + tx} ${py + ty}) scale(${o.scale}) translate(${-px} ${-py})`;
          setA(e, 'transform', tr);
          setA(this.strike[c][i], 'transform', tr);
        } else setA(e, 'opacity', 0);
        const sp = s.strike[c][i];
        setA(this.strike[c][i], 'opacity', sp > 0 ? Math.min(1, o ? o.op * 1.5 + 0.2 : 0) : 0);
        setA(this.strike[c][i], 'stroke-dashoffset', 1 - sp);
      }
      setA(this.xmark[c], 'opacity', s.xmark[c]);
    }
    for (const [key, e] of this.ovl) if (!s.used.has(key)) setA(e, 'opacity', 0);
  }
}
/** board-unit helpers for overlay paths */
export const bx = (c) => colOf(c) * 100 + 50;
export const by = (c) => rowOf(c) * 100 + 50;

// ---------- brand mark (geometry from assets/source/brand/mark.svg) ----------
export function markSVG(size) {
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  const b = TOKENS.brand;
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" style="overflow:visible;display:block">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.inkTop}"/><stop offset="1" stop-color="${b.inkBottom}"/></linearGradient></defs>
  <g class="tile"><rect width="1024" height="1024" rx="224" fill="url(#${id})"/></g>
  <g transform="translate(212 212)">
    <g fill="none" stroke="${b.paper}" stroke-linecap="round">
      <rect class="frame" x="14" y="14" width="572" height="572" rx="56" stroke-width="28" pathLength="1" stroke-dasharray="1 1"/>
      <path class="l" d="M200 14V586" stroke-width="16" pathLength="1" stroke-dasharray="1 1"/>
      <path class="l" d="M400 14V586" stroke-width="16" pathLength="1" stroke-dasharray="1 1"/>
      <path class="l" d="M14 200H586" stroke-width="16" pathLength="1" stroke-dasharray="1 1"/>
      <path class="l" d="M14 400H586" stroke-width="16" pathLength="1" stroke-dasharray="1 1"/>
    </g>
    <g fill="${b.dot}"><circle class="dot" cx="66" cy="66" r="17"/><circle class="dot" cx="118" cy="66" r="17"/><circle class="dot" cx="66" cy="118" r="17"/></g>
    <g transform="translate(300 300) rotate(-45)"><g class="pencil">
      <rect x="-88" y="-24" width="20" height="48" rx="6" fill="${b.dot}"/>
      <rect x="-64" y="-24" width="100" height="48" fill="${b.pencil}"/>
      <path d="M36 -24L88 0L36 24Z" fill="${b.pencilWood}"/>
      <path d="M71 -7.8L88 0L71 7.8Z" fill="#1E2733"/>
    </g></g>
  </g></svg>`;
  const svg = wrap.firstElementChild;
  const q = (s) => [...svg.querySelectorAll(s)];
  const parts = { tile: q('.tile')[0], frame: q('.frame')[0], lines: q('.l'), dots: q('.dot'), pencil: q('.pencil')[0] };
  /** p: {tile, frame, lines, dots:[3], pencil} each 0..1 */
  svg.pose = (p) => {
    const ts = 0.6 + 0.4 * ease.back(p.tile);
    setA(parts.tile, 'transform', `translate(512 512) scale(${ts}) translate(-512 -512)`);
    setA(parts.tile, 'opacity', clamp(p.tile * 1.5));
    setA(parts.frame, 'stroke-dashoffset', 1 - ease.inOut(p.frame));
    parts.lines.forEach((l, i) => setA(l, 'stroke-dashoffset', 1 - ease.inOut(clamp(p.lines * 1.6 - i * 0.2))));
    parts.dots.forEach((d, i) => {
      const a = ease.back(clamp(p.dots * 2.2 - i * 0.6));
      setA(d, 'transform', `translate(${d.getAttribute('cx')} ${d.getAttribute('cy')}) scale(${a}) translate(${-d.getAttribute('cx')} ${-d.getAttribute('cy')})`);
    });
    const pe = ease.out(p.pencil);
    setA(parts.pencil, 'transform', `translate(${lerp(-260, 0, pe)} 0)`);
    setA(parts.pencil, 'opacity', clamp(p.pencil * 3));
  };
  svg.pose({ tile: 1, frame: 1, lines: 1, dots: 1, pencil: 1 });
  return svg;
}

/** Wordmark: heavy system font, dotless i with the accent pencil-mark square as its dot. */
export function wordmark(parent, { size = 120, color, dot } = {}) {
  const k = TOKENS.light;
  const w = div('wordmark', parent);
  w.style.cssText = `font-family:${FONT};font-weight:900;font-size:${size}px;letter-spacing:-0.022em;line-height:1.33;color:${color || k.ink};white-space:nowrap;display:inline-block;padding-right:0.06em`;
  w.innerHTML = `Penc<span style="position:relative;display:inline-block">&#x131;<i class="wm-dot" style="position:absolute;left:50%;top:0.19em;width:0.2em;height:0.2em;margin-left:-0.1em;border-radius:0.028em;background:${dot || k.accent}"></i></span>lmark`;
  w.dot = w.querySelector('.wm-dot');
  return w;
}

/** Shared base CSS for scenes. */
export function baseCSS(theme = 'light') {
  const k = TOKENS[theme];
  const s = document.createElement('style');
  s.textContent = `
  body{background:${k.bg};color:${k.ink}}
  .abs{position:absolute}
  .caption{position:absolute;font-weight:600;color:${k.ink};line-height:1.25;letter-spacing:-0.005em}
  .chip{position:absolute;display:inline-flex;align-items:center;gap:14px;padding:12px 24px;border-radius:999px;background:${k.surfaceAlt};color:${k.ink};font-weight:700}
  .muted{color:${k.inkMuted}}
  .cellref{white-space:nowrap;background:${k.surfaceAlt};border-radius:10px;padding:0 .18em;font-weight:700}
  .paperGrid{position:absolute;inset:0;opacity:.5;background-image:linear-gradient(${k.line}33 2px,transparent 2px),linear-gradient(90deg,${k.line}33 2px,transparent 2px);background-size:120px 120px}
  `;
  document.head.appendChild(s);
}

/** End card overlay: brand gradient, mark, wordmark, tagline, claims, availability. Returns render(p, t). */
export function endCard(W, H, opts = {}) {
  const b = TOKENS.brand;
  const root = div('', document.body);
  root.style.cssText = `position:absolute;inset:0;opacity:0;background:linear-gradient(160deg, ${b.inkTop}, ${b.inkBottom});display:flex;flex-direction:column;align-items:center;justify-content:center;color:${b.paper};text-align:center`;
  const unit = Math.min(W, H);
  const markBox = div('', root);
  markBox.style.filter = 'drop-shadow(0 18px 36px rgba(5,12,28,.45))';
  const m = markSVG(unit * 0.26);
  markBox.appendChild(m);
  const wmBox = div('', root);
  wmBox.style.marginTop = unit * 0.05 + 'px';
  const wm = wordmark(wmBox, { size: unit * 0.115, color: b.paper, dot: b.dot });
  const tag = div('', root, opts.tagline || TAGLINE);
  tag.style.cssText = `font-size:${unit * 0.05}px;font-weight:600;opacity:.92;margin-top:${unit * 0.005}px`;
  const claims = div('', root, CLAIMS.map((c) => `<span>${c}</span>`).join('<b style="opacity:.5;padding:0 .5em">·</b>'));
  claims.style.cssText = `font-size:${unit * 0.042}px;font-weight:700;margin-top:${unit * 0.06}px;padding:${unit * 0.018}px ${unit * 0.04}px;border:3px solid ${b.paper}55;border-radius:999px`;
  const avail = div('', root, opts.availability || AVAILABILITY);
  avail.style.cssText = `font-size:${unit * 0.036}px;font-weight:600;margin-top:${unit * 0.035}px;color:${b.dot}`;
  const items = [markBox, wmBox, tag, claims, avail];
  return (p, t) => {
    css(root, { opacity: clamp(p * 3) });
    m.pose({ tile: seg(p, 0, 0.25), frame: seg(p, 0.08, 0.35), lines: seg(p, 0.15, 0.45), dots: seg(p, 0.35, 0.55), pencil: seg(p, 0.4, 0.6) });
    items.forEach((e, i) => {
      if (i === 0) return;
      const q = ease.out(seg(p, 0.25 + i * 0.08, 0.5 + i * 0.08));
      css(e, { opacity: q, transform: `translateY(${(1 - q) * 30}px)` });
    });
    wm.dot.style.transform = `translateY(${(1 - ease.back(seg(p, 0.5, 0.7))) * -60}px)`;
    wm.dot.style.opacity = seg(p, 0.48, 0.55);
  };
}

/** Timed captions: list of {a, b, text}; crossfade with a small rise. */
export function captions(box, list) {
  const els = list.map((c) => {
    const html = c.text.replace(/(r[1-9]c[1-9])/g, '<span class="cellref">$1</span>').replace(/ = (\d)/g, '&nbsp;=&nbsp;$1');
    const d = div('', box, html);
    d.style.cssText = 'position:absolute;left:0;right:0;top:0;opacity:0;text-wrap:balance';
    return { ...c, d };
  });
  return (t) => {
    for (const c of els) {
      const o = env(t, c.a, c.b, 0.35, 0.3);
      const rise = (1 - ease.out(seg(t, c.a, c.a + 0.45))) * 24;
      css(c.d, { opacity: o, transform: `translateY(${rise}px)` });
    }
  };
}

/**
 * Static "hero" state of a technique (for thumbnails, covers, store art): the deduction drawn on the real
 * engine position from data/explainers.json, the same overlays the explainer videos use.
 */
export function heroBoard(B, X, theme = 'light') {
  const k = TOKENS[theme];
  const st = X.step;
  B.begin();
  for (let c = 0; c < 81; c++) if (X.grid[c]) B.digit(c, X.grid[c], { color: X.givens[c] ? k.ink : k.accent, weight: X.givens[c] ? 600 : 500 });
  if (X.technique === 'hidden-single') {
    const { cell, digit } = st.placements[0];
    B.shadeUnit(st.units[0], k.hintSoft, 1);
    const byCell = new Map();
    for (const b of X.crossHatch) { B.cross(b.cell, 1); byCell.set(b.by, [...(byCell.get(b.by) || []), b.cell]); }
    for (const [src, cells] of byCell) {
      B.ring(src, 1, k.accent);
      B.digit(src, X.grid[src], { color: k.accent });
      const far = cells.reduce((f, c) => (Math.abs(colOf(c) - colOf(src)) + Math.abs(rowOf(c) - rowOf(src)) > Math.abs(colOf(f) - colOf(src)) + Math.abs(rowOf(f) - rowOf(src)) ? c : f), cells[0]);
      const dx = Math.sign(bx(far) - bx(src)) * 38, dy = Math.sign(by(far) - by(src)) * 38;
      B.path('ray' + src, `M${bx(src)} ${by(src)}L${bx(far) + dx} ${by(far) + dy}`, { color: k.accent, width: 7, op: 0.5 });
    }
    B.ring(cell, 1, k.hint);
    B.digit(cell, digit, { color: k.accent });
    B.shade(cell, k.success, 0.25);
  } else if (X.technique === 'x-wing') {
    const d = st.candidates[0].digit;
    const [a, b2, c3, d4] = st.patternCells;
    B.shadeUnit(st.units[0], k.hintSoft, 0.9);
    B.shadeUnit(st.units[1], k.hintSoft, 0.9);
    for (let c = 0; c < 81; c++) if (X.candidates[c].includes(d)) B.candidate(c, d, { color: st.patternCells.includes(c) ? k.hint : st.eliminations.some((e) => e.cell === c) ? k.eliminate : k.accent, weight: 800, scale: 1.45, center: 0.45 });
    for (const c of st.patternCells) B.ring(c, 1, k.hint);
    for (const e of st.eliminations) { B.strikeCand(e.cell, e.digit, 1); B.ring(e.cell, 1, k.eliminate); }
    B.path('rect', `M${bx(a)} ${by(a)}L${bx(b2)} ${by(b2)}L${bx(d4)} ${by(d4)}L${bx(c3)} ${by(c3)}Z`, { color: k.hint, width: 6, op: 0.6 });
  } else {
    const u = st.units[0];
    const inUnit = new Set(unitCells(u));
    B.shadeUnit(u, k.hintSoft, 0.9);
    for (let c = 0; c < 81; c++) for (const d of X.candidates[c]) B.candidate(c, d, { op: inUnit.has(c) ? 1 : 0.35 });
    for (const h of st.candidates) {
      if (h.role === 'pattern') B.candidate(h.cell, h.digit, { color: k.hint, weight: 800 });
      if (h.role === 'eliminate') { B.candidate(h.cell, h.digit, { color: k.eliminate, weight: 800 }); B.strikeCand(h.cell, h.digit, 1); }
    }
    for (const c of st.patternCells) B.ring(c, 1, k.hint);
  }
  B.end();
}

/** For static compositions: wait for images and fonts, then flag ready for the still renderer. */
export async function stillReady() {
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  await document.fonts.ready;
  window.__ready = true;
}
/** A real app capture inside a simple phone frame. Returns the element. */
export function phoneShot(parent, file, { x, y, h, theme = 'light' }) {
  const w = Math.round(((h - 28) * 1170) / 2532) + 28;
  const d = div('', parent);
  d.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${h * 0.045}px;background:#141A22;box-shadow:0 ${h * 0.03}px ${h * 0.06}px rgba(20,26,34,${theme === 'dark' ? 0.6 : 0.28}),0 0 0 2px #2E3946 inset`;
  d.innerHTML = `<img src="${file}" style="position:absolute;left:14px;top:14px;width:${w - 28}px;height:${h - 28}px;border-radius:${h * 0.036}px">`;
  return d;
}
