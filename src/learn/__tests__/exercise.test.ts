import { bit } from '../../engine';
import { evaluateEliminations, evaluatePlacement, isSingleInstance } from '../exercise';
import { examplePosition, type LessonPosition } from '../positions';

/** Every (cell, digit) that is a valid single of `technique` in the position, other than the expected one. */
function alternatives(pos: LessonPosition) {
  const out: { cell: number; digit: number }[] = [];
  const p = pos.step.placements[0];
  for (let cell = 0; cell < 81; cell++) {
    for (let d = 1; d <= 9; d++) {
      if (p && p.cell === cell && p.digit === d) continue;
      if (isSingleInstance(pos, cell, d, pos.technique)) out.push({ cell, digit: d });
    }
  }
  return out;
}

describe('evaluatePlacement accepts other valid singles', () => {
  const techniques = ['naked-single', 'hidden-single', 'full-house'] as const;

  it.each(techniques)('%s: every alternative single agrees with the solution and is accepted', (t) => {
    for (let i = 0; i < 4; i++) {
      const pos = examplePosition(t, i);
      if (!pos) continue;
      const p = pos.step.placements[0];
      expect(evaluatePlacement(pos, p.cell, p.digit).correct).toBe(true);
      for (const a of alternatives(pos)) {
        // A real single can never contradict the solution: this is the safety property.
        expect(pos.solution[a.cell]).toBe(a.digit);
        const v = evaluatePlacement(pos, a.cell, a.digit);
        expect(v.correct).toBe(true);
        expect(v.message).toMatch(/another/);
      }
    }
  });

  it('marks a correct digit that is not a single of this kind as retry, not wrong', () => {
    const pos = examplePosition('hidden-single', 0)!;
    const cell = pos.grid.findIndex(
      (v, c) => !v && !isSingleInstance(pos, c, pos.solution[c], 'hidden-single'),
    );
    if (cell < 0) return; // every empty cell is a hidden single in this position
    const v = evaluatePlacement(pos, cell, pos.solution[cell]);
    expect(v.correct).toBe(false);
    expect(v.retry).toBe(true);
  });

  it('rejects a wrong digit outright', () => {
    const pos = examplePosition('naked-single', 0)!;
    const p = pos.step.placements[0];
    const wrongDigit = (p.digit % 9) + 1;
    const v = evaluatePlacement(pos, p.cell, wrongDigit);
    expect(v.correct).toBe(false);
    expect(v.retry).toBe(false);
  });
});

describe('evaluateEliminations', () => {
  const pos = examplePosition('x-wing', 0)!;

  it('accepts exactly the expected eliminations', () => {
    expect(evaluateEliminations(pos, pos.step.eliminations).correct).toBe(true);
  });

  it('treats a truly impossible but unrelated candidate as retry', () => {
    const expected = new Set(pos.step.eliminations.map((e) => e.cell * 10 + e.digit));
    const pattern = new Set(pos.step.candidates.map((h) => h.cell * 10 + h.digit));
    let mark: { cell: number; digit: number } | null = null;
    for (let c = 0; c < 81 && !mark; c++) {
      if (pos.grid[c]) continue;
      for (let d = 1; d <= 9; d++) {
        const k = c * 10 + d;
        if (pos.candidates[c] & bit(d) && d !== pos.solution[c] && !expected.has(k) && !pattern.has(k)) {
          mark = { cell: c, digit: d };
          break;
        }
      }
    }
    expect(mark).not.toBeNull();
    const v = evaluateEliminations(pos, [mark!]);
    expect(v.correct).toBe(false);
    expect(v.retry).toBe(true);
  });

  it('marks removing a solution digit as wrong, not retry', () => {
    const c = pos.grid.findIndex((v, i) => !v && !pos.step.candidates.some((h) => h.cell === i));
    const v = evaluateEliminations(pos, [{ cell: c, digit: pos.solution[c] }]);
    expect(v.correct).toBe(false);
    expect(v.retry).toBe(false);
  });
});
