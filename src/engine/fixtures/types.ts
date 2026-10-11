import type { Step, TechniqueId } from '../steps';
import type { Difficulty } from '../types';

/**
 * A position where `technique` is the next step a solver needs (all easier techniques are exhausted).
 * Mined by scripts/engine-mine-examples.ts and re-validated by tests.
 */
export interface TechniqueExample {
  technique: TechniqueId;
  /** Original puzzle, 81 chars ('.' = empty). */
  puzzle: string;
  /** Current digits at the example position, 81 chars. */
  grid: string;
  /** Candidate masks at the position: 81 × 2 base-36 chars (decode with decodeCandidates). */
  candidates: string;
  /** The expected step (placements/eliminations are what tests compare). */
  step: Step;
}

export interface PracticePuzzle {
  /** 81 chars ('.' = empty). */
  puzzle: string;
  difficulty: Difficulty;
  score: number;
  hardestTechnique: TechniqueId;
}

export function encodeCandidates(cands: number[]): string {
  return cands.map((m) => m.toString(36).padStart(2, '0')).join('');
}

export function decodeCandidates(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < 81; i++) out.push(parseInt(text.slice(i * 2, i * 2 + 2), 36));
  return out;
}
