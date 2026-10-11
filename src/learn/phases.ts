import { applyStepToGrid, unitName, type HighlightCandidate, type Step } from '../engine';
import { overlayFromStep, type BoardOverlay } from '../ui/board/overlay';
import { effectText } from './exercise';

/**
 * Demonstration phases for one engine step: 1) the units involved, 2) the pattern, 3) the eliminations or
 * placement, 4) the resulting board. Uses the engine Step overlay as-is.
 */
export type Phase = 'units' | 'pattern' | 'effect' | 'result';

export function phasesFor(step: Step): Phase[] {
  return step.units?.length ? ['units', 'pattern', 'effect', 'result'] : ['pattern', 'effect', 'result'];
}

const joinAnd = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export interface PhaseView {
  values: number[];
  candidates: number[];
  overlay: BoardOverlay;
  caption: string;
}

export function phaseView(
  grid: number[],
  candidates: number[],
  step: Step,
  phase: Phase,
  patternCaption: string,
): PhaseView {
  switch (phase) {
    case 'units':
      return {
        values: grid,
        candidates,
        overlay: { units: step.units ?? [] },
        caption: `Focus on ${joinAnd((step.units ?? []).map(unitName))}.`,
      };
    case 'pattern':
      return { values: grid, candidates, overlay: overlayFromStep(step, 'where'), caption: patternCaption };
    case 'effect':
      return { values: grid, candidates, overlay: overlayFromStep(step, 'full'), caption: step.explanation };
    case 'result': {
      const next = applyStepToGrid(grid, candidates, step);
      const changed = [...new Set([...step.placements.map((p) => p.cell), ...step.eliminations.map((e) => e.cell)])];
      return {
        values: next.grid,
        candidates: next.candidates,
        overlay: { focusCells: changed },
        caption: `Result: ${effectText(step)}.`,
      };
    }
  }
}

/** Overlay for a learner's pending answer: marked eliminations (red strike) and a chosen placement (green). */
export function answerOverlay(marks: readonly { cell: number; digit: number }[], placement: { cell: number; digit: number } | null): HighlightCandidate[] {
  const out: HighlightCandidate[] = marks.map((m) => ({ cell: m.cell, digit: m.digit, role: 'eliminate' }));
  if (placement) out.push({ cell: placement.cell, digit: placement.digit, role: 'place' });
  return out;
}

/** Merge overlays (later ones win for the same candidate). */
export function mergeOverlays(...parts: (BoardOverlay | null | undefined)[]): BoardOverlay {
  const cand = new Map<string, HighlightCandidate>();
  const out: Required<Pick<BoardOverlay, 'patternCells' | 'supportCells' | 'units' | 'links' | 'flaggedCells' | 'focusCells'>> = {
    patternCells: [],
    supportCells: [],
    units: [],
    links: [],
    flaggedCells: [],
    focusCells: [],
  };
  for (const p of parts) {
    if (!p) continue;
    for (const h of p.candidates ?? []) cand.set(`${h.cell}:${h.digit}`, h);
    (out.patternCells as number[]).push(...(p.patternCells ?? []));
    (out.supportCells as number[]).push(...(p.supportCells ?? []));
    (out.units as number[]).push(...(p.units ?? []));
    (out.links as unknown[]).push(...(p.links ?? []));
    (out.flaggedCells as number[]).push(...(p.flaggedCells ?? []));
    (out.focusCells as number[]).push(...(p.focusCells ?? []));
  }
  return { ...out, candidates: [...cand.values()] };
}
