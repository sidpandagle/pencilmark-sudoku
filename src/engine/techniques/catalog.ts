import type { TechniqueId } from '../steps';
import type { Difficulty } from '../types';

export type TechniqueFamily =
  | 'singles'
  | 'intersections'
  | 'subsets'
  | 'fish'
  | 'single-digit'
  | 'wings'
  | 'coloring'
  | 'uniqueness'
  | 'chains'
  | 'als'
  | 'forcing';

export interface TechniqueInfo {
  id: TechniqueId;
  /** Display name. */
  name: string;
  /** Teaching level 1 (basic) … 5 (last resort). */
  level: 1 | 2 | 3 | 4 | 5;
  /** Puzzle difficulty implied when this is the hardest technique needed. */
  tier: Difficulty;
  family: TechniqueFamily;
  /** Techniques a learner should know first. */
  prerequisites: TechniqueId[];
  /** Weight added to the puzzle score each time the technique is used. */
  weight: number;
  /** Short description for learners. */
  description: string;
  /** Naming conventions / variants covered by this id. */
  conventions: string;
  /** Only valid when the puzzle has exactly one solution. */
  requiresUniqueness?: boolean;
}

/**
 * Technique taxonomy in solver order (increasing difficulty). The logical solver always tries techniques in
 * this order and restarts from the top after every step.
 */
export const TECHNIQUES: readonly TechniqueInfo[] = [
  // ---- Level 1: singles (easy) ----
  {
    id: 'full-house', name: 'Full House', level: 1, tier: 'easy', family: 'singles', prerequisites: [], weight: 1,
    description: 'A row, column or box has one empty cell left; it gets the missing digit.',
    conventions: 'Also called "last digit" or "last free cell".',
  },
  {
    id: 'hidden-single', name: 'Hidden Single', level: 1, tier: 'easy', family: 'singles', prerequisites: ['full-house'], weight: 2,
    description: 'A digit has only one possible cell in a row, column or box.',
    conventions: 'Boxes are searched first, then rows, then columns.',
  },
  {
    id: 'naked-single', name: 'Naked Single', level: 1, tier: 'easy', family: 'singles', prerequisites: ['full-house'], weight: 3,
    description: 'A cell has only one candidate left.',
    conventions: 'Also called "sole candidate".',
  },
  // ---- Level 2: intersections and small subsets (medium) ----
  {
    id: 'pointing', name: 'Pointing Pair/Triple', level: 2, tier: 'medium', family: 'intersections', prerequisites: ['hidden-single'], weight: 8,
    description: 'Inside a box a digit is confined to one row or column, so it leaves the rest of that line.',
    conventions: 'Locked candidates type 1. Covers pointing pairs and pointing triples.',
  },
  {
    id: 'box-line-reduction', name: 'Box/Line Reduction', level: 2, tier: 'medium', family: 'intersections', prerequisites: ['pointing'], weight: 9,
    description: 'Inside a row or column a digit is confined to one box, so it leaves the rest of that box.',
    conventions: 'Also called "claiming" or locked candidates type 2.',
  },
  {
    id: 'naked-pair', name: 'Naked Pair', level: 2, tier: 'medium', family: 'subsets', prerequisites: ['naked-single'], weight: 10,
    description: 'Two cells in a unit share the same two candidates; those digits leave the rest of the unit.',
    conventions: 'When the pair also shares a box and a line ("locked pair") eliminations cover both units.',
  },
  {
    id: 'hidden-pair', name: 'Hidden Pair', level: 2, tier: 'medium', family: 'subsets', prerequisites: ['hidden-single', 'naked-pair'], weight: 12,
    description: 'Two digits can only go in the same two cells of a unit; other candidates leave those cells.',
    conventions: '',
  },
  {
    id: 'naked-triple', name: 'Naked Triple', level: 2, tier: 'medium', family: 'subsets', prerequisites: ['naked-pair'], weight: 14,
    description: 'Three cells in a unit hold only three digits between them; those digits leave the rest of the unit.',
    conventions: 'Each cell may hold two or three of the digits.',
  },
  {
    id: 'hidden-triple', name: 'Hidden Triple', level: 2, tier: 'medium', family: 'subsets', prerequisites: ['hidden-pair'], weight: 16,
    description: 'Three digits can only go in the same three cells of a unit; other candidates leave those cells.',
    conventions: '',
  },
  // ---- Level 3: basic patterns (hard) ----
  {
    id: 'x-wing', name: 'X-Wing', level: 3, tier: 'hard', family: 'fish', prerequisites: ['pointing'], weight: 24,
    description: 'In two rows a digit fits only the same two columns (or vice versa); it leaves the rest of those columns.',
    conventions: 'Size-2 basic fish, row- or column-based.',
  },
  {
    id: 'skyscraper', name: 'Skyscraper', level: 3, tier: 'hard', family: 'single-digit', prerequisites: ['x-wing'], weight: 26,
    description: 'Two conjugate pairs in parallel lines share one end line; a cell seeing both other ends loses the digit.',
    conventions: 'A turbot fish (X-Chain of four cells) with both strong links in rows or both in columns.',
  },
  {
    id: 'two-string-kite', name: 'Two-String Kite', level: 3, tier: 'hard', family: 'single-digit', prerequisites: ['x-wing'], weight: 26,
    description: 'A row conjugate pair and a column conjugate pair meet in a box; a cell seeing both far ends loses the digit.',
    conventions: 'A turbot fish with one row and one column strong link joined inside a box.',
  },
  {
    id: 'xy-wing', name: 'XY-Wing', level: 3, tier: 'hard', family: 'wings', prerequisites: ['naked-pair'], weight: 28,
    description: 'A bivalue pivot {x,y} sees pincers {x,z} and {y,z}; cells seeing both pincers lose z.',
    conventions: 'Also called Y-Wing. It is the shortest XY-Chain (three cells).',
  },
  {
    id: 'xyz-wing', name: 'XYZ-Wing', level: 3, tier: 'hard', family: 'wings', prerequisites: ['xy-wing'], weight: 30,
    description: 'A pivot {x,y,z} sees pincers {x,z} and {y,z}; cells seeing all three lose z.',
    conventions: '',
  },
  {
    id: 'simple-coloring', name: 'Simple Colouring', level: 3, tier: 'hard', family: 'coloring', prerequisites: ['x-wing'], weight: 32,
    description: 'Colour chains of conjugate pairs of one digit in two colours; exactly one colour is true.',
    conventions: 'Also called single-digit colouring or singles chains. Covers colour wrap and colour trap.',
  },
  {
    id: 'swordfish', name: 'Swordfish', level: 3, tier: 'hard', family: 'fish', prerequisites: ['x-wing'], weight: 34,
    description: 'In three rows a digit fits only the same three columns (or vice versa); it leaves the rest of those columns.',
    conventions: 'Size-3 basic fish. Base lines may hold the digit in two or three of the cover lines.',
  },
  {
    id: 'naked-quad', name: 'Naked Quad', level: 3, tier: 'hard', family: 'subsets', prerequisites: ['naked-triple'], weight: 36,
    description: 'Four cells in a unit hold only four digits between them; those digits leave the rest of the unit.',
    conventions: '',
  },
  {
    id: 'hidden-quad', name: 'Hidden Quad', level: 3, tier: 'hard', family: 'subsets', prerequisites: ['hidden-triple'], weight: 38,
    description: 'Four digits can only go in the same four cells of a unit; other candidates leave those cells.',
    conventions: '',
  },
  // ---- Level 4: advanced patterns (hard) ----
  {
    id: 'turbot-fish', name: 'Turbot Fish', level: 4, tier: 'hard', family: 'single-digit', prerequisites: ['skyscraper', 'two-string-kite'], weight: 40,
    description: 'Strong link, weak link, strong link on one digit; a cell seeing both ends loses the digit.',
    conventions: 'General X-Chain with four cells. Skyscraper and two-string kite are turbot shapes found first; this id covers the rest (usually a box conjugate pair, like an empty rectangle).',
  },
  {
    id: 'w-wing', name: 'W-Wing', level: 4, tier: 'hard', family: 'wings', prerequisites: ['xy-wing'], weight: 42,
    description: 'Two identical bivalue cells {x,y} joined by a conjugate pair on x; cells seeing both lose y.',
    conventions: '',
  },
  {
    id: 'unique-rectangle-1', name: 'Unique Rectangle Type 1', level: 4, tier: 'hard', family: 'uniqueness', prerequisites: ['naked-pair'], weight: 42, requiresUniqueness: true,
    description: 'Three corners of a two-box rectangle are exactly {a,b}; the fourth corner cannot be a or b.',
    conventions: 'Only valid for puzzles with a unique solution.',
  },
  {
    id: 'unique-rectangle-2', name: 'Unique Rectangle Type 2', level: 4, tier: 'hard', family: 'uniqueness', prerequisites: ['unique-rectangle-1'], weight: 44, requiresUniqueness: true,
    description: 'Two corners are {a,b} and the other two are {a,b,x}; cells seeing both x corners lose x.',
    conventions: 'Only valid for puzzles with a unique solution. Floor corners must share a row or column.',
  },
  {
    id: 'unique-rectangle-4', name: 'Unique Rectangle Type 4', level: 4, tier: 'hard', family: 'uniqueness', prerequisites: ['unique-rectangle-1'], weight: 44, requiresUniqueness: true,
    description: 'Two corners are {a,b}; if a is locked to the other two corners in a unit, those corners lose b.',
    conventions: 'Only valid for puzzles with a unique solution.',
  },
  {
    id: 'bug-plus-one', name: 'BUG+1', level: 4, tier: 'hard', family: 'uniqueness', prerequisites: ['naked-pair'], weight: 44, requiresUniqueness: true,
    description: 'All empty cells are bivalue except one; that cell takes the digit that appears three times in its units.',
    conventions: 'Bivalue Universal Grave + 1. Only valid for puzzles with a unique solution.',
  },
  {
    id: 'finned-x-wing', name: 'Finned X-Wing', level: 4, tier: 'hard', family: 'fish', prerequisites: ['x-wing'], weight: 46,
    description: 'An X-Wing with extra candidates (fins) in one box; cells in the cover lines that see the fins lose the digit.',
    conventions: 'Includes sashimi X-Wings (a base line with only one candidate in the cover lines).',
  },
  {
    id: 'jellyfish', name: 'Jellyfish', level: 4, tier: 'hard', family: 'fish', prerequisites: ['swordfish'], weight: 48,
    description: 'In four rows a digit fits only the same four columns (or vice versa).',
    conventions: 'Size-4 basic fish.',
  },
  {
    id: 'finned-swordfish', name: 'Finned Swordfish', level: 4, tier: 'hard', family: 'fish', prerequisites: ['swordfish', 'finned-x-wing'], weight: 50,
    description: 'A Swordfish with fins in one box; cells in the cover lines that see the fins lose the digit.',
    conventions: 'Includes sashimi Swordfish.',
  },
  // ---- Level 4: chains and ALS (expert) ----
  {
    id: 'x-chain', name: 'X-Chain', level: 4, tier: 'expert', family: 'chains', prerequisites: ['turbot-fish', 'simple-coloring'], weight: 60,
    description: 'An alternating chain of strong and weak links on one digit; cells seeing both ends lose the digit.',
    conventions: 'At least four links in practice (three-link chains are turbot fish, found earlier). Up to 11 links.',
  },
  {
    id: 'xy-chain', name: 'XY-Chain', level: 4, tier: 'expert', family: 'chains', prerequisites: ['xy-wing'], weight: 62,
    description: 'A chain of bivalue cells, each linked to the next by a shared digit; cells seeing both ends lose the end digit.',
    conventions: 'Up to 13 links. XY-Wing is the three-cell case.',
  },
  {
    id: 'aic', name: 'Alternating Inference Chain', level: 4, tier: 'expert', family: 'chains', prerequisites: ['x-chain', 'xy-chain'], weight: 70,
    description: 'A chain mixing bivalue cells and conjugate pairs across digits; candidates that conflict with both ends are removed.',
    conventions: 'AIC with single-candidate nodes (no grouped nodes). Eureka notation: "=" strong, "–" weak. Up to 11 links.',
  },
  {
    id: 'als-xz', name: 'ALS-XZ', level: 4, tier: 'expert', family: 'als', prerequisites: ['naked-triple', 'xy-wing'], weight: 72,
    description: 'Two almost locked sets share a restricted common digit X; a common digit Z leaves cells seeing all its copies.',
    conventions: 'Singly linked ALS-XZ, sets of 1-4 cells.',
  },
  // ---- Level 5: last resort (expert) ----
  {
    id: 'sue-de-coq', name: 'Sue de Coq', level: 5, tier: 'expert', family: 'als', prerequisites: ['als-xz'], weight: 80,
    description: 'Cells at a box/line intersection plus cells from the line and box lock their digits into the line or box.',
    conventions: 'Also called two-sector disjoint subsets. Intersection of 2-3 cells, line and box parts of 1-3 cells.',
  },
  {
    id: 'forcing-chain', name: 'Forcing Chain', level: 5, tier: 'expert', family: 'forcing', prerequisites: ['aic'], weight: 100,
    description: 'Try every candidate of a cell (or every place for a digit in a unit); if all lead to the same result, it is true.',
    conventions: 'Last resort. Branches are followed with singles only (a "forcing net" of singles). Includes contradiction chains.',
  },
];

const BY_ID = new Map<TechniqueId, TechniqueInfo>(TECHNIQUES.map((t) => [t.id, t]));
const RANK = new Map<TechniqueId, number>(TECHNIQUES.map((t, i) => [t.id, i]));

export function techniqueInfo(id: TechniqueId): TechniqueInfo {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`Unknown technique ${id}`);
  return t;
}

/** Position of the technique in solver order (higher = harder). */
export const techniqueRank = (id: TechniqueId) => RANK.get(id) ?? -1;

const TIER_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2, expert: 3 };
export const tierRank = (d: Difficulty) => TIER_ORDER[d];
