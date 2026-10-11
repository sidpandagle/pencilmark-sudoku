/** Review cycle 2 regression tests: hostile input and hint ordering via the public API. */
import { analyzePuzzle, bit, getHint, generatePuzzle, parseGrid } from '..';

describe('analyzePuzzle rejects malformed grids without throwing', () => {
  const junk: unknown[] = [
    [],
    new Array(80).fill(0),
    new Array(82).fill(0),
    new Array(81).fill(NaN),
    new Array(81).fill(10),
    new Array(81).fill(-1),
    new Array(81).fill('5'),
    new Array(81).fill(1.5),
    null,
    undefined,
    'hello',
  ];
  it.each(junk.map((j, i) => [i, j]))('junk #%i', (_i, j) => {
    expect(analyzePuzzle(j as number[]).status).toBe('invalid');
  });
});

describe('parseGrid', () => {
  it.each([
    ['full-width digits', '１'.repeat(81)],
    ['80 cells', '5'.repeat(80)],
    ['82 cells', '5'.repeat(82)],
    ['letters', 'x'.repeat(81)],
    ['oversized', '1'.repeat(5000)],
  ])('rejects %s', (_name, text) => {
    expect(() => parseGrid(text)).toThrow();
  });

  it('accepts separators and newlines', () => {
    expect(
      parseGrid('53..7....|6..195...\n.98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'),
    ).toHaveLength(81);
  });
});

describe('analyzePuzzle status', () => {
  it('flags an empty grid as having multiple solutions', () => {
    expect(analyzePuzzle(new Array(81).fill(0)).status).toBe('multiple');
  });

  it('flags a contradiction with no duplicate digits as unsolvable', () => {
    const g = new Array(81).fill(0);
    for (let c = 0; c < 8; c++) g[c] = c + 1; // r1 needs 9 in c9
    g[9 * 4 + 8] = 9; // but r5c9 = 9
    expect(analyzePuzzle(g).status).toBe('unsolvable');
  });

  it('accepts a known 17-clue puzzle as unique and rated', () => {
    const a = analyzePuzzle(
      parseGrid('000000010400000000020000000000050407008000300001090000300400200050100000000806000'),
    );
    expect(a.status).toBe('unique');
    expect(a.beyondTechniques).toBe(false);
  });
});

describe('getHint ordering', () => {
  const g = generatePuzzle('easy', 99);
  const target = g.puzzle.findIndex((v) => v === 0);

  it('reports wrong entries before any step', () => {
    const grid = g.puzzle.slice();
    grid[target] = (g.solution[target] % 9) + 1;
    const h = getHint(grid, g.solution);
    expect(h.kind).toBe('mistake');
    expect(h.kind === 'mistake' && h.cells).toContain(target);
  });

  it('reports notes that exclude the solution digit', () => {
    const notes = new Array(81).fill(0);
    notes[target] = 0x1ff & ~bit(g.solution[target]);
    const h = getHint(g.puzzle, g.solution, notes);
    expect(h.kind).toBe('bad-notes');
  });

  it('gives a progressing, solution-consistent step from a clean position', () => {
    const h = getHint(g.puzzle, g.solution);
    expect(h.kind).toBe('step');
    if (h.kind !== 'step') return;
    for (const p of h.step.placements) expect(g.solution[p.cell]).toBe(p.digit);
    for (const e of h.step.eliminations) expect(g.solution[e.cell]).not.toBe(e.digit);
    expect(h.nudge).not.toMatch(/undefined|NaN/);
  });
});
