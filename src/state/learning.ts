import type { TechniqueId } from '../engine';
import {
  recordCheck,
  recordCompletion,
  recordStruggle,
  type CheckResult,
  type LearningState,
} from '../learn/progress';
import { useStore } from './store';
import { learningStore } from './stores';

/** Learning-progress actions (thin wrappers over the pure functions in src/learn/progress.ts). */

export function completeLesson(id: string, now = Date.now()) {
  learningStore.set((s) => recordCompletion(s, id, now));
}

export function recordMasteryCheck(id: string, result: CheckResult, now = Date.now()) {
  learningStore.set((s) => recordCheck(s, id, result, now));
}

/** A game hint used technique `t`: remembered as a weak-spot signal for learning mode. */
export function recordHintTechnique(t: TechniqueId, now = Date.now()) {
  learningStore.set((s) => recordStruggle(s, t, now));
}

export const useLearning = (): LearningState => useStore(learningStore);
