import { countSolutions, hasUniqueSolution } from '../bruteSolver';
import { generateRawPuzzle } from '../generator';
import { isCompleteAndValid, parseGrid } from '../grid';

const KNOWN =
  '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';

describe('countSolutions', () => {
  it('solves a known unique puzzle', () => {
    const r = countSolutions(parseGrid(KNOWN), 2);
    expect(r.count).toBe(1);
    expect(r.solution && isCompleteAndValid(r.solution)).toBe(true);
  });

  it('detects multiple solutions in an empty grid', () => {
    expect(countSolutions(new Array(81).fill(0), 2).count).toBe(2);
  });

  it('returns zero for contradictory givens', () => {
    const g = parseGrid(KNOWN);
    g[2] = 5; // duplicate 5 in row 1
    expect(countSolutions(g, 2).count).toBe(0);
  });

  it('generates unique puzzles reproducibly from a seed', () => {
    const a = generateRawPuzzle(42);
    const b = generateRawPuzzle(42);
    expect(a.puzzle).toEqual(b.puzzle);
    expect(hasUniqueSolution(a.puzzle)).toBe(true);
  });
});
