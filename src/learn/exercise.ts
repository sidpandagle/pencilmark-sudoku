import { BOXES, boxOf, cellName, COLS, colOf, nudgeFor, rowOf, ROWS, techniqueName, type CellDigit, type Step } from '../engine';
import type { LessonPosition } from './positions';
import type { TechniqueContent } from './types';

/**
 * Checking a learner's answer against the engine's step for a position. The expected answer is exactly
 * the step's effects (its placements, or its eliminations). Wrong picks get a short, kind reason.
 */

export type ExerciseKind = 'place' | 'eliminate';
export const exerciseKind = (step: Step): ExerciseKind => (step.placements.length ? 'place' : 'eliminate');

export type WrongReason = 'pattern' | 'wrong-digit' | 'not-reached' | 'not-candidate';

export interface Verdict {
  correct: boolean;
  /**
   * The answer is logically true but is not the deduction this exercise is about (e.g. candidates that are
   * impossible for another reason). The learner may try again; mastery checks do not count it as a miss.
   */
  retry?: boolean;
  /** Expected effects the learner got right. */
  found: number;
  total: number;
  wrong: { cell: number; digit: number; reason: WrongReason }[];
  message: string;
}

const key = (c: CellDigit) => c.cell * 10 + c.digit;
const unitsOf = (cell: number) => [ROWS[rowOf(cell)], COLS[colOf(cell)], BOXES[boxOf(cell)]];
const hasBit = (mask: number, d: number) => (mask & (1 << (d - 1))) !== 0;

/** True when (cell, digit) is one of the candidates that form the pattern (not an effect of the step). */
export function isPatternCandidate(step: Step, cd: CellDigit): boolean {
  if (step.candidates.some((h) => h.cell === cd.cell && h.digit === cd.digit && h.role !== 'eliminate' && h.role !== 'place')) return true;
  return false;
}

function reasonFor(pos: LessonPosition, cd: CellDigit): WrongReason {
  const { step } = pos;
  if (pos.grid[cd.cell] || !hasBit(pos.candidates[cd.cell], cd.digit)) return 'not-candidate';
  if (isPatternCandidate(step, cd)) return 'pattern';
  const digits = new Set(step.eliminations.map((e) => e.digit));
  if (digits.size === 1 && !digits.has(cd.digit)) return 'wrong-digit';
  return 'not-reached';
}

function reasonText(pos: LessonPosition, content: TechniqueContent | undefined, w: { cell: number; digit: number; reason: WrongReason }): string {
  const name = `${w.digit} in ${cellName(w.cell)}`;
  switch (w.reason) {
    case 'not-candidate':
      return `${name} is not a candidate here.`;
    case 'pattern':
      return `${name} is part of the pattern itself, so it stays.`;
    case 'wrong-digit': {
      const d = pos.step.eliminations[0]?.digit;
      return `This deduction is about the digit ${d}, not ${w.digit}.`;
    }
    default:
      return `${name} is out of the pattern’s reach.${content ? ` ${content.targetRule}` : ''}`;
  }
}

/** Check a set of candidates the learner marked for removal. */
export function evaluateEliminations(pos: LessonPosition, marks: readonly CellDigit[], content?: TechniqueContent): Verdict {
  const expected = new Set(pos.step.eliminations.map(key));
  const total = expected.size;
  let found = 0;
  const wrong: Verdict['wrong'] = [];
  for (const m of marks) {
    if (expected.has(key(m))) found++;
    else wrong.push({ cell: m.cell, digit: m.digit, reason: reasonFor(pos, m) });
  }
  const correct = found === total && wrong.length === 0;
  // Marks that are all genuinely impossible (live candidates that are not the solution digit) but do not
  // match this exercise's pattern: true, just not this deduction. Let the learner try again.
  const retry =
    !correct &&
    wrong.length > 0 &&
    wrong.every((w) => w.reason !== 'not-candidate' && w.reason !== 'pattern' && pos.solution[w.cell] !== w.digit);
  let message: string;
  if (correct) message = `Correct! ${pos.step.explanation}`;
  else if (!marks.length) message = 'Tap the candidates you want to remove first, then check.';
  else if (retry)
    message = `Good eye — ${wrong.length === 1 ? 'that candidate really is' : 'those candidates really are'} impossible, but not because of the pattern this exercise is about. Look for the ${techniqueName(pos.technique)} and remove only what it rules out.`;
  else if (wrong.length) message = `Not quite. ${reasonText(pos, content, wrong[0])}`;
  else message = `Good so far: ${found} of ${total} found. There ${total - found === 1 ? 'is one more candidate' : `are ${total - found} more candidates`} to remove.`;
  return { correct, retry, found, total, wrong, message };
}

const SINGLE_TECHNIQUES = new Set(['full-house', 'naked-single', 'hidden-single']);

/**
 * True when placing `digit` in `cell` is itself an instance of `technique` in this position (another full
 * house / naked single / hidden single than the one the exercise was built around). Checked directly on the
 * displayed digits and candidates, so it is valid on exactly what the learner sees.
 */
export function isSingleInstance(pos: LessonPosition, cell: number, digit: number, technique: string): boolean {
  if (pos.grid[cell] || !hasBit(pos.candidates[cell], digit)) return false;
  const units = unitsOf(cell);
  if (technique === 'naked-single') return pos.candidates[cell] === 1 << (digit - 1);
  if (technique === 'full-house') {
    return units.some((u) => {
      const empties = u.filter((c) => !pos.grid[c]);
      return empties.length === 1 && !u.some((c) => pos.grid[c] === digit);
    });
  }
  if (technique === 'hidden-single') {
    return units.some((u) => u.filter((c) => !pos.grid[c] && hasBit(pos.candidates[c], digit)).length === 1);
  }
  return false;
}

/** Check a placement (cell + digit). */
export function evaluatePlacement(pos: LessonPosition, cell: number, digit: number, content?: TechniqueContent): Verdict {
  const p = pos.step.placements[0];
  const exact = !!p && p.cell === cell && p.digit === digit;
  const alternative =
    !exact && SINGLE_TECHNIQUES.has(pos.technique) && pos.solution[cell] === digit && isSingleInstance(pos, cell, digit, pos.technique);
  const correct = exact || alternative;
  const retry = !correct && pos.solution[cell] === digit && !pos.grid[cell];
  let message: string;
  if (exact) message = `Correct! ${pos.step.explanation}`;
  else if (alternative)
    message = `Correct! ${cellName(cell)} = ${digit} is another ${techniqueName(pos.technique)} here — nicely spotted. (The one this example was built around: ${p ? `${cellName(p.cell)} = ${p.digit}` : 'elsewhere'}.)`;
  else if (retry)
    message = `${digit} is right for ${cellName(cell)}, but it doesn't follow from the ${techniqueName(pos.technique)} this exercise is about. Look for that pattern.`;
  else if (p && p.cell === cell) message = `Right cell, but ${digit} is not the digit that must go there. Check which digit has nowhere else to go.`;
  else message = `Not ${cellName(cell)}.${content ? ` ${content.targetRule}` : ''}`;
  return { correct, retry, found: correct ? 1 : 0, total: 1, wrong: correct ? [] : [{ cell, digit, reason: 'not-reached' }], message };
}

/** Progressive help for guided examples: 0 none, 1 nudge, 2 show the pattern, 3 show the answer. */
export const HELP_LABELS = ['Give me a nudge', 'Show the pattern', 'Show the answer'] as const;

export function helpText(pos: LessonPosition, level: number, content?: TechniqueContent): string {
  if (level <= 0) return '';
  if (level === 1) return nudgeFor(pos.step);
  if (level === 2) return content?.patternCaption ?? 'The highlighted cells form the pattern.';
  return pos.step.explanation;
}

/** Compact description of a step's effect, e.g. "r3c5 loses 2" or "r9c4 = 5". */
export function effectText(step: Step): string {
  if (step.placements.length) return step.placements.map((p) => `${cellName(p.cell)} = ${p.digit}`).join(', ');
  const byCell = new Map<number, number[]>();
  for (const e of step.eliminations) byCell.set(e.cell, [...(byCell.get(e.cell) ?? []), e.digit]);
  return [...byCell].map(([c, ds]) => `${cellName(c)} loses ${ds.join(' and ')}`).join('; ');
}
