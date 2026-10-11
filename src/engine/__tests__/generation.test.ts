import { BANK } from '../bank/bank';
import { countSolutions } from '../bruteSolver';
import { ratePuzzle } from '../difficulty';
import { generateFreshPuzzle } from '../fresh';
import { parseGrid } from '../grid';
import { dailyDifficulty, generatePuzzle, getDailyPuzzle } from '../index';
import { createRng } from '../rng';
import { findStepInState, makesProgress } from '../solver/solve';
import { applyStep, createState, isSolvedState } from '../solver/state';
import { validateStep } from '../solver/validate';
import { techniqueInfo, techniqueRank } from '../techniques/catalog';
import { applyTransform, randomTransform, transformCandidates, transformStep } from '../transform';
import { DIFFICULTIES } from '../types';

describe('puzzle bank', () => {
  it('has enough well-formed, distinct puzzles per difficulty', () => {
    const all = new Set<string>();
    for (const d of DIFFICULTIES) {
      expect(BANK[d].length).toBeGreaterThanOrEqual(d === 'expert' ? 80 : 250);
      for (const [p, score, tech] of BANK[d]) {
        expect(p).toMatch(/^[1-9.]{81}$/);
        expect(all.has(p)).toBe(false);
        all.add(p);
        expect(score).toBeGreaterThan(0);
        expect(techniqueInfo(tech).tier).toBe(d);
      }
    }
  });

  it('easy puzzles have friendly clue counts', () => {
    for (const [p] of BANK.easy) {
      const clues = p.replace(/\./g, '').length;
      expect(clues).toBeGreaterThanOrEqual(36);
      expect(clues).toBeLessThanOrEqual(45);
    }
  });

  it('stored ratings re-validate (sample per difficulty)', () => {
    for (const d of DIFFICULTIES) {
      const list = BANK[d];
      for (let i = 0; i < list.length; i += Math.max(1, Math.floor(list.length / 5))) {
        const [p, score, tech] = list[i];
        const g = parseGrid(p);
        expect(countSolutions(g, 2).count).toBe(1);
        const r = ratePuzzle(g, true);
        expect(r.difficulty).toBe(d);
        expect(r.hardestTechnique).toBe(tech);
        expect(r.score).toBe(score);
      }
    }
  });
});

describe('generatePuzzle (bank + transforms)', () => {
  it('is deterministic, unique and fast', () => {
    for (const d of DIFFICULTIES) {
      const a = generatePuzzle(d, 1234);
      const b = generatePuzzle(d, 1234);
      expect(a).toEqual(b);
      expect(a.difficulty).toBe(d);
      expect(countSolutions(a.puzzle, 2).count).toBe(1);
      expect(countSolutions(a.puzzle, 1).solution).toEqual(a.solution);
      a.puzzle.forEach((v, i) => v && expect(a.solution[i]).toBe(v));
    }
    const t0 = Date.now();
    for (let i = 0; i < 40; i++) generatePuzzle(DIFFICULTIES[i % 4], 9000 + i);
    expect((Date.now() - t0) / 40).toBeLessThan(50);
  });

  it('re-rating a transformed puzzle gives the same difficulty and hardest technique', () => {
    // The greedy solver may visit cells in a different order on a transformed copy, so the step count (and
    // score) can differ slightly; difficulty and hardest technique do not (see docs/ENGINE.md for the
    // 2,400-puzzle check). The stored score is the score of the mapped path, proven in the next test.
    for (const d of DIFFICULTIES) {
      for (let seed = 1; seed <= 3; seed++) {
        const g = generatePuzzle(d, seed * 7919);
        const r = ratePuzzle(g.puzzle, true);
        expect(r.difficulty).toBe(d);
        expect(r.hardestTechnique).toBe(g.hardestTechnique);
      }
    }
  });

  it('proof of invariance: every solving step maps to a valid step of the transformed puzzle', () => {
    // A Sudoku symmetry maps rows/columns/boxes onto rows/columns/boxes, so each technique instance maps to
    // an instance of the same technique. Replaying the mapped steps solves the transformed puzzle with exactly
    // the stored technique profile (same techniques, same counts, same score).
    const rng = createRng(99);
    for (const d of DIFFICULTIES) {
      const [p, storedScore, storedHardest] = BANK[d][Math.floor(BANK[d].length / 2)];
      let score = 0;
      let hardest = -1;
      const g = parseGrid(p);
      const t = randomTransform(rng);
      const tg = applyTransform(g, t);
      const tSolution = countSolutions(tg, 1).solution!;
      let s = createState(g, undefined, true);
      let ts = createState(tg, undefined, true);
      while (!isSolvedState(s)) {
        const step = findStepInState(s)!;
        expect(step).not.toBeNull();
        // The transformed candidate state is exactly the mapped candidate state.
        expect(ts.cands).toEqual(transformCandidates(s.cands, t));
        const mapped = transformStep(step, t);
        expect(validateStep(mapped, tSolution, ts)).toEqual([]);
        expect(makesProgress(ts, mapped)).toBe(true);
        expect(mapped.technique).toBe(step.technique);
        score += techniqueInfo(mapped.technique).weight;
        hardest = Math.max(hardest, techniqueRank(mapped.technique));
        s = applyStep(s, step);
        ts = applyStep(ts, mapped);
      }
      expect(ts.grid).toEqual(tSolution);
      expect(score).toBe(storedScore);
      expect(hardest).toBe(techniqueRank(storedHardest));
    }
  });
});

describe('daily puzzle', () => {
  it('is deterministic per date and rotates difficulty by weekday', () => {
    expect(getDailyPuzzle('2026-10-12')).toEqual(getDailyPuzzle('2026-10-12'));
    expect(getDailyPuzzle('2026-10-12').puzzle).not.toEqual(getDailyPuzzle('2026-10-13').puzzle);
    // 2026-10-12 is a Monday.
    expect(dailyDifficulty('2026-10-12')).toBe('easy');
    expect(dailyDifficulty('2026-10-14')).toBe('medium');
    expect(dailyDifficulty('2026-10-16')).toBe('hard');
    expect(dailyDifficulty('2026-10-18')).toBe('expert');
    expect(getDailyPuzzle('2026-10-18').difficulty).toBe('expert');
    expect(dailyDifficulty('not-a-date')).toBe('medium');
  });
});

describe('generateFreshPuzzle (slow path)', () => {
  it('produces an easy puzzle in the clue window', () => {
    const p = generateFreshPuzzle('easy', 31337, 20)!;
    expect(p).not.toBeNull();
    expect(p.difficulty).toBe('easy');
    const clues = p.puzzle.filter(Boolean).length;
    expect(clues).toBeGreaterThanOrEqual(36);
    expect(clues).toBeLessThanOrEqual(42);
    expect(ratePuzzle(p.puzzle, true).difficulty).toBe('easy');
  });

  it('produces a medium puzzle that really needs level-2 techniques', () => {
    const p = generateFreshPuzzle('medium', 4711, 30)!;
    expect(p).not.toBeNull();
    expect(ratePuzzle(p.puzzle, true).difficulty).toBe('medium');
  });
});
