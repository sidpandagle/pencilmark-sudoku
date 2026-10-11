import { countSolutions } from '../bruteSolver';
import { parseGrid } from '../grid';
import { getPracticePuzzles } from '../fixtures/practicePuzzles';
import { getTechniqueExamples, TECHNIQUE_EXAMPLES } from '../fixtures/techniqueExamples';
import { decodeCandidates } from '../fixtures/types';
import { ratePuzzle } from '../difficulty';
import { findStepInState } from '../solver/solve';
import { createState } from '../solver/state';
import { stateConsistent, validateStep } from '../solver/validate';
import { TECHNIQUES, techniqueInfo } from '../techniques/catalog';

const key = (xs: { cell: number; digit: number }[]) => xs.map((x) => `${x.cell}:${x.digit}`).sort();

describe('mined technique examples', () => {
  const all = TECHNIQUES.flatMap((t) => getTechniqueExamples(t.id));

  it('exist for most techniques', () => {
    expect(Object.keys(TECHNIQUE_EXAMPLES).length).toBeGreaterThanOrEqual(20);
  });

  it.each(all.map((e, i) => [`${e.technique} #${i}`, e] as const))('%s re-validates', (_name, ex) => {
    const puzzle = parseGrid(ex.puzzle);
    const solution = countSolutions(puzzle, 2);
    expect(solution.count).toBe(1);
    const grid = parseGrid(ex.grid);
    const state = createState(grid, decodeCandidates(ex.candidates), true);
    // The stored position is consistent with the solution and is a position reachable from the puzzle.
    expect(stateConsistent(state, solution.solution!)).toBe(true);
    puzzle.forEach((v, i) => v && expect(grid[i]).toBe(v));
    // The solver's next step here is exactly the stored step (so all easier techniques are exhausted).
    const step = findStepInState(state)!;
    expect(step).not.toBeNull();
    expect(step.technique).toBe(ex.technique);
    expect(key(step.placements)).toEqual(key(ex.step.placements));
    expect(key(step.eliminations)).toEqual(key(ex.step.eliminations));
    expect(validateStep(step, solution.solution!, state)).toEqual([]);
  });
});

describe('practice puzzles', () => {
  const all = TECHNIQUES.flatMap((t) => getPracticePuzzles(t.id));
  it('re-rate to their stored hardest technique (sample)', () => {
    expect(all.length).toBeGreaterThan(30);
    for (let i = 0; i < all.length; i += 4) {
      const p = all[i];
      const g = parseGrid(p.puzzle);
      expect(countSolutions(g, 2).count).toBe(1);
      const r = ratePuzzle(g, true);
      expect(r.hardestTechnique).toBe(p.hardestTechnique);
      expect(r.difficulty).toBe(techniqueInfo(p.hardestTechnique).tier);
      expect(p.difficulty).toBe(r.difficulty);
    }
  });
});
