import { boxOf, computeCandidates, unitName } from './grid';
import { createState } from './solver/state';
import { findStepInState } from './solver/solve';
import type { Step } from './steps';
import { techniqueInfo } from './techniques/catalog';
import type { Candidates, Grid } from './types';
import { countSolutions } from './bruteSolver';

export type Hint =
  /** Entries that disagree with the solution; no logical step is valid until they are fixed. */
  | { kind: 'mistake'; cells: number[]; message: string }
  /** Player notes that exclude the correct digit of a cell. */
  | { kind: 'bad-notes'; cells: number[]; message: string }
  /**
   * A logical step. `nudge` is a gentle, non-revealing pointer (e.g. "Look at box 5 — one digit has only one
   * home there."). `techniqueName` is the human name. The step carries cells, candidates and explanation.
   */
  | { kind: 'step'; step: Step; nudge: string; techniqueName: string }
  /** Solver could not find a step with implemented techniques. */
  | { kind: 'none'; message: string };

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Gentle, non-revealing pointer for a step: names the area (unit) for basic techniques and only the technique
 * family for advanced ones. Never names the digit or the target cell.
 */
export function nudgeFor(step: Step): string {
  const u = step.units?.[0];
  const where = u !== undefined ? unitName(u) : undefined;
  switch (step.technique) {
    case 'full-house':
      return `Look at ${where ?? 'the nearly full units'} — only one cell is still empty there.`;
    case 'hidden-single':
      return `Look at ${where ?? 'the boxes'} — one digit has only one possible home there.`;
    case 'naked-single': {
      const cell = step.placements[0]?.cell ?? step.patternCells[0];
      return `Look in ${unitName(18 + boxOf(cell))} — one cell has only one candidate left.`;
    }
    case 'pointing':
      return `In ${where ?? 'one box'}, one digit is confined to a single row or column.`;
    case 'box-line-reduction':
      return `In ${where ?? 'one row or column'}, one digit is confined to a single box.`;
    case 'naked-pair':
      return `Look for two cells in ${where ?? 'one unit'} that share the same two candidates.`;
    case 'naked-triple':
      return `Look for three cells in ${where ?? 'one unit'} that hold only three digits between them.`;
    case 'naked-quad':
      return `Look for four cells in ${where ?? 'one unit'} that hold only four digits between them.`;
    case 'hidden-pair':
      return `In ${where ?? 'one unit'}, two digits can only go in the same two cells.`;
    case 'hidden-triple':
      return `In ${where ?? 'one unit'}, three digits can only go in the same three cells.`;
    case 'hidden-quad':
      return `In ${where ?? 'one unit'}, four digits can only go in the same four cells.`;
    case 'x-wing':
      return 'Look for one digit that fits only two cells in each of two rows (or columns), lined up.';
    case 'swordfish':
      return 'Look for one digit restricted to the same three columns across three rows (or the reverse).';
    case 'jellyfish':
      return 'Look for one digit restricted to the same four columns across four rows (or the reverse).';
    case 'finned-x-wing':
    case 'finned-swordfish':
      return 'There is a fish pattern that is almost perfect — a fin in one box spoils it, but still gives an elimination.';
    case 'skyscraper':
      return 'Look for one digit with two conjugate pairs in parallel lines that share one end line.';
    case 'two-string-kite':
      return 'Look for one digit with a row pair and a column pair that meet in a box.';
    case 'turbot-fish':
      return 'Look for a short single-digit chain: strong link, weak link, strong link.';
    case 'xy-wing':
      return 'Look for a bivalue cell that sees two other bivalue cells sharing a third digit.';
    case 'xyz-wing':
      return 'Look for a three-candidate cell that sees two bivalue cells made from its digits.';
    case 'w-wing':
      return 'Look for two identical bivalue cells joined by a conjugate pair on one of their digits.';
    case 'simple-coloring':
      return 'Pick one digit and colour its conjugate pairs in two alternating colours.';
    case 'unique-rectangle-1':
    case 'unique-rectangle-2':
    case 'unique-rectangle-4':
      return 'Look for four cells forming a rectangle over two boxes that risk a deadly pattern (two solutions).';
    case 'bug-plus-one':
      return 'Almost every empty cell has exactly two candidates — what does uniqueness say about the odd one out?';
    case 'x-chain':
      return 'Follow a chain of alternating strong and weak links on a single digit.';
    case 'xy-chain':
      return 'Follow a chain of bivalue cells, each linked to the next by a shared digit.';
    case 'aic':
      return 'Follow an alternating chain that mixes bivalue cells and conjugate pairs.';
    case 'als-xz':
      return 'Look for two almost locked sets (N cells with N+1 digits) that share a restricted digit.';
    case 'sue-de-coq':
      return `Look at where ${where ? `${where} meets a box` : 'a box meets a row or column'}: the intersection cells lock digits into the line and the box.`;
    case 'forcing-chain':
      return 'This one needs a forcing chain: try each candidate of one cell and see what they all agree on.';
    default:
      return 'Look closely at the highlighted area.';
  }
}

/**
 * Hint for the player's position: mistakes first, then bad notes, then the next logical step on the candidate
 * state (computed candidates intersected with the player's notes for cells that have notes).
 */
export function getHint(grid: Grid, solution: Grid, notes?: Candidates): Hint {
  const wrong = grid.map((v, i) => (v && v !== solution[i] ? i : -1)).filter((i) => i >= 0);
  if (wrong.length) {
    return {
      kind: 'mistake',
      cells: wrong,
      message: `${wrong.length} ${plural(wrong.length, 'entry is', 'entries are')} incorrect. Fix ${plural(wrong.length, 'it', 'them')} before looking for the next step.`,
    };
  }
  if (notes) {
    const bad = grid
      .map((v, i) => (!v && notes[i] && !(notes[i] & (1 << (solution[i] - 1))) ? i : -1))
      .filter((i) => i >= 0);
    if (bad.length) {
      return {
        kind: 'bad-notes',
        cells: bad,
        message: `The notes in ${bad.length} ${plural(bad.length, 'cell rule', 'cells rule')} out the correct digit. Check ${plural(bad.length, 'it', 'them')} again.`,
      };
    }
  }
  if (grid.every((v) => v !== 0)) return { kind: 'none', message: 'The puzzle is complete.' };
  const computed = computeCandidates(grid);
  const cands = notes ? computed.map((m, i) => (notes[i] ? m & notes[i] : m)) : computed;
  // The grid only contains correct digits here, so it has the same unique solution as the puzzle
  // when the puzzle is unique; check cheaply rather than assume.
  const unique = countSolutions(grid, 2).count === 1;
  const step = findStepInState(createState(grid, cands, unique));
  if (step) {
    return { kind: 'step', step, nudge: nudgeFor(step), techniqueName: techniqueInfo(step.technique).name };
  }
  return { kind: 'none', message: 'No hint available: this position needs techniques beyond the ones the app knows.' };
}
