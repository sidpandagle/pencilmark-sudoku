import { cellName, maskToDigits, popcount } from '../grid';
import type { SolverState } from '../solver/state';
import type { Step } from '../steps';
import { cellsSeeingAll, cellsText, digitsSetText, liveElims, makeStep, see, positions, digitPlacedIn } from './util';

const bivalueCells = (s: SolverState) => {
  const out: number[] = [];
  for (let c = 0; c < 81; c++) if (!s.grid[c] && popcount(s.cands[c]) === 2) out.push(c);
  return out;
};

/**
 * XY-Wing: a pivot {x,y} sees two pincers {x,z} and {y,z}. Whatever the pivot is, one pincer is z, so z is
 * removed from every cell that sees both pincers.
 */
export function findXYWing(s: SolverState): Step | null {
  const bv = bivalueCells(s);
  for (const pivot of bv) {
    const pm = s.cands[pivot];
    const wings = bv.filter((c) => c !== pivot && see(c, pivot) && popcount(s.cands[c] & pm) === 1);
    for (let i = 0; i < wings.length; i++)
      for (let j = i + 1; j < wings.length; j++) {
        const p1 = wings[i];
        const p2 = wings[j];
        const m1 = s.cands[p1];
        const m2 = s.cands[p2];
        const x = m1 & pm;
        const y = m2 & pm;
        if (x === y) continue;
        const z = m1 & ~pm;
        if (z !== (m2 & ~pm) || popcount(z) !== 1) continue;
        const zd = maskToDigits(z)[0];
        const live = liveElims(s, cellsSeeingAll(s, [p1, p2], zd).filter((c) => c !== pivot).map((c) => ({ cell: c, digit: zd })));
        if (!live.length) continue;
        const [xd] = maskToDigits(x);
        const [yd] = maskToDigits(y);
        return makeStep({
          technique: 'xy-wing',
          eliminations: live,
          patternCells: [pivot, p1, p2],
          candidates: [
            { cell: pivot, digit: xd, role: 'pattern' },
            { cell: pivot, digit: yd, role: 'pattern' },
            { cell: p1, digit: xd, role: 'pattern' },
            { cell: p2, digit: yd, role: 'pattern' },
            { cell: p1, digit: zd, role: 'color-a' },
            { cell: p2, digit: zd, role: 'color-a' },
          ],
          explanation: `XY-Wing: pivot ${cellName(pivot)} ${digitsSetText([xd, yd])} sees ${cellName(p1)} ${digitsSetText([xd, zd])} and ${cellName(p2)} ${digitsSetText([yd, zd])}. Whether the pivot is ${xd} or ${yd}, one of the pincers must be ${zd}, so remove ${zd} from ${cellsText(live.map((e) => e.cell))}.`,
        });
      }
  }
  return null;
}

/**
 * XYZ-Wing: a pivot {x,y,z} sees pincers {x,z} and {y,z}. One of the three cells is z, so z is removed from
 * cells that see all three.
 */
export function findXYZWing(s: SolverState): Step | null {
  const bv = bivalueCells(s);
  for (let pivot = 0; pivot < 81; pivot++) {
    if (s.grid[pivot] || popcount(s.cands[pivot]) !== 3) continue;
    const pm = s.cands[pivot];
    const wings = bv.filter((c) => see(c, pivot) && (s.cands[c] & ~pm) === 0);
    for (let i = 0; i < wings.length; i++)
      for (let j = i + 1; j < wings.length; j++) {
        const p1 = wings[i];
        const p2 = wings[j];
        const m1 = s.cands[p1];
        const m2 = s.cands[p2];
        if (m1 === m2) continue;
        const z = m1 & m2;
        if (popcount(z) !== 1) continue;
        const zd = maskToDigits(z)[0];
        const live = liveElims(s, cellsSeeingAll(s, [pivot, p1, p2], zd).map((c) => ({ cell: c, digit: zd })));
        if (!live.length) continue;
        return makeStep({
          technique: 'xyz-wing',
          eliminations: live,
          patternCells: [pivot, p1, p2],
          candidates: [
            ...maskToDigits(pm & ~z).map((d) => ({ cell: pivot, digit: d, role: 'pattern' as const })),
            ...maskToDigits(m1 & ~z).map((d) => ({ cell: p1, digit: d, role: 'pattern' as const })),
            ...maskToDigits(m2 & ~z).map((d) => ({ cell: p2, digit: d, role: 'pattern' as const })),
            { cell: pivot, digit: zd, role: 'color-a' as const },
            { cell: p1, digit: zd, role: 'color-a' as const },
            { cell: p2, digit: zd, role: 'color-a' as const },
          ],
          explanation: `XYZ-Wing: pivot ${cellName(pivot)} ${digitsSetText(maskToDigits(pm))} sees ${cellName(p1)} ${digitsSetText(maskToDigits(m1))} and ${cellName(p2)} ${digitsSetText(maskToDigits(m2))}. One of these three cells must be ${zd}, so remove ${zd} from ${cellsText(live.map((e) => e.cell))}, which see${live.length > 1 ? '' : 's'} all three.`,
        });
      }
  }
  return null;
}

/**
 * W-Wing: two cells with the same pair {x,y} that do not see each other, joined by a conjugate pair on x
 * (one end sees each cell). One of the two cells must be y, so y is removed from cells that see both.
 */
export function findWWing(s: SolverState): Step | null {
  const bv = bivalueCells(s);
  for (let i = 0; i < bv.length; i++)
    for (let j = i + 1; j < bv.length; j++) {
      const A = bv[i];
      const B = bv[j];
      if (s.cands[A] !== s.cands[B] || see(A, B)) continue;
      const [d1, d2] = maskToDigits(s.cands[A]);
      for (const [x, y] of [[d1, d2], [d2, d1]]) {
        const targets = cellsSeeingAll(s, [A, B], y);
        if (!targets.length) continue;
        // Look for a conjugate pair on x with one end seeing A and the other seeing B.
        for (let u = 0; u < 27; u++) {
          if (digitPlacedIn(s, u, x)) continue;
          const pos = positions(s, u, x);
          if (pos.length !== 2) continue;
          for (const [p, q] of [[pos[0], pos[1]], [pos[1], pos[0]]]) {
            if (p === A || p === B || q === A || q === B) continue;
            if (!see(p, A) || !see(q, B)) continue;
            const live = liveElims(s, targets.map((c) => ({ cell: c, digit: y })));
            if (!live.length) continue;
            return makeStep({
              technique: 'w-wing',
              eliminations: live,
              patternCells: [A, B, p, q],
              units: [u],
              candidates: [
                { cell: A, digit: x, role: 'pattern' },
                { cell: B, digit: x, role: 'pattern' },
                { cell: p, digit: x, role: 'color-b' },
                { cell: q, digit: x, role: 'color-b' },
                { cell: A, digit: y, role: 'color-a' },
                { cell: B, digit: y, role: 'color-a' },
              ],
              links: [
                { from: { cell: A, digit: y }, to: { cell: A, digit: x }, type: 'strong' },
                { from: { cell: A, digit: x }, to: { cell: p, digit: x }, type: 'weak' },
                { from: { cell: p, digit: x }, to: { cell: q, digit: x }, type: 'strong' },
                { from: { cell: q, digit: x }, to: { cell: B, digit: x }, type: 'weak' },
                { from: { cell: B, digit: x }, to: { cell: B, digit: y }, type: 'strong' },
              ],
              explanation: `W-Wing: ${cellName(A)} and ${cellName(B)} both hold ${digitsSetText([x, y])}, and ${x} in ${cellName(p)}–${cellName(q)} is a conjugate pair linking them. They cannot both be ${x}, so one of them is ${y}: remove ${y} from ${cellsText(live.map((e) => e.cell))}.`,
            });
          }
        }
      }
    }
  return null;
}

