import { fireEvent, render, screen } from '@testing-library/react-native';
import { EMPTY_CELLS, PUZZLE, SOLUTION } from '../../game/testFixtures';
import { startCustomGame } from '../../state/actions';
import { unbindPersistence } from '../../state/persistence';
import { gameStore, resetAllStores, statsStore } from '../../state/stores';
import { ThemeProvider } from '../../ui/ThemeContext';
import Play from '../play';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: (cb: () => void | (() => void)) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    require('react').useEffect(cb, []);
  },
}));

const renderPlay = () =>
  render(
    <ThemeProvider>
      <Play />
    </ThemeProvider>,
  );

jest.setTimeout(30_000);

beforeEach(() => {
  unbindPersistence();
  resetAllStores();
});

describe('Play screen', () => {
  it('shows a friendly empty state without a game', async () => {
    await renderPlay();
    expect(screen.getByText('No game in progress')).toBeTruthy();
  });

  it('renders the board, enters digits and notes, undoes, and completes', async () => {
    startCustomGame(PUZZLE, SOLUTION, 'easy');
    await renderPlay();
    expect(screen.getByTestId('play-screen')).toBeTruthy();
    expect(screen.getAllByLabelText(/^Row \d, column \d/)).toHaveLength(81);

    // place a digit
    await fireEvent.press(screen.getByTestId('cell-2'));
    await fireEvent.press(screen.getByTestId('pad-4'));
    expect(screen.getByLabelText('Row 1, column 3, 4')).toBeTruthy();

    // notes mode
    await fireEvent.press(screen.getByTestId('tool-notes'));
    expect(screen.getByLabelText('Notes mode on')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cell-3'));
    await fireEvent.press(screen.getByTestId('pad-1'));
    await fireEvent.press(screen.getByTestId('pad-2'));
    expect(screen.getByLabelText('Row 1, column 4, empty, notes 1, 2')).toBeTruthy();

    // undo restores notes step by step
    await fireEvent.press(screen.getByTestId('tool-undo'));
    expect(screen.getByLabelText('Row 1, column 4, empty, notes 1')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tool-notes'));

    // pause hides the board
    await fireEvent.press(screen.getByTestId('pause'));
    expect(screen.getByTestId('pause-overlay')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('resume'));
    expect(screen.queryByTestId('pause-overlay')).toBeNull();

    // solve the rest
    for (const c of EMPTY_CELLS) {
      if (gameStore.get()!.status === 'completed') break;
      await fireEvent.press(screen.getByTestId(`cell-${c}`));
      await fireEvent.press(screen.getByTestId(`pad-${SOLUTION[c]}`));
    }
    expect(screen.getByTestId('completion')).toBeTruthy();
    expect(screen.getByText('Puzzle solved')).toBeTruthy();
    expect(statsStore.get().buckets.easy.completed).toBe(1);
  }, 120_000);

  it('opens the hint panel and closes it', async () => {
    startCustomGame(PUZZLE, SOLUTION, 'easy');
    await renderPlay();
    await fireEvent.press(screen.getByTestId('cell-2'));
    await fireEvent.press(screen.getByTestId('pad-9')); // wrong entry -> mistake hint
    await fireEvent.press(screen.getByTestId('tool-hint'));
    expect(screen.getByTestId('hint-panel')).toBeTruthy();
    expect(screen.getByTestId('hint-fix')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('hint-fix'));
    expect(screen.queryByTestId('hint-panel')).toBeNull();
    expect(gameStore.get()!.values[2]).toBe(0);
  });
});
