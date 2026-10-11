import { ALL_UNITS, bit, maskToDigits, popcount, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { Step, TechniqueId } from '../steps';
import type { CellDigit } from '../types';
import {
  cellsText,
  commonUnits,
  digitPlacedIn,
  digitsSetText,
  digitsText,
  elimText,
  forEachCombo,
  liveElims,
  makeStep,
  patternHighlights,
  positions,
  UNIT_ORDER,
} from './util';

const NAKED: Record<number, TechniqueId> = { 2: 'naked-pair', 3: 'naked-triple', 4: 'naked-quad' };
const HIDDEN: Record<number, TechniqueId> = { 2: 'hidden-pair', 3: 'hidden-triple', 4: 'hidden-quad' };
const WORD: Record<number, string> = { 2: 'pair', 3: 'triple', 4: 'quad' };

/**
 * Naked subset of size n: n cells of one unit whose candidates together are exactly n digits. Those digits
 * are removed from every other cell of every unit shared by the n cells.
 */
export function findNakedSubset(s: SolverState, n: number): Step | null {
  let result: Step | null = null;
  for (const u of UNIT_ORDER) {
    const empties = ALL_UNITS[u].filter((c) => !s.grid[c]);
    if (empties.length <= n) continue;
    const pool = empties.filter((c) => {
      const k = popcount(s.cands[c]);
      return k >= 2 && k <= n;
    });
    if (pool.length < n) continue;
    const found = forEachCombo(pool, n, (cells) => {
      let mask = 0;
      for (const c of cells) mask |= s.cands[c];
      if (popcount(mask) !== n) return false;
      const units = commonUnits(cells);
      const digits = maskToDigits(mask);
      const elims: CellDigit[] = [];
      for (const cu of units)
        for (const c of ALL_UNITS[cu]) if (!cells.includes(c)) for (const d of digits) elims.push({ cell: c, digit: d });
      const live = liveElims(s, elims);
      if (!live.length) return false;
      const unitsUsed = units.filter((cu) => live.some((e) => ALL_UNITS[cu].includes(e.cell)));
      result = makeStep({
        technique: NAKED[n],
        eliminations: live,
        patternCells: cells,
        units: unitsUsed,
        candidates: patternHighlights(s, cells, mask),
        explanation: `In ${unitName(u)}, ${cellsText(cells)} contain only the candidates ${digitsSetText(digits)}, a naked ${WORD[n]}, so those digits must go in these cells. Remove ${elimText(live)}.`,
      });
      return true;
    });
    if (found) return result;
  }
  return null;
}

/**
 * Hidden subset of size n: n digits of one unit that can only go in the same n cells. All other candidates
 * are removed from those cells.
 */
export function findHiddenSubset(s: SolverState, n: number): Step | null {
  let result: Step | null = null;
  for (const u of UNIT_ORDER) {
    const unit = ALL_UNITS[u];
    const empties = unit.filter((c) => !s.grid[c]);
    if (empties.length <= n) continue;
    const digitPos = new Map<number, number[]>();
    for (let d = 1; d <= 9; d++) {
      if (digitPlacedIn(s, u, d)) continue;
      const pos = positions(s, u, d);
      if (pos.length >= 2 && pos.length <= n) digitPos.set(d, pos);
    }
    const pool = [...digitPos.keys()];
    if (pool.length < n) continue;
    const found = forEachCombo(pool, n, (digits) => {
      const cellSet = new Set<number>();
      for (const d of digits) for (const c of digitPos.get(d)!) cellSet.add(c);
      if (cellSet.size !== n) return false;
      const cells = [...cellSet].sort((a, b) => a - b);
      let mask = 0;
      for (const d of digits) mask |= bit(d);
      const elims: CellDigit[] = [];
      for (const c of cells) for (const d of maskToDigits(s.cands[c] & ~mask)) elims.push({ cell: c, digit: d });
      const live = liveElims(s, elims);
      if (!live.length) return false;
      result = makeStep({
        technique: HIDDEN[n],
        eliminations: live,
        patternCells: cells,
        units: [u],
        candidates: patternHighlights(s, cells, mask),
        explanation: `In ${unitName(u)}, the digits ${digitsText(digits)} can only go in ${cellsText(cells)}, a hidden ${WORD[n]}. So these cells cannot hold anything else: remove ${elimText(live)}.`,
      });
      return true;
    });
    if (found) return result;
  }
  return null;
}

export const findNakedPair = (s: SolverState) => findNakedSubset(s, 2);
export const findNakedTriple = (s: SolverState) => findNakedSubset(s, 3);
export const findNakedQuad = (s: SolverState) => findNakedSubset(s, 4);
export const findHiddenPair = (s: SolverState) => findHiddenSubset(s, 2);
export const findHiddenTriple = (s: SolverState) => findHiddenSubset(s, 3);
export const findHiddenQuad = (s: SolverState) => findHiddenSubset(s, 4);
