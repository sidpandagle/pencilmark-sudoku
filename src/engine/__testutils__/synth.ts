import { ALL_UNITS, bit, cellAt, digitsToMask } from '../grid';
import type { SolverState } from '../solver/state';
import type { Step } from '../steps';
import type { CellDigit } from '../types';

/** 1-based cell index helper: rc(1, 1) = 0. */
export const rc = (r: number, c: number) => cellAt(r - 1, c - 1);
export const row = (r: number) => r - 1;
export const col = (c: number) => 8 + c;
export const box = (b: number) => 17 + b;

/**
 * Synthetic candidate state for detector unit tests: an empty grid where every cell starts with all nine
 * candidates. Tests then carve out exactly the pattern they need, so the expected result can be verified by hand.
 */
export function synth(unique = false): SolverState {
  return { grid: new Array(81).fill(0), cands: new Array(81).fill(0x1ff), unique };
}

export function setCands(s: SolverState, cell: number, digits: number[]): void {
  s.cands[cell] = digitsToMask(digits);
}

/** Remove digit d from every cell of the unit except `keep`. */
export function restrict(s: SolverState, unit: number, d: number, keep: number[]): void {
  for (const c of ALL_UNITS[unit]) if (!keep.includes(c)) s.cands[c] &= ~bit(d);
}

export const cd = (cell: number, digit: number): CellDigit => ({ cell, digit });

const key = (x: CellDigit) => `${x.cell}:${x.digit}`;
export const sortCD = (xs: CellDigit[]) => [...xs].map(key).sort();

export function expectElims(step: Step | null, expected: CellDigit[]): void {
  expect(step).not.toBeNull();
  expect(sortCD(step!.eliminations)).toEqual(sortCD(expected));
  expect(step!.placements).toEqual([]);
}

export function expectPlacement(step: Step | null, expected: CellDigit): void {
  expect(step).not.toBeNull();
  expect(step!.placements).toEqual([expected]);
  expect(step!.eliminations).toEqual([]);
}
