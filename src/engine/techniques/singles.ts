import { ALL_UNITS, bit, cellName, computeCandidates, PEERS, singleDigit, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { Step } from '../steps';
import { cap, makeStep, UNIT_ORDER } from './util';

/** Full house: a unit with exactly one empty cell gets its missing digit. */
export function findFullHouse(s: SolverState): Step | null {
  for (const u of UNIT_ORDER) {
    let empty = -1;
    let count = 0;
    let used = 0;
    for (const c of ALL_UNITS[u]) {
      if (s.grid[c]) used |= bit(s.grid[c]);
      else {
        empty = c;
        count++;
      }
    }
    if (count !== 1) continue;
    const d = singleDigit(0x1ff & ~used);
    if (!d || !(s.cands[empty] & bit(d))) continue;
    return makeStep({
      technique: 'full-house',
      placements: [{ cell: empty, digit: d }],
      patternCells: [empty],
      supportCells: ALL_UNITS[u].filter((c) => c !== empty),
      units: [u],
      explanation: `${cap(unitName(u))} has only one empty cell left, so ${cellName(empty)} must be ${d}, the missing digit.`,
    });
  }
  return null;
}

/** Hidden single: a digit with only one possible cell in a unit. */
export function findHiddenSingle(s: SolverState): Step | null {
  for (const u of UNIT_ORDER) {
    const unit = ALL_UNITS[u];
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      let pos = -1;
      let n = 0;
      let placed = false;
      for (const c of unit) {
        if (s.grid[c] === d) {
          placed = true;
          break;
        }
        if (s.cands[c] & b) {
          n++;
          pos = c;
        }
      }
      if (placed || n !== 1) continue;
      // Support: for each other empty cell of the unit, one placed d that rules it out (when there is one).
      const support = new Set<number>();
      for (const c of unit) {
        if (c === pos || s.grid[c]) continue;
        const blocker = PEERS[c].find((p) => s.grid[p] === d && !unit.includes(p));
        if (blocker !== undefined) support.add(blocker);
      }
      return makeStep({
        technique: 'hidden-single',
        placements: [{ cell: pos, digit: d }],
        patternCells: [pos],
        supportCells: [...support],
        units: [u],
        explanation: `In ${unitName(u)}, ${d} can only go in ${cellName(pos)}, so ${cellName(pos)} = ${d}.`,
      });
    }
  }
  return null;
}

/** Naked single: a cell with exactly one candidate. */
export function findNakedSingle(s: SolverState): Step | null {
  let fromGrid: number[] | null = null;
  for (let c = 0; c < 81; c++) {
    if (s.grid[c]) continue;
    const d = singleDigit(s.cands[c]);
    if (!d) continue;
    fromGrid = fromGrid ?? computeCandidates(s.grid);
    const byDigitsOnly = singleDigit(fromGrid[c]) === d;
    const support = PEERS[c].filter((p) => s.grid[p] !== 0);
    return makeStep({
      technique: 'naked-single',
      placements: [{ cell: c, digit: d }],
      patternCells: [c],
      supportCells: byDigitsOnly ? support : [],
      explanation: byDigitsOnly
        ? `Every digit except ${d} already appears in the row, column or box of ${cellName(c)}, so ${cellName(c)} = ${d}.`
        : `${cellName(c)} has only one candidate left, ${d}, so ${cellName(c)} = ${d}.`,
    });
  }
  return null;
}
