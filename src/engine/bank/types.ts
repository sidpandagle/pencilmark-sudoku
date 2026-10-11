import type { TechniqueId } from '../steps';
import type { Difficulty } from '../types';

/** [puzzle (81 chars, '.' = empty), score, hardest technique]. */
export type BankEntry = readonly [string, number, TechniqueId];
export type BankData = Record<Difficulty, readonly BankEntry[]>;
