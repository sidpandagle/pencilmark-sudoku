import { ALL_UNITS } from './grid';
import { createRng, randomInt, shuffle, type Rng } from './rng';
import type { Step } from './steps';
import type { Grid } from './types';

/**
 * Validity-preserving grid transform (a Sudoku symmetry): digit relabelling, row swaps within bands, column
 * swaps within stacks, band swaps, stack swaps and transposition. Every row/column/box maps onto a
 * row/column/box, so solutions, uniqueness and every technique pattern map onto equivalent ones.
 */
export interface GridTransform {
  /** cellMap[newCell] = oldCell. */
  cellMap: number[];
  /** digitMap[oldDigit] = newDigit (index 0 maps 0 → 0). */
  digitMap: number[];
}

function linePermutation(rng: Rng): number[] {
  const groups = shuffle(rng, [0, 1, 2]);
  const out: number[] = [];
  for (const g of groups) for (const i of shuffle(rng, [0, 1, 2])) out.push(g * 3 + i);
  return out;
}

export function randomTransform(rng: Rng | number): GridTransform {
  const r = typeof rng === 'number' ? createRng(rng) : rng;
  const rowPerm = linePermutation(r);
  const colPerm = linePermutation(r);
  const transpose = randomInt(r, 2) === 1;
  const digits = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const digitMap = [0, ...digits];
  const cellMap: number[] = new Array(81);
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++) {
      const [sr, sc] = transpose ? [col, row] : [row, col];
      cellMap[row * 9 + col] = rowPerm[sr] * 9 + colPerm[sc];
    }
  return { cellMap, digitMap };
}

export function applyTransform(grid: Grid, t: GridTransform): Grid {
  return t.cellMap.map((old) => t.digitMap[grid[old]]);
}

/** Map a candidate-mask array through a transform. */
export function transformCandidates(cands: number[], t: GridTransform): number[] {
  return t.cellMap.map((old) => {
    let m = 0;
    for (let d = 1; d <= 9; d++) if (cands[old] & (1 << (d - 1))) m |= 1 << (t.digitMap[d] - 1);
    return m;
  });
}

/** Map a step through a transform (used to prove technique-profile invariance in tests). */
export function transformStep(step: Step, t: GridTransform): Step {
  const inv: number[] = new Array(81);
  t.cellMap.forEach((old, nw) => (inv[old] = nw));
  const cd = <T extends { cell: number; digit: number }>(x: T): T => ({ ...x, cell: inv[x.cell], digit: t.digitMap[x.digit] });
  const mapUnit = (u: number) => {
    const cells = ALL_UNITS[u].map((c) => inv[c]);
    return ALL_UNITS.findIndex((unit) => cells.every((c) => unit.includes(c)));
  };
  return {
    ...step,
    placements: step.placements.map(cd),
    eliminations: step.eliminations.map(cd),
    patternCells: step.patternCells.map((c) => inv[c]),
    supportCells: step.supportCells?.map((c) => inv[c]),
    units: step.units?.map(mapUnit),
    candidates: step.candidates.map(cd),
    links: step.links?.map((l) => ({ ...l, from: cd(l.from), to: cd(l.to) })),
  };
}
