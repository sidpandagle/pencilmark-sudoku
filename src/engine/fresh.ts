import { countSolutions } from './bruteSolver';
import { ratePuzzle } from './difficulty';
import { carvePuzzle, generateSolvedGrid } from './generator';
import { createRng, randomInt, randomSeed, shuffle, type Rng } from './rng';
import { solveLogically } from './solver/solve';
import type { TechniqueId } from './steps';
import { TECHNIQUES, tierRank } from './techniques/catalog';
import type { Difficulty, GeneratedPuzzle, Grid } from './types';

const techniquesUpTo = (d: Difficulty): TechniqueId[] =>
  TECHNIQUES.filter((t) => tierRank(t.tier) <= tierRank(d)).map((t) => t.id);

const clueCount = (g: Grid) => g.reduce((n, v) => n + (v ? 1 : 0), 0);

/** Clue-count window per difficulty used when adding clues back (easy puzzles should feel easy). */
export const CLUE_TARGETS: Record<Difficulty, [number, number]> = {
  easy: [36, 42],
  medium: [28, 32],
  hard: [0, 0],
  expert: [0, 0],
};

/**
 * Add clues from the solution (random cells) until the puzzle is solvable with techniques of the target tier
 * or easier. Adding clues keeps the solution unique. Returns false if that never happens (cannot occur in
 * practice: a full grid is trivially solvable).
 */
function addCluesUntilSolvable(puzzle: Grid, solution: Grid, target: Difficulty, rng: Rng): boolean {
  const allowed = techniquesUpTo(target);
  const empties = shuffle(rng, puzzle.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0));
  for (const cell of empties) {
    if (solveLogically(puzzle, { techniques: allowed, uniqueness: true }).solved) return true;
    puzzle[cell] = solution[cell];
  }
  return solveLogically(puzzle, { techniques: allowed, uniqueness: true }).solved;
}

/**
 * Tune a carved puzzle to the target difficulty by adding clues: harder puzzles get clues until they need
 * nothing beyond the target tier; easy and medium puzzles are topped up into their clue-count window while
 * keeping their difficulty. Returns the tuned puzzle or null when the target cannot be reached.
 */
export function tunePuzzle(carved: Grid, solution: Grid, target: Difficulty, rng: Rng): Grid | null {
  const puzzle = carved.slice();
  let rating = ratePuzzle(puzzle, true);
  if (!rating.difficulty || tierRank(rating.difficulty) > tierRank(target)) {
    if (target === 'expert') return null;
    if (!addCluesUntilSolvable(puzzle, solution, target, rng)) return null;
    rating = ratePuzzle(puzzle, true);
  }
  if (rating.difficulty !== target) return null;
  const [lo, hi] = CLUE_TARGETS[target];
  if (lo > 0) {
    const want = lo + randomInt(rng, hi - lo + 1);
    const empties = shuffle(rng, puzzle.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0));
    for (const cell of empties) {
      if (clueCount(puzzle) >= want) break;
      puzzle[cell] = solution[cell];
      if (target !== 'easy' && ratePuzzle(puzzle, true).difficulty !== target) puzzle[cell] = 0;
    }
  }
  return puzzle;
}

/**
 * Slow path: generate a brand-new puzzle of the requested difficulty (for tools/tests and the bank builder).
 * Easy/medium/hard use symmetric carving; expert uses non-symmetric minimal carving, which yields harder
 * puzzles. Returns null when no puzzle was found in `maxAttempts` attempts.
 */
export function generateFreshPuzzle(
  difficulty: Difficulty,
  seed: number = randomSeed(),
  maxAttempts = 50,
): GeneratedPuzzle | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = (seed + Math.imul(attempt, 0x9e3779b1)) >>> 0;
    const rng = createRng(attemptSeed);
    const solution = generateSolvedGrid(rng);
    const carved = carvePuzzle(solution, rng, { symmetric: difficulty !== 'expert' });
    const puzzle = tunePuzzle(carved, solution, difficulty, rng);
    if (!puzzle) continue;
    if (countSolutions(puzzle, 2).count !== 1) continue; // defensive: carving and adding clues keep uniqueness
    const rating = ratePuzzle(puzzle, true);
    if (rating.difficulty !== difficulty) continue;
    return {
      puzzle,
      solution,
      difficulty,
      seed: attemptSeed,
      hardestTechnique: rating.hardestTechnique ?? undefined,
      score: rating.score,
    };
  }
  return null;
}
