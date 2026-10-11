import { ALL_UNITS, bit, cellName, PEERS, popcount, singleDigit, unitName } from '../grid';
import type { SolverState } from '../solver/state';
import type { HighlightCandidate, Step } from '../steps';
import type { CellDigit } from '../types';
import { makeStep, positions, digitPlacedIn } from './util';

/*
 * Forcing chains (last resort). An assumption "cell = digit" is propagated with naked and hidden singles only.
 *  - Contradiction: if the assumption empties a cell or leaves a digit with no place in a unit, it is false.
 *  - Cell forcing chain: every candidate of a cell leads to the same placement or elimination, so it is true.
 *  - Unit forcing chain: every possible position of a digit in a unit leads to the same conclusion.
 * Each branch is pure single-propagation, which is sound; exactly one branch is true in the real solution
 * (the candidate state always contains the solution), so a conclusion shared by all branches is true.
 * The search is capped: only cells with 2-3 candidates and digits with 2-3 places in a unit are used as branch
 * sets, and contradictions are only checked for the assumptions those sets propagate.
 */

/** Largest branch set tried (cell candidates or unit positions). */
const MAX_BRANCHES = 3;

interface Placement {
  cell: number;
  digit: number;
  parent: number; // index of the placement that triggered this one (-1 for the assumption)
}

interface Branch {
  cell: number;
  digit: number;
  grid: number[];
  cands: number[];
  order: Placement[];
  /** Index (into order) of the placement that removed candidate (cell, digit), or -1. */
  elimCause: Int16Array;
  /** depth[i] = number of placements on the trail from the assumption to placement i (inclusive). */
  depth: Int16Array;
  /** placedAt[cell] = index of the placement in that cell, or -1. */
  placedAt: Int16Array;
  contradiction: boolean;
  /** Human-readable description of the contradiction. */
  why: string;
  /** Index (into order) of the placement that triggered the contradiction. */
  whyAt: number;
}

const CELL_UNITS: readonly number[][] = Array.from({ length: 81 }, (_, c) => [Math.floor(c / 9), 9 + (c % 9), 18 + Math.floor(Math.floor(c / 9) / 3) * 3 + Math.floor((c % 9) / 3)]);

/** Per unit/digit count of possible positions (-1 when the digit is already placed in the unit). */
function unitCounts(s: SolverState): Int8Array {
  const cnt = new Int8Array(27 * 9);
  for (let u = 0; u < 27; u++)
    for (const c of ALL_UNITS[u]) {
      if (s.grid[c]) cnt[u * 9 + s.grid[c] - 1] = -1;
    }
  for (let u = 0; u < 27; u++)
    for (const c of ALL_UNITS[u]) {
      if (s.grid[c]) continue;
      for (let d = 1; d <= 9; d++) if (s.cands[c] & bit(d) && cnt[u * 9 + d - 1] >= 0) cnt[u * 9 + d - 1]++;
    }
  return cnt;
}

/**
 * Propagate the assumption cell = digit with naked and hidden singles (event driven: a cell dropping to one
 * candidate, or a digit dropping to one place in a unit, queues a placement). Records for every placement the
 * placement that triggered it, so the chain can be explained.
 */
function propagate(s: SolverState, baseCounts: Int8Array, cell: number, digit: number): Branch {
  const grid = s.grid.slice();
  const cands = s.cands.slice();
  const cnt = baseCounts.slice();
  const order: Placement[] = [];
  const elimCause = new Int16Array(729).fill(-1);
  const depth = new Int16Array(82);
  const placedAt = new Int16Array(81).fill(-1);
  const br: Branch = { cell, digit, grid, cands, order, elimCause, depth, placedAt, contradiction: false, why: '', whyAt: 0 };
  const qc: number[] = [];
  const qd: number[] = [];
  const qp: number[] = [];
  const fail = (why: string, at: number) => {
    if (!br.contradiction) {
      br.contradiction = true;
      br.why = why;
      br.whyAt = at;
    }
  };
  const removeCand = (p: number, e: number, idx: number) => {
    cands[p] &= ~bit(e);
    if (elimCause[p * 9 + e - 1] < 0) elimCause[p * 9 + e - 1] = idx;
    if (!grid[p]) {
      if (cands[p] === 0) fail(`${cellName(p)} would have no candidates left`, idx);
      else {
        const only = singleDigit(cands[p]);
        if (only) {
          qc.push(p);
          qd.push(only);
          qp.push(idx);
        }
      }
    }
    for (const u of CELL_UNITS[p]) {
      const k = u * 9 + e - 1;
      if (cnt[k] < 0) continue;
      cnt[k]--;
      if (cnt[k] === 0) fail(`${e} would have no place left in ${unitName(u)}`, idx);
      else if (cnt[k] === 1) {
        const b = bit(e);
        for (const c of ALL_UNITS[u])
          if (!grid[c] && cands[c] & b) {
            qc.push(c);
            qd.push(e);
            qp.push(idx);
            break;
          }
      }
    }
  };
  const place = (c: number, d: number, parent: number) => {
    const idx = order.length;
    order.push({ cell: c, digit: d, parent });
    depth[idx] = parent < 0 ? 1 : depth[parent] + 1;
    placedAt[c] = idx;
    grid[c] = d;
    for (const u of CELL_UNITS[c]) cnt[u * 9 + d - 1] = -1;
    const others = cands[c] & ~bit(d);
    for (let e = 1; e <= 9; e++) if (others & bit(e)) removeCand(c, e, idx);
    cands[c] = 0;
    const b = bit(d);
    for (const p of PEERS[c]) if (cands[p] & b) removeCand(p, d, idx);
  };
  place(cell, digit, -1);
  for (let qi = 0; qi < qc.length && !br.contradiction; qi++) {
    const c = qc[qi];
    const d = qd[qi];
    if (grid[c] === d) continue;
    if (grid[c]) {
      fail(`${cellName(c)} would need to be both ${grid[c]} and ${d}`, qp[qi]);
      break;
    }
    if (!(cands[c] & bit(d))) {
      fail(`${cellName(c)} would have to be ${d}, which is already ruled out`, qp[qi]);
      break;
    }
    place(c, d, qp[qi]);
  }
  return br;
}

/** Placement chain (indices) from the assumption to placement `idx`. */
function trail(br: Branch, idx: number): number[] {
  const out: number[] = [];
  for (let i = idx; i >= 0; i = br.order[i].parent) out.push(i);
  return out.reverse();
}

const isPlaced = (br: Branch, c: number, d: number) => br.grid[c] === d;

/** Index of the placement that establishes conclusion (placement or elimination) in a branch. */
function causeOf(br: Branch, c: number, d: number, place: boolean): number {
  if (place) return br.grid[c] === d ? br.placedAt[c] : -1;
  const own = br.placedAt[c];
  if (own >= 0) return own;
  return br.elimCause[c * 9 + d - 1];
}

function describeTrail(br: Branch, idx: number, maxShown = 5): string {
  const t = trail(br, idx).map((i) => `${cellName(br.order[i].cell)} = ${br.order[i].digit}`);
  if (t.length <= maxShown) return t.join(' → ');
  return [...t.slice(0, 2), '…', ...t.slice(-2)].join(' → ');
}

interface Candidate {
  kind: 'contradiction' | 'cell' | 'unit';
  branches: Branch[];
  conclusion: CellDigit;
  place: boolean;
  depth: number;
  unit?: number;
}

export function findForcingChain(s: SolverState): Step | null {
  const cache = new Map<number, Branch>();
  const base = unitCounts(s);
  const get = (c: number, d: number) => {
    const k = c * 9 + d - 1;
    let b = cache.get(k);
    if (!b) {
      b = propagate(s, base, c, d);
      cache.set(k, b);
    }
    return b;
  };
  let best: Candidate | null = null;
  let bestDepth = Infinity;
  const consider = (cand: Candidate) => {
    if (!best || cand.depth < best.depth || (cand.depth === best.depth && cand.place && !best.place)) {
      best = cand;
      bestDepth = cand.depth;
    }
  };

  // Branch sets (capped at MAX_BRANCHES): cells with few candidates, then digits with few places in a unit.
  const branchSets: { kind: 'cell' | 'unit'; branches: Branch[]; unit?: number }[] = [];
  for (let c = 0; c < 81; c++) {
    if (s.grid[c]) continue;
    const k = popcount(s.cands[c]);
    if (k < 2 || k > MAX_BRANCHES) continue;
    const brs: Branch[] = [];
    for (let d = 1; d <= 9; d++) if (s.cands[c] & bit(d)) brs.push(get(c, d));
    branchSets.push({ kind: 'cell', branches: brs });
  }
  for (let u = 0; u < 27; u++)
    for (let d = 1; d <= 9; d++) {
      if (digitPlacedIn(s, u, d)) continue;
      const pos = positions(s, u, d);
      if (pos.length < 2 || pos.length > MAX_BRANCHES) continue;
      branchSets.push({ kind: 'unit', unit: u, branches: pos.map((c) => get(c, d)) });
    }

  // 1. Contradictions among the propagated assumptions (in cell/digit order for determinism).
  for (const k of [...cache.keys()].sort((a, b) => a - b)) {
    const br = cache.get(k)!;
    if (br.contradiction) consider({ kind: 'contradiction', branches: [br], conclusion: { cell: br.cell, digit: br.digit }, place: false, depth: br.order.length });
  }

  // 2. Common conclusions of branch sets.
  for (const set of branchSets) {
    if (set.branches.some((b) => b.contradiction)) continue;
    const [first, ...rest] = set.branches;
    // Common placements.
    for (const p of first.order) {
      if (s.grid[p.cell]) continue;
      if (!rest.every((b) => isPlaced(b, p.cell, p.digit))) continue;
      let depth = 0;
      for (const b of set.branches) depth = Math.max(depth, b.depth[causeOf(b, p.cell, p.digit, true)]);
      consider({ kind: set.kind, branches: set.branches, conclusion: { cell: p.cell, digit: p.digit }, place: true, depth, unit: set.unit });
    }
    // Common eliminations.
    for (let c = 0; c < 81; c++) {
      if (s.grid[c]) continue;
      let common = s.cands[c];
      for (const b of set.branches) common &= ~(b.grid[c] ? bit(b.grid[c]) : b.cands[c]);
      if (!common) continue;
      for (let d = 1; d <= 9; d++) {
        if (!(common & bit(d))) continue;
        let depth = 0;
        for (const b of set.branches) depth = Math.max(depth, b.depth[causeOf(b, c, d, false)] + 1);
        if (depth > bestDepth) continue;
        consider({ kind: set.kind, branches: set.branches, conclusion: { cell: c, digit: d }, place: false, depth, unit: set.unit });
      }
    }
  }
  if (!best) return null;
  return forcingStep(s, best);
}

function forcingStep(s: SolverState, f: Candidate): Step {
  const { cell, digit } = f.conclusion;
  const pattern = new Set<number>();
  const highlights: HighlightCandidate[] = [];
  const parts: string[] = [];
  f.branches.forEach((br, bi) => {
    const role = bi % 2 === 0 ? 'color-a' : 'color-b';
    highlights.push({ cell: br.cell, digit: br.digit, role });
    pattern.add(br.cell);
    if (f.kind === 'contradiction') {
      // Only the causal trail that leads to the contradiction (each placement triggered by the previous one).
      for (const i of trail(br, br.whyAt)) pattern.add(br.order[i].cell);
      parts.push(describeTrail(br, br.whyAt, 6));
      return;
    }
    const idx = causeOf(br, cell, digit, f.place);
    for (const i of trail(br, idx)) pattern.add(br.order[i].cell);
    const tail = f.place ? '' : br.grid[cell] ? '' : `, so ${cellName(cell)} ≠ ${digit}`;
    parts.push(`if ${cellName(br.cell)} = ${br.digit}: ${describeTrail(br, idx)}${tail}`);
  });
  const conclusionText = f.place ? `${cellName(cell)} = ${digit}` : `${cellName(cell)} cannot be ${digit}`;
  let explanation: string;
  if (f.kind === 'contradiction') {
    const br = f.branches[0];
    explanation = `Forcing chain (contradiction): if ${cellName(cell)} were ${digit}, singles would follow (${parts[0]}), and then ${br.why}. So ${conclusionText}.`;
  } else {
    const intro =
      f.kind === 'cell'
        ? `Forcing chain on ${cellName(f.branches[0].cell)}: try each of its candidates.`
        : `Forcing chain on ${f.branches[0].digit} in ${unitName(f.unit!)}: try each place it can go.`;
    const cases = parts.join('; ');
    explanation = `${intro} ${cases.charAt(0).toUpperCase()}${cases.slice(1)}. Every case gives the same result, so ${conclusionText}.`;
  }
  pattern.delete(cell);
  return makeStep({
    technique: 'forcing-chain',
    placements: f.place ? [{ cell, digit }] : [],
    eliminations: f.place ? [] : [{ cell, digit }],
    patternCells: [...pattern, cell],
    units: f.unit !== undefined ? [f.unit] : undefined,
    candidates: highlights,
    explanation,
  });
}
