import {
  applyStep,
  countSolutions,
  createSolverState,
  decodeCandidates,
  findNextStep,
  getPracticePuzzles,
  getTechniqueExamples,
  validateStep,
  type SolverState,
  type Step,
  type TechniqueId,
} from '../engine';
import type { HandPosition } from './types';

/**
 * A position where a technique is the next logical step, with everything a lesson needs to show it and
 * to check a learner's answer. `candidates` are the engine's candidates at that point of the solving
 * path (they include earlier eliminations), so the step is valid on exactly what is displayed.
 */
export interface LessonPosition {
  key: string;
  technique: TechniqueId;
  /** Original puzzle (givens). */
  puzzle: number[];
  /** Digits at the position (givens + digits placed by earlier steps). */
  grid: number[];
  candidates: number[];
  solution: number[];
  step: Step;
  source: 'example' | 'mined';
}

export const parseDigits = (s: string): number[] => s.split('').map((ch) => (ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0));

const solutionCache = new Map<string, number[] | null>();
export function solutionOf(puzzle: number[]): number[] | null {
  const key = puzzle.join('');
  if (!solutionCache.has(key)) {
    const r = countSolutions(puzzle, 2);
    solutionCache.set(key, r.count === 1 && r.solution ? r.solution : null);
  }
  return solutionCache.get(key) ?? null;
}

export function stateOf(pos: Pick<LessonPosition, 'grid' | 'candidates'>, unique = true): SolverState {
  return createSolverState(pos.grid, pos.candidates, unique);
}

/** Mined example `index` (0-3) for a technique, or null if it does not exist. */
export function examplePosition(t: TechniqueId, index: number): LessonPosition | null {
  const ex = getTechniqueExamples(t)[index];
  if (!ex) return null;
  const puzzle = parseDigits(ex.puzzle);
  const solution = solutionOf(puzzle);
  if (!solution) return null;
  return {
    key: `${t}:example:${index}`,
    technique: t,
    puzzle,
    grid: parseDigits(ex.grid),
    candidates: decodeCandidates(ex.candidates),
    solution,
    step: ex.step,
    source: 'example',
  };
}

/**
 * Mine a fresh position on the fly: follow the logical solving path of a practice puzzle (easiest step
 * first) and stop at the first step that uses technique `t`. Every step before it is easier, so `t` is the
 * next step a solver needs there. The step is checked against the brute-force solution. `variant` picks
 * which practice puzzle to use (so reviews can differ). Returns null when no practice puzzle exists or
 * nothing suitable is found.
 */
export function minePosition(t: TechniqueId, variant = 0, avoidGrids: string[] = []): LessonPosition | null {
  const practice = getPracticePuzzles(t);
  for (let k = 0; k < practice.length; k++) {
    const idx = (variant + k) % practice.length;
    const puzzle = parseDigits(practice[idx].puzzle);
    const solution = solutionOf(puzzle);
    if (!solution) continue;
    let s = createSolverState(puzzle, undefined, true);
    for (let n = 0; n < 400; n++) {
      const step = findNextStep(s.grid, s.cands, { uniqueness: true });
      if (!step) break;
      if (step.technique === t && validateStep(step, solution, s).length === 0 && !avoidGrids.includes(s.grid.join(''))) {
        return {
          key: `${t}:mined:${idx}`,
          technique: t,
          puzzle,
          grid: s.grid.slice(),
          candidates: s.cands.slice(),
          solution,
          step,
          source: 'mined',
        };
      }
      s = applyStep(s, step);
    }
  }
  return null;
}

/**
 * Positions for the mastery check: mined examples 2 and 3, plus one position mined from a practice puzzle
 * (rotated by `attempt` so a review is not identical to the first try).
 */
export function masteryPositions(t: TechniqueId, attempt = 0): LessonPosition[] {
  const out: LessonPosition[] = [];
  for (const i of [2, 3]) {
    const p = examplePosition(t, i);
    if (p) out.push(p);
  }
  try {
    const avoid = getTechniqueExamples(t).map((e) => parseDigits(e.grid).join(''));
    const mined = minePosition(t, attempt, avoid);
    if (mined) out.push(mined);
  } catch {
    // mining is a bonus; the two stored examples are enough
  }
  return out;
}

/** Digits and givens of a hand-built foundation position. */
export function handPosition(p: HandPosition): { grid: number[]; givens: boolean[] } {
  const grid = parseDigits(p.grid);
  const givens = p.givens ? p.givens.split('').map((ch, i) => ch === 'g' && grid[i] !== 0) : grid.map((v) => v !== 0);
  return { grid, givens };
}
