import { ALL_UNITS, BOXES, maskToDigits, popcount, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { HighlightCandidate, Step } from '../steps';
import type { CellDigit } from '../types';
import { cellsText, digitsSetText, elimText, forEachCombo, liveElims, makeStep } from './util';

/**
 * Sue de Coq. Take 2-3 empty cells C where a box meets a row or column, with candidates V (|V| >= |C| + 2).
 * Pick cells D from the rest of the line and E from the rest of the box such that D's and E's candidates do
 * not overlap, and C ∪ D ∪ E (N cells) has exactly N candidates in total.
 *
 * Proof: digits in C ∪ D are all different (one line), digits in C ∪ E are all different (one box), and no
 * digit fits both D and E. So all N cells hold different digits and each of the N digits appears exactly once.
 * A digit of D (or of V that E cannot hold) must therefore sit in C ∪ D, i.e. in the line; a digit of E (or of V
 * that D cannot hold) must sit in C ∪ E, i.e. in the box. Remove them from the rest of the line / box
 * (an intersection cell not in C belongs to both, so it loses both groups).
 */
/** All 1..maxK-subsets of cells (lexicographic per size) with their candidate masks. */
function subsets(s: SolverState, cells: number[], maxK: number): { cells: number[]; mask: number }[] {
  const out: { cells: number[]; mask: number }[] = [];
  for (let k = 1; k <= maxK; k++)
    forEachCombo(cells, k, (cs) => {
      let m = 0;
      for (const c of cs) m |= s.cands[c];
      out.push({ cells: cs, mask: m });
    });
  return out;
}

export function findSueDeCoq(s: SolverState): Step | null {
  for (let b = 0; b < 9; b++) {
    const box = BOXES[b];
    const lines = new Set<number>();
    for (const c of box) {
      lines.add(Math.floor(c / 9));
      lines.add(9 + (c % 9));
    }
    for (const line of lines) {
      const lineCells = ALL_UNITS[line];
      const inter = box.filter((c) => lineCells.includes(c) && !s.grid[c]);
      if (inter.length < 2) continue;
      const lineRest = lineCells.filter((c) => !box.includes(c) && !s.grid[c]);
      const boxRest = box.filter((c) => !lineCells.includes(c) && !s.grid[c]);
      // All candidate D (line part) and E (box part) subsets with their candidate masks, in search order.
      const dSets = subsets(s, lineRest, Math.min(3, lineRest.length - 1));
      const eSets = subsets(s, boxRest, Math.min(3, boxRest.length - 1));
      for (let k = 2; k <= inter.length; k++) {
        let result: Step | null = null;
        forEachCombo(inter, k, (C) => {
          let V = 0;
          for (const c of C) V |= s.cands[c];
          if (popcount(V) < k + 2) return false;
          for (const { cells: D, mask: mD } of dSets) {
            if (!(mD & V)) continue;
            for (const { cells: E, mask: mE } of eSets) {
                  if (mE & mD || !(mE & V)) continue;
                  const n = k + D.length + E.length;
                  if (popcount(V | mD | mE) !== n) continue;
                  const lineDigits = mD | (V & ~mE);
                  const boxDigits = mE | (V & ~mD);
                  const elims: CellDigit[] = [];
                  for (const c of lineRest) if (!D.includes(c)) for (const d of maskToDigits(lineDigits)) elims.push({ cell: c, digit: d });
                  for (const c of boxRest) if (!E.includes(c)) for (const d of maskToDigits(boxDigits)) elims.push({ cell: c, digit: d });
                  // An unused intersection cell lies in both the line and the box.
                  for (const c of inter) if (!C.includes(c)) for (const d of maskToDigits(lineDigits | boxDigits)) elims.push({ cell: c, digit: d });
                  const live = liveElims(s, elims);
                  if (!live.length) continue;
                  const cands: HighlightCandidate[] = [];
                  for (const c of C) for (const d of maskToDigits(s.cands[c])) cands.push({ cell: c, digit: d, role: 'pattern' });
                  for (const c of D) for (const d of maskToDigits(s.cands[c])) cands.push({ cell: c, digit: d, role: 'color-a' });
                  for (const c of E) for (const d of maskToDigits(s.cands[c])) cands.push({ cell: c, digit: d, role: 'color-b' });
                  result = makeStep({
                    technique: 'sue-de-coq',
                    eliminations: live,
                    patternCells: [...C, ...D, ...E],
                    units: [line, 18 + b],
                    candidates: cands,
                    explanation: `Sue de Coq: ${cellsText(C)} (where ${unitName(18 + b)} meets ${unitName(line)}) hold ${digitsSetText(maskToDigits(V))}; together with ${cellsText(D)} ${digitsSetText(maskToDigits(mD))} in the ${line < 9 ? 'row' : 'column'} and ${cellsText(E)} ${digitsSetText(maskToDigits(mE))} in the box, ${n} cells hold exactly ${n} digits. So ${digitsSetText(maskToDigits(lineDigits))} stay in ${unitName(line)} and ${digitsSetText(maskToDigits(boxDigits))} stay in ${unitName(18 + b)}: remove ${elimText(live)}.`,
                  });
                  return true;
            }
          }
          return false;
        });
        if (result) return result;
      }
    }
  }
  return null;
}
