import type { TechniqueId } from './steps';
import { techniqueInfo } from './techniques/catalog';
import { solveLogically, type LogicalSolveResult } from './solver/solve';
import type { Difficulty, Grid } from './types';

/**
 * Difficulty classifier (see docs/ENGINE.md):
 *  - easy:   solved with level-1 singles only (full house, hidden single, naked single);
 *  - medium: needs intersections or pairs/triples, nothing harder;
 *  - hard:   needs a level-3/4 pattern (fish, wings, colouring, skyscraper/kite/turbot, uniqueness, finned fish);
 *  - expert: needs chains (X-Chain, XY-Chain, AIC), ALS-XZ, Sue de Coq or forcing chains — and is still solved.
 * A puzzle the logical solver cannot finish is unrated (null) and is never labelled.
 */
export function classifyDifficulty(hardest: TechniqueId | null): Difficulty {
  if (!hardest) return 'easy';
  return techniqueInfo(hardest).tier;
}

export interface Rating {
  /** null = unrated (the logical solver could not finish). */
  difficulty: Difficulty | null;
  hardestTechnique: TechniqueId | null;
  score: number;
  solved: boolean;
  result: LogicalSolveResult;
}

/** Solve logically and classify. `unique` should be true for unique puzzles (enables uniqueness techniques). */
export function ratePuzzle(grid: Grid, unique?: boolean): Rating {
  const result = solveLogically(grid, { uniqueness: unique });
  return {
    difficulty: result.solved ? classifyDifficulty(result.hardestTechnique) : null,
    hardestTechnique: result.hardestTechnique,
    score: result.score,
    solved: result.solved,
    result,
  };
}
