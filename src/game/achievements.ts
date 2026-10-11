import { DIFFICULTIES } from '../engine';
import type { HistoryEntry } from './history';
import { totals, type Stats } from './stats';

export type AchievementIcon = 'star' | 'flame' | 'check' | 'bolt' | 'crown' | 'layers' | 'calendar' | 'medal' | 'target';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  /** Optional progress (current, goal) for locked achievements. */
  progress?: (ctx: AchievementContext) => [number, number];
  unlocked: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  stats: Stats;
  history: HistoryEntry[];
}

/** id -> unlock timestamp (ms). */
export type UnlockedAchievements = Record<string, number>;

const wins = (h: HistoryEntry[]) => h.filter((e) => e.result === 'completed');

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first-win',
    title: 'First solve',
    description: 'Complete your first puzzle.',
    icon: 'star',
    unlocked: ({ stats }) => totals(stats).completed >= 1,
  },
  {
    id: 'streak-3',
    title: 'Three in a row',
    description: 'Complete a puzzle on 3 consecutive days.',
    icon: 'flame',
    progress: ({ stats }) => [Math.min(stats.longestStreak, 3), 3],
    unlocked: ({ stats }) => stats.longestStreak >= 3,
  },
  {
    id: 'streak-7',
    title: 'A full week',
    description: 'Complete a puzzle on 7 consecutive days.',
    icon: 'flame',
    progress: ({ stats }) => [Math.min(stats.longestStreak, 7), 7],
    unlocked: ({ stats }) => stats.longestStreak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Habit formed',
    description: 'Complete a puzzle on 30 consecutive days.',
    icon: 'crown',
    progress: ({ stats }) => [Math.min(stats.longestStreak, 30), 30],
    unlocked: ({ stats }) => stats.longestStreak >= 30,
  },
  {
    id: 'clean-solve',
    title: 'Clean solve',
    description: 'Complete a puzzle without a single wrong entry.',
    icon: 'check',
    unlocked: ({ stats }) => totals(stats).noMistakeWins >= 1,
  },
  {
    id: 'expert-unaided',
    title: 'Unaided expert',
    description: 'Complete an Expert puzzle without hints.',
    icon: 'target',
    unlocked: ({ history }) => wins(history).some((e) => e.difficulty === 'expert' && e.hintsUsed === 0),
  },
  {
    id: 'all-levels',
    title: 'Full range',
    description: 'Complete a puzzle at every difficulty.',
    icon: 'layers',
    progress: ({ stats }) => [DIFFICULTIES.filter((d) => stats.buckets[d].completed > 0).length, 4],
    unlocked: ({ stats }) => DIFFICULTIES.every((d) => stats.buckets[d].completed > 0),
  },
  {
    id: 'fifty-games',
    title: 'Fifty puzzles',
    description: 'Complete 50 puzzles.',
    icon: 'medal',
    progress: ({ stats }) => [Math.min(totals(stats).completed, 50), 50],
    unlocked: ({ stats }) => totals(stats).completed >= 50,
  },
  {
    id: 'quick-easy',
    title: 'Light pencil',
    description: 'Complete an Easy puzzle in under 5 minutes.',
    icon: 'bolt',
    unlocked: ({ stats, history }) =>
      (stats.buckets.easy.bestTimeMs ?? Infinity) < 5 * 60_000 ||
      wins(history).some((e) => e.difficulty === 'easy' && e.timeMs < 5 * 60_000),
  },
  {
    id: 'daily-7',
    title: 'Daily regular',
    description: 'Complete 7 daily challenges.',
    icon: 'calendar',
    progress: ({ stats }) => [Math.min(stats.dailyCompleted.length, 7), 7],
    unlocked: ({ stats }) => stats.dailyCompleted.length >= 7,
  },
];

/** Returns the updated unlocked map and the ids that were newly unlocked. Never re-locks. */
export function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: UnlockedAchievements,
  now: number = Date.now(),
): { unlocked: UnlockedAchievements; newly: string[] } {
  const newly: string[] = [];
  const next: UnlockedAchievements = { ...unlocked };
  for (const a of ACHIEVEMENTS) {
    if (next[a.id]) continue;
    if (a.unlocked(ctx)) {
      next[a.id] = now;
      newly.push(a.id);
    }
  }
  return { unlocked: newly.length ? next : unlocked, newly };
}

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
