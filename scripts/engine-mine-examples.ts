/**
 * Mine learning fixtures (bun): for every technique, positions where it is the NEXT step required (all easier
 * techniques exhausted), plus practice puzzles whose hardest technique is that technique.
 * Writes src/engine/fixtures/techniqueExamples.ts and src/engine/fixtures/practicePuzzles.ts.
 *
 *   bun scripts/engine-mine-examples.ts [--minutes=20] [--seed=777] [--per=4] [--practice=6]
 *   bun scripts/engine-mine-examples.ts --refresh   (recompute stored steps/explanations, keep positions)
 *   bun scripts/engine-mine-examples.ts --merge --seed=N --minutes=M   (keep stored fixtures, mine more puzzles)
 *   bun scripts/engine-mine-examples.ts --singles   (keep everything else, re-mine the three singles from the bank)
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANK } from '../src/engine/bank/bank';
import { countSolutions } from '../src/engine/bruteSolver';
import { classifyDifficulty } from '../src/engine/difficulty';
import { decodeCandidates, encodeCandidates, type PracticePuzzle, type TechniqueExample } from '../src/engine/fixtures/types';
import { generateRawPuzzle } from '../src/engine/generator';
import { cellAt, parseGrid, serializeGrid } from '../src/engine/grid';
import { solveLogically } from '../src/engine/solver/solve';
import { applyStep, createState, isSolvedState } from '../src/engine/solver/state';
import { findStepInState } from '../src/engine/solver/solve';
import { validateStep } from '../src/engine/solver/validate';
import type { Step, TechniqueId } from '../src/engine/steps';
import { TECHNIQUES, techniqueRank } from '../src/engine/techniques/catalog';
import { DIFFICULTIES } from '../src/engine/types';

const arg = (name: string, def: number) => Number(process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? def);
const MINUTES = arg('minutes', 20);
const SEED = arg('seed', 777);
const PER = arg('per', 4);
const PRACTICE = arg('practice', 6);
const DIR = fileURLToPath(new URL('../src/engine/fixtures', import.meta.url));

interface Cand extends TechniqueExample {
  clarity: number;
}
const examples = new Map<TechniqueId, Cand[]>();
const practice = new Map<TechniqueId, PracticePuzzle[]>();
const seenPractice = new Set<string>();

/** Smaller is clearer: few pattern cells, short chains, a handful of eliminations. */
const clarity = (st: Step) =>
  st.patternCells.length + 2 * (st.links?.length ?? 0) + Math.max(0, st.eliminations.length - 3) + st.explanation.length / 200;

const SINGLES: readonly TechniqueId[] = ['full-house', 'naked-single', 'hidden-single'];
/**
 * Singles are taught first, so prefer EARLY positions (many empty cells): an almost-solved grid makes the
 * single trivial to spot and teaches nothing about scanning.
 */
const singlesBonus = (technique: TechniqueId, grid: number[]) =>
  SINGLES.includes(technique) ? -grid.filter((v) => !v).length / 10 : 0;

function offer(e: Cand) {
  const list = examples.get(e.technique) ?? [];
  if (list.some((x) => x.puzzle === e.puzzle)) {
    // Keep at most one example per puzzle per technique (the clearest).
    const i = list.findIndex((x) => x.puzzle === e.puzzle);
    if (list[i].clarity <= e.clarity) return;
    list.splice(i, 1);
  }
  list.push(e);
  list.sort((a, b) => a.clarity - b.clarity);
  if (list.length > PER) list.length = PER;
  examples.set(e.technique, list);
}

function minePuzzle(puzzle: number[]) {
  const sol = countSolutions(puzzle, 2);
  if (sol.count !== 1 || !sol.solution) return;
  const pstr = serializeGrid(puzzle);
  let s = createState(puzzle, undefined, true);
  const used: TechniqueId[] = [];
  let score = 0;
  let guard = 0;
  while (!isSolvedState(s) && guard++ < 1000) {
    const step = findStepInState(s);
    if (!step) return; // unrated: not useful for examples
    if (validateStep(step, sol.solution, s).length) throw new Error(`invalid step while mining: ${step.technique}`);
    used.push(step.technique);
    score += TECHNIQUES.find((t) => t.id === step.technique)!.weight;
    // Singles are everywhere; only sample them occasionally to save time.
    const isSingle = SINGLES.includes(step.technique);
    if (SINGLES_ONLY && !isSingle) {
      s = applyStep(s, step);
      continue;
    }
    if (!isSingle || (examples.get(step.technique)?.length ?? 0) < PER || guard % 7 === 0 || SINGLES_ONLY) {
      offer({
        technique: step.technique,
        puzzle: pstr,
        grid: serializeGrid(s.grid),
        candidates: encodeCandidates(s.cands),
        step,
        clarity: clarity(step) + singlesBonus(step.technique, s.grid),
      });
    }
    s = applyStep(s, step);
  }
  const hardest = used.reduce<TechniqueId | null>((h, t) => (!h || techniqueRank(t) > techniqueRank(h) ? t : h), null);
  if (!hardest || seenPractice.has(pstr)) return;
  const list = practice.get(hardest) ?? [];
  if (list.length < PRACTICE) {
    list.push({ puzzle: pstr, difficulty: classifyDifficulty(hardest), score, hardestTechnique: hardest });
    practice.set(hardest, list);
    seenPractice.add(pstr);
  }
}

/** Full-house practice: remove one cell per row/column/box (a transversal) from a solved grid. */
function fullHousePuzzles() {
  const perms = [
    [0, 3, 6, 1, 4, 7, 2, 5, 8],
    [1, 4, 7, 2, 5, 8, 0, 3, 6],
    [2, 5, 8, 0, 3, 6, 1, 4, 7],
    [4, 7, 1, 5, 8, 2, 3, 6, 0],
  ];
  perms.forEach((perm, i) => {
    const { solution } = generateRawPuzzle(SEED + 900000 + i);
    const g = solution.slice();
    for (let r = 0; r < 9; r++) g[cellAt(r, perm[r])] = 0;
    const res = solveLogically(g, { uniqueness: true });
    if (res.solved && res.hardestTechnique === 'full-house') minePuzzle(g);
  });
}

const REFRESH = process.argv.includes('--refresh');
const SINGLES_ONLY = process.argv.includes('--singles');
const MERGE = process.argv.includes('--merge') || SINGLES_ONLY;
const t0 = performance.now();
let mined = 0;
if (REFRESH || MERGE) {
  const { TECHNIQUE_EXAMPLES } = await import('../src/engine/fixtures/techniqueExamples');
  const { PRACTICE_PUZZLES } = await import('../src/engine/fixtures/practicePuzzles');
  const k = (xs: { cell: number; digit: number }[]) => JSON.stringify(xs.map((x) => x.cell * 10 + x.digit).sort());
  for (const list of Object.values(TECHNIQUE_EXAMPLES))
    for (const e of list ?? []) {
      const st = findStepInState(createState(parseGrid(e.grid), decodeCandidates(e.candidates), true));
      if (!st || st.technique !== e.technique || k(st.placements) !== k(e.step.placements) || k(st.eliminations) !== k(e.step.eliminations)) {
        console.warn(`dropping stale example for ${e.technique}`);
        continue;
      }
      if (SINGLES_ONLY && SINGLES.includes(e.technique)) continue; // re-mined below
      offer({ ...e, step: st, clarity: clarity(st) + singlesBonus(e.technique, parseGrid(e.grid)) });
    }
  for (const [id, list] of Object.entries(PRACTICE_PUZZLES)) {
    practice.set(id as TechniqueId, [...(list ?? [])]);
    for (const p of list ?? []) seenPractice.add(p.puzzle);
  }
}
if (!REFRESH) {
  const deadline = t0 + MINUTES * 60000;
  if (!SINGLES_ONLY) fullHousePuzzles();
  // 1) Bank puzzles (already classified, all difficulties).
  for (const d of DIFFICULTIES) for (const e of BANK[d]) {
    if ((MERGE && !SINGLES_ONLY) || performance.now() > deadline) break;
    minePuzzle(parseGrid(e[0]));
    mined++;
  }
  console.log(`bank mined: ${mined} puzzles, ${((performance.now() - t0) / 1000).toFixed(0)}s`);
  // 2) Fresh puzzles (alternating symmetric / minimal) until every technique has PER examples or time runs out.
  let i = 0;
  const complete = () => TECHNIQUES.every((t) => (examples.get(t.id)?.length ?? 0) >= PER && (practice.get(t.id)?.length ?? 0) >= 3);
  while (performance.now() < deadline && !complete()) {
    const { puzzle } = generateRawPuzzle(SEED + i, { symmetric: i % 2 === 0 });
    minePuzzle(puzzle);
    i++;
    mined++;
    if (i % 500 === 0) {
      const missing = TECHNIQUES.filter((t) => (examples.get(t.id)?.length ?? 0) < PER).map((t) => `${t.id}:${examples.get(t.id)?.length ?? 0}`);
      console.log(`${mined} puzzles mined, ${((performance.now() - t0) / 1000).toFixed(0)}s, short: ${missing.join(' ')}`);
    }
  }

}

// ---- write files ----
const exLines: string[] = [
  '/* eslint-disable */',
  '// GENERATED by scripts/engine-mine-examples.ts — do not edit by hand.',
  "import type { TechniqueId } from '../steps';",
  "import type { TechniqueExample } from './types';",
  '',
  'export const TECHNIQUE_EXAMPLES: Partial<Record<TechniqueId, TechniqueExample[]>> = {',
];
for (const t of TECHNIQUES) {
  const list = examples.get(t.id);
  if (!list?.length) continue;
  exLines.push(`  '${t.id}': [`);
  for (const e of list) {
    const { clarity: _c, ...rest } = e;
    void _c;
    exLines.push(`    ${JSON.stringify(rest)},`);
  }
  exLines.push('  ],');
}
exLines.push('};', '');
exLines.push('/** Mined example positions where `id` is the next required step (empty when none were found). */');
exLines.push('export function getTechniqueExamples(id: TechniqueId): TechniqueExample[] {');
exLines.push('  return TECHNIQUE_EXAMPLES[id] ?? [];');
exLines.push('}', '');
writeFileSync(join(DIR, 'techniqueExamples.ts'), exLines.join('\n'));

const prLines: string[] = [
  '/* eslint-disable */',
  '// GENERATED by scripts/engine-mine-examples.ts — do not edit by hand.',
  "import type { TechniqueId } from '../steps';",
  "import type { PracticePuzzle } from './types';",
  '',
  'export const PRACTICE_PUZZLES: Partial<Record<TechniqueId, PracticePuzzle[]>> = {',
];
for (const t of TECHNIQUES) {
  const list = practice.get(t.id);
  if (!list?.length) continue;
  prLines.push(`  '${t.id}': [`);
  for (const p of list.sort((a, b) => a.score - b.score)) prLines.push(`    ${JSON.stringify(p)},`);
  prLines.push('  ],');
}
prLines.push('};', '');
prLines.push('/** Puzzles whose hardest required technique is `id` (empty when none were found). */');
prLines.push('export function getPracticePuzzles(id: TechniqueId): PracticePuzzle[] {');
prLines.push('  return PRACTICE_PUZZLES[id] ?? [];');
prLines.push('}', '');
writeFileSync(join(DIR, 'practicePuzzles.ts'), prLines.join('\n'));

console.log('\n=== Mining summary ===');
console.log(`puzzles mined: ${mined}, time ${((performance.now() - t0) / 1000).toFixed(0)}s`);
for (const t of TECHNIQUES) {
  console.log(`${t.id.padEnd(20)} examples ${examples.get(t.id)?.length ?? 0}  practice ${practice.get(t.id)?.length ?? 0}`);
}
