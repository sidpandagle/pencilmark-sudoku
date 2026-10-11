import { countSolutions } from '../bruteSolver';
import { bit, hasConflicts } from '../grid';
import type { Step, TechniqueId } from '../steps';
import { techniqueInfo, techniqueRank } from '../techniques/catalog';
import { DETECTORS, SOLVER_ORDER } from '../techniques/registry';
import type { Candidates, Grid } from '../types';
import { applyStep, createState, isBrokenState, isSolvedState, type SolverState } from './state';

export interface FindStepOptions {
  /**
   * Allow uniqueness techniques (unique rectangles, BUG+1). Default: automatic — enabled only when the grid has
   * exactly one solution (checked with the brute-force counter, ~1 ms).
   */
  uniqueness?: boolean;
  /** Restrict the search to these techniques (still tried in solver order). Default: all. */
  techniques?: readonly TechniqueId[];
}

export interface SolveOptions extends FindStepOptions {
  /** Starting candidate state (intersected with the candidates implied by placed digits). */
  candidates?: Candidates;
  /** Safety cap on the number of steps (default 2000). */
  maxSteps?: number;
}

export interface LogicalSolveResult {
  steps: Step[];
  solved: boolean;
  /** Position where the solver got stuck (only when not solved). */
  stuckGrid?: Grid;
  stuckCandidates?: Candidates;
  /** Hardest technique used (by solver order), or null when no step was needed. */
  hardestTechnique: TechniqueId | null;
  /** Sum of technique weights over all steps. */
  score: number;
  techniqueCounts: Partial<Record<TechniqueId, number>>;
}

/** True when a step changes the state: a placement in an empty cell that allows it, or a live elimination. */
export function makesProgress(s: SolverState, step: Step): boolean {
  if (!step.placements.length && !step.eliminations.length) return false;
  for (const p of step.placements) if (s.grid[p.cell] || !(s.cands[p.cell] & bit(p.digit))) return false;
  for (const e of step.eliminations) if (s.grid[e.cell] || !(s.cands[e.cell] & bit(e.digit))) return false;
  return true;
}

const resolveUniqueness = (grid: Grid, flag?: boolean) =>
  flag !== undefined ? flag : !hasConflicts(grid) && countSolutions(grid, 2).count === 1;

/** Easiest available step in a solver state (techniques tried in increasing difficulty). */
export function findStepInState(s: SolverState, techniques?: readonly TechniqueId[]): Step | null {
  if (isSolvedState(s) || isBrokenState(s)) return null;
  const allowed = techniques ? new Set(techniques) : null;
  for (const id of SOLVER_ORDER) {
    if (allowed && !allowed.has(id)) continue;
    if (techniqueInfo(id).requiresUniqueness && !s.unique) continue;
    const step = DETECTORS[id](s);
    if (step && makesProgress(s, step)) return step;
  }
  return null;
}

/** Next logical step for a grid (and optional candidate state). */
export function findNextStepFor(grid: Grid, candidates?: Candidates, opts: FindStepOptions = {}): Step | null {
  const s = createState(grid, candidates, resolveUniqueness(grid, opts.uniqueness));
  return findStepInState(s, opts.techniques);
}

/**
 * Solve with human techniques only, always taking the easiest available step and restarting from the easiest
 * technique after every step.
 */
export function solveLogically(grid: Grid, opts: SolveOptions = {}): LogicalSolveResult {
  const steps: Step[] = [];
  const techniqueCounts: Partial<Record<TechniqueId, number>> = {};
  let hardest: TechniqueId | null = null;
  let score = 0;
  if (hasConflicts(grid)) {
    return { steps, solved: false, stuckGrid: grid.slice(), hardestTechnique: null, score: 0, techniqueCounts };
  }
  let s = createState(grid, opts.candidates, resolveUniqueness(grid, opts.uniqueness));
  const maxSteps = opts.maxSteps ?? 2000;
  while (!isSolvedState(s) && steps.length < maxSteps) {
    const step = findStepInState(s, opts.techniques);
    if (!step) break;
    steps.push(step);
    techniqueCounts[step.technique] = (techniqueCounts[step.technique] ?? 0) + 1;
    score += techniqueInfo(step.technique).weight;
    if (!hardest || techniqueRank(step.technique) > techniqueRank(hardest)) hardest = step.technique;
    s = applyStep(s, step);
  }
  const solved = isSolvedState(s) && !hasConflicts(s.grid);
  const result: LogicalSolveResult = { steps, solved, hardestTechnique: hardest, score, techniqueCounts };
  if (!solved) {
    result.stuckGrid = s.grid.slice();
    result.stuckCandidates = s.cands.slice();
  }
  return result;
}
