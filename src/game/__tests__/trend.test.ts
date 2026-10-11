import { difficultyTrend, type HistoryEntry } from '../history';

const entry = (i: number, timeMs: number, over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: `g${i}`,
  puzzle: '0'.repeat(81),
  solution: '1'.repeat(81),
  difficulty: 'easy',
  source: 'random',
  startedAt: i * 3_600_000,
  endedAt: i * 3_600_000 + timeMs,
  timeMs,
  result: 'completed',
  mistakes: 0,
  errors: 0,
  hintsUsed: 0,
  ...over,
});

describe('difficultyTrend', () => {
  it('needs ten solves for a delta', () => {
    const t = difficultyTrend([1, 2, 3].map((i) => entry(i, 300_000)), 'easy');
    expect(t.recent).toHaveLength(3);
    expect(t.deltaMs).toBeNull();
  });

  it('reports faster (negative) when the last five average below the previous five', () => {
    const times = [600, 600, 600, 600, 600, 300, 300, 300, 300, 300].map((s) => s * 1000);
    expect(difficultyTrend(times.map((t, i) => entry(i, t)), 'easy').deltaMs).toBe(-300_000);
  });

  it('ignores other difficulties, custom games and abandoned games, and keeps chronological order', () => {
    const h = [
      entry(1, 100_000),
      entry(2, 999_000, { difficulty: 'hard' }),
      entry(3, 999_000, { source: 'custom' }),
      entry(4, 999_000, { result: 'abandoned' }),
      entry(0, 50_000),
    ];
    expect(difficultyTrend(h, 'easy').recent).toEqual([50_000, 100_000]);
  });
});
