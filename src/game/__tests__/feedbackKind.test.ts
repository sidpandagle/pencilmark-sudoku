import { inputFeedbackKind } from '../feedbackKind';
import { PUZZLE, SOLUTION } from '../testFixtures';

const off = { autoCheck: false, mistakeCounter: false, highlightConflicts: false };
const empty = PUZZLE.findIndex((v) => v === 0);

function withEntry(digit: number) {
  const values = PUZZLE.slice();
  values[empty] = digit;
  return { values, solution: SOLUTION, status: 'playing' as const };
}

/** A wrong digit for `empty` that does not duplicate anything in its row, column or box. */
function wrongWithoutConflict(): number | null {
  for (let d = 1; d <= 9; d++) {
    if (d === SOLUTION[empty]) continue;
    const r = Math.floor(empty / 9);
    const c = empty % 9;
    const clash = PUZZLE.some(
      (v, i) =>
        v === d &&
        (Math.floor(i / 9) === r || i % 9 === c || (Math.floor(i / 27) === Math.floor(empty / 27) && Math.floor((i % 9) / 3) === Math.floor(c / 3))),
    );
    if (!clash) return d;
  }
  return null;
}

describe('inputFeedbackKind never leaks correctness', () => {
  it('a wrong digit without a visible conflict feels like a normal placement when checking is off', () => {
    const d = wrongWithoutConflict();
    expect(d).not.toBeNull();
    expect(inputFeedbackKind(withEntry(d!), empty, off)).toBe('place');
  });

  it('signals the error when the player opted into auto-check or the mistake counter', () => {
    const d = wrongWithoutConflict()!;
    expect(inputFeedbackKind(withEntry(d), empty, { ...off, autoCheck: true })).toBe('error');
    expect(inputFeedbackKind(withEntry(d), empty, { ...off, mistakeCounter: true })).toBe('error');
  });

  it('signals a visible duplicate when conflict highlighting is on', () => {
    const dup = PUZZLE[Math.floor(empty / 9) * 9 + PUZZLE.slice(Math.floor(empty / 9) * 9, Math.floor(empty / 9) * 9 + 9).findIndex(Boolean)];
    expect(inputFeedbackKind(withEntry(dup), empty, { ...off, highlightConflicts: true })).toBe('error');
    expect(inputFeedbackKind(withEntry(dup), empty, off)).toBe('place');
  });

  it('a correct digit is a placement; a finished board is success', () => {
    expect(inputFeedbackKind(withEntry(SOLUTION[empty]), empty, { autoCheck: true, mistakeCounter: true, highlightConflicts: true })).toBe('place');
    expect(inputFeedbackKind({ values: SOLUTION, solution: SOLUTION, status: 'completed' }, empty, off)).toBe('success');
  });
});
