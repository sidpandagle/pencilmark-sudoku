import { ACHIEVEMENTS, evaluateAchievements } from '../achievements';
import { addDays, formatTime, localDateKey } from '../dates';
import { createGame } from '../factory';
import { addHistory, historyEntryFrom, HISTORY_MAX } from '../history';
import { currentStreak, emptyStats, recordCompletion, recordStart, totals } from '../stats';
import type { GameState } from '../types';
import { PUZZLE, SOLUTION } from '../testFixtures';

const day = (key: string) => new Date(`${key}T12:00:00`).getTime();

function completedGame(id: string, over: Partial<GameState> = {}): GameState {
  const g = createGame({ puzzle: PUZZLE, solution: SOLUTION, difficulty: 'easy', source: 'random', id, now: 0 });
  return { ...g, values: SOLUTION.slice(), status: 'completed', completedAt: day('2026-03-10'), elapsedMs: 200_000, ...over };
}

describe('stats', () => {
  it('counts a start once per game id', () => {
    let s = recordStart(emptyStats(), { id: 'a', difficulty: 'easy' });
    s = recordStart(s, { id: 'a', difficulty: 'easy' });
    expect(s.buckets.easy.started).toBe(1);
  });

  it('records a completion exactly once, even if called again', () => {
    const g = completedGame('a');
    const r1 = recordCompletion(emptyStats(), g);
    expect(r1.counted).toBe(true);
    expect(r1.isNewBest).toBe(true);
    const r2 = recordCompletion(r1.stats, g);
    expect(r2.counted).toBe(false);
    expect(r2.stats).toBe(r1.stats);
    const b = r2.stats.buckets.easy;
    expect(b).toEqual({ started: 1, completed: 1, totalTimeMs: 200_000, bestTimeMs: 200_000, noMistakeWins: 1 });
  });

  it('tracks best and average times and no-mistake wins', () => {
    let s = recordCompletion(emptyStats(), completedGame('a', { elapsedMs: 300_000, errors: 2 })).stats;
    const r = recordCompletion(s, completedGame('b', { elapsedMs: 100_000 }));
    s = r.stats;
    expect(r.isNewBest).toBe(true);
    expect(r.previousBestMs).toBe(300_000);
    expect(s.buckets.easy.bestTimeMs).toBe(100_000);
    expect(s.buckets.easy.totalTimeMs).toBe(400_000);
    expect(s.buckets.easy.noMistakeWins).toBe(1);
    expect(totals(s).completed).toBe(2);
  });

  it('ignores games that are not completed', () => {
    const g = { ...completedGame('a'), status: 'playing' as const };
    expect(recordCompletion(emptyStats(), g).counted).toBe(false);
  });

  it('puts unrated custom games in the custom bucket', () => {
    const s = recordCompletion(emptyStats(), completedGame('c', { difficulty: null, source: 'custom' })).stats;
    expect(s.buckets.custom.completed).toBe(1);
  });

  it('computes current and longest streaks over consecutive days', () => {
    let s = emptyStats();
    const days = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06'];
    days.forEach((d, i) => {
      s = recordCompletion(s, completedGame(`g${i}`, { completedAt: day(d) })).stats;
    });
    expect(s.longestStreak).toBe(3);
    expect(currentStreak(s, '2026-03-06')).toBe(2);
    expect(currentStreak(s, '2026-03-07')).toBe(2); // yesterday still counts
    expect(currentStreak(s, '2026-03-08')).toBe(0);
  });

  it('tracks daily challenge completions', () => {
    const s = recordCompletion(emptyStats(), completedGame('d', { source: 'daily', dailyKey: '2026-03-10' })).stats;
    expect(s.dailyCompleted).toEqual(['2026-03-10']);
  });
});

describe('dates', () => {
  it('handles month boundaries and formats time', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatTime(65_000)).toBe('1:05');
    expect(formatTime(3_725_000)).toBe('1:02:05');
  });
});

describe('history', () => {
  it('adds newest first, replaces by id and caps', () => {
    let h = addHistory([], historyEntryFrom(completedGame('a'), 'completed'));
    h = addHistory(h, historyEntryFrom(completedGame('b'), 'completed'));
    h = addHistory(h, historyEntryFrom(completedGame('a'), 'completed'));
    expect(h.map((e) => e.id)).toEqual(['a', 'b']);
    for (let i = 0; i < HISTORY_MAX + 10; i++) h = addHistory(h, historyEntryFrom(completedGame(`x${i}`), 'completed'));
    expect(h).toHaveLength(HISTORY_MAX);
  });
});

describe('achievements', () => {
  it('has about ten achievements with unique ids', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('unlocks first win, clean solve and quick easy from a fast flawless easy win', () => {
    const g = completedGame('a', { elapsedMs: 120_000 });
    const stats = recordCompletion(emptyStats(), g).stats;
    const history = [historyEntryFrom(g, 'completed')];
    const r = evaluateAchievements({ stats, history }, {}, 42);
    expect(r.newly.sort()).toEqual(['clean-solve', 'first-win', 'quick-easy']);
    expect(r.unlocked['first-win']).toBe(42);
    // idempotent: nothing new the second time, timestamps kept
    const r2 = evaluateAchievements({ stats, history }, r.unlocked, 99);
    expect(r2.newly).toEqual([]);
    expect(r2.unlocked['first-win']).toBe(42);
  });

  it('unlocks streak, all-levels and unaided expert', () => {
    let stats = emptyStats();
    const history = [];
    const levels = ['easy', 'medium', 'hard', 'expert'] as const;
    for (let i = 0; i < 7; i++) {
      const g = completedGame(`s${i}`, {
        completedAt: day(addDays('2026-04-01', i)),
        difficulty: levels[i % 4],
        elapsedMs: 900_000,
        errors: 1,
      });
      stats = recordCompletion(stats, g).stats;
      history.push(historyEntryFrom(g, 'completed'));
    }
    const r = evaluateAchievements({ stats, history }, {});
    expect(r.newly).toEqual(expect.arrayContaining(['streak-3', 'streak-7', 'all-levels', 'expert-unaided']));
    expect(r.newly).not.toContain('streak-30');
    expect(r.newly).not.toContain('clean-solve');
    expect(r.newly).not.toContain('quick-easy');
  });
});
