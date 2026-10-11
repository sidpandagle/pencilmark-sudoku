import type { TechniqueId } from '../engine';

/**
 * Learning progress: pure data + pure functions (no React, no storage). Persisted by src/storage under the
 * versioned `learning` namespace; `sanitizeLearning` is the runtime validator used on load.
 *
 * Model
 * - Completion: the learner went through all teaching cards of a lesson.
 * - Mastery: the learner passed the mastery check (every position right, no reveals).
 * - Spaced review: after mastery, reviews are due after 1, 3, 7, 14, 30 days. Passing a review moves to the
 *   next interval (capped at 30 days); failing resets to 1 day and marks the lesson "needs review".
 * - Struggle signals: hints used in games, per technique (timestamps, capped). Recent hints and failed checks
 *   drive the "weak spots" recommendations.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
/** Hints older than this no longer count as a weak spot. */
export const STRUGGLE_WINDOW_MS = 14 * DAY_MS;
const MAX_STRUGGLES_PER_TECHNIQUE = 20;
const MAX_LESSONS = 200;

export interface LessonProgress {
  /** First time all teaching cards were finished. */
  completedAt: number | null;
  /** Number of mastery checks taken (first check and reviews). */
  attempts: number;
  /** Score of the latest check, 0..1. */
  lastScore: number | null;
  bestScore: number;
  /** First time the mastery check was passed. */
  masteredAt: number | null;
  lastReviewedAt: number | null;
  nextReviewAt: number | null;
  /** Index into REVIEW_INTERVALS_DAYS of the interval used to schedule nextReviewAt. */
  intervalIndex: number;
  /** Result of the latest check. */
  lastResult: 'pass' | 'fail' | null;
}

export interface LearningState {
  lessons: Record<string, LessonProgress>;
  /** Technique id -> timestamps of hints that used it in games (newest last). */
  struggles: Partial<Record<TechniqueId, number[]>>;
}

export const emptyLearning = (): LearningState => ({ lessons: {}, struggles: {} });

export const emptyLessonProgress = (): LessonProgress => ({
  completedAt: null,
  attempts: 0,
  lastScore: null,
  bestScore: 0,
  masteredAt: null,
  lastReviewedAt: null,
  nextReviewAt: null,
  intervalIndex: 0,
  lastResult: null,
});

export const lessonProgress = (s: LearningState, id: string): LessonProgress => s.lessons[id] ?? emptyLessonProgress();

const setLesson = (s: LearningState, id: string, p: LessonProgress): LearningState => ({ ...s, lessons: { ...s.lessons, [id]: p } });

/** Mark all teaching cards of a lesson as finished (idempotent: keeps the first completion time). */
export function recordCompletion(s: LearningState, id: string, now: number): LearningState {
  const p = lessonProgress(s, id);
  if (p.completedAt !== null) return s;
  return setLesson(s, id, { ...p, completedAt: now });
}

export interface CheckResult {
  correct: number;
  total: number;
  /** Any answer revealed / help used. */
  revealed: boolean;
}

export const passed = (r: CheckResult) => r.total > 0 && r.correct === r.total && !r.revealed;

/**
 * Record a mastery check. The first pass sets masteredAt and schedules the first review in 1 day.
 * Later checks on a mastered lesson are reviews: a pass moves one interval up (max 30 days), a fail
 * resets to 1 day. Failing before mastery just counts the attempt.
 */
export function recordCheck(s: LearningState, id: string, r: CheckResult, now: number): LearningState {
  const p = lessonProgress(s, id);
  const score = r.total > 0 ? r.correct / r.total : 0;
  const ok = passed(r);
  const next: LessonProgress = {
    ...p,
    completedAt: p.completedAt ?? now,
    attempts: p.attempts + 1,
    lastScore: score,
    bestScore: Math.max(p.bestScore, score),
    lastResult: ok ? 'pass' : 'fail',
  };
  if (p.masteredAt === null) {
    if (ok) {
      next.masteredAt = now;
      next.intervalIndex = 0;
      next.lastReviewedAt = now;
      next.nextReviewAt = now + REVIEW_INTERVALS_DAYS[0] * DAY_MS;
    }
  } else {
    next.lastReviewedAt = now;
    next.intervalIndex = ok ? Math.min(p.intervalIndex + 1, REVIEW_INTERVALS_DAYS.length - 1) : 0;
    next.nextReviewAt = now + REVIEW_INTERVALS_DAYS[next.intervalIndex] * DAY_MS;
  }
  return setLesson(s, id, next);
}

/** Record that a game hint used technique `t`. */
export function recordStruggle(s: LearningState, t: TechniqueId, now: number): LearningState {
  const list = [...(s.struggles[t] ?? []), now].slice(-MAX_STRUGGLES_PER_TECHNIQUE);
  return { ...s, struggles: { ...s.struggles, [t]: list } };
}

export type LessonStatus = 'locked' | 'available' | 'completed' | 'mastered' | 'needs-review';

export function isDue(p: LessonProgress, now: number): boolean {
  return p.masteredAt !== null && p.nextReviewAt !== null && p.nextReviewAt <= now;
}

/**
 * Status of a lesson for the map. A lesson is available when every prerequisite is completed (completion,
 * not mastery, unlocks the next lessons). Mastered lessons that are due or whose last review failed show
 * "needs review".
 */
export function lessonStatus(s: LearningState, lesson: { id: string; prerequisites: readonly string[] }, now: number): LessonStatus {
  const p = lessonProgress(s, lesson.id);
  if (p.masteredAt !== null) return isDue(p, now) || p.lastResult === 'fail' ? 'needs-review' : 'mastered';
  if (p.completedAt !== null) return 'completed';
  const unlocked = lesson.prerequisites.every((id) => lessonProgress(s, id).completedAt !== null);
  return unlocked ? 'available' : 'locked';
}

/** Mastered lessons whose review is due (or whose last review failed), most overdue first. */
export function dueForReview(s: LearningState, now: number): string[] {
  return Object.entries(s.lessons)
    .filter(([, p]) => p.masteredAt !== null && (isDue(p, now) || p.lastResult === 'fail'))
    .sort((a, b) => (a[1].nextReviewAt ?? 0) - (b[1].nextReviewAt ?? 0))
    .map(([id]) => id);
}

export interface WeakSpot {
  id: string;
  /** Hints for this technique within the window. */
  recentHints: number;
  failedCheck: boolean;
  reason: string;
}

/**
 * Weak areas: techniques with recent hint usage in games, and lessons whose latest mastery check failed.
 * Sorted by weight (failed check counts like three hints), strongest signal first.
 */
export function weakSpots(s: LearningState, now: number, limit = 5): WeakSpot[] {
  const ids = new Set<string>([...Object.keys(s.struggles), ...Object.keys(s.lessons)]);
  const out: (WeakSpot & { w: number })[] = [];
  for (const id of ids) {
    const hints = (s.struggles[id as TechniqueId] ?? []).filter((t) => now - t <= STRUGGLE_WINDOW_MS && t <= now).length;
    const failedCheck = s.lessons[id]?.lastResult === 'fail';
    if (!hints && !failedCheck) continue;
    const parts: string[] = [];
    if (hints) parts.push(`${hints} hint${hints === 1 ? '' : 's'} in the last two weeks`);
    if (failedCheck) parts.push('last check missed');
    out.push({ id, recentHints: hints, failedCheck, reason: parts.join(' · '), w: hints + (failedCheck ? 3 : 0) });
  }
  return out
    .sort((a, b) => b.w - a.w || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map(({ w: _w, ...rest }) => rest);
}

/**
 * Recommended next lesson: the first lesson in curriculum order that is available (not yet completed);
 * otherwise the first completed-but-not-mastered lesson; otherwise null (everything mastered).
 */
export function recommendedLesson(s: LearningState, lessons: readonly { id: string; prerequisites: readonly string[] }[], now: number): string | null {
  const firstAvailable = lessons.find((l) => lessonStatus(s, l, now) === 'available');
  if (firstAvailable) return firstAvailable.id;
  const firstCompleted = lessons.find((l) => lessonStatus(s, l, now) === 'completed');
  return firstCompleted?.id ?? null;
}

// ------------------------------------------------------------------ validation (storage)

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);
const time = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : null);
const count = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
const score = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : null);
const ID_RE = /^[a-z0-9-]{1,40}$/;

function sanitizeLesson(raw: unknown): LessonProgress | null {
  if (!isObj(raw)) return null;
  const p = emptyLessonProgress();
  p.completedAt = time(raw.completedAt);
  p.attempts = count(raw.attempts);
  p.lastScore = score(raw.lastScore);
  p.bestScore = score(raw.bestScore) ?? 0;
  p.masteredAt = time(raw.masteredAt);
  p.lastReviewedAt = time(raw.lastReviewedAt);
  p.nextReviewAt = p.masteredAt !== null ? time(raw.nextReviewAt) : null;
  p.intervalIndex = Math.min(count(raw.intervalIndex), REVIEW_INTERVALS_DAYS.length - 1);
  p.lastResult = raw.lastResult === 'pass' || raw.lastResult === 'fail' ? raw.lastResult : null;
  if (p.masteredAt !== null && p.completedAt === null) p.completedAt = p.masteredAt;
  if (p.masteredAt !== null && p.nextReviewAt === null) p.nextReviewAt = p.masteredAt + DAY_MS;
  return p;
}

/** Runtime validation of persisted learning data. Never throws; repairs field by field. */
export function sanitizeLearning(raw: unknown): LearningState {
  const out = emptyLearning();
  if (!isObj(raw)) return out;
  if (isObj(raw.lessons)) {
    for (const [id, v] of Object.entries(raw.lessons).slice(0, MAX_LESSONS)) {
      if (!ID_RE.test(id)) continue;
      const p = sanitizeLesson(v);
      if (p) out.lessons[id] = p;
    }
  }
  if (isObj(raw.struggles)) {
    for (const [id, v] of Object.entries(raw.struggles).slice(0, 60)) {
      if (!ID_RE.test(id) || !Array.isArray(v)) continue;
      const list = v.map(time).filter((t): t is number => t !== null).sort((a, b) => a - b).slice(-MAX_STRUGGLES_PER_TECHNIQUE);
      if (list.length) out.struggles[id as TechniqueId] = list;
    }
  }
  return out;
}

/**
 * Migration of the v1 namespace (a free-form object reserved for learning mode, never written by a
 * shipped build) to v2: keep `lessons`/`struggles` when they are present, drop everything else.
 */
export function migrateLearningV1(data: unknown): unknown {
  if (!isObj(data)) return emptyLearning();
  return { lessons: isObj(data.lessons) ? data.lessons : {}, struggles: isObj(data.struggles) ? data.struggles : {} };
}
