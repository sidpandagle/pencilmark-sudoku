import { ALL_UNITS, bit, maskToDigits, PEERS, popcount, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { HighlightCandidate, Step } from '../steps';
import type { CellDigit } from '../types';
import { cellsText, digitsSetText, elimText, liveElims, makeStep } from './util';

/*
 * 81-cell sets as three 27-bit words (cells 0-26, 27-53, 54-80), for fast ALS pair tests.
 */
type Bits = [number, number, number];
const EMPTY = (): Bits => [0, 0, 0];
const ALL = (): Bits => [0x7ffffff, 0x7ffffff, 0x7ffffff];
const addCell = (b: Bits, c: number) => {
  b[(c / 27) | 0] |= 1 << c % 27;
};
const PEER_BITS: Bits[] = PEERS.map((ps) => {
  const b = EMPTY();
  for (const p of ps) addCell(b, p);
  return b;
});
const cellsOf = (b: Bits): number[] => {
  const out: number[] = [];
  for (let w = 0; w < 3; w++) for (let i = 0; i < 27; i++) if (b[w] & (1 << i)) out.push(w * 27 + i);
  return out;
};

/**
 * Almost locked set (ALS): N empty cells of one unit whose candidates together are exactly N + 1 digits.
 * If any one of those digits is removed from the set, the remaining N digits are locked into the N cells.
 */
export interface ALS {
  cells: number[];
  mask: number;
  unit: number;
  /** cells of the ALS holding each digit (index = digit). */
  byDigit: number[][];
  /** The ALS cells as a bit set. */
  bits: Bits;
  /** digitBits[d]: the ALS cells holding d. */
  digitBits: Bits[];
  /** seeAll[d]: cells that see every ALS cell holding d. */
  seeAll: Bits[];
}

export function findAlmostLockedSets(s: SolverState, maxSize = 4): ALS[] {
  const out: ALS[] = [];
  const seen = new Set<string>();
  for (let u = 0; u < 27; u++) {
    const empties = ALL_UNITS[u].filter((c) => !s.grid[c]);
    for (let k = 1; k <= Math.min(maxSize, empties.length - 1); k++) {
      // Lexicographic k-combinations, pruned as soon as the partial union exceeds k + 1 digits.
      forEachPrunedCombo(s, empties, k, (cells, mask) => {
        const key = cells.join(',');
        if (seen.has(key)) return false;
        seen.add(key);
        const byDigit: number[][] = Array.from({ length: 10 }, () => []);
        for (const c of cells) for (const d of maskToDigits(s.cands[c])) byDigit[d].push(c);
        const bits = EMPTY();
        for (const c of cells) addCell(bits, c);
        const digitBits: Bits[] = [];
        const seeAll: Bits[] = [];
        for (let d = 0; d <= 9; d++) {
          const db = EMPTY();
          const sa = ALL();
          for (const c of byDigit[d] ?? []) {
            addCell(db, c);
            const pb = PEER_BITS[c];
            sa[0] &= pb[0];
            sa[1] &= pb[1];
            sa[2] &= pb[2];
          }
          digitBits.push(db);
          seeAll.push(sa);
        }
        out.push({ cells, mask, unit: u, byDigit, bits, digitBits, seeAll });
      });
    }
  }
  return out;
}

function forEachPrunedCombo(s: SolverState, items: number[], k: number, cb: (cells: number[], mask: number) => void) {
  const combo: number[] = [];
  const rec = (start: number, mask: number) => {
    if (popcount(mask) > k + 1) return;
    if (combo.length === k) {
      if (popcount(mask) === k + 1) cb(combo.slice(), mask);
      return;
    }
    for (let i = start; i <= items.length - (k - combo.length); i++) {
      combo.push(items[i]);
      rec(i + 1, mask | s.cands[items[i]]);
      combo.pop();
    }
  };
  rec(0, 0);
}

/** Cells (bit set) holding candidate d. */
function candidateBits(s: SolverState): Bits[] {
  const out: Bits[] = [];
  for (let d = 0; d <= 9; d++) out.push(EMPTY());
  for (let c = 0; c < 81; c++) {
    if (s.grid[c]) continue;
    for (let d = 1; d <= 9; d++) if (s.cands[c] & bit(d)) addCell(out[d], c);
  }
  return out;
}

/**
 * ALS-XZ: two disjoint ALSs A and B share a restricted common candidate X (every X in A sees every X in B, so
 * at most one of them holds X). Then for another common digit Z, one of the sets must hold Z, so Z is removed
 * from every cell outside both sets that sees all Z cells of A and B.
 */
export function findAlsXZ(s: SolverState): Step | null {
  const sets = findAlmostLockedSets(s, 4);
  const cand = candidateBits(s);
  let best: { a: ALS; b: ALS; x: number; z: number[]; elims: CellDigit[] } | null = null;
  for (let i = 0; i < sets.length; i++) {
    const A = sets[i];
    for (let j = i + 1; j < sets.length; j++) {
      const B = sets[j];
      const common = A.mask & B.mask;
      if (popcount(common) < 2) continue;
      const size = A.cells.length + B.cells.length;
      if (best && size >= best.a.cells.length + best.b.cells.length) continue;
      if (A.bits[0] & B.bits[0] || A.bits[1] & B.bits[1] || A.bits[2] & B.bits[2]) continue;
      const digits = maskToDigits(common);
      for (const x of digits) {
        // Restricted common: every x-cell of B sees every x-cell of A (peer sets exclude the cell itself).
        const bx = B.digitBits[x];
        const ax = A.seeAll[x];
        if (bx[0] & ~ax[0] || bx[1] & ~ax[1] || bx[2] & ~ax[2]) continue;
        const elims: CellDigit[] = [];
        const zs: number[] = [];
        for (const z of digits) {
          if (z === x) continue;
          const t0 = A.seeAll[z][0] & B.seeAll[z][0] & cand[z][0] & ~A.bits[0] & ~B.bits[0];
          const t1 = A.seeAll[z][1] & B.seeAll[z][1] & cand[z][1] & ~A.bits[1] & ~B.bits[1];
          const t2 = A.seeAll[z][2] & B.seeAll[z][2] & cand[z][2] & ~A.bits[2] & ~B.bits[2];
          if (!(t0 | t1 | t2)) continue;
          for (const p of cellsOf([t0, t1, t2])) elims.push({ cell: p, digit: z });
          zs.push(z);
        }
        const live = liveElims(s, elims);
        if (live.length) {
          best = { a: A, b: B, x, z: zs, elims: live };
          break;
        }
      }
    }
  }
  if (!best) return null;
  const { a, b, x, z, elims } = best;
  const cands: HighlightCandidate[] = [];
  for (const set of [a, b])
    for (const c of set.cells)
      for (const d of maskToDigits(s.cands[c]))
        cands.push({ cell: c, digit: d, role: d === x ? 'color-b' : z.includes(d) ? 'color-a' : 'pattern' });
  const desc = (t: ALS) => `${cellsText(t.cells)} ${digitsSetText(maskToDigits(t.mask))} in ${unitName(t.unit)}`;
  return makeStep({
    technique: 'als-xz',
    eliminations: elims,
    patternCells: [...a.cells, ...b.cells],
    units: [a.unit, b.unit],
    candidates: cands,
    explanation: `ALS-XZ: ${desc(a)} and ${desc(b)} are almost locked sets that cannot both contain ${x} (every ${x} in one sees every ${x} in the other), so one of them is locked without ${x} and must contain ${digitsText(z)}. Remove ${elimText(elims)}, which see${elims.length > 1 ? '' : 's'} all of those cells.`,
  });
}

const digitsText = (ds: number[]) => ds.join(' and ');
