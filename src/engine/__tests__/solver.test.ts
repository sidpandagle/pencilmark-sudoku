import { BANK } from '../bank/bank';
import { countSolutions } from '../bruteSolver';
import { generateRawPuzzle } from '../generator';
import { computeCandidates, isCompleteAndValid, parseGrid, serializeGrid } from '../grid';
import { applyStepToGrid, findNextStep, solveLogically } from '../index';
import { findStepInState, makesProgress } from '../solver/solve';
import { applyStep, createState, isSolvedState } from '../solver/state';
import { stateConsistent, validateStep } from '../solver/validate';
import { TECHNIQUES } from '../techniques/catalog';
import { DETECTORS } from '../techniques/registry';
import { DIFFICULTIES } from '../types';

const KNOWN = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';

/** Solve logically, validating every step against the brute-force solution. Returns violations. */
function solveAndValidate(puzzle: number[], allDetectorsEvery = 0): { violations: string[]; solved: boolean; steps: number } {
  const solution = countSolutions(puzzle, 2).solution!;
  const violations: string[] = [];
  let s = createState(puzzle, undefined, true);
  let n = 0;
  while (!isSolvedState(s) && n < 1000) {
    if (!stateConsistent(s, solution)) violations.push(`inconsistent state in ${serializeGrid(puzzle)}`);
    if (allDetectorsEvery && n % allDetectorsEvery === 0) {
      for (const t of TECHNIQUES) {
        if (t.requiresUniqueness && !s.unique) continue;
        const st = DETECTORS[t.id](s);
        if (st) violations.push(...validateStep(st, solution, s));
      }
    }
    const step = findStepInState(s);
    if (!step) break;
    violations.push(...validateStep(step, solution, s));
    s = applyStep(s, step);
    n++;
  }
  return { violations, solved: isSolvedState(s), steps: n };
}

describe('solveLogically', () => {
  it('solves a known easy puzzle with singles and matches the brute-force solution', () => {
    const g = parseGrid(KNOWN);
    const r = solveLogically(g);
    expect(r.solved).toBe(true);
    expect(['full-house', 'hidden-single', 'naked-single']).toContain(r.hardestTechnique);
    let grid = g.slice();
    let cands = computeCandidates(g);
    for (const st of r.steps) ({ grid, candidates: cands } = applyStepToGrid(grid, cands, st));
    expect(isCompleteAndValid(grid)).toBe(true);
    expect(grid).toEqual(countSolutions(g, 1).solution);
    expect(r.score).toBeGreaterThan(0);
    expect(Object.values(r.techniqueCounts).reduce((a, b) => a + (b ?? 0), 0)).toBe(r.steps.length);
  });

  it('returns an unsolved result for conflicting input instead of throwing', () => {
    const g = parseGrid(KNOWN);
    g[2] = 5;
    const r = solveLogically(g);
    expect(r.solved).toBe(false);
    expect(r.steps).toEqual([]);
  });

  it('findNextStep returns null for solved, broken or malformed grids', () => {
    const solved = countSolutions(parseGrid(KNOWN), 1).solution!;
    expect(findNextStep(solved)).toBeNull();
    const broken = parseGrid(KNOWN);
    broken[2] = 5;
    expect(findNextStep(broken)).toBeNull();
    expect(findNextStep([1, 2, 3] as number[])).toBeNull();
    // A candidate state with an empty cell that has no candidates is a contradiction.
    const cands = computeCandidates(parseGrid(KNOWN));
    cands[2] = 0;
    expect(findNextStep(parseGrid(KNOWN), cands)).toBeNull();
  });

  it('respects a supplied candidate state', () => {
    const g = parseGrid(KNOWN);
    const cands = computeCandidates(g);
    const first = findNextStep(g, cands)!;
    expect(first).not.toBeNull();
    // Every step makes progress on the supplied state.
    expect(makesProgress(createState(g, cands), first)).toBe(true);
  });

  it('restricts techniques when asked', () => {
    const r = solveLogically(parseGrid(KNOWN), { techniques: ['full-house', 'naked-single'] });
    for (const st of r.steps) expect(['full-house', 'naked-single']).toContain(st.technique);
  });
});

describe('safety net: every step agrees with the brute-force solution', () => {
  it('bank puzzles of every difficulty (zero violations)', () => {
    let checked = 0;
    for (const d of DIFFICULTIES) {
      const list = BANK[d];
      const stride = Math.max(1, Math.floor(list.length / 8));
      for (let i = 0; i < list.length; i += stride) {
        const r = solveAndValidate(parseGrid(list[i][0]));
        expect(r.violations).toEqual([]);
        expect(r.solved).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(DIFFICULTIES.length * 8);
  });

  it('fresh random puzzles, symmetric and minimal (zero violations)', () => {
    for (let i = 0; i < 16; i++) {
      const { puzzle } = generateRawPuzzle(4242 + i, { symmetric: i % 2 === 0 });
      expect(solveAndValidate(puzzle).violations).toEqual([]);
    }
  });

  it('all detectors on intermediate states of hard puzzles (zero violations)', () => {
    const list = [...BANK.expert.slice(0, 3), ...BANK.hard.slice(0, 2)];
    for (const e of list) expect(solveAndValidate(parseGrid(e[0]), 6).violations).toEqual([]);
  });
});
