import type { Difficulty } from '../engine';
import type { GameSource, GameState } from './types';

export function makeId(now: number = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface NewGameInput {
  puzzle: number[];
  solution: number[];
  difficulty: Difficulty | null;
  source: GameSource;
  seed?: number | null;
  dailyKey?: string;
  id?: string;
  now?: number;
}

export function createGame(input: NewGameInput): GameState {
  const now = input.now ?? Date.now();
  return {
    id: input.id ?? makeId(now),
    puzzle: input.puzzle.slice(),
    solution: input.solution.slice(),
    givens: input.puzzle.map((v) => v !== 0),
    values: input.puzzle.slice(),
    notes: new Array(81).fill(0),
    selected: -1,
    highlightDigit: 0,
    notesMode: false,
    elapsedMs: 0,
    mistakes: 0,
    errors: 0,
    hintsUsed: 0,
    status: 'playing',
    difficulty: input.difficulty,
    source: input.source,
    dailyKey: input.dailyKey,
    seed: input.seed ?? null,
    startedAt: now,
    completedAt: null,
    past: [],
    future: [],
    livesOfferDismissed: false,
    recorded: false,
  };
}
