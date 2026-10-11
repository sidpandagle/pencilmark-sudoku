/**
 * Empirical check that bank ratings are invariant under random Sudoku symmetries (bun):
 *   bun scripts/engine-check-invariance.ts [transformsPerPuzzle=2]
 */
import { BANK } from '../src/engine/bank/bank';
import { ratePuzzle } from '../src/engine/difficulty';
import { parseGrid } from '../src/engine/grid';
import { createRng } from '../src/engine/rng';
import { applyTransform, randomTransform } from '../src/engine/transform';
import { DIFFICULTIES } from '../src/engine/types';

const per = Number(process.argv[2] ?? 2);
const rng = createRng(2026);
let checked = 0;
const mism = { difficulty: 0, hardest: 0, score: 0 };
for (const d of DIFFICULTIES)
  for (const [p, score, tech] of BANK[d]) {
    for (let k = 0; k < per; k++) {
      const g = applyTransform(parseGrid(p), randomTransform(rng));
      const r = ratePuzzle(g, true);
      checked++;
      if (r.difficulty !== d) { mism.difficulty++; console.error('DIFFICULTY', d, r.difficulty, p); }
      if (r.hardestTechnique !== tech) { mism.hardest++; console.error('HARDEST', tech, r.hardestTechnique, p); }
      if (r.score !== score) mism.score++;
    }
  }
console.log(`transformed puzzles rated: ${checked}; mismatches: ${JSON.stringify(mism)}`);
