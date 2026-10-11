import {
  DEFAULT_SETTINGS,
  emptyStats,
  type GameState,
  type HistoryEntry,
  type Settings,
  type Stats,
  type UnlockedAchievements,
} from '../game';
import { emptyLearning, type LearningState } from '../learn/progress';
import type { Namespace } from '../storage';
import { createStore } from './store';

export const settingsStore = createStore<Settings>(DEFAULT_SETTINGS);
export const statsStore = createStore<Stats>(emptyStats());
export const historyStore = createStore<HistoryEntry[]>([]);
export const achievementsStore = createStore<UnlockedAchievements>({});
export const gameStore = createStore<GameState | null>(null);
/**
 * Learning progress (persisted under `pencilmark:learning`, schema v2). Owned by the learning feature
 * (src/learn/progress.ts); update it through the actions in src/state/learning.ts.
 */
export const learningStore = createStore<LearningState>(emptyLearning());

export interface AppMeta {
  hydrated: boolean;
  /** Namespaces whose stored data was unreadable and reset to defaults (a backup was kept). */
  recovered: Namespace[];
}
export const appStore = createStore<AppMeta>({ hydrated: false, recovered: [] });

/** Test helper: put every store back to its initial value. */
export function resetAllStores() {
  settingsStore.set(DEFAULT_SETTINGS);
  statsStore.set(emptyStats());
  historyStore.set([]);
  achievementsStore.set({});
  gameStore.set(null);
  learningStore.set(emptyLearning());
  appStore.set({ hydrated: false, recovered: [] });
}
