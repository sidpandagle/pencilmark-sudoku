import { fireEvent, render, screen } from '@testing-library/react-native';
import { bit } from '../../engine';
import { PUZZLE, SOLUTION } from '../../game/testFixtures';
import { handleKey, type KeyboardHandlers } from '../game/useGameKeyboard';
import { Board, overlayFromStep } from '../board';
import { NumberPad } from '../components/NumberPad';

const givens = PUZZLE.map(Boolean);

describe('Board', () => {
  it('renders 81 cells with accessible labels', async () => {
    const notes = new Array(81).fill(0);
    notes[2] = bit(1) | bit(4) | bit(7);
    await render(<Board values={PUZZLE} givens={givens} notes={notes} size={360} selected={2} />);
    for (let i = 0; i < 81; i++) expect(screen.getByTestId(`cell-${i}`)).toBeTruthy();
    expect(screen.getByLabelText('Row 1, column 1, 5, given')).toBeTruthy();
    expect(screen.getByLabelText('Row 1, column 3, empty, notes 1, 4, 7')).toBeTruthy();
    expect(screen.getByTestId('cell-2').props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  });

  it('labels conflicts and wrong entries, and reports presses', async () => {
    const values = PUZZLE.slice();
    values[2] = 5; // duplicates the 5 in r1c1
    const onPress = jest.fn();
    await render(<Board values={values} givens={givens} solution={SOLUTION} highlights={{ autoCheck: true }} size={360} onCellPress={onPress} />);
    expect(screen.getByLabelText('Row 1, column 3, 5, conflict, incorrect')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cell-40'));
    expect(onPress).toHaveBeenCalledWith(40);
  });

  it('readOnly disables presses and candidates replace notes', async () => {
    const onPress = jest.fn();
    const cands = new Array(81).fill(0);
    cands[2] = bit(2) | bit(4);
    await render(<Board values={PUZZLE} givens={givens} candidates={cands} size={360} readOnly onCellPress={onPress} />);
    expect(screen.getByLabelText('Row 1, column 3, empty, candidates 2, 4')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cell-2'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('draws an overlay from an engine step', async () => {
    const step = {
      technique: 'x-wing' as const,
      placements: [],
      eliminations: [{ cell: 3, digit: 4 }],
      patternCells: [2, 20],
      units: [0, 9],
      candidates: [{ cell: 2, digit: 4, role: 'pattern' as const }],
      links: [{ from: { cell: 2, digit: 4 }, to: { cell: 20, digit: 4 }, type: 'strong' as const }],
      explanation: 'test',
    };
    const where = overlayFromStep(step, 'where');
    expect(where.candidates?.some((c) => c.role === 'eliminate')).toBe(false);
    const full = overlayFromStep(step, 'full');
    expect(full.candidates).toEqual(expect.arrayContaining([{ cell: 3, digit: 4, role: 'eliminate' }]));
    await render(<Board values={PUZZLE} givens={givens} size={360} overlay={full} />);
    expect(screen.getByTestId('board-overlay')).toBeTruthy();
    expect(screen.getByLabelText('Row 1, column 3, empty, highlighted by hint')).toBeTruthy();
  });
});

describe('NumberPad', () => {
  it('shows remaining counts and disables completed digits', async () => {
    const counts = [0, 9, 3, 0, 0, 0, 0, 0, 0, 1];
    const onDigit = jest.fn();
    await render(<NumberPad counts={counts} onDigit={onDigit} width={360} />);
    expect(screen.getByLabelText('1, all placed')).toBeTruthy();
    expect(screen.getByLabelText('2, 6 left')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('pad-1'));
    expect(onDigit).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('pad-2'));
    expect(onDigit).toHaveBeenCalledWith(2);
  });
});

describe('keyboard mapping', () => {
  const make = () => {
    const h: KeyboardHandlers = {
      digit: jest.fn(),
      move: jest.fn(),
      erase: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      toggleNotes: jest.fn(),
      hint: jest.fn(),
      pauseOrEscape: jest.fn(),
    };
    return h;
  };
  const ev = (key: string, extra: Partial<KeyboardEvent> = {}) =>
    ({ key, code: '', shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...extra }) as KeyboardEvent;

  it('maps shortcuts', async () => {
    const h = make();
    handleKey(ev('5', { code: 'Digit5' }), h);
    handleKey(ev('%', { code: 'Digit5', shiftKey: true }), h);
    handleKey(ev('ArrowLeft'), h);
    handleKey(ev('W'), h);
    handleKey(ev('Backspace'), h);
    handleKey(ev('0', { code: 'Digit0' }), h);
    handleKey(ev('z', { ctrlKey: true }), h);
    handleKey(ev('z', { metaKey: true, shiftKey: true }), h);
    handleKey(ev('y', { ctrlKey: true }), h);
    handleKey(ev('n'), h);
    handleKey(ev('h'), h);
    handleKey(ev('Escape'), h);
    expect(h.digit).toHaveBeenNthCalledWith(1, 5, false);
    expect(h.digit).toHaveBeenNthCalledWith(2, 5, true);
    expect(h.move).toHaveBeenNthCalledWith(1, 0, -1);
    expect(h.move).toHaveBeenNthCalledWith(2, -1, 0);
    expect(h.erase).toHaveBeenCalledTimes(2);
    expect(h.undo).toHaveBeenCalledTimes(1);
    expect(h.redo).toHaveBeenCalledTimes(2);
    expect(h.toggleNotes).toHaveBeenCalledTimes(1);
    expect(h.hint).toHaveBeenCalledTimes(1);
    expect(h.pauseOrEscape).toHaveBeenCalledWith('escape');
    expect(handleKey(ev('q'), h)).toBe(false);
  });
});
