import { bit, cellName, PEERS, popcount } from '../grid';
import type { SolverState } from '../solver/state';
import type { ChainLink, HighlightCandidate, Step, TechniqueId } from '../steps';
import type { CellDigit } from '../types';
import { ALL_UNITS, elimText, liveElims, makeStep, see } from './util';

/*
 * Alternating inference chains (AIC) over candidate nodes (cell, digit).
 *
 *  - Strong link A = B: A and B cannot both be false (bivalue cell, or the only two places for a digit in a unit).
 *  - Weak link A – B: A and B cannot both be true (same cell, or same digit in cells that see each other).
 *
 * A chain A = n1 – n2 = n3 … = B that starts and ends with a strong link proves "A or B" (if A is false, the
 * links force B true). Every candidate that is weakly linked to both A and B is therefore false. This holds
 * regardless of what else the chain contains, so the only correctness requirement is that every link used
 * really is strong / weak, which the link builders guarantee by construction.
 *
 * Families:
 *  - x-chain: single digit; strong links are conjugate pairs, weak links are same-digit peers.
 *  - xy-chain: strong links only inside bivalue cells, weak links only between same digits in peer cells.
 *  - aic: any mix of the above.
 */

type Mode = 'x' | 'xy' | 'aic';
const node = (cell: number, digit: number) => cell * 9 + digit - 1;
const nCell = (n: number) => Math.floor(n / 9);
const nDigit = (n: number) => (n % 9) + 1;
const nodeCD = (n: number): CellDigit => ({ cell: nCell(n), digit: nDigit(n) });

interface Graph {
  strong: number[][];
  weak: number[][];
}

function buildGraph(s: SolverState, mode: Mode, onlyDigit = 0): Graph {
  const strong: number[][] = Array.from({ length: 729 }, () => []);
  const weak: number[][] = Array.from({ length: 729 }, () => []);
  const has = (c: number, d: number) => !s.grid[c] && (s.cands[c] & bit(d)) !== 0;
  for (let c = 0; c < 81; c++) {
    if (s.grid[c]) continue;
    for (let d = 1; d <= 9; d++) {
      if (!has(c, d) || (onlyDigit && d !== onlyDigit)) continue;
      const n = node(c, d);
      // Same digit, peer cells.
      for (const p of PEERS[c]) if (has(p, d)) weak[n].push(node(p, d));
      if (mode !== 'x') {
        // Same cell, other digits (a weak link only in AIC; xy-chains use the in-cell link as strong).
        if (mode === 'aic') for (let e = 1; e <= 9; e++) if (e !== d && has(c, e)) weak[n].push(node(c, e));
        if (popcount(s.cands[c]) === 2) {
          for (let e = 1; e <= 9; e++) if (e !== d && has(c, e)) strong[n].push(node(c, e));
        }
      }
    }
  }
  if (mode !== 'xy') {
    for (let u = 0; u < 27; u++)
      for (let d = 1; d <= 9; d++) {
        if (onlyDigit && d !== onlyDigit) continue;
        const pos: number[] = [];
        let placed = false;
        for (const c of ALL_UNITS[u]) {
          if (s.grid[c] === d) placed = true;
          else if (has(c, d)) pos.push(c);
        }
        if (placed || pos.length !== 2) continue;
        const a = node(pos[0], d);
        const b = node(pos[1], d);
        if (!strong[a].includes(b)) strong[a].push(b);
        if (!strong[b].includes(a)) strong[b].push(a);
      }
  }
  return { strong, weak };
}

/** Candidates (other than A and B) weakly linked to both A and B. */
function endpointEliminations(s: SolverState, A: number, B: number): CellDigit[] {
  const ca = nCell(A);
  const cb = nCell(B);
  const da = nDigit(A);
  const db = nDigit(B);
  const out: CellDigit[] = [];
  if (ca === cb) {
    for (let d = 1; d <= 9; d++) if (d !== da && d !== db) out.push({ cell: ca, digit: d });
  } else if (da === db) {
    for (const p of PEERS[ca]) if (p !== cb && see(p, cb)) out.push({ cell: p, digit: da });
  } else if (see(ca, cb)) {
    out.push({ cell: ca, digit: db }, { cell: cb, digit: da });
  }
  return liveElims(s, out);
}

/** Allocation-free count of endpointEliminations(s, A, B).length (hot path of the chain search). */
function countEndpointEliminations(s: SolverState, A: number, B: number): number {
  const ca = nCell(A);
  const cb = nCell(B);
  const da = nDigit(A);
  const db = nDigit(B);
  if (ca === cb) return popcount(s.cands[ca] & ~bit(da) & ~bit(db));
  if (da === db) {
    const b = bit(da);
    let n = 0;
    for (const p of PEERS[ca]) if (p !== cb && s.cands[p] & b && see(p, cb)) n++;
    return n;
  }
  if (!see(ca, cb)) return 0;
  return ((s.cands[ca] & bit(db)) !== 0 ? 1 : 0) + ((s.cands[cb] & bit(da)) !== 0 ? 1 : 0);
}

interface Found {
  path: number[];
  elims: CellDigit[];
}

/**
 * Shortest chain (by number of links, at least 3) that yields an elimination, searched breadth-first from every
 * start node. `maxLinks` caps the chain length to keep the search fast.
 */
function searchChains(s: SolverState, mode: Mode, maxLinks: number, onlyDigit = 0): Found | null {
  const g = buildGraph(s, mode, onlyDigit);
  let best: Found | null = null;
  const parent = new Int32Array(729 * 2);
  const depth = new Int16Array(729 * 2);
  const queue = new Int32Array(729 * 2);
  for (let A = 0; A < 729; A++) {
    if (!g.strong[A].length) continue;
    parent.fill(-2);
    // state = node * 2 + t ; t = 1 when the node was reached through a strong link (next link must be weak).
    let qh = 0;
    let qt = 0;
    const s0 = A * 2;
    parent[s0] = -1;
    depth[s0] = 0;
    queue[qt++] = s0;
    let limit = best ? Math.min(maxLinks, best.path.length - 1) : maxLinks;
    const inPath = (st: number, target: number) => {
      for (let x = st; x !== -1; x = parent[x]) if (x >> 1 === target) return true;
      return false;
    };
    while (qh < qt) {
      const st = queue[qh++];
      const n = st >> 1;
      const t = st & 1;
      const dep = depth[st];
      if (dep >= limit) continue;
      const nextT = t === 0 ? 1 : 0;
      const nbrs = t === 0 ? g.strong[n] : g.weak[n];
      for (const m of nbrs) {
        const ns = m * 2 + nextT;
        if (parent[ns] !== -2) continue;
        if (inPath(st, m)) continue;
        parent[ns] = st;
        depth[ns] = dep + 1;
        queue[qt++] = ns;
        if (nextT === 1 && dep + 1 >= 3) {
          const k = countEndpointEliminations(s, A, m);
          if (k) {
            const len = dep + 1;
            if (!best || len < best.path.length - 1 || (len === best.path.length - 1 && k > best.elims.length)) {
              const path: number[] = [];
              for (let x = ns; x !== -1; x = parent[x]) path.push(x >> 1);
              path.reverse();
              best = { path, elims: endpointEliminations(s, A, m) };
              limit = Math.min(limit, len);
            }
          }
        }
      }
    }
  }
  return best;
}

const TITLES: Record<Mode, string> = { x: 'X-Chain', xy: 'XY-Chain', aic: 'Alternating inference chain' };
const IDS: Record<Mode, TechniqueId> = { x: 'x-chain', xy: 'xy-chain', aic: 'aic' };

export function chainNotation(path: number[]): string {
  let out = '';
  for (let i = 0; i < path.length; i++) {
    const n = path[i];
    if (i > 0) out += i % 2 === 1 ? ' = ' : ' – ';
    out += `${nDigit(n)}${cellName(nCell(n))}`;
  }
  return out;
}

function chainStep(s: SolverState, mode: Mode, f: Found): Step {
  const { path, elims } = f;
  const links: ChainLink[] = [];
  for (let i = 0; i + 1 < path.length; i++)
    links.push({ from: nodeCD(path[i]), to: nodeCD(path[i + 1]), type: i % 2 === 0 ? 'strong' : 'weak' });
  const candidates: HighlightCandidate[] = path.map((n, i) => ({ ...nodeCD(n), role: i % 2 === 0 ? 'color-b' : 'color-a' }));
  const A = nodeCD(path[0]);
  const B = nodeCD(path[path.length - 1]);
  const ends = `${cellName(A.cell)} is ${A.digit} or ${cellName(B.cell)} is ${B.digit}`;
  const digitWord = mode === 'x' ? ` on ${A.digit}` : '';
  return makeStep({
    technique: IDS[mode],
    eliminations: elims,
    patternCells: path.map(nCell),
    candidates,
    links,
    explanation: `${TITLES[mode]}${digitWord}: ${chainNotation(path)} ("=" means at least one is true, "–" means at most one is true). So ${ends}; remove ${elimText(elims)}, since ${elims.length > 1 ? 'each of these candidates conflicts' : 'it conflicts'} with both ends.`,
  });
}

export function findXChain(s: SolverState): Step | null {
  // In 'x' mode the graph only links equal digits, so one search covers all nine digits.
  const f = searchChains(s, 'x', 11);
  return f ? chainStep(s, 'x', f) : null;
}

export function findXYChain(s: SolverState): Step | null {
  const f = searchChains(s, 'xy', 13);
  return f ? chainStep(s, 'xy', f) : null;
}

export function findAIC(s: SolverState): Step | null {
  const f = searchChains(s, 'aic', 11);
  return f ? chainStep(s, 'aic', f) : null;
}
