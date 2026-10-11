import { bit, boxOf, cellAt, popcount, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { HighlightCandidate, Step, TechniqueId } from '../steps';
import type { CellDigit } from '../types';
import { cellsText, digitPlacedIn, forEachCombo, joinAnd, liveElims, makeStep } from './util';

const BASIC: Record<number, TechniqueId> = { 2: 'x-wing', 3: 'swordfish', 4: 'jellyfish' };
const FINNED: Record<number, TechniqueId> = { 2: 'finned-x-wing', 3: 'finned-swordfish' };
const FISH_NAME: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' };

/** Cell at (line, cross) in the given orientation (rowMode: line = row, cross = column). */
const at = (rowMode: boolean, line: number, cross: number) => (rowMode ? cellAt(line, cross) : cellAt(cross, line));
const linesText = (rowMode: boolean, idx: number[]) =>
  `${rowMode ? 'rows' : 'columns'} ${joinAnd(idx.map((i) => String(i + 1)))}`;
const crossText = (rowMode: boolean, idx: number[]) =>
  `${rowMode ? 'columns' : 'rows'} ${joinAnd(idx.map((i) => String(i + 1)))}`;

/** For a digit and orientation, a 9-bit mask per line of the cross positions holding the digit (-1 when placed). */
function lineMasks(s: SolverState, d: number, rowMode: boolean): number[] {
  const b = bit(d);
  const masks: number[] = [];
  for (let line = 0; line < 9; line++) {
    if (digitPlacedIn(s, rowMode ? line : 9 + line, d)) {
      masks.push(-1);
      continue;
    }
    let m = 0;
    for (let x = 0; x < 9; x++) if (s.cands[at(rowMode, line, x)] & b) m |= 1 << x;
    masks.push(m);
  }
  return masks;
}

/** COVERS[n]: all 9-bit masks with n bits set, in decreasing numeric order. */
const COVERS: number[][] = Array.from({ length: 5 }, (_, n) => {
  const out: number[] = [];
  for (let m = 511; m > 0; m--) if (popcount(m) === n) out.push(m);
  return out;
});

const bitsOf = (m: number) => {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (m & (1 << i)) out.push(i);
  return out;
};

/**
 * Basic fish of size n (X-Wing 2, Swordfish 3, Jellyfish 4): in n base lines (rows or columns) the digit is
 * restricted to the same n cover lines, so it is removed from the cover lines outside the base lines.
 */
export function findBasicFish(s: SolverState, n: number): Step | null {
  for (let d = 1; d <= 9; d++) {
    for (const rowMode of [true, false]) {
      const masks = lineMasks(s, d, rowMode);
      const base = [...Array(9).keys()].filter((i) => masks[i] > 0 && popcount(masks[i]) >= 2 && popcount(masks[i]) <= n);
      let result: Step | null = null;
      forEachCombo(base, n, (lines) => {
        let cover = 0;
        for (const l of lines) cover |= masks[l];
        if (popcount(cover) !== n) return false;
        const coverIdx = bitsOf(cover);
        const elims: CellDigit[] = [];
        for (const x of coverIdx) for (let l = 0; l < 9; l++) if (!lines.includes(l)) elims.push({ cell: at(rowMode, l, x), digit: d });
        const live = liveElims(s, elims);
        if (!live.length) return false;
        const pattern: number[] = [];
        for (const l of lines) for (const x of bitsOf(masks[l])) pattern.push(at(rowMode, l, x));
        result = makeStep({
          technique: BASIC[n],
          eliminations: live,
          patternCells: pattern,
          units: [...lines.map((l) => (rowMode ? l : 9 + l)), ...coverIdx.map((x) => (rowMode ? 9 + x : x))],
          candidates: pattern.map((c) => ({ cell: c, digit: d, role: 'pattern' as const })),
          explanation: `${FISH_NAME[n]} on ${d}: in ${linesText(rowMode, lines)}, ${d} can only go in ${crossText(rowMode, coverIdx)}. One ${d} per base line fills each of those ${rowMode ? 'columns' : 'rows'}, so remove ${d} from ${cellsText(live.map((e) => e.cell))}.`,
        });
        return true;
      });
      if (result) return result;
    }
  }
  return null;
}

/**
 * Finned fish of size n (finned/sashimi X-Wing and Swordfish): like a basic fish, but some base-line
 * candidates ("fins") fall outside the cover lines, all inside one box. Either the fish is real or a fin is
 * true, so the digit can be removed from cells that are in a cover line, outside the base lines, and in the
 * fin box (they see every fin). Sashimi variants (a base line with a single cover candidate) are included.
 */
export function findFinnedFish(s: SolverState, n: number): Step | null {
  for (let d = 1; d <= 9; d++) {
    const dm = bit(d);
    for (const rowMode of [true, false]) {
      const masks = lineMasks(s, d, rowMode);
      const base = [...Array(9).keys()].filter((i) => masks[i] > 0 && popcount(masks[i]) <= n + 3);
      let result: Step | null = null;
      forEachCombo(base, n, (lines) => {
        let union = 0;
        let lineSet = 0;
        for (const l of lines) {
          union |= masks[l];
          lineSet |= 1 << l;
        }
        if (popcount(union) <= n) return false;
        // n-subsets of the union, in decreasing numeric order.
        for (const cover of COVERS[n]) {
          if (cover & ~union) continue;
          let finLines = 0;
          let finCross = 0;
          let ok = true;
          for (const l of lines) {
            const m = masks[l];
            // Each base line needs at least one candidate in the cover.
            if (!(m & cover)) {
              ok = false;
              break;
            }
            if (m & ~cover) {
              finLines |= 1 << l;
              finCross |= m & ~cover;
            }
          }
          if (!ok || !finCross) continue;
          // All fins in one box: fin lines within one band and fin positions within one stack.
          const band = Math.floor(Math.log2(finLines & -finLines) / 3);
          const stack = Math.floor(Math.log2(finCross & -finCross) / 3);
          const bandMask = 7 << (3 * band);
          const stackMask = 7 << (3 * stack);
          if (finLines & ~bandMask || finCross & ~stackMask) continue;
          // Targets: cover positions inside the fin box, on lines of the fin band that are not base lines.
          const targetCross = cover & stackMask;
          if (!targetCross) continue;
          const elims: CellDigit[] = [];
          for (let l = 3 * band; l < 3 * band + 3; l++) {
            if (lineSet & (1 << l)) continue;
            for (const x of bitsOf(targetCross)) if (s.cands[at(rowMode, l, x)] & dm) elims.push({ cell: at(rowMode, l, x), digit: d });
          }
          const live = liveElims(s, elims);
          if (!live.length) continue;
          const coverIdx = bitsOf(cover);
          const fins: number[] = [];
          for (const l of lines) for (const x of bitsOf(masks[l] & ~cover)) fins.push(at(rowMode, l, x));
          const finBox = boxOf(fins[0]);
          const body: number[] = [];
          for (const l of lines) for (const x of bitsOf(masks[l] & cover)) body.push(at(rowMode, l, x));
          const sashimi = lines.some((l) => popcount(masks[l] & cover) === 1);
          const cands: HighlightCandidate[] = [
            ...body.map((c) => ({ cell: c, digit: d, role: 'pattern' as const })),
            ...fins.map((c) => ({ cell: c, digit: d, role: 'fin' as const })),
          ];
          result = makeStep({
            technique: FINNED[n],
            eliminations: live,
            patternCells: [...body, ...fins],
            units: [...lines.map((l) => (rowMode ? l : 9 + l)), ...coverIdx.map((x) => (rowMode ? 9 + x : x)), 18 + finBox],
            candidates: cands,
            explanation: `${sashimi ? 'Sashimi' : 'Finned'} ${FISH_NAME[n]} on ${d}: in ${linesText(rowMode, lines)}, ${d} is limited to ${crossText(rowMode, coverIdx)} except for the fin${fins.length > 1 ? 's' : ''} at ${cellsText(fins)} in ${unitName(18 + finBox)}. Either the fish holds or a fin is ${d}; both remove ${d} from ${cellsText(live.map((e) => e.cell))}, which ${live.length > 1 ? 'are' : 'is'} in a cover ${rowMode ? 'column' : 'row'} and see${live.length > 1 ? '' : 's'} the fin${fins.length > 1 ? 's' : ''}.`,
          });
          return true;
        }
        return false;
      });
      if (result) return result;
    }
  }
  return null;
}

export const findXWing = (s: SolverState) => findBasicFish(s, 2);
export const findSwordfish = (s: SolverState) => findBasicFish(s, 3);
export const findJellyfish = (s: SolverState) => findBasicFish(s, 4);
export const findFinnedXWing = (s: SolverState) => findFinnedFish(s, 2);
export const findFinnedSwordfish = (s: SolverState) => findFinnedFish(s, 3);
