import type { Difficulty } from '../engine';

export type GameStatus = 'playing' | 'paused' | 'completed';
export type GameSource = 'random' | 'daily' | 'custom' | 'practice' | 'lesson';

/**
 * Compact undo snapshot. `v` = 81 chars '0'-'9' (values), `n` = 81 x 2 base-36 chars (note masks),
 * `s` = selected cell (-1 for none). ~250 bytes each, so a 500-entry history stays small.
 */
export interface Snapshot {
  v: string;
  n: string;
  s: number;
}

/** Summary captured once, at the moment a game is completed (used by the completion screen). */
export interface CompletionSummary {
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
  isNewBest: boolean;
  previousBestMs: number | null;
  streak: number;
  newAchievements: string[];
}

export interface GameState {
  /** Unique id per attempt. Stats/history are keyed by it so a game is only ever counted once. */
  id: string;
  puzzle: number[];
  solution: number[];
  /** givens[i] is true when the cell was part of the puzzle (immutable). */
  givens: boolean[];
  values: number[];
  /** 9-bit note masks (bit d-1 = digit d). Always 0 for filled cells. */
  notes: number[];
  /** Selected cell index, -1 for none. */
  selected: number;
  /** Digit highlighted via digit-first tapping when no cell is selected (0 = none). */
  highlightDigit: number;
  notesMode: boolean;
  elapsedMs: number;
  /** Wrong placements counted while the mistake counter setting is on (shown to the player). */
  mistakes: number;
  /** Wrong placements always counted (used for "no-mistake win" stats/achievements, never shown as a penalty). */
  errors: number;
  hintsUsed: number;
  status: GameStatus;
  difficulty: Difficulty | null;
  source: GameSource;
  dailyKey?: string;
  seed: number | null;
  startedAt: number;
  completedAt: number | null;
  past: Snapshot[];
  future: Snapshot[];
  /** Player chose "continue anyway" after reaching the mistake limit. */
  livesOfferDismissed: boolean;
  /** Statistics/history have been recorded for this game id. */
  recorded: boolean;
  completion?: CompletionSummary;
}

/** Settings that influence reducer behaviour, passed per dispatch (settings can change mid-game). */
export interface ReducerConfig {
  autoRemoveNotes: boolean;
  countMistakes: boolean;
  now: number;
}

export const HISTORY_LIMIT = 500;
