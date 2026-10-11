import { countSolutions, findNextStep, getTechniqueExamples, TECHNIQUES, validateStep } from '../../engine';
import { evaluateEliminations, evaluatePlacement, exerciseKind, isPatternCandidate } from '../exercise';
import { lessonForTechnique } from '../curriculum';
import { phasesFor, phaseView } from '../phases';
import { examplePosition, masteryPositions, minePosition, stateOf } from '../positions';
import { alternativeMoves, buildSolveSession } from '../solveSession';
import { practicePuzzleFor } from '../practice';

jest.setTimeout(120_000);

const sameEffects = (a: { placements: unknown; eliminations: unknown }, b: { placements: unknown; eliminations: unknown }) =>
  JSON.stringify(a.placements) === JSON.stringify(b.placements) && JSON.stringify(a.eliminations) === JSON.stringify(b.eliminations);

describe('lesson positions', () => {
  it.each(TECHNIQUES.map((t) => t.id))('%s: every example re-validates and the guided answer is the engine step', (t) => {
    const n = getTechniqueExamples(t).length;
    expect(n).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < n; i++) {
      const p = examplePosition(t, i)!;
      expect(p).not.toBeNull();
      // The brute-force solution is unique and agrees with the givens.
      expect(countSolutions(p.puzzle, 2).count).toBe(1);
      p.puzzle.forEach((v, c) => v && expect(p.solution[c]).toBe(v));
      // The step is valid against the solution on the displayed candidate state.
      expect(validateStep(p.step, p.solution, stateOf(p))).toEqual([]);
      // The engine's next step at this position is exactly the stored step (so the lesson checks the right answer).
      const next = findNextStep(p.grid, p.candidates)!;
      expect(next.technique).toBe(t);
      expect(sameEffects(next, p.step)).toBe(true);
      // The expected guided answer is accepted.
      const content = lessonForTechnique(t)!.content;
      const v =
        exerciseKind(p.step) === 'place'
          ? evaluatePlacement(p, p.step.placements[0].cell, p.step.placements[0].digit, content)
          : evaluateEliminations(p, p.step.eliminations, content);
      expect(v.correct).toBe(true);
    }
  });

  it('mines mastery positions that are valid next steps (when practice puzzles exist)', () => {
    for (const t of TECHNIQUES.map((x) => x.id)) {
      const list = masteryPositions(t, 1);
      expect(list.length).toBeGreaterThanOrEqual(2);
      for (const p of list) {
        expect(validateStep(p.step, p.solution, stateOf(p))).toEqual([]);
        expect(p.step.technique).toBe(t);
        if (p.source === 'mined') {
          const next = findNextStep(p.grid, p.candidates)!;
          expect(next.technique).toBe(t);
        }
      }
      if (t !== 'hidden-quad') expect(list.some((p) => p.source === 'mined')).toBe(true);
    }
    expect(minePosition('hidden-quad')).toBeNull();
  });
});

describe('answer checking', () => {
  const p = examplePosition('x-wing', 1)!;
  const content = lessonForTechnique('x-wing')!.content;

  it('rejects an empty answer without failing it', () => {
    const v = evaluateEliminations(p, [], content);
    expect(v.correct).toBe(false);
    expect(v.message).toMatch(/Tap the candidates/);
  });

  it('explains why a pattern candidate is not removed', () => {
    const pat = p.step.candidates.find((h) => h.role === 'pattern')!;
    expect(isPatternCandidate(p.step, pat)).toBe(true);
    const v = evaluateEliminations(p, [...p.step.eliminations, { cell: pat.cell, digit: pat.digit }], content);
    expect(v.correct).toBe(false);
    expect(v.wrong[0].reason).toBe('pattern');
    expect(v.message).toMatch(/part of the pattern/);
  });

  it('points out a wrong digit and an out-of-reach candidate', () => {
    const d = p.step.eliminations[0].digit;
    // A live candidate of another digit somewhere.
    let other: { cell: number; digit: number } | null = null;
    let reach: { cell: number; digit: number } | null = null;
    for (let c = 0; c < 81 && (!other || !reach); c++) {
      for (let x = 1; x <= 9; x++) {
        if (!(p.candidates[c] & (1 << (x - 1)))) continue;
        const isElim = p.step.eliminations.some((e) => e.cell === c && e.digit === x);
        const isPat = isPatternCandidate(p.step, { cell: c, digit: x });
        if (!other && x !== d) other = { cell: c, digit: x };
        if (!reach && x === d && !isElim && !isPat) reach = { cell: c, digit: x };
      }
    }
    expect(evaluateEliminations(p, [other!], content).wrong[0].reason).toBe('wrong-digit');
    const r = evaluateEliminations(p, [reach!], content);
    expect(r.wrong[0].reason).toBe('not-reached');
    expect(r.message).toContain(content!.targetRule);
  });

  it('reports partial progress for multi-elimination steps', () => {
    const sword = examplePosition('swordfish', 0)!;
    expect(sword.step.eliminations.length).toBeGreaterThan(1);
    const v = evaluateEliminations(sword, sword.step.eliminations.slice(0, 1));
    expect(v.correct).toBe(false);
    expect(v.found).toBe(1);
    expect(v.message).toMatch(/Good so far/);
  });

  it('checks placements: right cell wrong digit, wrong cell', () => {
    const h = examplePosition('hidden-single', 1)!;
    const { cell, digit } = h.step.placements[0];
    expect(evaluatePlacement(h, cell, digit).correct).toBe(true);
    expect(evaluatePlacement(h, cell, digit === 9 ? 1 : digit + 1).message).toMatch(/Right cell/);
    const otherEmpty = h.grid.findIndex((v, i) => !v && i !== cell);
    expect(evaluatePlacement(h, otherEmpty, digit).correct).toBe(false);
  });
});

describe('demonstration phases', () => {
  it('shows units, pattern, effect and result for a step with units', () => {
    const p = examplePosition('x-wing', 0)!;
    const phases = phasesFor(p.step);
    expect(phases).toEqual(['units', 'pattern', 'effect', 'result']);
    const where = phaseView(p.grid, p.candidates, p.step, 'pattern', 'cap');
    expect(where.overlay.candidates!.some((c) => c.role === 'eliminate')).toBe(false);
    const full = phaseView(p.grid, p.candidates, p.step, 'effect', 'cap');
    expect(full.overlay.candidates!.some((c) => c.role === 'eliminate')).toBe(true);
    const result = phaseView(p.grid, p.candidates, p.step, 'result', 'cap');
    const e = p.step.eliminations[0];
    expect(result.candidates[e.cell] & (1 << (e.digit - 1))).toBe(0);
  });

  it('skips the units phase when a step has none', () => {
    expect(phasesFor(examplePosition('xy-wing', 0)!.step)[0]).toBe('pattern');
  });
});

describe('guided solving session', () => {
  const PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'.split('').map(Number);

  it('solves a classic puzzle with frames before every step', () => {
    const s = buildSolveSession(PUZZLE);
    expect(s.solved).toBe(true);
    expect(s.steps.length).toBeGreaterThan(3);
    expect(s.frames).toHaveLength(s.steps.length + 1);
    expect(s.frames[s.steps.length].grid.every((v) => v > 0)).toBe(true);
  });

  it('flags invalid starts', () => {
    const bad = PUZZLE.slice();
    bad[2] = 5;
    expect(buildSolveSession(bad).invalid).toBe(true);
  });

  it('reports stuck when the solver runs out of techniques (empty grid has many solutions but no logic)', () => {
    const s = buildSolveSession(new Array(81).fill(0));
    expect(s.solved).toBe(false);
    expect(s.stuck).toBe(true);
    expect(s.invalid).toBe(false);
  });

  it('lists alternative moves restricted by technique', () => {
    const s = buildSolveSession(PUZZLE);
    const alts = alternativeMoves(s.frames[0], s.steps[0].technique);
    expect(alts.every((a) => a.technique !== s.steps[0].technique)).toBe(true);
    for (const a of alts) expect(validateStep(a.step, s.frames[s.frames.length - 1].grid).length).toBe(0);
  });
});

describe('practice puzzles', () => {
  it('returns a transformed puzzle whose hardest technique is the requested one', () => {
    const p = practicePuzzleFor('x-wing', 0, 42)!;
    expect(p.exact).toBe(true);
    expect(countSolutions(p.puzzle, 2).count).toBe(1);
  });

  it('is honest when no practice puzzle exists', () => {
    const p = practicePuzzleFor('hidden-quad', 0, 7)!;
    expect(p).not.toBeNull();
    if (!p.exact) expect(p.note).toMatch(/may not need/);
  });
});
