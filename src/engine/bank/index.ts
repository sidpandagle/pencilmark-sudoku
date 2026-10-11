import { parseGrid } from '../grid';
import { randomInt, type Rng } from '../rng';
import type { Difficulty } from '../types';
import { BANK } from './bank';
import type { BankEntry } from './types';

export { BANK };
export type { BankEntry };

export const bankSize = (d: Difficulty) => BANK[d].length;

/** Pick a bank entry for a difficulty, or null when the bank has none. */
export function pickBankEntry(d: Difficulty, rng: Rng): { puzzle: number[]; entry: BankEntry } | null {
  const list = BANK[d];
  if (!list.length) return null;
  const entry = list[randomInt(rng, list.length)];
  return { puzzle: parseGrid(entry[0]), entry };
}
