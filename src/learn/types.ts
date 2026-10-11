import type { TechniqueId } from '../engine';

export type LevelId = 1 | 2 | 3 | 4 | 5;

export interface LevelInfo {
  id: LevelId;
  title: string;
  /** One sentence shown under the level heading on the map. */
  blurb: string;
}

/**
 * Written content for a technique lesson. Every field is real teaching text (tests reject empty fields).
 * Texts are short on purpose: each one is shown as its own card or paragraph.
 */
export interface TechniqueContent {
  technique: TechniqueId;
  /** One line for the curriculum map. */
  summary: string;
  /** Plain-language explanation of the pattern (< ~120 words). */
  concept: string;
  /** The logical argument: why the deduction can never remove a true candidate. */
  why: string;
  /** Common mistakes and misconceptions (2-3). */
  mistakes: string[];
  /** Alternative names and naming conventions; '' when there is nothing useful to say. */
  naming: string;
  /** Limits of the technique (or of Pencilmark's detector); '' when none. */
  limits: string;
  /** Which candidates/cells the deduction affects. Used as feedback when a learner picks a wrong target. */
  targetRule: string;
  /** Caption for the "pattern" phase of the demonstration. */
  patternCaption: string;
}

/** A hand-built position for a foundation exercise. Verified programmatically in tests. */
export interface HandPosition {
  /** 81 chars, '.' or '0' = empty. */
  grid: string;
  /** Optional mask string of which filled cells are givens (81 chars, 'g' = given). Default: all filled cells are givens. */
  givens?: string;
}

export type FoundationCard =
  | { kind: 'concept'; title: string; body: string[]; position?: HandPosition; overlayCells?: number[]; overlayUnits?: number[]; diagramLabel?: string }
  | {
      kind: 'tap-cell';
      title: string;
      prompt: string;
      position: HandPosition;
      /** Any of these cells is a correct answer. */
      answers: number[];
      success: string;
      /** Feedback for a wrong tap. */
      retry: string;
    }
  | {
      kind: 'fill-candidates';
      title: string;
      prompt: string;
      position: HandPosition;
      cell: number;
      success: string;
    }
  | {
      kind: 'place-digit';
      title: string;
      prompt: string;
      position: HandPosition;
      cell: number;
      digit: number;
      success: string;
      retry: string;
    }
  | {
      kind: 'remove-candidates';
      title: string;
      prompt: string;
      position: HandPosition;
      /** Candidates shown: computed from the grid with these extra marks removed (none by default). */
      answers: { cell: number; digit: number }[];
      /** Cell/digit just placed, highlighted as the reason. */
      focusCell?: number;
      success: string;
    }
  | {
      kind: 'choice';
      title: string;
      prompt: string;
      options: { label: string; correct: boolean; feedback: string }[];
    };

export interface FoundationContent {
  id: string;
  title: string;
  level: LevelId;
  summary: string;
  prerequisites: string[];
  cards: FoundationCard[];
}

export type LessonKind = 'foundation' | 'technique';

export interface Lesson {
  id: string;
  kind: LessonKind;
  title: string;
  level: LevelId;
  summary: string;
  /** Lesson ids that should be completed first. */
  prerequisites: string[];
  technique?: TechniqueId;
  content?: TechniqueContent;
  foundation?: FoundationContent;
}
