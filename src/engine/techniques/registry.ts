import type { SolverState } from '../solver/state';
import type { Step, TechniqueId } from '../steps';
import { TECHNIQUES } from './catalog';
import { findAlsXZ } from './als';
import { findAIC, findXChain, findXYChain } from './chains';
import { findSimpleColoring } from './coloring';
import { findFinnedSwordfish, findFinnedXWing, findJellyfish, findSwordfish, findXWing } from './fish';
import { findForcingChain } from './forcing';
import { findBoxLineReduction, findPointing } from './intersections';
import { findFullHouse, findHiddenSingle, findNakedSingle } from './singles';
import { findSkyscraper, findTurbotFish, findTwoStringKite } from './singleDigit';
import {
  findHiddenPair,
  findHiddenQuad,
  findHiddenTriple,
  findNakedPair,
  findNakedQuad,
  findNakedTriple,
} from './subsets';
import { findSueDeCoq } from './sueDeCoq';
import { findBugPlusOne, findUniqueRectangle1, findUniqueRectangle2, findUniqueRectangle4 } from './uniqueness';
import { findWWing, findXYWing, findXYZWing } from './wings';

/** A technique detector: returns a step that makes progress, or null. Never mutates the state. */
export type Detector = (s: SolverState) => Step | null;

export const DETECTORS: Record<TechniqueId, Detector> = {
  'full-house': findFullHouse,
  'hidden-single': findHiddenSingle,
  'naked-single': findNakedSingle,
  pointing: findPointing,
  'box-line-reduction': findBoxLineReduction,
  'naked-pair': findNakedPair,
  'hidden-pair': findHiddenPair,
  'naked-triple': findNakedTriple,
  'hidden-triple': findHiddenTriple,
  'x-wing': findXWing,
  skyscraper: findSkyscraper,
  'two-string-kite': findTwoStringKite,
  'xy-wing': findXYWing,
  'xyz-wing': findXYZWing,
  'simple-coloring': findSimpleColoring,
  swordfish: findSwordfish,
  'naked-quad': findNakedQuad,
  'hidden-quad': findHiddenQuad,
  'turbot-fish': findTurbotFish,
  'w-wing': findWWing,
  'unique-rectangle-1': findUniqueRectangle1,
  'unique-rectangle-2': findUniqueRectangle2,
  'unique-rectangle-4': findUniqueRectangle4,
  'bug-plus-one': findBugPlusOne,
  'finned-x-wing': findFinnedXWing,
  jellyfish: findJellyfish,
  'finned-swordfish': findFinnedSwordfish,
  'x-chain': findXChain,
  'xy-chain': findXYChain,
  aic: findAIC,
  'als-xz': findAlsXZ,
  'sue-de-coq': findSueDeCoq,
  'forcing-chain': findForcingChain,
};

/** Technique ids in solver order. */
export const SOLVER_ORDER: readonly TechniqueId[] = TECHNIQUES.map((t) => t.id);
