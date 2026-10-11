import { AppState, Platform } from 'react-native';
import { evaluateAchievements, type GameState, type HistoryEntry, type Settings, type Stats, type UnlockedAchievements } from '../game';
import {
  UNDO_PERSIST_LIMIT,
  asyncStorageAdapter,
  createPersister,
  loadNamespace,
  type KeyValueStorage,
  type Namespace,
  type PersistedGame,
  type PersistedUndo,
  type Persister,
} from '../storage';
import type { LearningState } from '../learn/progress';
import { achievementsStore, appStore, gameStore, historyStore, learningStore, settingsStore, statsStore } from './stores';

let persister: Persister | null = null;
let unbind: (() => void) | null = null;

export function getPersister() {
  return persister;
}

/** Load every namespace into the stores, then start persisting changes. Safe to call more than once. */
export async function hydrate(storage: KeyValueStorage = asyncStorageAdapter, delayMs = 400): Promise<void> {
  if (appStore.get().hydrated) return;
  const recovered: Namespace[] = [];
  const track = <T,>(ns: Namespace, r: { value: T; status: string }) => {
    if (r.status === 'recovered') recovered.push(ns);
    return r.value;
  };
  const [settings, stats, history, achievements, game, undo, learning] = await Promise.all([
    loadNamespace<Settings>(storage, 'settings').then((r) => track('settings', r)),
    loadNamespace<Stats>(storage, 'stats').then((r) => track('stats', r)),
    loadNamespace<HistoryEntry[]>(storage, 'history').then((r) => track('history', r)),
    loadNamespace<UnlockedAchievements>(storage, 'achievements').then((r) => track('achievements', r)),
    loadNamespace<PersistedGame | null>(storage, 'game').then((r) => track('game', r)),
    loadNamespace<PersistedUndo | null>(storage, 'gameUndo').then((r) => track('gameUndo', r)),
    loadNamespace<LearningState>(storage, 'learning').then((r) => track('learning', r)),
  ]);

  settingsStore.set(settings);
  statsStore.set(stats);
  historyStore.set(history);
  learningStore.set(learning);
  const ach = evaluateAchievements({ stats, history }, achievements);
  achievementsStore.set(ach.unlocked);
  if (game) {
    const matching = undo && undo.id === game.id ? undo : null;
    // Snapshots are validated in isolation; also drop any that would overwrite a given of this puzzle.
    const keepsGivens = (s: PersistedUndo['past'][number]) =>
      game.puzzle.every((v, i) => !v || s.v.charCodeAt(i) - 48 === v);
    gameStore.set({
      ...game,
      past: (matching?.past ?? []).filter(keepsGivens),
      future: (matching?.future ?? []).filter(keepsGivens),
    });
  } else {
    gameStore.set(null);
  }

  bindPersistence(storage, delayMs);
  appStore.set({ hydrated: true, recovered });
}

function stripUndo(g: GameState): PersistedGame {
  const { past: _p, future: _f, ...rest } = g;
  return rest;
}

export function bindPersistence(storage: KeyValueStorage, delayMs = 400) {
  unbind?.();
  const p = createPersister(storage, delayMs);
  persister = p;
  let lastGame = gameStore.get();
  const subs = [
    settingsStore.subscribe(() => p.schedule('settings', () => settingsStore.get())),
    statsStore.subscribe(() => p.schedule('stats', () => statsStore.get())),
    historyStore.subscribe(() => p.schedule('history', () => historyStore.get())),
    achievementsStore.subscribe(() => p.schedule('achievements', () => achievementsStore.get())),
    learningStore.subscribe(() => p.schedule('learning', () => learningStore.get())),
    gameStore.subscribe(() => {
      const g = gameStore.get();
      const prev = lastGame;
      lastGame = g;
      p.schedule('game', () => {
        const cur = gameStore.get();
        return cur ? stripUndo(cur) : null;
      });
      // Undo history is large-ish: only rewrite it when it actually changed (not on timer ticks).
      if (!g || !prev || g.id !== prev.id || g.past !== prev.past || g.future !== prev.future) {
        p.schedule('gameUndo', () => {
          const cur = gameStore.get();
          return cur
            ? { id: cur.id, past: cur.past.slice(-UNDO_PERSIST_LIMIT), future: cur.future.slice(-UNDO_PERSIST_LIMIT) }
            : null;
        });
      }
    }),
  ];

  const appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'background' || state === 'inactive') void p.flush();
  });
  let removeWeb: (() => void) | null = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
    const onHide = () => void p.flush();
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    removeWeb = () => {
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }

  unbind = () => {
    subs.forEach((u) => u());
    appStateSub.remove();
    removeWeb?.();
  };
}

/** Write everything pending right now. */
export async function flushNow() {
  await persister?.flush();
}

/** Test helper. */
export function unbindPersistence() {
  unbind?.();
  unbind = null;
  persister = null;
}
