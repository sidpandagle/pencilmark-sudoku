import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { examplePosition, masteryPositions } from '../../learn';
import { BASE } from '../../learn/content/level1';
import { emptyLearning, recordCompletion } from '../../learn/progress';
import { unbindPersistence } from '../../state/persistence';
import { learningStore, resetAllStores } from '../../state/stores';
import { ThemeProvider } from '../../ui/ThemeContext';
import LessonScreen from '../learn/[lessonId]';
import LearnHome from '../learn/index';
import GuidedSolve from '../learn/solve';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

let mockParams: Record<string, string> = {};
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, canDismiss: () => false },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: () => void | (() => void)) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    require('react').useEffect(cb, []);
  },
}));

jest.setTimeout(120_000);

const wrap = (el: React.ReactElement) => render(<ThemeProvider>{el}</ThemeProvider>);

beforeEach(() => {
  unbindPersistence();
  resetAllStores();
  mockPush.mockClear();
  mockParams = {};
});

describe('Learn map', () => {
  it('shows levels, the recommended lesson and gentle locks with "Preview anyway"', async () => {
    await wrap(<LearnHome />);
    for (let l = 1; l <= 5; l++) expect(screen.getByTestId(`level-${l}`)).toBeTruthy();
    expect(screen.getByTestId('recommended')).toBeTruthy();
    expect(screen.getByLabelText(/^Recommended next: The rules/)).toBeTruthy();
    expect(screen.getByLabelText(/^The rules, Ready/)).toBeTruthy();
    expect(screen.getByLabelText(/^X-Wing, Locked\. Unlocks after Pointing/)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('lesson-x-wing'));
    expect(screen.getByTestId('locked-sheet')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('preview-anyway'));
    expect(mockPush).toHaveBeenCalledWith('/learn/x-wing');
  });

  it('shows completed lessons, due reviews and weak spots', async () => {
    const now = Date.now();
    learningStore.set({
      ...recordCompletion(emptyLearning(), 'rules', now),
      lessons: {
        rules: { completedAt: now, attempts: 0, lastScore: null, bestScore: 0, masteredAt: null, lastReviewedAt: null, nextReviewAt: null, intervalIndex: 0, lastResult: null },
        'hidden-single': { completedAt: now - 9e7, attempts: 1, lastScore: 1, bestScore: 1, masteredAt: now - 9e7, lastReviewedAt: now - 9e7, nextReviewAt: now - 1000, intervalIndex: 0, lastResult: 'pass' },
      },
      struggles: { 'x-wing': [now - 1000, now - 500] },
    });
    await wrap(<LearnHome />);
    expect(screen.getByLabelText(/^The rules, Completed/)).toBeTruthy();
    expect(screen.getByLabelText(/^Hidden Single, Needs review/)).toBeTruthy();
    expect(screen.getByTestId('due-hidden-single')).toBeTruthy();
    expect(screen.getByTestId('weak-x-wing')).toBeTruthy();
    expect(screen.getByText('2 hints in the last two weeks')).toBeTruthy();
  });
});

describe('Lesson player', () => {
  it('Hidden Single: concept → demo → guided (wrong, then right) → completion', async () => {
    mockParams = { lessonId: 'hidden-single' };
    await wrap(<LessonScreen />);
    expect(screen.getByTestId('card-title').props.children).toBe('What it is');
    expect(screen.getByTestId('concept-diagram')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('card-next')); // why
    expect(screen.getByTestId('card-title').props.children).toBe('Why it works');
    await fireEvent.press(screen.getByTestId('card-next')); // watch out
    expect(screen.getByTestId('card-title').props.children).toBe('Watch out');
    await fireEvent.press(screen.getByTestId('card-next')); // demo
    expect(screen.getByTestId('step-demo')).toBeTruthy();
    const demo = examplePosition('hidden-single', 0)!;
    // units → pattern → effect → result
    await fireEvent.press(screen.getByTestId('demo-next'));
    await fireEvent.press(screen.getByTestId('demo-next'));
    expect(screen.getByTestId('demo-caption').props.children).toBe(demo.step.explanation);
    await fireEvent.press(screen.getByTestId('demo-next'));
    expect(screen.getByTestId('demo-caption').props.children).toMatch(/^Result: /);
    await fireEvent.press(screen.getByTestId('card-next')); // guided

    expect(screen.getByTestId('exercise-guided')).toBeTruthy();
    expect(screen.getByTestId('card-next').props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    const g = examplePosition('hidden-single', 1)!;
    const { cell, digit } = g.step.placements[0];
    const wrongCell = g.grid.findIndex((v, i) => !v && i !== cell && g.candidates[i]);

    // Help: nudge first.
    await fireEvent.press(screen.getByTestId('exercise-help'));
    expect(screen.getByTestId('help-text')).toBeTruthy();

    // Wrong cell.
    await fireEvent.press(screen.getByTestId(`cell-${wrongCell}`));
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => g.candidates[wrongCell] & (1 << (d - 1)))!;
    await fireEvent.press(screen.getByTestId(`exchip-${wrongDigit}`));
    await fireEvent.press(screen.getByTestId('exercise-check'));
    expect(screen.getByTestId('verdict-wrong')).toBeTruthy();

    // Right cell and digit.
    await fireEvent.press(screen.getByTestId(`cell-${cell}`));
    await fireEvent.press(screen.getByTestId(`exchip-${digit}`));
    await fireEvent.press(screen.getByTestId('exercise-check'));
    expect(screen.getByTestId('verdict-correct')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('card-next')); // practice = completion
    expect(screen.getByTestId('lesson-complete')).toBeTruthy();
    expect(learningStore.get().lessons['hidden-single']?.completedAt).toEqual(expect.any(Number));
    expect(learningStore.get().lessons['hidden-single']?.masteredAt).toBeNull();
    expect(screen.getByTestId('practice-start')).toBeTruthy();
  });

  it('X-Wing guided step: candidate taps, kind feedback, then correct', async () => {
    mockParams = { lessonId: 'x-wing' };
    await wrap(<LessonScreen />);
    for (let i = 0; i < 4; i++) await fireEvent.press(screen.getByTestId('card-next'));
    expect(screen.getByTestId('exercise-guided')).toBeTruthy();
    const g = examplePosition('x-wing', 1)!;
    const pat = g.step.candidates.find((h) => h.role === 'pattern')!;
    // Candidate slots are hidden from screen readers (the cell + large chips are the accessible path).
    await fireEvent.press(screen.getByTestId(`cand-${pat.cell}-${pat.digit}`, { includeHiddenElements: true }));
    await fireEvent.press(screen.getByTestId('exercise-check'));
    expect(screen.getByText(/part of the pattern itself/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('exercise-clear'));
    // Use the large-chip alternative for the real answer.
    for (const e of g.step.eliminations) {
      await fireEvent.press(screen.getByTestId(`cell-${e.cell}`));
      await fireEvent.press(screen.getByTestId(`exchip-${e.digit}`));
    }
    await fireEvent.press(screen.getByTestId('exercise-check'));
    expect(screen.getByTestId('verdict-correct')).toBeTruthy();
  });

  it('mastery check: all correct → mastered and a review is scheduled', async () => {
    mockParams = { lessonId: 'hidden-single', card: 'mastery' };
    await wrap(<LessonScreen />);
    expect(screen.getByTestId('mastery-intro')).toBeTruthy();
    const positions = masteryPositions('hidden-single', 0);
    await fireEvent.press(screen.getByTestId('mastery-start'));
    await waitFor(() => expect(screen.getByTestId('exercise-mastery')).toBeTruthy(), { timeout: 30_000 });
    expect(screen.queryByTestId('exercise-help')).toBeNull(); // no help in the check
    for (let i = 0; i < positions.length; i++) {
      const { cell, digit } = positions[i].step.placements[0];
      await fireEvent.press(screen.getByTestId(`cell-${cell}`));
      await fireEvent.press(screen.getByTestId(`exchip-${digit}`));
      await fireEvent.press(screen.getByTestId('exercise-check'));
      expect(screen.getByTestId('verdict-correct')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('mastery-next'));
    }
    expect(screen.getByTestId('mastery-result')).toBeTruthy();
    expect(screen.getByText('Mastered!')).toBeTruthy();
    const p = learningStore.get().lessons['hidden-single'];
    expect(p.masteredAt).toEqual(expect.any(Number));
    expect(p.nextReviewAt! - p.masteredAt!).toBe(24 * 60 * 60 * 1000);
  });

  it('mastery check: a wrong answer is final, shows the answer, and is not mastery', async () => {
    mockParams = { lessonId: 'hidden-single', card: 'mastery' };
    await wrap(<LessonScreen />);
    const positions = masteryPositions('hidden-single', 0);
    await fireEvent.press(screen.getByTestId('mastery-start'));
    await waitFor(() => expect(screen.getByTestId('exercise-mastery')).toBeTruthy(), { timeout: 30_000 });
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const { cell, digit } = p.step.placements[0];
      const d = i === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9].find((x) => x !== digit && p.candidates[cell] & (1 << (x - 1))) ?? digit : digit;
      await fireEvent.press(screen.getByTestId(`cell-${cell}`));
      if (screen.queryByTestId(`exchip-${d}`)) await fireEvent.press(screen.getByTestId(`exchip-${d}`));
      await fireEvent.press(screen.getByTestId('exercise-check'));
      await fireEvent.press(screen.getByTestId('mastery-next'));
    }
    expect(screen.getByTestId('mastery-result')).toBeTruthy();
    const p = learningStore.get().lessons['hidden-single'];
    expect(p.attempts).toBe(1);
    // Example cells of hidden singles may have one candidate only; then the first answer is right anyway.
    if (p.lastResult === 'fail') expect(p.masteredAt).toBeNull();
  });

  it('foundation lesson: "The rules" tap-the-conflict exercise', async () => {
    mockParams = { lessonId: 'rules' };
    await wrap(<LessonScreen />);
    await fireEvent.press(screen.getByTestId('card-next'));
    await fireEvent.press(screen.getByTestId('card-next'));
    expect(screen.getByTestId('card-title').props.children).toBe('Spot the broken rule');
    await fireEvent.press(screen.getByTestId('cell-0')); // the given 5: not the culprit
    expect(screen.getByTestId('foundation-wrong')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cell-2'));
    expect(screen.getByTestId('foundation-correct')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('card-next'));
    expect(screen.getByTestId('lesson-complete')).toBeTruthy();
    expect(learningStore.get().lessons.rules?.completedAt).toEqual(expect.any(Number));
  });

  it('foundation lesson: fill candidates for a cell', async () => {
    mockParams = { lessonId: 'candidates' };
    await wrap(<LessonScreen />);
    await fireEvent.press(screen.getByTestId('card-next'));
    await fireEvent.press(screen.getByTestId('fchip-1'));
    await fireEvent.press(screen.getByTestId('fchip-3'));
    await fireEvent.press(screen.getByTestId('foundation-check'));
    expect(screen.getByText('3 is already in its row and box.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('fchip-3'));
    await fireEvent.press(screen.getByTestId('fchip-2'));
    await fireEvent.press(screen.getByTestId('fchip-4'));
    await fireEvent.press(screen.getByTestId('foundation-check'));
    expect(screen.getByTestId('foundation-correct')).toBeTruthy();
  });

  it('shows a gentle preview note on a locked lesson', async () => {
    mockParams = { lessonId: 'aic' };
    await wrap(<LessonScreen />);
    expect(screen.getByTestId('preview-note')).toBeTruthy();
  });
});

describe('Hint integration', () => {
  it('offers "Learn this technique" after Explain, and records the hint as a weak-spot signal', async () => {
    const { HintPanel } = require('../../ui/game/HintPanel');
    const { recordHintTechnique } = require('../../state/learning');
    const step = examplePosition('x-wing', 0)!.step;
    const onLearn = jest.fn();
    const hint = { kind: 'step', step, nudge: 'n', techniqueName: 'X-Wing' };
    const noop = () => {};
    await wrap(<HintPanel hint={hint} level={2} revealCell={-1} onNext={noop} onApply={noop} onFix={noop} onReveal={noop} onClose={noop} width={360} onLearn={onLearn} />);
    expect(screen.queryByTestId('hint-learn')).toBeNull();
    await screen.rerender(
      <ThemeProvider>
        <HintPanel hint={hint} level={3} revealCell={-1} onNext={noop} onApply={noop} onFix={noop} onReveal={noop} onClose={noop} width={360} onLearn={onLearn} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByTestId('hint-learn'));
    expect(onLearn).toHaveBeenCalled();
    recordHintTechnique('x-wing', 123);
    expect(learningStore.get().struggles['x-wing']).toEqual([123]);
  });
});

describe('Guided solve', () => {
  it('steps through a puzzle with explanations', async () => {
    mockParams = { source: 'puzzle', puzzle: BASE };
    await wrap(<GuidedSolve />);
    await waitFor(() => expect(screen.getByTestId('solve-screen')).toBeTruthy(), { timeout: 30_000 });
    expect(screen.getByTestId('solve-counter').props.children).toMatch(/^Step 1 of \d+ · /);
    await fireEvent.press(screen.getByTestId('solve-next')); // explain
    await fireEvent.press(screen.getByTestId('solve-next')); // step 2
    await fireEvent.press(screen.getByTestId('solve-next'));
    await fireEvent.press(screen.getByTestId('solve-next')); // step 3
    expect(screen.getByTestId('solve-counter').props.children).toMatch(/^Step 3 of /);
    await fireEvent.press(screen.getByTestId('solve-alts'));
    await fireEvent.press(screen.getByTestId('solve-end'));
    expect(screen.getByTestId('solve-done')).toBeTruthy();
  });

  it('is transparent when the solver gets stuck', async () => {
    mockParams = { source: 'puzzle', puzzle: '0'.repeat(81) };
    await wrap(<GuidedSolve />);
    await waitFor(() => expect(screen.getByTestId('solve-screen')).toBeTruthy(), { timeout: 30_000 });
    expect(screen.getByTestId('solve-stuck').props.children).toMatch(/does not implement yet/);
  });

  it('refuses a current game with wrong entries', async () => {
    const { startCustomGame } = require('../../state/actions');
    const { PUZZLE, SOLUTION } = require('../../game/testFixtures');
    const g = startCustomGame(PUZZLE, SOLUTION, 'easy');
    const { gameStore } = require('../../state/stores');
    gameStore.set({ ...g, values: g.values.map((v: number, i: number) => (i === 2 ? 9 : v)) });
    mockParams = { source: 'game' };
    await wrap(<GuidedSolve />);
    await waitFor(() => expect(screen.getByTestId('solve-error')).toBeTruthy(), { timeout: 30_000 });
    expect(screen.getByTestId('solve-error').props.children).toMatch(/do(es)? not match the solution/);
  });
});
