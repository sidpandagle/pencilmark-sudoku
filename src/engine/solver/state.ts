import { ALL_UNITS, bit, computeCandidates, hasConflicts, PEERS } from '../grid';
import type { Step } from '../steps';
import type { Candidates, Grid } from '../types';

/**
 * Candidate-state model used by the logical solver: placed digits plus a candidate mask per cell.
 * Filled cells always have mask 0. Every technique detector reads a SolverState and never mutates it.
 */
export interface SolverState {
  grid: Grid;
  cands: Candidates;
  /**
   * True when uniqueness-based techniques (unique rectangles, BUG+1) may be used. They are only valid when
   * the position has exactly one solution.
   */
  unique: boolean;
}

/**
 * Build a solver state. Supplied candidates are intersected with the candidates implied by placed digits,
 * so a candidate that contradicts a placed digit can never survive. Filled cells get 0.
 */
export function createState(grid: Grid, candidates?: Candidates, unique = false): SolverState {
  const computed = computeCandidates(grid);
  const cands = candidates
    ? computed.map((m, i) => (grid[i] ? 0 : m & (candidates[i] ?? 0)))
    : computed;
  return { grid: grid.slice(), cands, unique };
}

export function cloneState(s: SolverState): SolverState {
  return { grid: s.grid.slice(), cands: s.cands.slice(), unique: s.unique };
}

/** Place a digit in place: set the cell and remove the digit from its peers' candidates. */
export function placeDigit(s: SolverState, cell: number, digit: number): void {
  s.grid[cell] = digit;
  s.cands[cell] = 0;
  const b = bit(digit);
  for (const p of PEERS[cell]) s.cands[p] &= ~b;
}

/** Return a new state with the step's placements and eliminations applied (the input is not modified). */
export function applyStep(s: SolverState, step: Step): SolverState {
  const next = cloneState(s);
  for (const e of step.eliminations) next.cands[e.cell] &= ~bit(e.digit);
  for (const p of step.placements) placeDigit(next, p.cell, p.digit);
  return next;
}

export const isSolvedState = (s: SolverState) => s.grid.every((v) => v !== 0);

/**
 * True when the state is visibly broken: duplicate digits, an empty cell with no candidates, or a unit where
 * an unplaced digit has nowhere to go. Detectors are never run on broken states.
 */
export function isBrokenState(s: SolverState): boolean {
  if (hasConflicts(s.grid)) return true;
  for (let c = 0; c < 81; c++) if (!s.grid[c] && s.cands[c] === 0) return true;
  for (const unit of ALL_UNITS) {
    let placed = 0;
    let possible = 0;
    for (const c of unit) {
      if (s.grid[c]) placed |= bit(s.grid[c]);
      else possible |= s.cands[c];
    }
    if ((placed | possible) !== 0x1ff) return true;
  }
  return false;
}
