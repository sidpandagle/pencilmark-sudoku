import type { CandidateMask, Candidates, Grid } from './types';

export const ALL_CANDIDATES: CandidateMask = 0x1ff;

export const rowOf = (cell: number) => Math.floor(cell / 9);
export const colOf = (cell: number) => cell % 9;
export const boxOf = (cell: number) => Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);
export const cellAt = (row: number, col: number) => row * 9 + col;

/** Human-friendly cell name, e.g. r1c1 for cell 0 (1-based rows and columns). */
export const cellName = (cell: number) => `r${rowOf(cell) + 1}c${colOf(cell) + 1}`;

function buildUnits(): { rows: number[][]; cols: number[][]; boxes: number[][] } {
  const rows: number[][] = [];
  const cols: number[][] = [];
  const boxes: number[][] = [];
  for (let i = 0; i < 9; i++) {
    rows.push([]);
    cols.push([]);
    boxes.push([]);
  }
  for (let c = 0; c < 81; c++) {
    rows[rowOf(c)].push(c);
    cols[colOf(c)].push(c);
    boxes[boxOf(c)].push(c);
  }
  return { rows, cols, boxes };
}

const units = buildUnits();
export const ROWS: readonly number[][] = units.rows;
export const COLS: readonly number[][] = units.cols;
export const BOXES: readonly number[][] = units.boxes;
/** All 27 units: rows 0-8, cols 9-17, boxes 18-26. */
export const ALL_UNITS: readonly number[][] = [...units.rows, ...units.cols, ...units.boxes];

export type UnitKind = 'row' | 'col' | 'box';
export const unitKind = (unitIndex: number): UnitKind =>
  unitIndex < 9 ? 'row' : unitIndex < 18 ? 'col' : 'box';
export const unitName = (unitIndex: number): string => {
  const kind = unitKind(unitIndex);
  const n = (unitIndex % 9) + 1;
  return kind === 'row' ? `row ${n}` : kind === 'col' ? `column ${n}` : `box ${n}`;
};

/** For each cell, the 20 distinct peer cells sharing a row, column or box. */
export const PEERS: readonly number[][] = Array.from({ length: 81 }, (_, cell) => {
  const set = new Set<number>([...ROWS[rowOf(cell)], ...COLS[colOf(cell)], ...BOXES[boxOf(cell)]]);
  set.delete(cell);
  return [...set];
});

export const sees = (a: number, b: number) =>
  a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

export const bit = (digit: number): CandidateMask => 1 << (digit - 1);
export const hasCandidate = (mask: CandidateMask, digit: number) => (mask & bit(digit)) !== 0;

export function popcount(mask: CandidateMask): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

export function maskToDigits(mask: CandidateMask): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d);
  return out;
}

export function digitsToMask(digits: Iterable<number>): CandidateMask {
  let m = 0;
  for (const d of digits) m |= bit(d);
  return m;
}

/** The digit of a one-candidate mask, or 0 if the mask has zero or several candidates. */
export function singleDigit(mask: CandidateMask): number {
  if (mask === 0 || (mask & (mask - 1)) !== 0) return 0;
  return Math.round(Math.log2(mask)) + 1;
}

export const emptyGrid = (): Grid => new Array(81).fill(0);
export const cloneGrid = (g: Grid): Grid => g.slice();

export class PuzzleParseError extends Error {}

/**
 * Parse an 81-cell puzzle string. Accepts digits 1-9 for givens and 0 . _ * for empties.
 * Whitespace and grid separators (| - + = , ; :) are ignored. Throws PuzzleParseError on bad input.
 */
export function parseGrid(text: string): Grid {
  if (typeof text !== 'string') throw new PuzzleParseError('Puzzle must be text.');
  if (text.length > 2000) throw new PuzzleParseError('Puzzle text is too long.');
  const cells: number[] = [];
  for (const ch of text) {
    if (ch >= '1' && ch <= '9') cells.push(ch.charCodeAt(0) - 48);
    else if (ch === '0' || ch === '.' || ch === '_' || ch === '*') cells.push(0);
    else if (/[\s|+\-=,;:]/.test(ch)) continue;
    else throw new PuzzleParseError(`Unexpected character "${ch}".`);
    if (cells.length > 81) break;
  }
  if (cells.length !== 81) {
    throw new PuzzleParseError(`Expected 81 cells, found ${cells.length > 81 ? 'more than 81' : cells.length}.`);
  }
  return cells;
}

export function serializeGrid(g: Grid, empty = '.'): string {
  return g.map((v) => (v >= 1 && v <= 9 ? String(v) : empty)).join('');
}

export function isWellFormedGrid(g: unknown): g is Grid {
  return (
    Array.isArray(g) && g.length === 81 && g.every((v) => Number.isInteger(v) && v >= 0 && v <= 9)
  );
}

/** Cells whose digit duplicates another digit in a shared unit. */
export function findConflicts(g: Grid): Set<number> {
  const conflicts = new Set<number>();
  for (const unit of ALL_UNITS) {
    const seen = new Map<number, number>();
    for (const c of unit) {
      const v = g[c];
      if (!v) continue;
      const prev = seen.get(v);
      if (prev !== undefined) {
        conflicts.add(prev);
        conflicts.add(c);
      } else seen.set(v, c);
    }
  }
  return conflicts;
}

export const hasConflicts = (g: Grid) => findConflicts(g).size > 0;

/** True if every cell is filled and no unit contains a duplicate. */
export function isCompleteAndValid(g: Grid): boolean {
  return g.length === 81 && g.every((v) => v >= 1 && v <= 9) && !hasConflicts(g);
}

/** Candidates implied purely by placed digits (no advanced eliminations). Filled cells get 0. */
export function computeCandidates(g: Grid): Candidates {
  const cands: Candidates = new Array(81).fill(0);
  for (let c = 0; c < 81; c++) {
    if (g[c]) continue;
    let used = 0;
    for (const p of PEERS[c]) if (g[p]) used |= bit(g[p]);
    cands[c] = ALL_CANDIDATES & ~used;
  }
  return cands;
}
