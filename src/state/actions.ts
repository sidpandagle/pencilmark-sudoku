import { generatePuzzle, getDailyPuzzle, type Difficulty } from '../engine';
import {
  addHistory,
  createGame,
  emptyStats,
  evaluateAchievements,
  gameReducer,
  hasProgress,
  historyEntryFrom,
  makeId,
  recordCompletion,
  recordStart,
  stringToGrid,
  type GameAction,
  type GameState,
  type HistoryEntry,
  type NewGameInput,
  type ReducerConfig,
  type Settings,
} from '../game';
import { achievementsStore, gameStore, historyStore, settingsStore, statsStore } from './stores';

export function reducerConfig(settings: Settings = settingsStore.get(), now = Date.now()): ReducerConfig {
  return { autoRemoveNotes: settings.autoRemoveNotes, countMistakes: settings.mistakeCounter, now };
}

/** Dispatch a game action. Handles the one-time completion bookkeeping. Returns the new state. */
export function dispatchGame(action: GameAction): GameState | null {
  const game = gameStore.get();
  if (!game) return null;
  const next = gameReducer(game, action, reducerConfig());
  if (next !== game) gameStore.set(next);
  if (next.status === 'completed' && !next.recorded) return finalizeCompletion(next);
  return next;
}

/**
 * Record stats, history and achievements for a completed game exactly once.
 * Guarded twice: by `game.recorded` and by the stats' recorded-id list (survives reloads).
 */
export function finalizeCompletion(game: GameState, now = Date.now()): GameState {
  if (game.recorded) return game;
  const res = recordCompletion(statsStore.get(), game, now);
  statsStore.set(res.stats);
  const history = addHistory(historyStore.get(), historyEntryFrom(game, 'completed', now));
  historyStore.set(history);
  const ach = evaluateAchievements({ stats: res.stats, history }, achievementsStore.get(), now);
  achievementsStore.set(ach.unlocked);
  const finished = gameReducer(game, {
    type: 'markRecorded',
    completion: {
      timeMs: game.elapsedMs,
      mistakes: game.mistakes,
      hintsUsed: game.hintsUsed,
      isNewBest: res.counted && res.isNewBest,
      previousBestMs: res.previousBestMs,
      streak: res.streak,
      newAchievements: ach.newly,
    },
  });
  gameStore.set(finished);
  return finished;
}

/** Keep a record of an unfinished game that is being replaced. */
function archiveCurrent(now = Date.now()) {
  const cur = gameStore.get();
  if (cur && cur.status !== 'completed' && hasProgress(cur)) {
    historyStore.set(addHistory(historyStore.get(), historyEntryFrom(cur, 'abandoned', now)));
  }
}

export function startGame(input: NewGameInput): GameState {
  archiveCurrent();
  const game = createGame(input);
  statsStore.set(recordStart(statsStore.get(), game));
  gameStore.set(game);
  return game;
}

export function startRandomGame(difficulty: Difficulty): GameState {
  const p = generatePuzzle(difficulty);
  return startGame({ puzzle: p.puzzle, solution: p.solution, difficulty: p.difficulty ?? difficulty, source: 'random', seed: p.seed });
}

/** Continue today's daily if it is the current unfinished game, otherwise start it fresh. */
export function startDailyGame(dateKey: string): GameState {
  const cur = gameStore.get();
  if (cur && cur.source === 'daily' && cur.dailyKey === dateKey && cur.status !== 'completed') return cur;
  const p = getDailyPuzzle(dateKey);
  return startGame({ puzzle: p.puzzle, solution: p.solution, difficulty: p.difficulty, source: 'daily', seed: p.seed, dailyKey: dateKey });
}

export function startCustomGame(puzzle: number[], solution: number[], difficulty: Difficulty | null): GameState {
  return startGame({ puzzle, solution, difficulty, source: 'custom' });
}

export function replayHistoryEntry(entry: HistoryEntry): GameState | null {
  const puzzle = stringToGrid(entry.puzzle);
  const solution = stringToGrid(entry.solution);
  if (!puzzle || !solution) return null;
  return startGame({ puzzle, solution, difficulty: entry.difficulty, source: entry.source === 'daily' ? 'random' : entry.source });
}

/** Replay the current puzzle as a brand-new attempt (counted as a new start). */
export function replayCurrent(): GameState | null {
  const cur = gameStore.get();
  if (!cur) return null;
  archiveCurrent();
  const next = gameReducer(cur, { type: 'restart', id: makeId() }, reducerConfig());
  statsStore.set(recordStart(statsStore.get(), next));
  gameStore.set(next);
  return next;
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((s) => ({ ...s, ...patch }));
}

export function resetStatistics() {
  statsStore.set(emptyStats());
}
