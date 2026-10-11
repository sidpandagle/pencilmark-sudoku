/**
 * Export real, engine-validated Sudoku content for the marketing scenes.
 * Run with bun (TypeScript directly):  bun scripts/export-data.ts   (from marketing/)
 *
 * Every position comes from the app engine (src/engine): mined technique examples, the logical solver
 * and the brute-force solver. Each exported step is re-checked with validateStep against the unique
 * solution, so no scene can show an invalid deduction. Output: marketing/data/*.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALL_UNITS,
  applyStepToGrid,
  bit,
  boxOf,
  colOf,
  computeCandidates,
  countSolutions,
  decodeCandidates,
  findNextStep,
  getPracticePuzzles,
  getTechniqueExamples,
  maskToDigits,
  parseGrid,
  rowOf,
  sees,
  solveLogically,
  techniqueInfo,
  TECHNIQUES,
  unitName,
  validateStep,
  type Step,
  type TechniqueId,
} from '../../src/engine';
import { LEVELS, LESSONS } from '../../src/learn/curriculum';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'data');
mkdirSync(out, { recursive: true });
const write = (name: string, data: unknown) => {
  writeFileSync(join(out, name), JSON.stringify(data, null, 1));
  console.log('wrote data/' + name);
};

const SINGLES: TechniqueId[] = ['full-house', 'naked-single', 'hidden-single'];
const fail = (msg: string): never => {
  throw new Error(msg);
};

function solutionOf(grid: number[]): number[] {
  const r = countSolutions(grid, 2);
  if (r.count !== 1 || !r.solution) fail('position does not have exactly one solution');
  return r.solution!;
}

function checkStep(step: Step, solution: number[], label: string) {
  const v = validateStep(step, solution);
  if (v.length) fail(`${label}: ${v.join('; ')}`);
}

/** Pure cross-hatching proof for a hidden single: every other empty cell of the unit is seen by a placed digit d. */
function crossHatch(grid: number[], step: Step) {
  const { cell: target, digit } = step.placements[0];
  const unit = step.units![0];
  const blocks: { cell: number; by: number; line: 'row' | 'col' | 'box' }[] = [];
  for (const c of ALL_UNITS[unit]) {
    if (c === target || grid[c]) continue;
    const by = grid.findIndex((v, i) => v === digit && sees(i, c));
    if (by < 0) return null; // needs candidate reasoning, not pure cross-hatching
    const line = rowOf(by) === rowOf(c) ? 'row' : colOf(by) === colOf(c) ? 'col' : 'box';
    blocks.push({ cell: c, by, line });
  }
  return blocks;
}

function exportExample(id: TechniqueId, index: number) {
  const ex = getTechniqueExamples(id)[index];
  const grid = [...ex.grid].map((ch) => (ch === '.' ? 0 : Number(ch)));
  return buildExample(id, ex.puzzle, grid, decodeCandidates(ex.candidates), ex.step, index, 'fixture');
}

/** Validate a position + step and package it for the scenes. `index` -1 = mined (not a fixture). */
function buildExample(id: TechniqueId, puzzle: string, grid: number[], cands: number[], step: Step, index: number, source: 'fixture' | 'mined', minedFrom?: string) {
  const ex = { puzzle, step };
  const solution = solutionOf(grid);
  checkStep(ex.step, solution, `${id}#${index}`);
  // the engine must find exactly this step at this position (all easier techniques exhausted)
  const again = findNextStep(grid, cands);
  if (!again || again.technique !== id || again.explanation !== ex.step.explanation)
    fail(`${id}#${index}: engine does not find this step at the position`);
  const after = applyStepToGrid(grid, cands, ex.step);
  let payoff: Step | null = null;
  const next = findNextStep(after.grid, after.candidates);
  if (next && SINGLES.includes(next.technique)) {
    checkStep(next, solution, `${id}#${index} payoff`);
    payoff = next;
  }
  const elimCells = new Set(ex.step.eliminations.map((e) => e.cell));
  return {
    technique: id,
    name: techniqueInfo(id).name,
    level: techniqueInfo(id).level,
    exampleIndex: index,
    puzzle: ex.puzzle,
    grid,
    givens: [...ex.puzzle].map((ch) => ch !== '.'),
    candidates: cands.map((m, i) => (grid[i] ? [] : maskToDigits(m))),
    solution,
    step: ex.step,
    unitNames: (ex.step.units ?? []).map(unitName),
    after: { grid: after.grid, candidates: after.candidates.map((m, i) => (after.grid[i] ? [] : maskToDigits(m))) },
    payoff,
    payoffOnEliminatedCell: !!payoff && payoff.placements.some((p) => elimCells.has(p.cell)),
    crossHatch: id === 'hidden-single' ? crossHatch(grid, ex.step) : null,
    source,
    minedFrom: minedFrom ?? null,
    validated: true,
  };
}

// ---- 1. Technique explainer positions: pick the clearest real example per technique ----
type Ex = ReturnType<typeof buildExample>;
/**
 * Mine positions for technique `id` by following the logical solve of practice puzzles that belong to OTHER
 * techniques (the app's lessons mine only from the technique's own practice list), so the videos never
 * show a lesson exercise or mastery-check position.
 */
function mine(id: TechniqueId, limit = 40): Ex[] {
  const out: Ex[] = [];
  const fixtureGrids = new Set(getTechniqueExamples(id).map((e) => e.grid.replace(/\./g, '0')));
  for (const t of TECHNIQUES) {
    if (t.id === id) continue;
    for (const [pi, p] of getPracticePuzzles(t.id).entries()) {
      let g = parseGrid(p.puzzle);
      let c = computeCandidates(g);
      for (let n = 0; n < 300; n++) {
        const st = findNextStep(g, c);
        if (!st) break;
        if (st.technique === id && !fixtureGrids.has(g.join(''))) {
          try {
            const pz = p.puzzle.replace(/0/g, '.');
            out.push(buildExample(id, pz, g.slice(), c.slice(), st, -1, 'mined', `practice:${t.id}#${pi} step ${n + 1}`));
          } catch { /* skip positions that fail validation */ }
          if (out.length >= limit) return out;
        }
        ({ grid: g, candidates: c } = applyStepToGrid(g, c, st));
      }
    }
  }
  return out;
}
function pickFrom(list: Ex[], score: (e: Ex) => number): Ex {
  if (!list.length) fail('nothing mined');
  return [...list].sort((a, b) => score(b) - score(a))[0];
}
function pick(id: TechniqueId, score: (e: Ex) => number): Ex {
  const all = getTechniqueExamples(id).map((_, i) => exportExample(id, i));
  all.sort((a, b) => score(b) - score(a));
  return all[0];
}

// Example #0 is the one the app's lesson already demonstrates with its answer ("See it in a puzzle").
// Examples #1-#3 are the lesson's guided exercise and mastery check, so videos avoid them (no spoilers).
const DEMO = (e: Ex) => (e.exampleIndex === 0 ? 1000 : 0);
const explainers = {
  'hidden-single': pick('hidden-single', (e) =>
    (e.crossHatch ? DEMO(e) + 100 : 0) + ((e.step.units?.[0] ?? 0) >= 18 ? 10 : 0) - (e.crossHatch?.length ?? 9)),
  // elimination techniques: prefer a mined position whose elimination immediately unlocks a single
  'naked-pair': pickFrom(mine('naked-pair'), (e) => (e.payoffOnEliminatedCell ? 100 : e.payoff ? 50 : 0) - 3 * e.step.eliminations.length + (e.step.units![0] < 9 ? 5 : 0)),
  'x-wing': pickFrom(mine('x-wing'), (e) => (e.payoffOnEliminatedCell ? 100 : e.payoff ? 50 : 0) - 3 * e.step.eliminations.length),
};
for (const [id, e] of Object.entries(explainers))
  console.log(`${id}: ${e.source} #${e.exampleIndex} ${e.minedFrom ?? ''}, payoff=${e.payoff?.technique ?? 'none'} onElim=${e.payoffOnEliminatedCell} :: ${e.step.explanation}`);
if (!explainers['hidden-single'].crossHatch) fail('no hidden single example with pure cross-hatching');
write('explainers.json', explainers);

// ---- 2. Every technique's example 0 (education series + progression) ----
const allExamples: Record<string, unknown> = {};
for (const t of TECHNIQUES) {
  if (!getTechniqueExamples(t.id).length) continue;
  const e = exportExample(t.id, 0);
  allExamples[t.id] = {
    name: e.name,
    level: e.level,
    exampleIndex: 0,
    explanation: e.step.explanation,
    patternCells: e.step.patternCells,
    placements: e.step.placements,
    eliminations: e.step.eliminations,
    units: e.unitNames,
    puzzle: e.puzzle,
    grid: e.grid.join(''),
    payoff: e.payoff?.explanation ?? null,
  };
}
write('technique-examples.json', allExamples);

// ---- 3. Catalog and curriculum ----
write('curriculum.json', {
  levels: LEVELS,
  lessons: LESSONS.map((l) => ({ id: l.id, title: l.title, level: l.level, kind: l.kind, summary: l.summary })),
  techniques: TECHNIQUES.map((t) => ({ id: t.id, name: t.name, level: t.level, tier: t.tier, family: t.family, description: t.description })),
});

// ---- 4. Logical solve for the number-placement loop (real puzzle, real solving order) ----
{
  const p = getPracticePuzzles('hidden-single')[0] ?? fail('no practice puzzle');
  const grid = parseGrid(p.puzzle);
  const solution = solutionOf(grid);
  const res = solveLogically(grid);
  if (!res.solved) fail('loop puzzle not solved logically');
  const order: { cell: number; digit: number; technique: string }[] = [];
  for (const s of res.steps) {
    checkStep(s, solution, 'loop');
    for (const pl of s.placements) order.push({ cell: pl.cell, digit: pl.digit, technique: s.technique });
  }
  if (order.length !== grid.filter((v) => !v).length) fail('loop: placements do not fill the grid');
  write('solve-loop.json', { puzzle: p.puzzle, difficulty: p.difficulty, grid, solution, order });
}

// ---- 5. App-capture script for the hint screenshots: reach the explainer X-Wing position by real play ----
// Start from the original puzzle, type the digits the solver had placed (player entries), auto-fill notes,
// then remove the notes the solver had already eliminated. The app's hint then uses these notes and must
// find exactly the fixture X-Wing (the app hint intersects computed candidates with the player's notes).
{
  const x = explainers['x-wing'];
  const start = parseGrid(x.puzzle);
  const entries = x.grid.map((d, i) => (d && !start[i] ? { cell: i, digit: d } : null)).filter(Boolean);
  const computed = computeCandidates(x.grid);
  const removals: { cell: number; digit: number }[] = [];
  for (let i = 0; i < 81; i++) {
    if (x.grid[i]) continue;
    for (const d of maskToDigits(computed[i])) if (!x.candidates[i].includes(d)) removals.push({ cell: i, digit: d });
  }
  const notes = x.candidates.map((ds) => ds.reduce((m, d) => m | bit(d), 0));
  const hintStep = findNextStep(x.grid, notes);
  if (!hintStep || hintStep.technique !== 'x-wing') fail('app-play: notes do not lead to the X-Wing');
  write('app-play.json', {
    note: 'Real play script for capture-app.mjs: import puzzle, enter entries, auto-fill notes, remove removals.',
    puzzle: x.puzzle,
    solution: x.solution.join(''),
    entries,
    removals,
    expectedHint: hintStep.explanation,
  });
  // Stats demo games: real puzzles from the engine practice bank (one per difficulty) with their solutions.
  const statsGames = (['hidden-single', 'pointing', 'naked-pair', 'x-wing', 'hidden-single'] as TechniqueId[]).map((t, k) => {
    const p = getPracticePuzzles(t)[k === 4 ? 1 : 0] ?? fail('no practice puzzle for ' + t);
    return { puzzle: p.puzzle, solution: solutionOf(parseGrid(p.puzzle)).join(''), difficulty: p.difficulty };
  });
  write('stats-games.json', statsGames);
}
console.log('all exported steps validated against the unique solution');
// keep linters quiet about helpers only used in some branches
void bit;
void boxOf;
