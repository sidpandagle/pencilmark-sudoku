import { parseGrid } from '../grid';
import { analyzePuzzle, techniqueName, TECHNIQUES } from '../index';
import { techniqueRank } from '../techniques/catalog';

const KNOWN = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';

describe('analyzePuzzle', () => {
  it('classifies a unique easy puzzle', () => {
    const a = analyzePuzzle(parseGrid(KNOWN));
    expect(a.status).toBe('unique');
    expect(a.difficulty).toBe('easy');
    expect(a.beyondTechniques).toBe(false);
    expect(a.score).toBeGreaterThan(0);
    expect(a.clueCount).toBe(30);
  });

  it('reports invalid, unsolvable and multiple-solution puzzles without labels', () => {
    const bad = parseGrid(KNOWN);
    bad[2] = 5;
    expect(analyzePuzzle(bad)).toMatchObject({ status: 'invalid', solution: null });
    const multi = analyzePuzzle(new Array(81).fill(0));
    expect(multi.status).toBe('multiple');
    expect(multi.difficulty).toBeUndefined();
    expect(analyzePuzzle([1, 2, 3] as number[]).status).toBe('invalid');
  });

  it('detects a puzzle with no solution', () => {
    // Row 1 needs a 9 in r1c9, but column 9 already holds a 9.
    const g = parseGrid('12345678.' + '........9' + '.'.repeat(63));
    expect(analyzePuzzle(g).status).toBe('unsolvable');
  });

  it('a famously hard puzzle is either rated expert or flagged beyond techniques, never mislabelled', () => {
    // "AI Escargot" (Arto Inkala).
    const a = analyzePuzzle(parseGrid('1....7.9..3..2...8..96..5....53..9...1..8...26....4...3......1..4......7..7...3..'));
    expect(a.status).toBe('unique');
    if (a.beyondTechniques) expect(a.difficulty).toBeUndefined();
    else expect(a.difficulty).toBe('expert');
  });
});

describe('catalog', () => {
  it('lists every technique once, in non-decreasing level and tier order', () => {
    const ids = TECHNIQUES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const tiers = ['easy', 'medium', 'hard', 'expert'];
    for (let i = 1; i < TECHNIQUES.length; i++) {
      expect(TECHNIQUES[i].level).toBeGreaterThanOrEqual(TECHNIQUES[i - 1].level);
      expect(tiers.indexOf(TECHNIQUES[i].tier)).toBeGreaterThanOrEqual(tiers.indexOf(TECHNIQUES[i - 1].tier));
      expect(techniqueRank(TECHNIQUES[i].id)).toBe(i);
    }
    for (const t of TECHNIQUES) {
      expect(techniqueName(t.id)).toBe(t.name);
      for (const p of t.prerequisites) expect(techniqueRank(p)).toBeLessThan(techniqueRank(t.id));
    }
  });
});
