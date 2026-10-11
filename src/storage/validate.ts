/**
 * Runtime validation for everything read from storage. Each sanitizer either returns a fully valid
 * value (repairing what it safely can, field by field) or `null` / defaults when the data is unusable.
 * Nothing in here throws for any input.
 */
import { DIFFICULTIES, isCompleteAndValid, type Difficulty } from '../engine';
import { sanitizeLearning as sanitizeLearningState, type LearningState } from '../learn/progress';
import {
  ACHIEVEMENTS,
  DATE_KEY_RE,
  DEFAULT_SETTINGS,
  HISTORY_MAX,
  MISTAKE_LIMIT_OPTIONS,
  STATS_BUCKETS,
  emptyBucket,
  emptyStats,
  isValidSnapshot,
  type BucketStats,
  type CompletionSummary,
  type GameSource,
  type GameState,
  type GameStatus,
  type HistoryEntry,
  type Settings,
  type Snapshot,
  type Stats,
  type UnlockedAchievements,
} from '../game';

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);
const isNonNegInt = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0;
const isFiniteNonNeg = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const nonNeg = (x: unknown, fallback = 0) => (isFiniteNonNeg(x) ? Math.floor(x) : fallback);

export function isGrid(x: unknown): x is number[] {
  return Array.isArray(x) && x.length === 81 && x.every((v) => Number.isInteger(v) && v >= 0 && v <= 9);
}

const isDifficulty = (x: unknown): x is Difficulty => typeof x === 'string' && (DIFFICULTIES as readonly string[]).includes(x);
const SOURCES: readonly GameSource[] = ['random', 'daily', 'custom', 'practice', 'lesson'];
const STATUSES: readonly GameStatus[] = ['playing', 'paused', 'completed'];

// ---------------------------------------------------------------- settings

export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (!isObj(raw)) return out;
  if (raw.theme === 'system' || raw.theme === 'light' || raw.theme === 'dark') out.theme = raw.theme;
  const bools: (keyof Settings)[] = [
    'highContrast',
    'highlightPeers',
    'highlightSameDigit',
    'highlightConflicts',
    'autoCheck',
    'mistakeCounter',
    'showTimer',
    'autoRemoveNotes',
    'reduceMotion',
    'haptics',
    'sound',
    'keepAwake',
  ];
  for (const k of bools) if (typeof raw[k] === 'boolean') (out as unknown as Obj)[k] = raw[k];
  if ((MISTAKE_LIMIT_OPTIONS as readonly unknown[]).includes(raw.mistakeLimit)) out.mistakeLimit = raw.mistakeLimit as number;
  if (raw.padLayout === 'row' || raw.padLayout === 'grid') out.padLayout = raw.padLayout;
  return out;
}

// ---------------------------------------------------------------- stats

function sanitizeBucket(raw: unknown): BucketStats {
  if (!isObj(raw)) return emptyBucket();
  const completed = nonNeg(raw.completed);
  return {
    started: Math.max(nonNeg(raw.started), completed),
    completed,
    totalTimeMs: nonNeg(raw.totalTimeMs),
    bestTimeMs: isFiniteNonNeg(raw.bestTimeMs) && completed > 0 ? Math.floor(raw.bestTimeMs) : null,
    noMistakeWins: Math.min(nonNeg(raw.noMistakeWins), completed),
  };
}

const stringList = (x: unknown, re: RegExp | null, cap: number) =>
  Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string' && s.length < 64 && (!re || re.test(s))).slice(-cap) : [];

export function sanitizeStats(raw: unknown): Stats {
  const out = emptyStats();
  if (!isObj(raw)) return out;
  const buckets = isObj(raw.buckets) ? raw.buckets : {};
  for (const k of STATS_BUCKETS) out.buckets[k] = sanitizeBucket(buckets[k]);
  out.completedDays = [...new Set(stringList(raw.completedDays, DATE_KEY_RE, 800))].sort();
  out.dailyCompleted = [...new Set(stringList(raw.dailyCompleted, DATE_KEY_RE, 800))].sort();
  out.longestStreak = nonNeg(raw.longestStreak);
  out.totalHints = nonNeg(raw.totalHints);
  out.startedIds = stringList(raw.startedIds, null, 300);
  out.recordedIds = stringList(raw.recordedIds, null, 300);
  return out;
}

// ---------------------------------------------------------------- history

const GRID_STR = /^[0-9]{81}$/;

function sanitizeHistoryEntry(raw: unknown): HistoryEntry | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id.length > 64) return null;
  if (typeof raw.puzzle !== 'string' || !GRID_STR.test(raw.puzzle)) return null;
  if (typeof raw.solution !== 'string' || !GRID_STR.test(raw.solution) || raw.solution.includes('0')) return null;
  if (raw.result !== 'completed' && raw.result !== 'abandoned') return null;
  const source = SOURCES.includes(raw.source as GameSource) ? (raw.source as GameSource) : 'random';
  return {
    id: raw.id,
    puzzle: raw.puzzle,
    solution: raw.solution,
    difficulty: isDifficulty(raw.difficulty) ? raw.difficulty : null,
    source,
    dailyKey: typeof raw.dailyKey === 'string' && DATE_KEY_RE.test(raw.dailyKey) ? raw.dailyKey : undefined,
    startedAt: nonNeg(raw.startedAt),
    endedAt: nonNeg(raw.endedAt),
    timeMs: nonNeg(raw.timeMs),
    result: raw.result,
    mistakes: nonNeg(raw.mistakes),
    errors: nonNeg(raw.errors),
    hintsUsed: nonNeg(raw.hintsUsed),
  };
}

export function sanitizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryEntry[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const e = sanitizeHistoryEntry(r);
    if (e && !seen.has(e.id)) {
      seen.add(e.id);
      out.push(e);
    }
    if (out.length >= HISTORY_MAX) break;
  }
  return out;
}

// ---------------------------------------------------------------- achievements

export function sanitizeAchievements(raw: unknown): UnlockedAchievements {
  const out: UnlockedAchievements = {};
  if (!isObj(raw)) return out;
  for (const a of ACHIEVEMENTS) {
    const t = raw[a.id];
    if (isFiniteNonNeg(t) && t > 0) out[a.id] = Math.floor(t);
  }
  return out;
}

// ---------------------------------------------------------------- game

/** Persisted game without undo history (history is stored under its own key). */
export type PersistedGame = Omit<GameState, 'past' | 'future'>;
export interface PersistedUndo {
  id: string;
  past: Snapshot[];
  future: Snapshot[];
}

function sanitizeCompletion(raw: unknown): CompletionSummary | undefined {
  if (!isObj(raw)) return undefined;
  return {
    timeMs: nonNeg(raw.timeMs),
    mistakes: nonNeg(raw.mistakes),
    hintsUsed: nonNeg(raw.hintsUsed),
    isNewBest: raw.isNewBest === true,
    previousBestMs: isFiniteNonNeg(raw.previousBestMs) ? Math.floor(raw.previousBestMs) : null,
    streak: nonNeg(raw.streak),
    newAchievements: stringList(raw.newAchievements, null, 20),
  };
}

/** Strict: a game that fails any structural check is discarded (null) rather than half-loaded. */
export function sanitizeGame(raw: unknown): PersistedGame | null {
  if (!isObj(raw)) return null;
  const { puzzle, solution, values, notes } = raw;
  if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 64) return null;
  if (!isGrid(puzzle) || !isGrid(solution) || !isGrid(values)) return null;
  if (!isCompleteAndValid(solution)) return null;
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] && puzzle[i] !== solution[i]) return null;
    if (puzzle[i] && values[i] !== puzzle[i]) return null;
  }
  if (!Array.isArray(notes) || notes.length !== 81 || !notes.every((m) => Number.isInteger(m) && m >= 0 && m <= 0x1ff)) {
    return null;
  }
  const status = STATUSES.includes(raw.status as GameStatus) ? (raw.status as GameStatus) : 'paused';
  const selected = Number.isInteger(raw.selected) && (raw.selected as number) >= -1 && (raw.selected as number) <= 80 ? (raw.selected as number) : -1;
  const hd = raw.highlightDigit;
  return {
    id: raw.id,
    puzzle: puzzle.slice(),
    solution: solution.slice(),
    givens: puzzle.map((v) => v !== 0),
    values: values.slice(),
    notes: notes.map((m, i) => (values[i] ? 0 : (m as number))),
    selected,
    highlightDigit: isNonNegInt(hd) && hd <= 9 ? hd : 0,
    notesMode: raw.notesMode === true,
    elapsedMs: nonNeg(raw.elapsedMs),
    mistakes: nonNeg(raw.mistakes),
    errors: nonNeg(raw.errors),
    hintsUsed: nonNeg(raw.hintsUsed),
    status,
    difficulty: isDifficulty(raw.difficulty) ? raw.difficulty : null,
    source: SOURCES.includes(raw.source as GameSource) ? (raw.source as GameSource) : 'random',
    dailyKey: typeof raw.dailyKey === 'string' && DATE_KEY_RE.test(raw.dailyKey) ? raw.dailyKey : undefined,
    seed: isFiniteNonNeg(raw.seed) ? raw.seed : null,
    startedAt: nonNeg(raw.startedAt),
    completedAt: isFiniteNonNeg(raw.completedAt) ? raw.completedAt : null,
    livesOfferDismissed: raw.livesOfferDismissed === true,
    recorded: raw.recorded === true,
    completion: sanitizeCompletion(raw.completion),
  };
}

export const UNDO_PERSIST_LIMIT = 200;

export function sanitizeUndo(raw: unknown): PersistedUndo | null {
  if (!isObj(raw) || typeof raw.id !== 'string') return null;
  const list = (x: unknown) => (Array.isArray(x) ? x.filter(isValidSnapshot).slice(-UNDO_PERSIST_LIMIT) : []);
  return { id: raw.id, past: list(raw.past), future: list(raw.future) };
}

// ---------------------------------------------------------------- learning

/** Learning progress (lessons, mastery, reviews, hint signals); validated field by field in src/learn. */
export function sanitizeLearning(raw: unknown): LearningState {
  return sanitizeLearningState(raw);
}
