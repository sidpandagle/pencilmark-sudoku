import { computeCandidates, getHint, popcount, techniqueName, type Hint } from '../engine';
import type { GameState } from './types';

/** getHint, made safe: never throws, never returns an unexpected shape. */
export function requestHint(game: Pick<GameState, 'values' | 'solution' | 'notes'>): Hint {
  try {
    const hasNotes = game.notes.some((m) => m !== 0);
    const h = getHint(game.values.slice(), game.solution.slice(), hasNotes ? game.notes.slice() : undefined);
    if (h && typeof h === 'object' && 'kind' in h) {
      if (h.kind === 'step' && (!h.step || !Array.isArray(h.step.patternCells))) {
        return { kind: 'none', message: '' };
      }
      if ((h.kind === 'mistake' || h.kind === 'bad-notes') && !Array.isArray(h.cells)) return { kind: 'none', message: '' };
      return h;
    }
  } catch {
    // fall through
  }
  return { kind: 'none', message: '' };
}

export function hintTechniqueName(h: Extract<Hint, { kind: 'step' }>): string {
  if (h.techniqueName && h.techniqueName !== h.step.technique) return h.techniqueName;
  try {
    return techniqueName(h.step.technique) || h.step.technique;
  } catch {
    return h.step.technique;
  }
}

/**
 * Cell to reveal when no explainable step exists: the selected empty cell if any, otherwise the
 * empty cell with the fewest candidates (the most "obvious" one). -1 when the board is full.
 */
export function revealTarget(game: Pick<GameState, 'values' | 'selected' | 'givens' | 'solution'>): number {
  const { values, selected } = game;
  if (selected >= 0 && !game.givens[selected] && values[selected] !== game.solution[selected]) return selected;
  const cands = computeCandidates(values);
  let best = -1;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (values[i]) continue;
    const n = popcount(cands[i]);
    if (n < bestCount) {
      best = i;
      bestCount = n;
    }
  }
  return best;
}
