import type { Difficulty } from '../engine';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

/** Short description of the techniques each level needs (shown in the difficulty picker). */
export const DIFFICULTY_DESCRIPTION: Record<Difficulty, string> = {
  easy: 'Singles only. Scan rows, columns and boxes for the one place a digit fits.',
  medium: 'Adds pointing and box-line reductions. Notes start to help.',
  hard: 'Pairs, triples and hidden subsets. Plan to use notes.',
  expert: 'Fish, wings and chains such as X-Wing and XY-Wing.',
};

export const difficultyLabel = (d: Difficulty | null | undefined) => (d ? DIFFICULTY_LABEL[d] : 'Custom');
