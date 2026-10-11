import type { PuzzleAnalysis } from '../engine';
import { difficultyLabel } from './difficulty';

/** User-facing description of an imported puzzle's analysis. */
export function describeAnalysis(a: PuzzleAnalysis): { ok: boolean; title: string; message: string } {
  switch (a.status) {
    case 'invalid':
      return { ok: false, title: 'Not a valid puzzle', message: 'Some givens repeat in a row, column or box.' };
    case 'unsolvable':
      return { ok: false, title: 'No solution', message: 'These givens can’t all be satisfied. Check for a typo.' };
    case 'multiple':
      return {
        ok: false,
        title: 'More than one solution',
        message: 'A proper Sudoku has exactly one solution, so this one can’t be solved by logic alone.',
      };
    default:
      return {
        ok: true,
        title: 'Ready to play',
        message: a.difficulty
          ? `Unique solution. Rated ${difficultyLabel(a.difficulty)}.`
          : a.beyondTechniques
            ? 'Unique solution. It goes beyond the rated techniques, so hints may run out.'
            : 'Unique solution.',
      };
  }
}
