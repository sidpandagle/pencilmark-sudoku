import { countSolutions } from '../bruteSolver';
import { cellName, computeCandidates, parseGrid } from '../grid';
import { getHint, nudgeFor } from '../hints';
import { techniqueName } from '../index';
import { TECHNIQUES } from '../techniques/catalog';
import { getTechniqueExamples } from '../fixtures/techniqueExamples';

const KNOWN = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
const puzzle = parseGrid(KNOWN);
const solution = countSolutions(puzzle, 1).solution!;

describe('getHint', () => {
  it('reports wrong entries first', () => {
    const g = puzzle.slice();
    const empty = g.indexOf(0);
    g[empty] = (solution[empty] % 9) + 1;
    const h = getHint(g, solution);
    expect(h.kind).toBe('mistake');
    if (h.kind === 'mistake') expect(h.cells).toEqual([empty]);
  });

  it('reports notes that exclude the solution digit', () => {
    const notes = new Array(81).fill(0);
    const empty = puzzle.indexOf(0);
    notes[empty] = 0x1ff & ~(1 << (solution[empty] - 1));
    const h = getHint(puzzle, solution, notes);
    expect(h.kind).toBe('bad-notes');
    if (h.kind === 'bad-notes') expect(h.cells).toEqual([empty]);
  });

  it('returns a valid logical step with a name and a non-revealing nudge', () => {
    const h = getHint(puzzle, solution);
    expect(h.kind).toBe('step');
    if (h.kind !== 'step') return;
    for (const p of h.step.placements) expect(solution[p.cell]).toBe(p.digit);
    for (const e of h.step.eliminations) expect(solution[e.cell]).not.toBe(e.digit);
    expect(h.techniqueName).toBe(techniqueName(h.step.technique));
    for (const p of h.step.placements) expect(h.nudge).not.toContain(cellName(p.cell));
  });

  it('uses notes ∩ computed candidates as the candidate state', () => {
    // Notes leaving exactly the solution digit in one cell turn that cell into a naked single.
    const notes = new Array(81).fill(0);
    const cands = computeCandidates(puzzle);
    // Choose an empty cell that is not already a single from the digits alone.
    const target = puzzle.findIndex((v, i) => !v && (cands[i] & (cands[i] - 1)) !== 0);
    notes[target] = 1 << (solution[target] - 1);
    const h = getHint(puzzle, solution, notes);
    expect(h.kind).toBe('step');
    if (h.kind === 'step') {
      for (const p of h.step.placements) expect(solution[p.cell]).toBe(p.digit);
      for (const e of h.step.eliminations) expect(solution[e.cell]).not.toBe(e.digit);
    }
  });

  it('says the puzzle is complete when it is', () => {
    expect(getHint(solution, solution).kind).toBe('none');
  });
});

describe('nudges and names', () => {
  it('every technique has a display name and a nudge that never names the target cells', () => {
    for (const t of TECHNIQUES) {
      expect(techniqueName(t.id)).toBe(t.name);
      for (const ex of getTechniqueExamples(t.id)) {
        const n = nudgeFor(ex.step);
        expect(n.length).toBeGreaterThan(10);
        for (const p of ex.step.placements) expect(n).not.toContain(cellName(p.cell));
        for (const e of ex.step.eliminations) expect(n).not.toContain(cellName(e.cell));
      }
    }
  });
});
