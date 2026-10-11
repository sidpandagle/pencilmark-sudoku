import { createGame, DEFAULT_SETTINGS, emptyStats, gameReducer, type GameState } from '../../game';
import { PUZZLE, SOLUTION } from '../../game/testFixtures';
import { createMemoryStorage } from '../adapter';
import { createPersister } from '../persister';
import { BACKUP_PREFIX, loadNamespace, saveNamespace, storageKey } from '../schema';
import { sanitizeGame, sanitizeHistory, sanitizeSettings, sanitizeStats, sanitizeUndo, type PersistedGame } from '../validate';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const game = (): GameState => createGame({ puzzle: PUZZLE, solution: SOLUTION, difficulty: 'easy', source: 'random', id: 'g1', now: 5 });

describe('loadNamespace', () => {
  it('returns defaults for missing data', async () => {
    const st = createMemoryStorage();
    expect(await loadNamespace(st, 'settings')).toEqual({ value: DEFAULT_SETTINGS, status: 'missing' });
    expect((await loadNamespace(st, 'game')).value).toBeNull();
    expect((await loadNamespace(st, 'learning')).value).toEqual({ lessons: {}, struggles: {} });
  });

  it('round-trips saved data', async () => {
    const st = createMemoryStorage();
    await saveNamespace(st, 'settings', { ...DEFAULT_SETTINGS, theme: 'dark' });
    const r = await loadNamespace<typeof DEFAULT_SETTINGS>(st, 'settings');
    expect(r.status).toBe('ok');
    expect(r.value.theme).toBe('dark');
  });

  it('recovers from corrupt JSON and keeps a backup', async () => {
    const st = createMemoryStorage({ [storageKey('stats')]: '{not json' });
    const r = await loadNamespace(st, 'stats');
    expect(r.status).toBe('recovered');
    expect(r.value).toEqual(emptyStats());
    expect(st.data.get(`${BACKUP_PREFIX}stats`)).toBe('{not json');
  });

  it('recovers from a future schema version', async () => {
    const raw = JSON.stringify({ v: 99, data: {} });
    const st = createMemoryStorage({ [storageKey('settings')]: raw });
    const r = await loadNamespace(st, 'settings');
    expect(r.status).toBe('recovered');
    expect(st.data.get(`${BACKUP_PREFIX}settings`)).toBe(raw);
  });

  it('migrates v0 (un-enveloped) settings', async () => {
    const st = createMemoryStorage({ [storageKey('settings')]: JSON.stringify({ darkMode: true, autoCheck: true }) });
    const r = await loadNamespace<typeof DEFAULT_SETTINGS>(st, 'settings');
    expect(r.status).toBe('migrated');
    expect(r.value.theme).toBe('dark');
    expect(r.value.autoCheck).toBe(true);
    expect((r.value as unknown as Record<string, unknown>).darkMode).toBeUndefined();
  });

  it('discards a structurally invalid game but keeps a backup', async () => {
    const bad = { ...game(), values: [1, 2, 3] };
    const raw = JSON.stringify({ v: 1, data: bad });
    const st = createMemoryStorage({ [storageKey('game')]: raw });
    const r = await loadNamespace(st, 'game');
    expect(r.value).toBeNull();
    expect(r.status).toBe('recovered');
    expect(st.data.get(`${BACKUP_PREFIX}game`)).toBe(raw);
  });

  it('never throws when the storage itself fails', async () => {
    const st = { getItem: () => Promise.reject(new Error('boom')), setItem: () => Promise.resolve(), removeItem: () => Promise.resolve() };
    await expect(loadNamespace(st, 'history')).resolves.toEqual({ value: [], status: 'missing' });
  });
});

describe('sanitizers', () => {
  it('repairs settings field by field', () => {
    const s = sanitizeSettings({ theme: 'neon', autoCheck: 'yes', showTimer: false, mistakeLimit: 7 });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, showTimer: false });
  });

  it('repairs stats', () => {
    const s = sanitizeStats({ buckets: { easy: { started: -3, completed: 2, totalTimeMs: 'x', bestTimeMs: 50, noMistakeWins: 9 } }, completedDays: ['2026-01-01', 'bad', 3] });
    expect(s.buckets.easy).toEqual({ started: 2, completed: 2, totalTimeMs: 0, bestTimeMs: 50, noMistakeWins: 2 });
    expect(s.buckets.medium.started).toBe(0);
    expect(s.completedDays).toEqual(['2026-01-01']);
    expect(sanitizeStats('garbage')).toEqual(emptyStats());
  });

  it('filters invalid history entries', () => {
    const good = { id: 'a', puzzle: PUZZLE.join(''), solution: SOLUTION.join(''), difficulty: 'easy', source: 'random', startedAt: 1, endedAt: 2, timeMs: 3, result: 'completed', mistakes: 0, errors: 0, hintsUsed: 0 };
    const h = sanitizeHistory([good, { ...good, id: 'b', puzzle: 'short' }, null, 5, { ...good }]);
    expect(h.map((e) => e.id)).toEqual(['a']);
  });

  it('accepts a valid game and rejects tampered ones', () => {
    const g = gameReducer(game(), { type: 'toggleNote', cell: 2, digit: 1 });
    const { past: _p, future: _f, ...persisted } = g;
    const ok = sanitizeGame(JSON.parse(JSON.stringify(persisted)));
    expect(ok).not.toBeNull();
    expect((ok as PersistedGame).notes[2]).toBe(1);
    expect(sanitizeGame({ ...persisted, solution: PUZZLE })).toBeNull(); // not a complete solution
    const changedGiven = persisted.values.slice();
    changedGiven[0] = 9;
    expect(sanitizeGame({ ...persisted, values: changedGiven })).toBeNull();
    expect(sanitizeGame({ ...persisted, notes: persisted.notes.map(() => 9999) })).toBeNull();
    expect(sanitizeGame(null)).toBeNull();
  });

  it('drops invalid undo snapshots', () => {
    const u = sanitizeUndo({ id: 'g1', past: [{ v: '0'.repeat(81), n: '00'.repeat(81), s: -1 }, { v: 'x', n: '', s: 0 }], future: 'nope' });
    expect(u?.past).toHaveLength(1);
    expect(u?.future).toEqual([]);
  });
});

describe('persister', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('debounces writes and writes the latest value', async () => {
    const st = createMemoryStorage();
    const spy = jest.spyOn(st, 'setItem');
    const p = createPersister(st, 400);
    let value = 1;
    p.schedule('learning', () => ({ value }));
    value = 2;
    p.schedule('learning', () => ({ value }));
    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    await p.flush();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(st.data.get(storageKey('learning')) as string).data).toEqual({ value: 2 });
  });

  it('flush writes immediately', async () => {
    const st = createMemoryStorage();
    const p = createPersister(st, 10_000);
    p.schedule('settings', () => DEFAULT_SETTINGS);
    await p.flush();
    expect(st.data.has(storageKey('settings'))).toBe(true);
    expect(p.pendingCount()).toBe(0);
  });

  it('null removes the key', async () => {
    const st = createMemoryStorage({ [storageKey('game')]: 'x' });
    const p = createPersister(st, 10);
    p.schedule('game', () => null);
    await p.flush();
    expect(st.data.has(storageKey('game'))).toBe(false);
  });
});
