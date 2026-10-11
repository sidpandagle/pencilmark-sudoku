import { ALL_UNITS, bit, BOXES, boxOf, cellName, COLS, colOf, PEERS, ROWS, rowOf, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { ChainLink, HighlightCandidate, Step, TechniqueId } from '../steps';
import type { CellDigit } from '../types';

/** SEES[a * 81 + b] = 1 when cells a and b are distinct and share a row, column or box. */
export const SEES: Uint8Array = (() => {
  const m = new Uint8Array(81 * 81);
  for (let a = 0; a < 81; a++) for (const b of PEERS[a]) m[a * 81 + b] = 1;
  return m;
})();
export const see = (a: number, b: number) => SEES[a * 81 + b] === 1;

/** Unit search order used for learner-friendly results: boxes first, then rows, then columns. */
export const UNIT_ORDER: readonly number[] = [18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export const rowUnit = (cell: number) => rowOf(cell);
export const colUnit = (cell: number) => 9 + colOf(cell);
export const boxUnit = (cell: number) => 18 + boxOf(cell);
export const unitsOf = (cell: number) => [rowUnit(cell), colUnit(cell), boxUnit(cell)];
export { ROWS, COLS, BOXES, ALL_UNITS };

/** Units (indices 0-26) that contain every given cell. */
export function commonUnits(cells: number[]): number[] {
  if (cells.length === 0) return [];
  return unitsOf(cells[0]).filter((u) => cells.every((c) => ALL_UNITS[u].includes(c)));
}

/** Empty cells (other than the given ones) holding `digit` that see every given cell. */
export function cellsSeeingAll(s: SolverState, cells: number[], digit: number): number[] {
  const b = bit(digit);
  const out: number[] = [];
  if (cells.length === 0) return out;
  for (const p of PEERS[cells[0]]) {
    if (!(s.cands[p] & b)) continue;
    if (cells.includes(p)) continue;
    let ok = true;
    for (let i = 1; i < cells.length; i++) if (!see(p, cells[i])) { ok = false; break; }
    if (ok) out.push(p);
  }
  return out.sort((x, y) => x - y);
}

/** Cells in `unit` whose candidates include `digit`. */
export function positions(s: SolverState, unit: number, digit: number): number[] {
  const b = bit(digit);
  const out: number[] = [];
  for (const c of ALL_UNITS[unit]) if (s.cands[c] & b) out.push(c);
  return out;
}

export function digitPlacedIn(s: SolverState, unit: number, digit: number): boolean {
  for (const c of ALL_UNITS[unit]) if (s.grid[c] === digit) return true;
  return false;
}

/** Visit every k-combination of `items`; stop early when the callback returns true. */
export function forEachCombo<T>(items: readonly T[], k: number, cb: (combo: T[]) => boolean | void): boolean {
  const combo: T[] = [];
  const rec = (start: number): boolean => {
    if (combo.length === k) return cb(combo.slice()) === true;
    for (let i = start; i <= items.length - (k - combo.length); i++) {
      combo.push(items[i]);
      if (rec(i + 1)) return true;
      combo.pop();
    }
    return false;
  };
  return rec(0);
}

// ---------- text helpers ----------

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
export function joinOr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
}
export const cellsText = (cells: number[]) => joinAnd([...cells].sort((a, b) => a - b).map(cellName));
export const digitsText = (digits: number[]) => joinAnd([...digits].sort((a, b) => a - b).map(String));
export const digitsSetText = (digits: number[]) => `{${[...digits].sort((a, b) => a - b).join(',')}}`;
export const unitsText = (units: number[]) => joinAnd(units.map(unitName));
export const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export const nodeText = (n: CellDigit) => `${n.digit}${cellName(n.cell)}`;

/** Describe a list of eliminations compactly, e.g. "7 from r1c2 and r1c5" or "r2c3 ≠ 4, r5c5 ≠ 6". */
export function elimText(elims: CellDigit[]): string {
  const digits = [...new Set(elims.map((e) => e.digit))];
  if (digits.length === 1) return `${digits[0]} from ${cellsText(elims.map((e) => e.cell))}`;
  const cells = [...new Set(elims.map((e) => e.cell))];
  if (cells.length === 1) return `${digitsText(elims.map((e) => e.digit))} from ${cellName(cells[0])}`;
  const byDigit = digits.sort((a, b) => a - b).map((d) => `${d} from ${cellsText(elims.filter((e) => e.digit === d).map((e) => e.cell))}`);
  return joinAnd(byDigit);
}

// ---------- step construction ----------

export interface StepInput {
  technique: TechniqueId;
  placements?: CellDigit[];
  eliminations?: CellDigit[];
  patternCells: number[];
  supportCells?: number[];
  units?: number[];
  candidates?: HighlightCandidate[];
  links?: ChainLink[];
  explanation: string;
}

const uniqSort = (cells: number[]) => [...new Set(cells)].sort((a, b) => a - b);

function dedupeCD(list: CellDigit[]): CellDigit[] {
  const seen = new Set<number>();
  const out: CellDigit[] = [];
  for (const x of list) {
    const k = x.cell * 10 + x.digit;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ cell: x.cell, digit: x.digit });
  }
  return out.sort((a, b) => a.cell - b.cell || a.digit - b.digit);
}

/** Build a Step, deduplicating lists and adding 'place' / 'eliminate' candidate highlights automatically. */
export function makeStep(p: StepInput): Step {
  const placements = dedupeCD(p.placements ?? []);
  const eliminations = dedupeCD(p.eliminations ?? []);
  const effect = new Set<number>([...placements, ...eliminations].map((x) => x.cell * 10 + x.digit));
  const candidates: HighlightCandidate[] = [];
  const seen = new Set<string>();
  for (const h of p.candidates ?? []) {
    const key = `${h.cell}:${h.digit}:${h.role}`;
    if (seen.has(key) || effect.has(h.cell * 10 + h.digit)) continue;
    seen.add(key);
    candidates.push({ cell: h.cell, digit: h.digit, role: h.role });
  }
  for (const x of placements) candidates.push({ ...x, role: 'place' });
  for (const x of eliminations) candidates.push({ ...x, role: 'eliminate' });
  const step: Step = {
    technique: p.technique,
    placements,
    eliminations,
    patternCells: uniqSort(p.patternCells),
    candidates,
    explanation: p.explanation,
  };
  if (p.supportCells && p.supportCells.length) step.supportCells = uniqSort(p.supportCells);
  if (p.units && p.units.length) step.units = [...new Set(p.units)];
  if (p.links && p.links.length) step.links = p.links;
  return step;
}

/** Keep only eliminations of candidates that are currently present (so every step makes progress). */
export function liveElims(s: SolverState, elims: CellDigit[]): CellDigit[] {
  return dedupeCD(elims.filter((e) => !s.grid[e.cell] && (s.cands[e.cell] & bit(e.digit)) !== 0));
}

export const patternHighlights = (s: SolverState, cells: number[], digitMask: number, role: HighlightCandidate['role'] = 'pattern'): HighlightCandidate[] => {
  const out: HighlightCandidate[] = [];
  for (const c of cells) for (let d = 1; d <= 9; d++) if (s.cands[c] & digitMask & bit(d)) out.push({ cell: c, digit: d, role });
  return out;
};

/** Fast check: is there an empty cell other than a and b, holding `digit`, that sees both a and b? */
export function anySeesBoth(s: SolverState, a: number, b: number, digit: number, skip1 = -1, skip2 = -1): boolean {
  const m = bit(digit);
  for (const p of PEERS[a]) if (p !== b && p !== skip1 && p !== skip2 && s.cands[p] & m && SEES[p * 81 + b]) return true;
  return false;
}
