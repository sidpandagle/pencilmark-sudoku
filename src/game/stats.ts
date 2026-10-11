import { DIFFICULTIES, type Difficulty } from '../engine';
import { addDays, localDateKey } from './dates';
import type { GameState } from './types';

export type StatsBucket = Difficulty | 'custom';
export const STATS_BUCKETS: readonly StatsBucket[] = [...DIFFICULTIES, 'custom'];

export interface BucketStats {
  started: number;
  completed: number;
  totalTimeMs: number;
  bestTimeMs: number | null;
  noMistakeWins: number;
}

export interface Stats {
  buckets: Record<StatsBucket, BucketStats>;
  /** Sorted unique local date keys on which at least one game was completed. */
  completedDays: string[];
  /** Date keys of completed daily challenges. */
  dailyCompleted: string[];
  longestStreak: number;
  totalHints: number;
  /** Game ids already counted as started / completed (guards against double counting). */
  startedIds: string[];
  recordedIds: string[];
}

const ID_MEMORY = 300;
const DAY_MEMORY = 800;

export const emptyBucket = (): BucketStats => ({
  started: 0,
  completed: 0,
  totalTimeMs: 0,
  bestTimeMs: null,
  noMistakeWins: 0,
});

export function emptyStats(): Stats {
  return {
    buckets: { easy: emptyBucket(), medium: emptyBucket(), hard: emptyBucket(), expert: emptyBucket(), custom: emptyBucket() },
    completedDays: [],
    dailyCompleted: [],
    longestStreak: 0,
    totalHints: 0,
    startedIds: [],
    recordedIds: [],
  };
}

export const bucketOf = (g: Pick<GameState, 'difficulty'>): StatsBucket => g.difficulty ?? 'custom';

const remember = (list: string[], id: string, cap: number) => [...list.filter((x) => x !== id), id].slice(-cap);

/** Count a game as started. Idempotent per game id. */
export function recordStart(stats: Stats, game: Pick<GameState, 'id' | 'difficulty'>): Stats {
  if (stats.startedIds.includes(game.id)) return stats;
  const key = bucketOf(game);
  const b = stats.buckets[key];
  return {
    ...stats,
    buckets: { ...stats.buckets, [key]: { ...b, started: b.started + 1 } },
    startedIds: remember(stats.startedIds, game.id, ID_MEMORY),
  };
}

/** Length of the run of consecutive days ending at `endKey` (inclusive). */
function runEndingAt(days: Set<string>, endKey: string): number {
  let n = 0;
  let k = endKey;
  while (days.has(k)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

/** Current streak: consecutive days with a completed game, ending today or yesterday. */
export function currentStreak(stats: Pick<Stats, 'completedDays'>, todayKey: string = localDateKey()): number {
  const days = new Set(stats.completedDays);
  if (days.has(todayKey)) return runEndingAt(days, todayKey);
  return runEndingAt(days, addDays(todayKey, -1));
}

export interface CompletionResult {
  stats: Stats;
  counted: boolean;
  isNewBest: boolean;
  previousBestMs: number | null;
  streak: number;
}

/** Record a completed game exactly once (keyed by game id). */
export function recordCompletion(stats: Stats, game: GameState, now: number = Date.now()): CompletionResult {
  const key = bucketOf(game);
  const prevBest = stats.buckets[key].bestTimeMs;
  if (stats.recordedIds.includes(game.id) || game.status !== 'completed') {
    return { stats, counted: false, isNewBest: false, previousBestMs: prevBest, streak: currentStreak(stats, localDateKey(now)) };
  }
  // A completed game implies it was started (covers games created before stats existed).
  const base = recordStart(stats, game);
  const b = base.buckets[key];
  const t = game.elapsedMs;
  const isNewBest = prevBest === null || t < prevBest;
  const today = localDateKey(game.completedAt ?? now);
  const completedDays = [...new Set([...base.completedDays, today])].sort().slice(-DAY_MEMORY);
  const dailyCompleted =
    game.source === 'daily' && game.dailyKey
      ? [...new Set([...base.dailyCompleted, game.dailyKey])].sort().slice(-DAY_MEMORY)
      : base.dailyCompleted;
  const streak = runEndingAt(new Set(completedDays), today);
  const next: Stats = {
    ...base,
    buckets: {
      ...base.buckets,
      [key]: {
        started: b.started,
        completed: b.completed + 1,
        totalTimeMs: b.totalTimeMs + t,
        bestTimeMs: isNewBest ? t : prevBest,
        noMistakeWins: b.noMistakeWins + (game.errors === 0 ? 1 : 0),
      },
    },
    completedDays,
    dailyCompleted,
    longestStreak: Math.max(base.longestStreak, streak),
    totalHints: base.totalHints + game.hintsUsed,
    recordedIds: remember(base.recordedIds, game.id, ID_MEMORY),
  };
  return { stats: next, counted: true, isNewBest, previousBestMs: prevBest, streak };
}

export function totals(stats: Stats) {
  let started = 0;
  let completed = 0;
  let totalTimeMs = 0;
  let noMistakeWins = 0;
  for (const k of STATS_BUCKETS) {
    const b = stats.buckets[k];
    started += b.started;
    completed += b.completed;
    totalTimeMs += b.totalTimeMs;
    noMistakeWins += b.noMistakeWins;
  }
  return { started, completed, totalTimeMs, noMistakeWins };
}

export const completionRate = (b: BucketStats) => (b.started ? b.completed / Math.max(b.started, b.completed) : 0);
export const averageTime = (b: BucketStats) => (b.completed ? b.totalTimeMs / b.completed : null);
