import { bit, cellName } from '../grid';
import type { Step } from '../steps';
import type { Grid } from '../types';
import type { SolverState } from './state';

/**
 * Safety net: check a step against the brute-force solution. Returns a list of human-readable violations
 * (empty = valid). A placement must equal the solution digit; an elimination must never remove the solution
 * digit. When the pre-step state is given, the step must also make progress on that state.
 */
export function validateStep(step: Step, solution: Grid, state?: SolverState): string[] {
  const out: string[] = [];
  for (const p of step.placements) {
    if (solution[p.cell] !== p.digit)
      out.push(`${step.technique}: placed ${p.digit} in ${cellName(p.cell)} but the solution is ${solution[p.cell]}`);
  }
  for (const e of step.eliminations) {
    if (solution[e.cell] === e.digit)
      out.push(`${step.technique}: eliminated the solution digit ${e.digit} from ${cellName(e.cell)}`);
  }
  if (!step.placements.length && !step.eliminations.length) out.push(`${step.technique}: step makes no change`);
  if (state) {
    for (const p of step.placements)
      if (state.grid[p.cell] || !(state.cands[p.cell] & bit(p.digit)))
        out.push(`${step.technique}: placement ${p.digit} in ${cellName(p.cell)} is not a live candidate`);
    for (const e of step.eliminations)
      if (state.grid[e.cell] || !(state.cands[e.cell] & bit(e.digit)))
        out.push(`${step.technique}: elimination ${e.digit} from ${cellName(e.cell)} is not a live candidate`);
  }
  if (!step.explanation || step.explanation.length < 10) out.push(`${step.technique}: missing explanation`);
  return out;
}

/** True when the state's candidates still contain every solution digit (the state is consistent). */
export function stateConsistent(state: SolverState, solution: Grid): boolean {
  for (let c = 0; c < 81; c++) {
    if (state.grid[c]) {
      if (state.grid[c] !== solution[c]) return false;
    } else if (!(state.cands[c] & bit(solution[c]))) return false;
  }
  return true;
}
