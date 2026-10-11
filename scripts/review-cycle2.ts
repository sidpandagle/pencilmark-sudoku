/**
 * Review cycle 2 — adversarial correctness checks against the public engine API.
 * Run: bun scripts/review-cycle2.ts
 */
import {
  analyzePuzzle,
  bit,
  computeCandidates,
  countSolutions,
  createRng,
  DIFFICULTIES,
  generatePuzzle,
  getDailyPuzzle,
  getHint,
  parseGrid,
  ratePuzzle,
  validateStep,
  createSolverState,
} from '../src/engine';

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log('FAIL', msg);
};

// 1. Malformed input must never throw from analyzePuzzle.
const junk: unknown[] = [
  [],
  new Array(80).fill(0),
  new Array(82).fill(0),
  new Array(81).fill(NaN),
  new Array(81).fill(10),
  new Array(81).fill(-1),
  new Array(81).fill('5'),
  new Array(81).fill(1.5),
  null,
  undefined,
  'hello',
];
for (const j of junk) {
  try {
    const r = analyzePuzzle(j as number[]);
    if (r.status !== 'invalid') fail(`junk accepted: ${JSON.stringify(j)?.slice(0, 40)} -> ${r.status}`);
  } catch (e) {
    fail(`analyzePuzzle threw on junk ${String(j).slice(0, 20)}: ${e}`);
  }
}

// 2. parseGrid edge cases.
const parseCases: [string, boolean][] = [
  ['.'.repeat(81), true],
  ['0'.repeat(81), true],
  ['１'.repeat(81), false], // full-width digits
  ['5'.repeat(80), false],
  ['5'.repeat(82), false],
  ['x'.repeat(81), false],
  ['1'.repeat(5000), false],
  ['53..7....|6..195...\n.98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79', true],
];
for (const [text, ok] of parseCases) {
  let parsed = false;
  try {
    parseGrid(text);
    parsed = true;
  } catch {
    parsed = false;
  }
  if (parsed !== ok) fail(`parseGrid(${text.slice(0, 15)}… len ${text.length}) parsed=${parsed}, expected ${ok}`);
}

// 3. Status classification.
const empty = analyzePuzzle(new Array(81).fill(0));
if (empty.status !== 'multiple') fail(`empty grid -> ${empty.status}`);
// No direct conflict, but unsolvable: r1 has 1-8 in c1-c8, and 9 sits in c9's column elsewhere.
const unsolv = new Array(81).fill(0);
for (let c = 0; c < 8; c++) unsolv[c] = c + 1;
unsolv[9 * 4 + 8] = 9; // r5c9 = 9 -> r1c9 can't be 9
const u = analyzePuzzle(unsolv);
if (u.status !== 'unsolvable') fail(`hidden contradiction -> ${u.status}`);
// Known 17-clue puzzle (unique).
const p17 = parseGrid('000000010400000000020000000000050407008000300001090000300400200050100000000806000');
const a17 = analyzePuzzle(p17);
if (a17.status !== 'unique') fail(`17-clue -> ${a17.status}`);
console.log('17-clue analysis:', a17.difficulty, a17.hardestTechnique, 'beyond=', a17.beyondTechniques);

// 4. Generated puzzles: unique, labelled correctly, fast.
const rng = createRng(2026);
for (const d of DIFFICULTIES) {
  let maxMs = 0;
  for (let i = 0; i < 60; i++) {
    const t = performance.now();
    const g = generatePuzzle(d, Math.floor(rng() * 2 ** 32));
    maxMs = Math.max(maxMs, performance.now() - t);
    if (countSolutions(g.puzzle, 2).count !== 1) fail(`${d} puzzle not unique`);
    if (g.puzzle.some((v, k) => v && v !== g.solution[k])) fail(`${d} givens disagree with solution`);
    const r = ratePuzzle(g.puzzle, true);
    if (!r.solved || r.difficulty !== d) fail(`${d} puzzle rated ${r.difficulty} solved=${r.solved}`);
  }
  console.log(`${d}: max generatePuzzle ${maxMs.toFixed(1)} ms`);
}

// 5. Daily puzzle determinism.
const d1 = getDailyPuzzle('2026-10-11');
const d2 = getDailyPuzzle('2026-10-11');
if (d1.puzzle.join('') !== d2.puzzle.join('')) fail('daily not deterministic');
if (getDailyPuzzle('2026-10-12').puzzle.join('') === d1.puzzle.join('')) fail('daily same across dates');

// 6. Hints from random mid-game positions with random (but solution-consistent) notes.
let hintSteps = 0;
let hintMaxMs = 0;
for (let i = 0; i < 300; i++) {
  const d = DIFFICULTIES[i % 4];
  const g = generatePuzzle(d, i * 7919);
  const grid = g.puzzle.slice();
  // Fill a random fraction of empty cells with correct digits.
  const frac = rng() * 0.6;
  for (let c = 0; c < 81; c++) if (!grid[c] && rng() < frac) grid[c] = g.solution[c];
  const cands = computeCandidates(grid);
  const notes = cands.map((m, c) => {
    if (!m || rng() < 0.5) return 0; // half the cells without notes
    // keep the solution digit, randomly drop others
    let n = bit(g.solution[c]);
    for (let dd = 1; dd <= 9; dd++) if (m & bit(dd) && rng() < 0.7) n |= bit(dd);
    return n;
  });
  const t = performance.now();
  const h = getHint(grid, g.solution, i % 3 === 0 ? undefined : notes);
  hintMaxMs = Math.max(hintMaxMs, performance.now() - t);
  if (h.kind === 'step') {
    hintSteps++;
    const state = createSolverState(grid, notes.map((n, c) => (n ? n & cands[c] : cands[c])), true);
    const v = validateStep(h.step, g.solution, state);
    if (v.length) fail(`hint step invalid: ${v.join('; ')}`);
    for (const p of h.step.placements) if (g.solution[p.cell] !== p.digit) fail(`hint places wrong digit ${h.step.technique}`);
    for (const e of h.step.eliminations) if (g.solution[e.cell] === e.digit) fail(`hint eliminates solution digit ${h.step.technique}`);
    if (!h.step.placements.length && !h.step.eliminations.length) fail('hint step makes no progress');
    if (/\bundefined\b|NaN/.test(h.step.explanation + h.nudge)) fail(`bad text: ${h.step.explanation}`);
  } else if (h.kind !== 'none') {
    fail(`unexpected hint kind ${h.kind}`);
  }
}
console.log(`hints: ${hintSteps} steps validated, max ${hintMaxMs.toFixed(1)} ms`);

// 7. Mistakes and bad notes are reported before steps.
{
  const g = generatePuzzle('easy', 99);
  const grid = g.puzzle.slice();
  const empty1 = grid.findIndex((v) => v === 0);
  grid[empty1] = (g.solution[empty1] % 9) + 1;
  const h = getHint(grid, g.solution);
  if (h.kind !== 'mistake' || !h.cells.includes(empty1)) fail('mistake not reported first');
  const grid2 = g.puzzle.slice();
  const notes = new Array(81).fill(0);
  notes[empty1] = 0x1ff & ~bit(g.solution[empty1]);
  const h2 = getHint(grid2, g.solution, notes);
  if (h2.kind !== 'bad-notes' || !h2.cells.includes(empty1)) fail('bad notes not reported');
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
