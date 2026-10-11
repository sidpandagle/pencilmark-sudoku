import {
  applyTransform,
  countSolutions,
  createRng,
  generatePuzzle,
  getPracticePuzzles,
  randomTransform,
  techniqueInfo,
  techniqueName,
  type Difficulty,
  type TechniqueId,
} from '../engine';
import { parseDigits } from './positions';

export interface PracticeChoice {
  puzzle: number[];
  solution: number[];
  difficulty: Difficulty;
  /** True when the puzzle's hardest technique is exactly the requested one. */
  exact: boolean;
  /** Honest one-line description for the learner. */
  note: string;
}

export const hasPracticePuzzles = (t: TechniqueId) => getPracticePuzzles(t).length > 0;

/**
 * A puzzle for practising technique `t`: a stored practice puzzle whose hardest technique is `t`, relabelled
 * and shuffled with a random Sudoku symmetry (which keeps the solution unique and the technique profile the
 * same). When no practice puzzle exists, falls back to a generated puzzle of the technique's difficulty and
 * says so.
 */
export function practicePuzzleFor(t: TechniqueId, variant: number, seed: number): PracticeChoice | null {
  const list = getPracticePuzzles(t);
  const name = techniqueName(t);
  if (list.length) {
    const p = list[Math.abs(variant) % list.length];
    const puzzle = applyTransform(parseDigits(p.puzzle), randomTransform(createRng(seed)));
    const r = countSolutions(puzzle, 2);
    if (r.count === 1 && r.solution) {
      return { puzzle, solution: r.solution, difficulty: p.difficulty, exact: true, note: `The hardest step in this puzzle is a ${name}.` };
    }
  }
  try {
    const tier = techniqueInfo(t).tier;
    const g = generatePuzzle(tier, seed);
    const exact = g.hardestTechnique === t;
    return {
      puzzle: g.puzzle,
      solution: g.solution,
      difficulty: g.difficulty,
      exact,
      note: exact
        ? `The hardest step in this puzzle is a ${name}.`
        : `Pencilmark has no puzzle that needs a ${name} as its hardest step. This ${tier} puzzle uses techniques of similar difficulty, but may not need a ${name} at all.`,
    };
  } catch {
    return null;
  }
}
