import { createMemoryStorage } from '../../storage/adapter';
import { BACKUP_PREFIX, loadNamespace, saveNamespace, storageKey } from '../../storage/schema';
import { LESSONS } from '../curriculum';
import {
  DAY_MS,
  dueForReview,
  emptyLearning,
  lessonProgress,
  lessonStatus,
  migrateLearningV1,
  recommendedLesson,
  recordCheck,
  recordCompletion,
  recordStruggle,
  sanitizeLearning,
  weakSpots,
  type LearningState,
} from '../progress';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const T0 = 1_700_000_000_000;
const PASS = { correct: 3, total: 3, revealed: false };
const FAIL = { correct: 2, total: 3, revealed: false };

describe('completion and mastery', () => {
  it('completion is idempotent and is not mastery', () => {
    let s = recordCompletion(emptyLearning(), 'x-wing', T0);
    s = recordCompletion(s, 'x-wing', T0 + 5);
    expect(lessonProgress(s, 'x-wing').completedAt).toBe(T0);
    expect(lessonProgress(s, 'x-wing').masteredAt).toBeNull();
  });

  it('a failed first check counts the attempt but does not schedule reviews', () => {
    const s = recordCheck(emptyLearning(), 'x-wing', FAIL, T0);
    const p = lessonProgress(s, 'x-wing');
    expect(p.attempts).toBe(1);
    expect(p.masteredAt).toBeNull();
    expect(p.nextReviewAt).toBeNull();
    expect(p.lastScore).toBeCloseTo(2 / 3);
  });

  it('a reveal is never mastery', () => {
    const s = recordCheck(emptyLearning(), 'x-wing', { correct: 3, total: 3, revealed: true }, T0);
    expect(lessonProgress(s, 'x-wing').masteredAt).toBeNull();
  });
});

describe('spaced review schedule', () => {
  it('follows 1, 3, 7, 14, 30 days on passes and stays at 30', () => {
    let s: LearningState = emptyLearning();
    let now = T0;
    s = recordCheck(s, 'pointing', PASS, now);
    expect(lessonProgress(s, 'pointing').nextReviewAt).toBe(now + 1 * DAY_MS);
    for (const days of [3, 7, 14, 30, 30]) {
      now = lessonProgress(s, 'pointing').nextReviewAt!;
      s = recordCheck(s, 'pointing', PASS, now);
      expect(lessonProgress(s, 'pointing').nextReviewAt).toBe(now + days * DAY_MS);
    }
  });

  it('a failed review resets the interval to one day', () => {
    let s = recordCheck(emptyLearning(), 'pointing', PASS, T0);
    s = recordCheck(s, 'pointing', PASS, T0 + DAY_MS); // -> 3 days
    s = recordCheck(s, 'pointing', FAIL, T0 + 4 * DAY_MS);
    const p = lessonProgress(s, 'pointing');
    expect(p.intervalIndex).toBe(0);
    expect(p.nextReviewAt).toBe(T0 + 5 * DAY_MS);
    expect(p.masteredAt).toBe(T0); // mastery is kept, but it needs review
    expect(lessonStatus(s, { id: 'pointing', prerequisites: [] }, T0 + 4 * DAY_MS)).toBe('needs-review');
  });

  it('lists due reviews, most overdue first', () => {
    let s = recordCheck(emptyLearning(), 'a', PASS, T0);
    s = recordCheck(s, 'b', PASS, T0 - DAY_MS);
    expect(dueForReview(s, T0 - 1)).toEqual([]);
    expect(dueForReview(s, T0 + DAY_MS)).toEqual(['b', 'a']);
  });
});

describe('lesson status', () => {
  const lesson = { id: 'hidden-pair', prerequisites: ['hidden-single', 'naked-pair'] };
  it('locked → available → completed → mastered → needs review', () => {
    let s = emptyLearning();
    expect(lessonStatus(s, lesson, T0)).toBe('locked');
    s = recordCompletion(s, 'hidden-single', T0);
    expect(lessonStatus(s, lesson, T0)).toBe('locked');
    s = recordCompletion(s, 'naked-pair', T0);
    expect(lessonStatus(s, lesson, T0)).toBe('available');
    s = recordCompletion(s, 'hidden-pair', T0);
    expect(lessonStatus(s, lesson, T0)).toBe('completed');
    s = recordCheck(s, 'hidden-pair', PASS, T0);
    expect(lessonStatus(s, lesson, T0 + 1000)).toBe('mastered');
    expect(lessonStatus(s, lesson, T0 + DAY_MS)).toBe('needs-review');
  });

  it('recommends the first available lesson, starting with the rules', () => {
    expect(recommendedLesson(emptyLearning(), LESSONS, T0)).toBe('rules');
    const s = recordCompletion(emptyLearning(), 'rules', T0);
    expect(recommendedLesson(s, LESSONS, T0)).toBe('givens');
  });
});

describe('weak spots from gameplay signals', () => {
  it('counts recent hints per technique and failed checks', () => {
    let s = emptyLearning();
    s = recordStruggle(s, 'x-wing', T0);
    s = recordStruggle(s, 'x-wing', T0 + 1);
    s = recordStruggle(s, 'naked-pair', T0 - 20 * DAY_MS); // too old
    s = recordCheck(s, 'skyscraper', FAIL, T0);
    const w = weakSpots(s, T0 + 10);
    expect(w.map((x) => x.id)).toEqual(['skyscraper', 'x-wing']);
    expect(w[1].recentHints).toBe(2);
    expect(w[0].failedCheck).toBe(true);
  });

  it('caps stored struggle signals', () => {
    let s = emptyLearning();
    for (let i = 0; i < 50; i++) s = recordStruggle(s, 'pointing', T0 + i);
    expect(s.struggles.pointing).toHaveLength(20);
  });
});

describe('validation and migration', () => {
  it('sanitizes garbage field by field', () => {
    const s = sanitizeLearning({
      lessons: {
        'x-wing': { completedAt: 'yesterday', attempts: -3, bestScore: 7, masteredAt: T0, nextReviewAt: null, intervalIndex: 99, lastResult: 'meh' },
        'BAD ID!': { completedAt: T0 },
        pointing: 'nope',
      },
      struggles: { 'x-wing': [T0, 'x', -1, T0 + 1], other: 'no' },
      extra: true,
    });
    expect(Object.keys(s.lessons)).toEqual(['x-wing']);
    const p = s.lessons['x-wing'];
    expect(p.completedAt).toBe(T0); // repaired from masteredAt
    expect(p.attempts).toBe(0);
    expect(p.bestScore).toBe(1);
    expect(p.nextReviewAt).toBe(T0 + DAY_MS);
    expect(p.intervalIndex).toBe(4);
    expect(p.lastResult).toBeNull();
    expect(s.struggles['x-wing']).toEqual([T0, T0 + 1]);
    expect(sanitizeLearning(null)).toEqual(emptyLearning());
    expect(sanitizeLearning([1, 2])).toEqual(emptyLearning());
  });

  it('migrates the v1 free-form object', () => {
    expect(migrateLearningV1({ anything: 1 })).toEqual({ lessons: {}, struggles: {} });
    expect(migrateLearningV1({ lessons: { a: 1 } })).toEqual({ lessons: { a: 1 }, struggles: {} });
    expect(migrateLearningV1('x')).toEqual(emptyLearning());
  });

  it('loads a v1 envelope through the storage layer as migrated v2 data', async () => {
    const st = createMemoryStorage({ [storageKey('learning')]: JSON.stringify({ v: 1, savedAt: 1, data: { foo: 'bar' } }) });
    const r = await loadNamespace<LearningState>(st, 'learning');
    expect(r.status).toBe('migrated');
    expect(r.value).toEqual(emptyLearning());
  });

  it('round-trips v2 data and recovers from corruption with a backup', async () => {
    const st = createMemoryStorage();
    const s = recordCheck(recordStruggle(emptyLearning(), 'x-wing', T0), 'x-wing', PASS, T0);
    await saveNamespace(st, 'learning', s);
    expect(JSON.parse(st.data.get(storageKey('learning'))!).v).toBe(2);
    expect((await loadNamespace<LearningState>(st, 'learning')).value).toEqual(s);

    const bad = createMemoryStorage({ [storageKey('learning')]: '{oops' });
    const r = await loadNamespace<LearningState>(bad, 'learning');
    expect(r.status).toBe('recovered');
    expect(r.value).toEqual(emptyLearning());
    expect(bad.data.get(`${BACKUP_PREFIX}learning`)).toBe('{oops');

    const future = createMemoryStorage({ [storageKey('learning')]: JSON.stringify({ v: 9, data: {} }) });
    expect((await loadNamespace(future, 'learning')).status).toBe('recovered');
  });
});
