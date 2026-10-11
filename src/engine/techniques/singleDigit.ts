import { boxOf, cellName, colOf, rowOf, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { ChainLink, Step, TechniqueId } from '../steps';
import { anySeesBoth, cellsSeeingAll, cellsText, digitPlacedIn, liveElims, makeStep, positions, see } from './util';

/** A conjugate pair (strong link): the only two cells of a unit that can hold the digit. */
export interface StrongLink {
  a: number;
  b: number;
  unit: number;
}

export function conjugatePairs(s: SolverState, d: number, units?: (u: number) => boolean): StrongLink[] {
  const out: StrongLink[] = [];
  for (let u = 0; u < 27; u++) {
    if (units && !units(u)) continue;
    if (digitPlacedIn(s, u, d)) continue;
    const pos = positions(s, u, d);
    if (pos.length === 2) out.push({ a: pos[0], b: pos[1], unit: u });
  }
  return out;
}

interface Turbot {
  /** Chain b1 = a1 - a2 = b2: the ends b1 and b2 cannot both be false. */
  b1: number;
  a1: number;
  a2: number;
  b2: number;
  u1: number;
  u2: number;
}

function turbotStep(s: SolverState, d: number, t: Turbot, technique: TechniqueId, label: string, detail: string): Step | null {
  const targets = cellsSeeingAll(s, [t.b1, t.b2], d).filter((c) => c !== t.a1 && c !== t.a2);
  const live = liveElims(s, targets.map((c) => ({ cell: c, digit: d })));
  if (!live.length) return null;
  const links: ChainLink[] = [
    { from: { cell: t.b1, digit: d }, to: { cell: t.a1, digit: d }, type: 'strong' },
    { from: { cell: t.a1, digit: d }, to: { cell: t.a2, digit: d }, type: 'weak' },
    { from: { cell: t.a2, digit: d }, to: { cell: t.b2, digit: d }, type: 'strong' },
  ];
  return makeStep({
    technique,
    eliminations: live,
    patternCells: [t.b1, t.a1, t.a2, t.b2],
    units: [t.u1, t.u2],
    candidates: [
      { cell: t.b1, digit: d, role: 'color-a' },
      { cell: t.a1, digit: d, role: 'color-b' },
      { cell: t.a2, digit: d, role: 'color-a' },
      { cell: t.b2, digit: d, role: 'color-b' },
    ],
    links,
    explanation: `${label} on ${d}: ${detail}, so at least one of ${cellName(t.b1)} and ${cellName(t.b2)} is ${d} (chain ${d}${cellName(t.b1)} = ${d}${cellName(t.a1)} – ${d}${cellName(t.a2)} = ${d}${cellName(t.b2)}). Remove ${d} from ${cellsText(live.map((e) => e.cell))}, which see${live.length > 1 ? '' : 's'} both.`,
  });
}

/**
 * Skyscraper: two conjugate pairs on the same digit in two rows (or two columns) share one end line
 * (the "base"); the other two ends (the roof) cannot both be false.
 */
export function findSkyscraper(s: SolverState): Step | null {
  for (let d = 1; d <= 9; d++) {
    for (const rowMode of [true, false]) {
      const links = conjugatePairs(s, d, (u) => (rowMode ? u < 9 : u >= 9 && u < 18));
      const cross = (c: number) => (rowMode ? colOf(c) : rowOf(c));
      for (let i = 0; i < links.length; i++)
        for (let j = i + 1; j < links.length; j++) {
          const L1 = links[i];
          const L2 = links[j];
          for (const [a1, b1] of [[L1.a, L1.b], [L1.b, L1.a]])
            for (const [a2, b2] of [[L2.a, L2.b], [L2.b, L2.a]]) {
              if (cross(a1) !== cross(a2) || cross(b1) === cross(b2)) continue;
              if (!anySeesBoth(s, b1, b2, d, a1, a2)) continue;
              const step = turbotStep(
                s,
                d,
                { b1, a1, a2, b2, u1: L1.unit, u2: L2.unit },
                'skyscraper',
                'Skyscraper',
                `${unitName(L1.unit)} and ${unitName(L2.unit)} each have ${d} in only two cells, and ${cellName(a1)} and ${cellName(a2)} line up in ${unitName(rowMode ? 9 + colOf(a1) : rowOf(a1))} (only one of them can be ${d})`,
              );
              if (step) return step;
            }
        }
    }
  }
  return null;
}

/**
 * Two-string kite: a row conjugate pair and a column conjugate pair on the same digit, with one end of each
 * in the same box; the two far ends cannot both be false.
 */
export function findTwoStringKite(s: SolverState): Step | null {
  for (let d = 1; d <= 9; d++) {
    const rows = conjugatePairs(s, d, (u) => u < 9);
    const cols = conjugatePairs(s, d, (u) => u >= 9 && u < 18);
    for (const R of rows)
      for (const C of cols)
        for (const [a1, b1] of [[R.a, R.b], [R.b, R.a]])
          for (const [a2, b2] of [[C.a, C.b], [C.b, C.a]]) {
            if (a1 === a2 || b1 === b2 || a1 === b2 || a2 === b1) continue;
            if (boxOf(a1) !== boxOf(a2)) continue;
            if (boxOf(b1) === boxOf(a1) || boxOf(b2) === boxOf(a1)) continue;
            if (!anySeesBoth(s, b1, b2, d, a1, a2)) continue;
            const step = turbotStep(
              s,
              d,
              { b1, a1, a2, b2, u1: R.unit, u2: C.unit },
              'two-string-kite',
              'Two-string kite',
              `${unitName(R.unit)} and ${unitName(C.unit)} each have ${d} in only two cells, and ${cellName(a1)} and ${cellName(a2)} share ${unitName(18 + boxOf(a1))} (only one of them can be ${d})`,
            );
            if (step) return step;
          }
  }
  return null;
}

/**
 * Turbot fish: the general single-digit chain strong – weak – strong (X-Chain with four cells), where the
 * strong links may lie in rows, columns or boxes. Skyscraper and two-string kite are special cases that are
 * tried first; this detector finds the remaining shapes (typically involving a box conjugate pair).
 */
export function findTurbotFish(s: SolverState): Step | null {
  for (let d = 1; d <= 9; d++) {
    const links = conjugatePairs(s, d);
    for (let i = 0; i < links.length; i++)
      for (let j = 0; j < links.length; j++) {
        if (i === j) continue;
        const L1 = links[i];
        const L2 = links[j];
        for (const [b1, a1] of [[L1.a, L1.b], [L1.b, L1.a]])
          for (const [a2, b2] of [[L2.a, L2.b], [L2.b, L2.a]]) {
            const cells = new Set([b1, a1, a2, b2]);
            if (cells.size !== 4) continue;
            if (!see(a1, a2)) continue;
            if (!anySeesBoth(s, b1, b2, d, a1, a2)) continue;
            const step = turbotStep(
              s,
              d,
              { b1, a1, a2, b2, u1: L1.unit, u2: L2.unit },
              'turbot-fish',
              'Turbot fish',
              `${cellName(b1)} and ${cellName(a1)} are the only places for ${d} in ${unitName(L1.unit)}, ${cellName(a2)} and ${cellName(b2)} are the only places in ${unitName(L2.unit)}, and ${cellName(a1)} sees ${cellName(a2)}`,
            );
            if (step) return step;
          }
      }
  }
  return null;
}

