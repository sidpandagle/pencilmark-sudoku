/**
 * Engine stress test (bun): generates many puzzles, solves them logically and validates EVERY step against the
 * brute-force solution. With --all-detectors (default on), every detector is also run on every intermediate
 * state and its step validated, which exercises advanced techniques far more often than normal solving does.
 *
 *   bun scripts/engine-stress.ts [count=500] [--seed=1] [--minimal] [--no-all] [--bank]
 */
import { countSolutions } from '../src/engine/bruteSolver';
import { generateRawPuzzle } from '../src/engine/generator';
import { serializeGrid, parseGrid } from '../src/engine/grid';
import { applyStep, createState, isBrokenState, isSolvedState } from '../src/engine/solver/state';
import { findStepInState, makesProgress } from '../src/engine/solver/solve';
import { stateConsistent, validateStep } from '../src/engine/solver/validate';
import { techniqueInfo, techniqueRank, TECHNIQUES } from '../src/engine/techniques/catalog';
import { DETECTORS } from '../src/engine/techniques/registry';
import { classifyDifficulty } from '../src/engine/difficulty';
import type { TechniqueId } from '../src/engine/steps';

const args = process.argv.slice(2);
const count = Number(args.find((a) => /^\d+$/.test(a)) ?? 500);
const seed0 = Number(args.find((a) => a.startsWith('--seed='))?.slice(7) ?? 1);
const minimal = args.includes('--minimal');
const allDetectors = !args.includes('--no-all');
const useBank = args.includes('--bank');

let violations = 0;
let stepsChecked = 0;
let detectorRuns = 0;
let detectorSteps = 0;
const perTechniqueValidated: Record<string, number> = {};
const diffCounts: Record<string, number> = {};
const hardestCounts: Record<string, number> = {};
const detectorTime: Record<string, number> = {};
let maxFindMs = 0;
let bankMismatches = 0;
let maxFindTech = '';
let genMs = 0;
let solveMs = 0;
const findTimes: number[] = [];

async function main() {
  let puzzles: { p: string; score: number; tech: string; diff: string }[] = [];
  if (useBank) {
    const { BANK } = await import('../src/engine/bank/bank');
    for (const d of ['easy', 'medium', 'hard', 'expert'] as const) for (const e of BANK[d]) puzzles.push({ p: e[0], score: e[1], tech: e[2], diff: d });
    if (count < puzzles.length) {
      const stride = puzzles.length / count;
      puzzles = Array.from({ length: count }, (_, k) => puzzles[Math.floor(k * stride)]);
    }
  }
  const total = useBank ? puzzles.length : count;
  const t0 = performance.now();
  for (let i = 0; i < total; i++) {
    let puzzle: number[];
    const tg = performance.now();
    if (useBank) puzzle = parseGrid(puzzles[i].p);
    else puzzle = generateRawPuzzle(seed0 + i, minimal ? { symmetric: false } : undefined).puzzle;
    genMs += performance.now() - tg;
    const sol = countSolutions(puzzle, 2);
    if (sol.count !== 1 || !sol.solution) throw new Error('generator produced a non-unique puzzle');
    const solution = sol.solution;
    let s = createState(puzzle, undefined, true);
    const usedTech: TechniqueId[] = [];
    const ts = performance.now();
    let guard = 0;
    while (!isSolvedState(s) && guard++ < 2000) {
      if (!stateConsistent(s, solution)) {
        violations++;
        console.error('STATE INCONSISTENT', serializeGrid(puzzle));
        break;
      }
      if (allDetectors && !isBrokenState(s)) {
        for (const t of TECHNIQUES) {
          if (t.requiresUniqueness && !s.unique) continue;
          const td = performance.now();
          const st = DETECTORS[t.id](s);
          detectorTime[t.id] = (detectorTime[t.id] ?? 0) + performance.now() - td;
          detectorRuns++;
          if (!st) continue;
          detectorSteps++;
          if (st.technique !== t.id) {
            violations++;
            console.error(`detector ${t.id} returned technique ${st.technique}`);
          }
          const v = validateStep(st, solution, s);
          if (v.length) {
            violations += v.length;
            console.error('VIOLATION', v, serializeGrid(puzzle), serializeGrid(s.grid), JSON.stringify(s.cands));
          } else perTechniqueValidated[t.id] = (perTechniqueValidated[t.id] ?? 0) + 1;
        }
      }
      const tf = performance.now();
      const step = findStepInState(s);
      const dt = performance.now() - tf;
      findTimes.push(dt);
      if (dt > maxFindMs) {
        maxFindMs = dt;
        maxFindTech = step?.technique ?? 'none';
      }
      if (!step) break;
      stepsChecked++;
      const v = validateStep(step, solution, s);
      if (v.length || !makesProgress(s, step)) {
        violations += Math.max(1, v.length);
        console.error('VIOLATION (solver path)', v, serializeGrid(puzzle));
      }
      usedTech.push(step.technique);
      s = applyStep(s, step);
    }
    solveMs += performance.now() - ts;
    const hardest = usedTech.reduce<TechniqueId | null>((h, t) => (!h || techniqueRank(t) > techniqueRank(h) ? t : h), null);
    const solved = isSolvedState(s);
    const diff = solved ? classifyDifficulty(hardest) : 'unrated';
    diffCounts[diff] = (diffCounts[diff] ?? 0) + 1;
    if (useBank) {
      const score = usedTech.reduce((n, t) => n + techniqueInfo(t).weight, 0);
      const e = puzzles[i];
      if (e.diff !== diff || e.tech !== hardest || e.score !== score) {
        bankMismatches++;
        console.error('BANK MISMATCH', e, { diff, hardest, score });
      }
    }
    if (hardest) hardestCounts[hardest] = (hardestCounts[hardest] ?? 0) + 1;
    if ((i + 1) % 50 === 0) console.log(`${i + 1}/${total} puzzles, ${violations} violations, ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  }
  findTimes.sort((a, b) => a - b);
  const pct = (p: number) => findTimes[Math.min(findTimes.length - 1, Math.floor(findTimes.length * p))].toFixed(2);
  console.log('\n=== Engine stress summary ===');
  console.log(`puzzles: ${total} (${useBank ? 'bank' : minimal ? 'minimal non-symmetric' : 'symmetric'}), seed start ${seed0}`);
  console.log(`solver-path steps validated: ${stepsChecked}`);
  console.log(`all-detector runs: ${detectorRuns}, steps produced and validated: ${detectorSteps}`);
  console.log(`VIOLATIONS: ${violations}`);
  console.log('difficulty distribution:', JSON.stringify(diffCounts));
  console.log('hardest technique distribution:', JSON.stringify(hardestCounts));
  console.log('validated steps per detector:', JSON.stringify(perTechniqueValidated));
  console.log(`avg generation ms: ${(genMs / total).toFixed(1)}, avg logical solve ms (incl. all-detector runs): ${(solveMs / total).toFixed(1)}`);
  console.log(`findNextStep ms: p50 ${pct(0.5)}, p90 ${pct(0.9)}, p99 ${pct(0.99)}, max ${maxFindMs.toFixed(1)} (${maxFindTech})`);
  const dtSorted = Object.entries(detectorTime).sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log('slowest detectors (total ms):', dtSorted.map(([k, v]) => `${k}=${v.toFixed(0)}`).join(', '));
  if (useBank) console.log(`bank rating mismatches: ${bankMismatches}`);
  // Instant generation timing (bank + transform + brute-force solution).
  const { generatePuzzle } = await import('../src/engine/index');
  const gt: number[] = [];
  for (let k = 0; k < 400; k++) {
    const a = performance.now();
    generatePuzzle((['easy', 'medium', 'hard', 'expert'] as const)[k % 4], 777 + k);
    gt.push(performance.now() - a);
  }
  gt.sort((a, b) => a - b);
  console.log(`generatePuzzle ms (400 calls): avg ${(gt.reduce((a, b) => a + b, 0) / gt.length).toFixed(2)}, p99 ${gt[395].toFixed(2)}, max ${gt[399].toFixed(2)}`);
  if (violations || bankMismatches) process.exit(1);
}

main();
