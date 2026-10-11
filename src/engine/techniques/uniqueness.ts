import { bit, boxOf, cellAt, cellName, maskToDigits, popcount, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { HighlightCandidate, Step } from '../steps';
import type { CellDigit } from '../types';
import { cellsSeeingAll, cellsText, commonUnits, digitsSetText, liveElims, makeStep, positions } from './util';

/*
 * Uniqueness techniques assume the position has exactly one solution. They are only run when
 * `state.unique` is true (the solver checks this with the brute-force counter before enabling them).
 *
 * A "deadly pattern" is four empty cells at the corners of a rectangle spanning exactly two rows, two
 * columns and two boxes, all able to hold only {a,b}. If the final solution had such a pattern, swapping a and
 * b in the four cells would give a second solution, so in a unique puzzle at least one corner holds something
 * other than a or b.
 */

interface Rect {
  cells: [number, number, number, number]; // r1c1, r1c2, r2c1, r2c2
  a: number;
  b: number;
}

function* rectangles(s: SolverState): Generator<Rect> {
  for (let r1 = 0; r1 < 9; r1++)
    for (let r2 = r1 + 1; r2 < 9; r2++)
      for (let c1 = 0; c1 < 9; c1++)
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells: [number, number, number, number] = [cellAt(r1, c1), cellAt(r1, c2), cellAt(r2, c1), cellAt(r2, c2)];
          if (cells.some((c) => s.grid[c])) continue;
          const boxes = new Set(cells.map(boxOf));
          if (boxes.size !== 2) continue;
          const common = s.cands[cells[0]] & s.cands[cells[1]] & s.cands[cells[2]] & s.cands[cells[3]];
          if (popcount(common) < 2) continue;
          const ds = maskToDigits(common);
          for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) yield { cells, a: ds[i], b: ds[j] };
        }
}

const urHighlights = (cells: number[], a: number, b: number): HighlightCandidate[] =>
  cells.flatMap((c) => [
    { cell: c, digit: a, role: 'pattern' as const },
    { cell: c, digit: b, role: 'pattern' as const },
  ]);

/** Unique rectangle type 1: three corners are exactly {a,b}; the fourth cannot be a or b. */
export function findUniqueRectangle1(s: SolverState): Step | null {
  if (!s.unique) return null;
  for (const { cells, a, b } of rectangles(s)) {
    const ab = bit(a) | bit(b);
    const extra = cells.filter((c) => s.cands[c] !== ab);
    if (extra.length !== 1) continue;
    const target = extra[0];
    const live = liveElims(s, [{ cell: target, digit: a }, { cell: target, digit: b }]);
    if (!live.length) continue;
    const floor = cells.filter((c) => c !== target);
    return makeStep({
      technique: 'unique-rectangle-1',
      eliminations: live,
      patternCells: [...cells],
      candidates: urHighlights(floor, a, b),
      explanation: `Unique rectangle: ${cellsText(floor)} can only be ${digitsSetText([a, b])}. If ${cellName(target)} were also ${a} or ${b}, the four corners could swap ${a} and ${b} and the puzzle would have two solutions, so remove ${digitsSetText(live.map((e) => e.digit))} from ${cellName(target)}.`,
    });
  }
  return null;
}

/** Floor = two corners that are exactly {a,b} and share a row or column; roof = the other two corners. */
function floorAndRoof(s: SolverState, cells: number[], ab: number): { floor: number[]; roof: number[] } | null {
  const floor = cells.filter((c) => s.cands[c] === ab);
  if (floor.length !== 2) return null;
  const roof = cells.filter((c) => s.cands[c] !== ab);
  if (commonUnits(floor).length === 0) return null; // diagonal floor: not handled
  return { floor, roof };
}

/**
 * Unique rectangle type 2: floor corners are exactly {a,b}; both roof corners are {a,b,x} with the same single
 * extra x. One roof corner must be x, so x is removed from cells that see both roof corners.
 */
export function findUniqueRectangle2(s: SolverState): Step | null {
  if (!s.unique) return null;
  for (const { cells, a, b } of rectangles(s)) {
    const ab = bit(a) | bit(b);
    const fr = floorAndRoof(s, cells, ab);
    if (!fr) continue;
    const { floor, roof } = fr;
    if (s.cands[roof[0]] !== s.cands[roof[1]]) continue;
    const xm = s.cands[roof[0]] & ~ab;
    if (popcount(xm) !== 1) continue;
    const x = maskToDigits(xm)[0];
    const live = liveElims(s, cellsSeeingAll(s, roof, x).map((c) => ({ cell: c, digit: x })));
    if (!live.length) continue;
    return makeStep({
      technique: 'unique-rectangle-2',
      eliminations: live,
      patternCells: [...cells],
      candidates: [...urHighlights(cells, a, b), ...roof.map((c) => ({ cell: c, digit: x, role: 'color-a' as const }))],
      explanation: `Unique rectangle type 2: ${cellsText(floor)} are exactly ${digitsSetText([a, b])} and ${cellsText(roof)} are ${digitsSetText([a, b, x])}. To avoid two solutions one of ${cellsText(roof)} must be ${x}, so remove ${x} from ${cellsText(live.map((e) => e.cell))}, which see${live.length > 1 ? '' : 's'} both.`,
    });
  }
  return null;
}

/**
 * Unique rectangle type 4: floor corners are exactly {a,b}; in a unit containing both roof corners, a can only
 * go in the roof corners, so one roof corner is a and neither can be b (that would complete the deadly pattern).
 */
export function findUniqueRectangle4(s: SolverState): Step | null {
  if (!s.unique) return null;
  for (const { cells, a, b } of rectangles(s)) {
    const ab = bit(a) | bit(b);
    const fr = floorAndRoof(s, cells, ab);
    if (!fr) continue;
    const { floor, roof } = fr;
    for (const [lock, gone] of [[a, b], [b, a]]) {
      const unit = commonUnits(roof).find((u) => {
        const pos = positions(s, u, lock);
        return pos.length === 2 && roof.every((c) => pos.includes(c));
      });
      if (unit === undefined) continue;
      const elims: CellDigit[] = roof.map((c) => ({ cell: c, digit: gone }));
      const live = liveElims(s, elims);
      if (!live.length) continue;
      return makeStep({
        technique: 'unique-rectangle-4',
        eliminations: live,
        patternCells: [...cells],
        units: [unit],
        candidates: [...urHighlights(floor, a, b), ...roof.map((c) => ({ cell: c, digit: lock, role: 'pattern' as const }))],
        explanation: `Unique rectangle type 4: ${cellsText(floor)} are exactly ${digitsSetText([a, b])}, and in ${unitName(unit)} ${lock} can only go in ${cellsText(roof)}. One of them is ${lock}, so neither can be ${gone} without creating two solutions: remove ${gone} from ${cellsText(live.map((e) => e.cell))}.`,
      });
    }
  }
  return null;
}

/**
 * BUG+1 (bivalue universal grave + 1): every empty cell has two candidates except one cell with three, and
 * every candidate appears exactly twice in each unit except one digit appearing three times in that cell's
 * row, column and box. A position with only bivalue cells like this would have zero or several solutions, so
 * in a unique puzzle the triple cell must take that extra digit.
 */
export function findBugPlusOne(s: SolverState): Step | null {
  if (!s.unique) return null;
  let tri = -1;
  for (let c = 0; c < 81; c++) {
    if (s.grid[c]) continue;
    const k = popcount(s.cands[c]);
    if (k === 2) continue;
    if (k === 3 && tri === -1) tri = c;
    else return null;
  }
  if (tri === -1) return null;
  const triUnits = [Math.floor(tri / 9), 9 + (tri % 9), 18 + boxOf(tri)];
  let extra = 0;
  for (const d of maskToDigits(s.cands[tri])) {
    if (triUnits.every((u) => positions(s, u, d).length === 3)) {
      if (extra) return null;
      extra = d;
    }
  }
  if (!extra) return null;
  // Strict BUG check: every other unit/digit count is 0 or 2; the extra digit's tri-cell units have 3.
  for (let u = 0; u < 27; u++)
    for (let d = 1; d <= 9; d++) {
      const n = positions(s, u, d).length;
      const expected3 = d === extra && triUnits.includes(u);
      if (expected3 ? n !== 3 : n !== 0 && n !== 2) return null;
    }
  return makeStep({
    technique: 'bug-plus-one',
    placements: [{ cell: tri, digit: extra }],
    patternCells: [tri],
    units: triUnits,
    candidates: maskToDigits(s.cands[tri])
      .filter((d) => d !== extra)
      .map((d) => ({ cell: tri, digit: d, role: 'pattern' as const })),
    explanation: `BUG+1: every empty cell has two candidates except ${cellName(tri)}, and ${extra} appears three times in its row, column and box. Without ${extra} there, the grid would be a deadly pattern with no unique solution, so ${cellName(tri)} = ${extra}.`,
  });
}
