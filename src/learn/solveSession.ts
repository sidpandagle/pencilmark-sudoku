import {
  applyStepToGrid,
  computeCandidates,
  countSolutions,
  findNextStep,
  hasConflicts,
  solveLogically,
  techniqueName,
  TECHNIQUE_IDS,
  type Step,
  type TechniqueId,
} from '../engine';

/**
 * Guided solving: the full logical solving path from a position, with the board state before every step,
 * so the screen can move back and forth freely.
 */
export interface SolveFrame {
  grid: number[];
  candidates: number[];
}

export interface SolveSession {
  start: SolveFrame;
  steps: Step[];
  /** frames[i] = position before step i; frames[steps.length] = final position. */
  frames: SolveFrame[];
  solved: boolean;
  /** Not solved and not broken: the solver ran out of implemented techniques. */
  stuck: boolean;
  /** The start position is invalid (conflicts) or has no solution. */
  invalid: boolean;
}

export function buildSolveSession(grid: number[]): SolveSession {
  const start: SolveFrame = { grid: grid.slice(), candidates: computeCandidates(grid) };
  if (grid.length !== 81 || hasConflicts(grid) || countSolutions(grid, 1).count === 0) {
    return { start, steps: [], frames: [start], solved: false, stuck: false, invalid: true };
  }
  const r = solveLogically(grid);
  const frames: SolveFrame[] = [start];
  let cur = start;
  for (const step of r.steps) {
    const next = applyStepToGrid(cur.grid, cur.candidates, step);
    cur = { grid: next.grid, candidates: next.candidates };
    frames.push(cur);
  }
  return { start, steps: r.steps, frames, solved: r.solved, stuck: !r.solved, invalid: false };
}

export interface AlternativeMove {
  technique: TechniqueId;
  name: string;
  step: Step;
}

/**
 * Other moves available at a frame: runs each technique detector on its own (findNextStep restricted to
 * one technique) and keeps one step per technique, skipping the technique the solver chose. Forcing chains
 * are skipped unless nothing else is found (they are slow and always "available" in hard positions).
 */
export function alternativeMoves(frame: SolveFrame, chosen: TechniqueId | null, max = 6): AlternativeMove[] {
  const out: AlternativeMove[] = [];
  for (const id of TECHNIQUE_IDS) {
    if (id === chosen || id === 'forcing-chain') continue;
    const step = findNextStep(frame.grid, frame.candidates, { techniques: [id] });
    if (step) out.push({ technique: id, name: techniqueName(id), step });
    if (out.length >= max) break;
  }
  return out;
}
