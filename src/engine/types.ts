/**
 * Core Sudoku engine types. The engine is pure TypeScript and must never import UI code.
 *
 * Conventions:
 * - A grid is a flat array of 81 numbers, row-major. 0 = empty, 1..9 = digit.
 * - Cell index i: row = floor(i / 9), col = i % 9, box = floor(row / 3) * 3 + floor(col / 3).
 * - Candidate sets are 9-bit masks: bit (d - 1) set means digit d is a candidate.
 */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Grid = number[];
export type CandidateMask = number;
export type Candidates = CandidateMask[];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export interface CellDigit {
  cell: number;
  digit: number;
}

export interface SolveResult {
  /** Number of solutions found, capped at the requested limit. */
  count: number;
  /** The first solution found, if any. */
  solution: Grid | null;
}

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
  seed: number;
  /** Hardest technique the logical solver needed (see techniques taxonomy). */
  hardestTechnique?: string;
  /** Numeric difficulty score from the classifier. */
  score?: number;
}
