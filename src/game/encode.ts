import type { Snapshot } from './types';

export function encodeValues(values: readonly number[]): string {
  let s = '';
  for (let i = 0; i < 81; i++) s += String(values[i] | 0);
  return s;
}

export function decodeValues(s: string): number[] {
  const out = new Array<number>(81);
  for (let i = 0; i < 81; i++) out[i] = s.charCodeAt(i) - 48;
  return out;
}

export function encodeNotes(notes: readonly number[]): string {
  let s = '';
  for (let i = 0; i < 81; i++) s += (notes[i] & 0x1ff).toString(36).padStart(2, '0');
  return s;
}

export function decodeNotes(s: string): number[] {
  const out = new Array<number>(81);
  for (let i = 0; i < 81; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 36);
  return out;
}

const SNAPSHOT_V = /^[0-9]{81}$/;
const SNAPSHOT_N = /^[0-9a-z]{162}$/;

export function isValidSnapshot(x: unknown): x is Snapshot {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (typeof o.v !== 'string' || !SNAPSHOT_V.test(o.v)) return false;
  if (typeof o.n !== 'string' || !SNAPSHOT_N.test(o.n)) return false;
  if (!Number.isInteger(o.s) || (o.s as number) < -1 || (o.s as number) > 80) return false;
  return decodeNotes(o.n).every((m) => m >= 0 && m <= 0x1ff);
}

/** Encode a puzzle/solution grid as an 81-char string ('0' for blank). */
export const gridToString = encodeValues;
export function stringToGrid(s: string): number[] | null {
  if (typeof s !== 'string' || !SNAPSHOT_V.test(s)) return null;
  return decodeValues(s);
}
