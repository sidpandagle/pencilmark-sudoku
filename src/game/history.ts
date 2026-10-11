import type { Difficulty } from '../engine';
import { encodeValues } from './encode';
import type { GameSource, GameState } from './types';

export interface HistoryEntry {
  id: string;
  /** 81-char puzzle string, '0' for blanks. */
  puzzle: string;
  solution: string;
  difficulty: Difficulty | null;
  source: GameSource;
  dailyKey?: string;
  startedAt: number;
  endedAt: number;
  timeMs: number;
  result: 'completed' | 'abandoned';
  mistakes: number;
  errors: number;
  hintsUsed: number;
}

export const HISTORY_MAX = 200;

export function historyEntryFrom(game: GameState, result: HistoryEntry['result'], now: number = Date.now()): HistoryEntry {
  return {
    id: game.id,
    puzzle: encodeValues(game.puzzle),
    solution: encodeValues(game.solution),
    difficulty: game.difficulty,
    source: game.source,
    dailyKey: game.dailyKey,
    startedAt: game.startedAt,
    endedAt: game.completedAt ?? now,
    timeMs: game.elapsedMs,
    result,
    mistakes: game.mistakes,
    errors: game.errors,
    hintsUsed: game.hintsUsed,
  };
}

/** Add (or replace by id) an entry at the front, newest first, capped at HISTORY_MAX. */
export function addHistory(list: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...list.filter((e) => e.id !== entry.id)].slice(0, HISTORY_MAX);
}

/** A game is worth recording as abandoned only if the player actually did something. */
export function hasProgress(game: GameState): boolean {
  return game.past.length > 0 || game.values.some((v, i) => v !== game.puzzle[i]);
}

export interface Trend {
  /** Completed solve times (ms), oldest first, at most `window * 2`. */
  recent: number[];
  /** Average of the latest `window` solves minus the `window` before them (negative = faster). */
  deltaMs: number | null;
}

/**
 * Personal trend for one difficulty from local history: the latest completed (non-custom) solve times and
 * how the last `window` compare with the `window` before them. Needs 2 × window solves for a delta.
 */
export function difficultyTrend(history: readonly HistoryEntry[], difficulty: Difficulty, window = 5): Trend {
  const times = history
    .filter((h) => h.result === 'completed' && h.difficulty === difficulty && h.source !== 'custom' && h.timeMs > 0)
    .sort((a, b) => a.endedAt - b.endedAt)
    .map((h) => h.timeMs);
  const recent = times.slice(-window * 2);
  if (recent.length < window * 2) return { recent, deltaMs: null };
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  return { recent, deltaMs: Math.round(avg(recent.slice(window)) - avg(recent.slice(0, window))) };
}
