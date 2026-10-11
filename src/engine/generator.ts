import { countSolutions } from './bruteSolver';
import { emptyGrid } from './grid';
import { createRng, randomSeed, shuffle, type Rng } from './rng';
import type { Grid } from './types';

/** Build a random, fully solved valid grid. */
export function generateSolvedGrid(rng: Rng): Grid {
  const result = countSolutions(emptyGrid(), 1, rng);
  if (!result.solution) throw new Error('Failed to generate a solved grid.');
  return result.solution;
}

export interface CarveOptions {
  /** Stop removing clues once this many remain (lower bound, not a target). */
  minClues?: number;
  /** Use 180-degree rotational symmetry when removing clues. */
  symmetric?: boolean;
}

/**
 * Remove clues from a solved grid while preserving a unique solution.
 * Every removal is verified with the exhaustive solver, so the result always has exactly one solution.
 */
export function carvePuzzle(solution: Grid, rng: Rng, options: CarveOptions = {}): Grid {
  const { minClues = 17, symmetric = true } = options;
  const puzzle = solution.slice();
  const order = shuffle(
    rng,
    Array.from({ length: 81 }, (_, i) => i),
  );
  let clues = 81;
  for (const cell of order) {
    if (!puzzle[cell]) continue;
    const mirror = 80 - cell;
    const group = symmetric && mirror !== cell && puzzle[mirror] ? [cell, mirror] : [cell];
    if (clues - group.length < minClues) continue;
    const saved = group.map((c) => puzzle[c]);
    for (const c of group) puzzle[c] = 0;
    if (countSolutions(puzzle, 2).count !== 1) {
      group.forEach((c, i) => (puzzle[c] = saved[i]));
    } else {
      clues -= group.length;
    }
  }
  return puzzle;
}

/** Generate a random unique-solution puzzle without difficulty targeting. */
export function generateRawPuzzle(seed: number = randomSeed(), options?: CarveOptions) {
  const rng = createRng(seed);
  const solution = generateSolvedGrid(rng);
  const puzzle = carvePuzzle(solution, rng, options);
  return { puzzle, solution, seed };
}
