import { findConflicts } from '../engine';
import type { Settings } from './settings';
import type { GameState } from './types';

export type FeedbackKind = 'select' | 'place' | 'erase' | 'error' | 'success';

/**
 * Which feedback (haptic/sound) a digit entry deserves. An error is only signalled when the player has opted
 * to see mistakes (auto-check or mistake counter) or the entry creates a visible conflict with conflict
 * highlighting on — feedback must never leak correctness the board itself does not show.
 */
export function inputFeedbackKind(
  after: Pick<GameState, 'values' | 'solution' | 'status'>,
  cell: number,
  s: Pick<Settings, 'autoCheck' | 'mistakeCounter' | 'highlightConflicts'>,
): FeedbackKind {
  if (after.status === 'completed') return 'success';
  const v = cell >= 0 ? after.values[cell] : 0;
  const wrongShown = !!v && v !== after.solution[cell] && (s.autoCheck || s.mistakeCounter);
  const conflictShown = !!v && s.highlightConflicts && findConflicts(after.values).has(cell);
  return wrongShown || conflictShown ? 'error' : 'place';
}
