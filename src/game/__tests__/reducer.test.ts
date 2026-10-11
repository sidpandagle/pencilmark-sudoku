import { bit } from '../../engine';
import { createGame } from '../factory';
import { gameReducer, progressOf, type GameAction } from '../reducer';
import { HISTORY_LIMIT, type GameState, type ReducerConfig } from '../types';
import { EMPTY_CELLS, PUZZLE, SOLUTION } from '../testFixtures';

const cfg: ReducerConfig = { autoRemoveNotes: true, countMistakes: true, now: 1000 };
const newGame = () => createGame({ puzzle: PUZZLE, solution: SOLUTION, difficulty: 'easy', source: 'random', now: 0, id: 'g1' });
const run = (s: GameState, actions: GameAction[], c: ReducerConfig = cfg) => actions.reduce((st, a) => gameReducer(st, a, c), s);

// r1c3 (cell 2) is empty, solution 4. r1c4 (cell 3) is empty, solution 6.
describe('input', () => {
  it('places a digit in the selected empty cell', () => {
    const s = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'input', digit: 4 }]);
    expect(s.values[2]).toBe(4);
    expect(s.past).toHaveLength(1);
    expect(s.mistakes).toBe(0);
  });

  it('never changes a given', () => {
    const g = newGame();
    const s = run(g, [{ type: 'select', cell: 0 }, { type: 'input', digit: 9 }, { type: 'erase' }]);
    expect(s.values[0]).toBe(5);
    expect(s.past).toHaveLength(0);
  });

  it('with no selection, a digit highlights instead of placing', () => {
    const s = run(newGame(), [{ type: 'input', digit: 7 }]);
    expect(s.highlightDigit).toBe(7);
    expect(s.values).toEqual(PUZZLE);
  });

  it('counts mistakes only when enabled and never deletes the entry', () => {
    const on = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'input', digit: 9 }]);
    expect(on.values[2]).toBe(9);
    expect(on.mistakes).toBe(1);
    expect(on.errors).toBe(1);
    const off = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'input', digit: 9 }], { ...cfg, countMistakes: false });
    expect(off.mistakes).toBe(0);
    expect(off.errors).toBe(1);
    expect(off.values[2]).toBe(9);
  });
});

describe('notes', () => {
  it('toggles notes in notes mode and via asNote', () => {
    let s = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'toggleNotesMode' }, { type: 'input', digit: 1 }, { type: 'input', digit: 2 }]);
    expect(s.notes[2]).toBe(bit(1) | bit(2));
    s = run(s, [{ type: 'input', digit: 1 }]);
    expect(s.notes[2]).toBe(bit(2));
    s = run(s, [{ type: 'toggleNotesMode' }, { type: 'input', digit: 7, asNote: true }]);
    expect(s.notes[2]).toBe(bit(2) | bit(7));
    expect(s.values[2]).toBe(0);
  });

  it('placing a digit clears the cell notes and removes the digit from peer notes in the same undo entry', () => {
    let s = run(newGame(), [
      { type: 'toggleNote', cell: 3, digit: 4 },
      { type: 'toggleNote', cell: 3, digit: 6 },
      { type: 'toggleNote', cell: 2, digit: 4 },
      { type: 'toggleNote', cell: 2, digit: 1 },
      { type: 'toggleNote', cell: 80 - 0, digit: 4 }, // r9c9 is a given -> ignored
    ]);
    expect(s.notes[3]).toBe(bit(4) | bit(6));
    const pastBefore = s.past.length;
    s = run(s, [{ type: 'select', cell: 2 }, { type: 'input', digit: 4 }]);
    expect(s.notes[2]).toBe(0);
    expect(s.notes[3]).toBe(bit(6)); // peer in the same row lost its 4
    expect(s.past.length).toBe(pastBefore + 1);
    // one undo restores both the digit and all notes
    s = run(s, [{ type: 'undo' }]);
    expect(s.values[2]).toBe(0);
    expect(s.notes[2]).toBe(bit(4) | bit(1));
    expect(s.notes[3]).toBe(bit(4) | bit(6));
  });

  it('does not touch peer notes when auto-remove is off', () => {
    const s = run(newGame(), [{ type: 'toggleNote', cell: 3, digit: 4 }, { type: 'select', cell: 2 }, { type: 'input', digit: 4 }], {
      ...cfg,
      autoRemoveNotes: false,
    });
    expect(s.notes[3]).toBe(bit(4));
  });

  it('auto-fills candidates and clears notes as single undo entries', () => {
    let s = run(newGame(), [{ type: 'autoFillNotes' }]);
    expect(s.past).toHaveLength(1);
    expect(s.notes[2] & bit(SOLUTION[2])).toBeTruthy();
    expect(s.notes[0]).toBe(0);
    s = run(s, [{ type: 'clearNotes' }]);
    expect(s.notes.every((m) => m === 0)).toBe(true);
    s = run(s, [{ type: 'undo' }]);
    expect(s.notes[2]).not.toBe(0);
  });
});

describe('erase', () => {
  it('erases a digit first, then notes', () => {
    let s = run(newGame(), [{ type: 'toggleNote', cell: 2, digit: 1 }, { type: 'select', cell: 2 }, { type: 'input', digit: 9 }]);
    s = run(s, [{ type: 'erase' }]);
    expect(s.values[2]).toBe(0);
    s = run(newGame(), [{ type: 'toggleNote', cell: 2, digit: 1 }, { type: 'select', cell: 2 }, { type: 'erase' }]);
    expect(s.notes[2]).toBe(0);
  });
});

describe('undo / redo', () => {
  it('undo and redo walk through history and restore selection', () => {
    let s = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'input', digit: 4 }, { type: 'select', cell: 3 }, { type: 'input', digit: 6 }]);
    s = run(s, [{ type: 'undo' }]);
    expect(s.values[3]).toBe(0);
    expect(s.selected).toBe(3);
    s = run(s, [{ type: 'undo' }]);
    expect(s.values[2]).toBe(0);
    expect(s.future).toHaveLength(2);
    s = run(s, [{ type: 'redo' }, { type: 'redo' }]);
    expect(s.values[2]).toBe(4);
    expect(s.values[3]).toBe(6);
    // a new edit clears redo
    s = run(s, [{ type: 'undo' }, { type: 'select', cell: 4 }, { type: 'erase' }, { type: 'toggleNote', cell: 3, digit: 1 }]);
    expect(s.future).toHaveLength(0);
  });

  it('caps history', () => {
    let s = newGame();
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) s = gameReducer(s, { type: 'toggleNote', cell: 2, digit: 1 }, cfg);
    expect(s.past.length).toBe(HISTORY_LIMIT);
  });
});

describe('completion', () => {
  it('detects completion when every cell matches the solution', () => {
    let s = newGame();
    for (const c of EMPTY_CELLS) s = run(s, [{ type: 'select', cell: c }, { type: 'input', digit: SOLUTION[c] }]);
    expect(s.status).toBe('completed');
    expect(s.completedAt).toBe(1000);
    expect(progressOf(s)).toBe(1);
    // nothing changes after completion
    expect(run(s, [{ type: 'erase' }, { type: 'undo' }])).toBe(s);
  });

  it('does not complete with a wrong digit', () => {
    let s = newGame();
    for (const c of EMPTY_CELLS) s = run(s, [{ type: 'select', cell: c }, { type: 'input', digit: SOLUTION[c] }]);
    const last = EMPTY_CELLS[EMPTY_CELLS.length - 1];
    // rebuild with the last cell wrong
    let t = newGame();
    for (const c of EMPTY_CELLS) t = run(t, [{ type: 'select', cell: c }, { type: 'input', digit: c === last ? (SOLUTION[c] % 9) + 1 : SOLUTION[c] }]);
    expect(t.status).toBe('playing');
    expect(s.status).toBe('completed');
  });
});

describe('timer and pause', () => {
  it('ticks only while playing and clamps large jumps', () => {
    let s = run(newGame(), [{ type: 'tick', deltaMs: 1000 }, { type: 'pause' }, { type: 'tick', deltaMs: 1000 }]);
    expect(s.elapsedMs).toBe(1000);
    expect(s.status).toBe('paused');
    s = run(s, [{ type: 'resume' }, { type: 'tick', deltaMs: 60_000 }]);
    expect(s.elapsedMs).toBe(6000);
  });

  it('ignores input while paused', () => {
    const s = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'pause' }, { type: 'input', digit: 4 }]);
    expect(s.values[2]).toBe(0);
  });
});

describe('restart', () => {
  it('resets entries, notes, counters and history but keeps the puzzle', () => {
    let s = run(newGame(), [{ type: 'select', cell: 2 }, { type: 'input', digit: 9 }, { type: 'toggleNote', cell: 3, digit: 1 }, { type: 'tick', deltaMs: 3000 }, { type: 'useHint' }]);
    s = run(s, [{ type: 'restart' }]);
    expect(s.values).toEqual(PUZZLE);
    expect(s.notes.every((m) => m === 0)).toBe(true);
    expect(s.mistakes + s.errors + s.hintsUsed + s.elapsedMs).toBe(0);
    expect(s.past).toHaveLength(0);
    expect(s.id).toBe('g1');
    expect(run(s, [{ type: 'restart', id: 'g2' }]).id).toBe('g2');
  });
});

describe('hints', () => {
  it('applies placements and eliminations as one undo entry', () => {
    let s = run(newGame(), [{ type: 'toggleNote', cell: 3, digit: 4 }, { type: 'toggleNote', cell: 3, digit: 6 }]);
    const before = s.past.length;
    s = run(s, [
      {
        type: 'applyHintStep',
        step: { placements: [{ cell: 2, digit: 4 }], eliminations: [{ cell: 3, digit: 4 }, { cell: 5, digit: 2 }] },
      },
    ]);
    expect(s.values[2]).toBe(4);
    expect(s.notes[3]).toBe(bit(6));
    // r1c6 had no notes: it is filled with candidates, minus the eliminated 2
    expect(s.notes[5] & bit(2)).toBe(0);
    expect(s.notes[5]).not.toBe(0);
    expect(s.past.length).toBe(before + 1);
    s = run(s, [{ type: 'undo' }]);
    expect(s.values[2]).toBe(0);
    expect(s.notes[3]).toBe(bit(4) | bit(6));
    expect(s.notes[5]).toBe(0);
  });

  it('fixEntries clears only wrong entries; fixNotes adds the right digit; revealCell places the answer', () => {
    let s = run(newGame(), [
      { type: 'select', cell: 2 },
      { type: 'input', digit: 9 },
      { type: 'select', cell: 3 },
      { type: 'input', digit: 6 },
      { type: 'toggleNote', cell: 5, digit: 1 },
    ]);
    s = run(s, [{ type: 'fixEntries', cells: [2, 3] }]);
    expect(s.values[2]).toBe(0);
    expect(s.values[3]).toBe(6);
    s = run(s, [{ type: 'fixNotes', cells: [5] }]);
    expect(s.notes[5]).toBe(bit(1) | bit(SOLUTION[5]));
    s = run(s, [{ type: 'revealCell', cell: 2 }]);
    expect(s.values[2]).toBe(SOLUTION[2]);
  });
});
