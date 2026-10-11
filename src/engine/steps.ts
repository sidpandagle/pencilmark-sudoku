import type { CellDigit } from './types';

/**
 * Structured solving step produced by technique detectors. This is the single contract shared by
 * the logical solver, the difficulty classifier, hints, guided solving and learning mode.
 */
export type TechniqueId =
  | 'full-house'
  | 'naked-single'
  | 'hidden-single'
  | 'pointing'
  | 'box-line-reduction'
  | 'naked-pair'
  | 'hidden-pair'
  | 'naked-triple'
  | 'hidden-triple'
  | 'naked-quad'
  | 'hidden-quad'
  | 'x-wing'
  | 'swordfish'
  | 'jellyfish'
  | 'finned-x-wing'
  | 'finned-swordfish'
  | 'skyscraper'
  | 'two-string-kite'
  | 'turbot-fish'
  | 'xy-wing'
  | 'xyz-wing'
  | 'w-wing'
  | 'simple-coloring'
  | 'unique-rectangle-1'
  | 'unique-rectangle-2'
  | 'unique-rectangle-4'
  | 'bug-plus-one'
  | 'xy-chain'
  | 'x-chain'
  | 'aic'
  | 'als-xz'
  | 'sue-de-coq'
  | 'forcing-chain';

/** Role a highlighted candidate plays in a deduction, used for colouring overlays. */
export type CandidateRole =
  | 'pattern' // candidate forming the pattern (e.g. the pair in a naked pair)
  | 'eliminate' // candidate being removed
  | 'place' // digit being placed
  | 'color-a' // first colour / "on" side of a chain
  | 'color-b' // second colour / "off" side of a chain
  | 'fin'; // fin candidate in finned fish

export interface HighlightCandidate extends CellDigit {
  role: CandidateRole;
}

export interface ChainLink {
  from: CellDigit;
  to: CellDigit;
  /** strong: if `from` is false then `to` is true. weak: if `from` is true then `to` is false. */
  type: 'strong' | 'weak';
}

export interface Step {
  technique: TechniqueId;
  /** Digits placed by this step (singles). */
  placements: CellDigit[];
  /** Candidates removed by this step. */
  eliminations: CellDigit[];
  /** Cells that form the pattern (drawn with emphasis). */
  patternCells: number[];
  /** Other cells involved, e.g. cells seeing the target that justify a single. */
  supportCells?: number[];
  /** Units (0-26: rows, cols, boxes) relevant to the deduction. */
  units?: number[];
  /** Candidate-level highlights. */
  candidates: HighlightCandidate[];
  /** Chain links for chain/colouring techniques. */
  links?: ChainLink[];
  /** One-sentence explanation of the deduction in plain language, using r1c1 cell names. */
  explanation: string;
}
