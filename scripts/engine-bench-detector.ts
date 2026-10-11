/** Benchmark one detector on every intermediate state of generated puzzles: bun scripts/engine-bench-detector.ts <id> [count] */
import { generateRawPuzzle } from '../src/engine/generator';
import { applyStep, createState, isSolvedState } from '../src/engine/solver/state';
import { findStepInState } from '../src/engine/solver/solve';
import { DETECTORS } from '../src/engine/techniques/registry';
import type { TechniqueId } from '../src/engine/steps';
const id = (process.argv[2] ?? 'forcing-chain') as TechniqueId;
const count = Number(process.argv[3] ?? 30);
const times: number[] = [];
for (let i = 0; i < count; i++) {
  let s = createState(generateRawPuzzle(300 + i, { symmetric: i % 2 === 0 }).puzzle, undefined, true);
  while (!isSolvedState(s)) {
    const t = performance.now();
    DETECTORS[id](s);
    times.push(performance.now() - t);
    const st = findStepInState(s);
    if (!st) break;
    s = applyStep(s, st);
  }
}
times.sort((a, b) => a - b);
const q = (p: number) => times[Math.floor((times.length - 1) * p)].toFixed(2);
console.log(`${id}: n=${times.length} p50 ${q(0.5)} p90 ${q(0.9)} p99 ${q(0.99)} max ${q(1)} ms`);
