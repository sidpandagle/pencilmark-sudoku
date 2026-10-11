import type { CandidateRole, CellDigit, ChainLink, HighlightCandidate, Step } from '../../engine';

/**
 * Visual annotations drawn on top of the Board, usually derived from an engine `Step`.
 *
 * Rendering contract (also used by learning mode):
 * - `patternCells`  : warm `hintSoft` background + `hint` ring (the cells that form the pattern).
 * - `supportCells`  : light tint (cells that justify the deduction, e.g. peers that see the target).
 * - `units`         : 0-8 rows, 9-17 columns, 18-26 boxes; outlined with a rounded `hint` stroke.
 * - `candidates`    : candidate-level marks by role. They are drawn even if the player has no such note.
 *     pattern   -> ring          eliminate -> red + strike       place -> green filled disc
 *     color-a   -> blue disc     color-b   -> orange disc        fin   -> square outline
 * - `links`         : chain links between candidate positions; strong = solid line, weak = dashed, with arrowheads.
 * - `flaggedCells`  : cells needing attention (e.g. wrong entries): conflict background + corner marker.
 * - `focusCells`    : cells to emphasise without a role (e.g. "reveal this cell"): accent ring.
 */
export interface BoardOverlay {
  patternCells?: readonly number[];
  supportCells?: readonly number[];
  units?: readonly number[];
  candidates?: readonly HighlightCandidate[];
  links?: readonly ChainLink[];
  flaggedCells?: readonly number[];
  focusCells?: readonly number[];
}

/** How much of a step to reveal: 'where' shows the pattern only; 'full' adds placements/eliminations. */
export type OverlayDetail = 'where' | 'full';

const REVEALING: readonly CandidateRole[] = ['eliminate', 'place'];

export function overlayFromStep(step: Step, detail: OverlayDetail = 'full'): BoardOverlay {
  const candidates: HighlightCandidate[] = [];
  const seen = new Set<string>();
  const add = (c: CellDigit, role: CandidateRole) => {
    const k = `${c.cell}:${c.digit}`;
    if (seen.has(k)) return;
    seen.add(k);
    candidates.push({ cell: c.cell, digit: c.digit, role });
  };
  for (const c of step.candidates ?? []) {
    if (detail === 'where' && REVEALING.includes(c.role)) continue;
    add(c, c.role);
  }
  if (detail === 'full') {
    for (const p of step.placements ?? []) add(p, 'place');
    for (const e of step.eliminations ?? []) add(e, 'eliminate');
  }
  return {
    patternCells: step.patternCells ?? [],
    supportCells: detail === 'full' ? (step.supportCells ?? []) : [],
    units: step.units ?? [],
    candidates,
    links: detail === 'full' ? (step.links ?? []) : [],
    focusCells: detail === 'full' ? (step.placements ?? []).map((p) => p.cell) : [],
  };
}

export const ROLE_CODE: Record<CandidateRole, string> = {
  pattern: 'p',
  eliminate: 'e',
  place: 'l',
  'color-a': 'a',
  'color-b': 'b',
  fin: 'f',
};
