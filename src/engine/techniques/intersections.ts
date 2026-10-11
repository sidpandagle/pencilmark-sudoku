import { ALL_UNITS, boxOf, colOf, rowOf, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { Step } from '../steps';
import { cellsText, digitPlacedIn, liveElims, makeStep, positions } from './util';

/**
 * Pointing (pointing pair / triple): inside a box, a digit is confined to one row or column, so it can be
 * removed from the rest of that row or column.
 */
export function findPointing(s: SolverState): Step | null {
  for (let b = 0; b < 9; b++) {
    const box = 18 + b;
    for (let d = 1; d <= 9; d++) {
      if (digitPlacedIn(s, box, d)) continue;
      const pos = positions(s, box, d);
      if (pos.length < 2) continue;
      const lines: number[] = [];
      if (pos.every((c) => rowOf(c) === rowOf(pos[0]))) lines.push(rowOf(pos[0]));
      if (pos.every((c) => colOf(c) === colOf(pos[0]))) lines.push(9 + colOf(pos[0]));
      for (const line of lines) {
        const elims = liveElims(
          s,
          ALL_UNITS[line].filter((c) => boxOf(c) !== b).map((c) => ({ cell: c, digit: d })),
        );
        if (!elims.length) continue;
        const kind = pos.length === 2 ? 'pair' : 'triple';
        return makeStep({
          technique: 'pointing',
          eliminations: elims,
          patternCells: pos,
          units: [box, line],
          candidates: pos.map((c) => ({ cell: c, digit: d, role: 'pattern' as const })),
          explanation: `In ${unitName(box)}, ${d} can only be in ${unitName(line)} (${cellsText(pos)}), a pointing ${kind}. So ${d} can be removed from the rest of ${unitName(line)}: ${cellsText(elims.map((e) => e.cell))}.`,
        });
      }
    }
  }
  return null;
}

/**
 * Box/line reduction (claiming): inside a row or column, a digit is confined to one box, so it can be removed
 * from the rest of that box.
 */
export function findBoxLineReduction(s: SolverState): Step | null {
  for (let line = 0; line < 18; line++) {
    for (let d = 1; d <= 9; d++) {
      if (digitPlacedIn(s, line, d)) continue;
      const pos = positions(s, line, d);
      if (pos.length < 2) continue;
      const b = boxOf(pos[0]);
      if (!pos.every((c) => boxOf(c) === b)) continue;
      const box = 18 + b;
      const elims = liveElims(
        s,
        ALL_UNITS[box].filter((c) => !ALL_UNITS[line].includes(c)).map((c) => ({ cell: c, digit: d })),
      );
      if (!elims.length) continue;
      return makeStep({
        technique: 'box-line-reduction',
        eliminations: elims,
        patternCells: pos,
        units: [line, box],
        candidates: pos.map((c) => ({ cell: c, digit: d, role: 'pattern' as const })),
        explanation: `In ${unitName(line)}, ${d} can only be in ${unitName(box)} (${cellsText(pos)}). So ${d} can be removed from the rest of ${unitName(box)}: ${cellsText(elims.map((e) => e.cell))}.`,
      });
    }
  }
  return null;
}
