/**
 * Public engine API. UI code imports only from here (`src/engine`).
 *
 * The signatures of the original scaffold are a contract shared with the UI (additive changes only).
 * See docs/ENGINE.md for the architecture, technique list and difficulty rules.
 */
import { pickBankEntry } from './bank';
import { countSolutions } from './bruteSolver';
import { classifyDifficulty, ratePuzzle } from './difficulty';
import { generateFreshPuzzle } from './fresh';
import { bit, hasConflicts, isWellFormedGrid, PEERS } from './grid';
import { createRng, randomSeed, seedFromString } from './rng';
import { findNextStepFor, type FindStepOptions } from './solver/solve';
import { applyStep as applyStepToState, type SolverState } from './solver/state';
import type { Step, TechniqueId } from './steps';
import { techniqueInfo, TECHNIQUES } from './techniques/catalog';
import { applyTransform, randomTransform } from './transform';
import type { Candidates, Difficulty, GeneratedPuzzle, Grid } from './types';

export * from './types';
export * from './steps';
export * from './grid';
export * from './rng';
export { countSolutions, solve, hasUniqueSolution } from './bruteSolver';

// ---- additive exports ----
export { TECHNIQUES, techniqueInfo, techniqueRank } from './techniques/catalog';
export type { TechniqueInfo, TechniqueFamily } from './techniques/catalog';
export { solveLogically } from './solver/solve';
export type { LogicalSolveResult, SolveOptions, FindStepOptions } from './solver/solve';
export { createState as createSolverState, isBrokenState } from './solver/state';
export type { SolverState } from './solver/state';
export { validateStep, stateConsistent } from './solver/validate';
export { classifyDifficulty, ratePuzzle } from './difficulty';
export type { Rating } from './difficulty';
export { generateFreshPuzzle } from './fresh';
export { getHint, nudgeFor } from './hints';
export type { Hint } from './hints';
export { getTechniqueExamples } from './fixtures/techniqueExamples';
export { getPracticePuzzles } from './fixtures/practicePuzzles';
export { decodeCandidates, encodeCandidates } from './fixtures/types';
export type { TechniqueExample, PracticePuzzle } from './fixtures/types';
export { bankSize } from './bank';
export { randomTransform, applyTransform } from './transform';

/**
 * Instant (bank + validity-preserving transforms): a unique-solution puzzle of the requested difficulty.
 * A bank entry is chosen by the seed, then relabelled/shuffled with a random Sudoku symmetry, which keeps
 * the solution unique and the technique profile (difficulty, hardest technique, score) unchanged.
 */
export function generatePuzzle(difficulty: Difficulty, seed: number = randomSeed()): GeneratedPuzzle {
  const rng = createRng(seed);
  const picked = pickBankEntry(difficulty, rng);
  if (picked) {
    const puzzle = applyTransform(picked.puzzle, randomTransform(rng));
    const solved = countSolutions(puzzle, 2);
    if (solved.count === 1 && solved.solution) {
      return {
        puzzle,
        solution: solved.solution,
        difficulty,
        seed,
        hardestTechnique: picked.entry[2],
        score: picked.entry[1],
      };
    }
  }
  // Fallback (empty bank): slow fresh generation. Never mislabels a puzzle.
  const fresh = generateFreshPuzzle(difficulty, seed, 500);
  if (!fresh) throw new Error(`Could not generate a ${difficulty} puzzle.`);
  return { ...fresh, seed };
}

/** Daily difficulty by weekday of the date key: Mon/Tue easy, Wed/Thu medium, Fri/Sat hard, Sun expert. */
export function dailyDifficulty(dateKey: string): Difficulty {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return 'medium';
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  if (Number.isNaN(day)) return 'medium';
  return (['expert', 'easy', 'easy', 'medium', 'medium', 'hard', 'hard'] as const)[day];
}

/** Deterministic daily challenge for a local date key `YYYY-MM-DD`. Same date → same puzzle on every device. */
export function getDailyPuzzle(dateKey: string): GeneratedPuzzle {
  return generatePuzzle(dailyDifficulty(dateKey), seedFromString(`daily:${dateKey}`));
}

/**
 * Next logical step for the given position. When `candidates` is supplied it is used as the candidate
 * state (it is intersected with the candidates implied by placed digits; an empty cell with mask 0 is a
 * contradiction, so pass player notes through getHint instead). Otherwise candidates are computed from
 * placed digits. Returns null when no implemented technique applies (or the position is broken).
 * Uniqueness techniques are used only when the grid has exactly one solution (override with opts.uniqueness).
 */
export function findNextStep(grid: Grid, candidates?: Candidates, opts?: FindStepOptions): Step | null {
  if (!isWellFormedGrid(grid)) return null;
  return findNextStepFor(grid, candidates, opts);
}

/** Apply a step to a solver state (returns a new state). */
export function applyStep(state: SolverState, step: Step): SolverState {
  return applyStepToState(state, step);
}

/**
 * Apply a step to a plain grid + candidate masks (returns new arrays): placements fill cells and clear that
 * digit from peers; eliminations clear candidate bits.
 */
export function applyStepToGrid(grid: Grid, candidates: Candidates, step: Step): { grid: Grid; candidates: Candidates } {
  const g = grid.slice();
  const c = candidates.slice();
  for (const e of step.eliminations) c[e.cell] &= ~bit(e.digit);
  for (const p of step.placements) {
    g[p.cell] = p.digit;
    c[p.cell] = 0;
    for (const q of PEERS[p.cell]) c[q] &= ~bit(p.digit);
  }
  return { grid: g, candidates: c };
}

export interface PuzzleAnalysis {
  /** 'invalid': conflicting givens; 'unsolvable': no solution; 'multiple': >1 solution; 'unique': exactly one. */
  status: 'invalid' | 'unsolvable' | 'multiple' | 'unique';
  solution: Grid | null;
  clueCount: number;
  /** Present when unique AND the logical solver solved it with implemented techniques. */
  difficulty?: Difficulty;
  hardestTechnique?: TechniqueId;
  score?: number;
  /** True when unique but the logical solver got stuck (beyond implemented techniques). */
  beyondTechniques?: boolean;
}

/** Validate and classify an arbitrary (e.g. imported) puzzle. Never throws for 81-length 0..9 grids. */
export function analyzePuzzle(grid: Grid): PuzzleAnalysis {
  if (!isWellFormedGrid(grid)) return { status: 'invalid', solution: null, clueCount: 0 };
  const clueCount = grid.filter(Boolean).length;
  if (hasConflicts(grid)) return { status: 'invalid', solution: null, clueCount };
  const r = countSolutions(grid, 2);
  if (r.count === 0) return { status: 'unsolvable', solution: null, clueCount };
  if (r.count > 1) return { status: 'multiple', solution: null, clueCount };
  const rating = ratePuzzle(grid, true);
  const out: PuzzleAnalysis = { status: 'unique', solution: r.solution, clueCount };
  if (rating.solved) {
    out.difficulty = rating.difficulty ?? classifyDifficulty(rating.hardestTechnique);
    if (rating.hardestTechnique) out.hardestTechnique = rating.hardestTechnique;
    out.score = rating.score;
    out.beyondTechniques = false;
  } else {
    out.beyondTechniques = true;
  }
  return out;
}

/** Human-readable technique name for display (e.g. 'x-wing' → 'X-Wing'). */
export function techniqueName(id: TechniqueId): string {
  try {
    return techniqueInfo(id).name;
  } catch {
    return id;
  }
}

export const isSolvable = (grid: Grid) => countSolutions(grid, 1).count === 1;

/** All technique ids in solver order (easiest first). */
export const TECHNIQUE_IDS: readonly TechniqueId[] = TECHNIQUES.map((t) => t.id);

