import { createMemoryStorage, storageKey } from '../../storage';
import { EMPTY_CELLS, PUZZLE, SOLUTION } from '../../game/testFixtures';
import { dispatchGame, finalizeCompletion, replayCurrent, startCustomGame } from '../actions';
import { flushNow, hydrate, unbindPersistence } from '../persistence';
import { achievementsStore, gameStore, historyStore, resetAllStores, statsStore } from '../stores';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function solveCurrent() {
  for (const c of EMPTY_CELLS) {
    dispatchGame({ type: 'select', cell: c });
    dispatchGame({ type: 'input', digit: SOLUTION[c] });
  }
}

beforeEach(() => {
  unbindPersistence();
  resetAllStores();
});

describe('completion bookkeeping', () => {
  it('records stats, history and achievements exactly once', () => {
    startCustomGame(PUZZLE, SOLUTION, 'easy');
    expect(statsStore.get().buckets.easy.started).toBe(1);
    solveCurrent();
    const g = gameStore.get()!;
    expect(g.status).toBe('completed');
    expect(g.recorded).toBe(true);
    expect(g.completion?.isNewBest).toBe(true);
    expect(statsStore.get().buckets.easy.completed).toBe(1);
    expect(historyStore.get()).toHaveLength(1);
    expect(achievementsStore.get()['first-win']).toBeGreaterThan(0);

    // Re-dispatching / re-finalizing (e.g. re-render or reload) must not double count.
    dispatchGame({ type: 'complete' });
    finalizeCompletion(g);
    finalizeCompletion({ ...g, recorded: false });
    expect(statsStore.get().buckets.easy.completed).toBe(1);
    expect(historyStore.get()).toHaveLength(1);
  });

  it('replay starts a new attempt that can be counted again', () => {
    startCustomGame(PUZZLE, SOLUTION, 'easy');
    solveCurrent();
    replayCurrent();
    expect(gameStore.get()!.status).toBe('playing');
    expect(statsStore.get().buckets.easy.started).toBe(2);
    solveCurrent();
    expect(statsStore.get().buckets.easy.completed).toBe(2);
    expect(historyStore.get()).toHaveLength(2);
  });

  it('archives an unfinished game with progress when a new one starts', () => {
    startCustomGame(PUZZLE, SOLUTION, 'easy');
    dispatchGame({ type: 'select', cell: EMPTY_CELLS[0] });
    dispatchGame({ type: 'input', digit: 1 });
    startCustomGame(PUZZLE, SOLUTION, 'medium');
    expect(historyStore.get()[0].result).toBe('abandoned');
  });
});

describe('hydrate + persistence', () => {
  it('saves the game (with notes and undo history) and restores it', async () => {
    const storage = createMemoryStorage();
    await hydrate(storage, 5);
    startCustomGame(PUZZLE, SOLUTION, 'hard');
    dispatchGame({ type: 'select', cell: 2 });
    dispatchGame({ type: 'input', digit: 4 });
    dispatchGame({ type: 'toggleNote', cell: 3, digit: 6 });
    await flushNow();
    expect(storage.data.has(storageKey('game'))).toBe(true);
    expect(storage.data.has(storageKey('gameUndo'))).toBe(true);
    const id = gameStore.get()!.id;

    unbindPersistence();
    resetAllStores();
    await hydrate(storage, 5);
    const g = gameStore.get()!;
    expect(g.id).toBe(id);
    expect(g.values[2]).toBe(4);
    expect(g.notes[3]).toBe(1 << 5);
    expect(g.past).toHaveLength(2);
    dispatchGame({ type: 'undo' });
    expect(gameStore.get()!.notes[3]).toBe(0);
    expect(statsStore.get().buckets.hard.started).toBe(1);
  });

  it('survives corrupted storage', async () => {
    const storage = createMemoryStorage({
      [storageKey('game')]: '{"v":1,"data":{"id":"x"}}',
      [storageKey('stats')]: 'not json',
      [storageKey('settings')]: '[]',
    });
    await hydrate(storage, 5);
    expect(gameStore.get()).toBeNull();
    expect(statsStore.get().buckets.easy.started).toBe(0);
  });

  it('drops persisted undo snapshots that would overwrite a given', async () => {
    const storage = createMemoryStorage();
    await hydrate(storage, 5);
    startCustomGame(PUZZLE, SOLUTION, 'easy');
    dispatchGame({ type: 'select', cell: EMPTY_CELLS[0] });
    dispatchGame({ type: 'input', digit: SOLUTION[EMPTY_CELLS[0]] });
    await flushNow();
    const undoKey = storageKey('gameUndo');
    const env = JSON.parse(storage.data.get(undoKey)!);
    const given = PUZZLE.findIndex((v) => v !== 0);
    const tampered = { ...env.data.past[0] };
    tampered.v = tampered.v.slice(0, given) + String((PUZZLE[given] % 9) + 1) + tampered.v.slice(given + 1);
    env.data.past = [tampered, ...env.data.past];
    storage.data.set(undoKey, JSON.stringify(env));

    unbindPersistence();
    resetAllStores();
    await hydrate(storage, 5);
    const g = gameStore.get()!;
    expect(g.past.every((s) => s.v.charCodeAt(given) - 48 === PUZZLE[given])).toBe(true);
    expect(g.past).toHaveLength(env.data.past.length - 1);
  });
});
