import { bit, cellName } from '../grid';
import type { SolverState } from '../solver/state';
import type { ChainLink, HighlightCandidate, Step } from '../steps';
import { conjugatePairs } from './singleDigit';
import { cellsText, liveElims, makeStep, see } from './util';

/**
 * Simple colouring (single-digit colouring): conjugate pairs of one digit form chains; colour them
 * alternately. Exactly one colour of a cluster is true.
 *  - Colour wrap: two cells of the same colour see each other, so that colour is false everywhere.
 *  - Colour trap: a cell outside the cluster that sees both colours cannot hold the digit.
 */
export function findSimpleColoring(s: SolverState): Step | null {
  for (let d = 1; d <= 9; d++) {
    const links = conjugatePairs(s, d);
    if (links.length < 2) continue;
    const adj = new Map<number, number[]>();
    for (const L of links) {
      if (!adj.has(L.a)) adj.set(L.a, []);
      if (!adj.has(L.b)) adj.set(L.b, []);
      adj.get(L.a)!.push(L.b);
      adj.get(L.b)!.push(L.a);
    }
    const color = new Map<number, number>();
    for (const start of adj.keys()) {
      if (color.has(start)) continue;
      // BFS 2-colouring of the cluster.
      const cluster: number[] = [start];
      color.set(start, 0);
      let bipartite = true;
      for (let qi = 0; qi < cluster.length; qi++) {
        const c = cluster[qi];
        for (const n of adj.get(c)!) {
          if (!color.has(n)) {
            color.set(n, 1 - color.get(c)!);
            cluster.push(n);
          } else if (color.get(n) === color.get(c)) bipartite = false;
        }
      }
      if (!bipartite || cluster.length < 3) continue;
      const A = cluster.filter((c) => color.get(c) === 0).sort((x, y) => x - y);
      const B = cluster.filter((c) => color.get(c) === 1).sort((x, y) => x - y);
      const clusterLinks: ChainLink[] = links
        .filter((L) => color.has(L.a) && cluster.includes(L.a))
        .map((L) => ({ from: { cell: L.a, digit: d }, to: { cell: L.b, digit: d }, type: 'strong' as const }));
      const highlights: HighlightCandidate[] = [
        ...A.map((c) => ({ cell: c, digit: d, role: 'color-a' as const })),
        ...B.map((c) => ({ cell: c, digit: d, role: 'color-b' as const })),
      ];
      // Colour wrap.
      for (const [same, other, label] of [
        [A, B, 'blue'],
        [B, A, 'orange'],
      ] as const) {
        let clash: [number, number] | null = null;
        for (let i = 0; i < same.length && !clash; i++)
          for (let j = i + 1; j < same.length; j++)
            if (see(same[i], same[j])) {
              clash = [same[i], same[j]];
              break;
            }
        if (!clash) continue;
        const live = liveElims(s, same.map((c) => ({ cell: c, digit: d })));
        if (!live.length) continue;
        return makeStep({
          technique: 'simple-coloring',
          eliminations: live,
          patternCells: cluster,
          candidates: highlights,
          links: clusterLinks,
          explanation: `Simple colouring on ${d}: colour the chain of conjugate pairs alternately; two ${label} cells, ${cellName(clash[0])} and ${cellName(clash[1])}, see each other, so ${label} cannot be ${d}. Remove ${d} from ${cellsText(live.map((e) => e.cell))} (the other colour, ${cellsText([...other])}, holds the ${d}s).`,
        });
      }
      // Colour trap.
      const b = bit(d);
      const trap: number[] = [];
      for (let c = 0; c < 81; c++) {
        if (!(s.cands[c] & b) || color.has(c) && cluster.includes(c)) continue;
        if (A.some((x) => see(x, c)) && B.some((x) => see(x, c))) trap.push(c);
      }
      const live = liveElims(s, trap.map((c) => ({ cell: c, digit: d })));
      if (live.length) {
        return makeStep({
          technique: 'simple-coloring',
          eliminations: live,
          patternCells: cluster,
          candidates: highlights,
          links: clusterLinks,
          explanation: `Simple colouring on ${d}: colour the chain of conjugate pairs alternately; one colour holds all the ${d}s. ${cellsText(live.map((e) => e.cell))} see${live.length > 1 ? '' : 's'} both a blue and an orange cell, so remove ${d} from ${live.length > 1 ? 'them' : 'it'}.`,
        });
      }
    }
  }
  return null;
}
