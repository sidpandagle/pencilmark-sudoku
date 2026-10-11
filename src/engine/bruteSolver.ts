import { ALL_CANDIDATES, ALL_UNITS, bit, hasConflicts, PEERS, popcount, singleDigit } from './grid';
import { shuffle, type Rng } from './rng';
import type { Grid, SolveResult } from './types';

/**
 * Exhaustive backtracking solver with constraint propagation (naked + hidden singles)
 * and minimum-remaining-values branching. Used for validity and uniqueness checks,
 * never for teaching. Counts up to `limit` solutions (use 2 to test uniqueness).
 * Passing an rng randomises branch order, which the generator uses to build random grids.
 */
export function countSolutions(grid: Grid, limit = 2, rng?: Rng): SolveResult {
  if (!Array.isArray(grid) || grid.length !== 81 || hasConflicts(grid)) {
    return { count: 0, solution: null };
  }
  const values = grid.slice();
  const cands = new Array<number>(81).fill(0);
  for (let c = 0; c < 81; c++) {
    if (values[c]) continue;
    let used = 0;
    for (const p of PEERS[c]) if (values[p]) used |= bit(values[p]);
    cands[c] = ALL_CANDIDATES & ~used;
    if (cands[c] === 0) return { count: 0, solution: null };
  }
  let count = 0;
  let first: Grid | null = null;

  const search = (vals: number[], cs: number[]): boolean => {
    if (!propagate(vals, cs)) return false;
    let best = -1;
    let bestCount = 10;
    for (let c = 0; c < 81; c++) {
      if (vals[c]) continue;
      const n = popcount(cs[c]);
      if (n < bestCount) {
        bestCount = n;
        best = c;
        if (n === 2) break;
      }
    }
    if (best === -1) {
      count++;
      if (!first) first = vals.slice();
      return count >= limit;
    }
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) if (cs[best] & bit(d)) digits.push(d);
    if (rng) shuffle(rng, digits);
    for (const d of digits) {
      const v2 = vals.slice();
      const c2 = cs.slice();
      if (assign(v2, c2, best, d) && search(v2, c2)) return true;
    }
    return false;
  };

  search(values, cands);
  return { count, solution: first };
}

function assign(vals: number[], cs: number[], cell: number, d: number): boolean {
  vals[cell] = d;
  cs[cell] = 0;
  const b = bit(d);
  for (const p of PEERS[cell]) {
    if (vals[p] === d) return false;
    if (!vals[p] && cs[p] & b) {
      cs[p] &= ~b;
      if (cs[p] === 0) return false;
    }
  }
  return true;
}

/** Repeatedly apply naked and hidden singles. Returns false on contradiction. */
function propagate(vals: number[], cs: number[]): boolean {
  let changed = true;
  while (changed) {
    changed = false;
    for (let c = 0; c < 81; c++) {
      if (vals[c]) continue;
      if (cs[c] === 0) return false;
      const d = singleDigit(cs[c]);
      if (d) {
        if (!assign(vals, cs, c, d)) return false;
        changed = true;
      }
    }
    for (const unit of ALL_UNITS) {
      for (let d = 1; d <= 9; d++) {
        const b = bit(d);
        let place = -1;
        let n = 0;
        let placed = false;
        for (const c of unit) {
          if (vals[c] === d) {
            placed = true;
            break;
          }
          if (!vals[c] && cs[c] & b) {
            n++;
            place = c;
          }
        }
        if (placed) continue;
        if (n === 0) return false;
        if (n === 1) {
          if (!assign(vals, cs, place, d)) return false;
          changed = true;
        }
      }
    }
  }
  return true;
}

export function solve(grid: Grid): Grid | null {
  return countSolutions(grid, 1).solution;
}

export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2).count === 1;
}
