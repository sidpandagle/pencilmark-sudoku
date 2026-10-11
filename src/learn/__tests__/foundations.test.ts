import { bit, BOXES, COLS, computeCandidates, countSolutions, findConflicts, PEERS, ROWS } from '../../engine';
import { staleCandidates } from '../components/FoundationCardView';
import { BASE, BASE_SOLUTION } from '../content/level1';
import { LESSONS } from '../curriculum';
import { handPosition, parseDigits } from '../positions';
import type { FoundationCard } from '../types';

const cards = LESSONS.filter((l) => l.kind === 'foundation').flatMap((l) => l.foundation!.cards.map((c) => ({ lesson: l.id, card: c })));
const find = (lesson: string, kind: FoundationCard['kind']) => cards.find((x) => x.lesson === lesson && x.card.kind === kind)!.card;

describe('foundation positions (hand-built, verified)', () => {
  it('BASE is a valid puzzle with the stated unique solution', () => {
    const r = countSolutions(parseDigits(BASE), 2);
    expect(r.count).toBe(1);
    expect(r.solution!.join('')).toBe(BASE_SOLUTION);
  });

  it('every hand position has 81 cells and givens that agree with BASE', () => {
    for (const { card } of cards) {
      if (!('position' in card) || !card.position) continue;
      expect(card.position.grid).toHaveLength(81);
      const { grid, givens } = handPosition(card.position);
      givens.forEach((g, i) => g && expect(grid[i]).toBe(Number(BASE[i])));
    }
  });

  it('"The rules": the conflict example has exactly one conflict, and the answer is the entry in it', () => {
    const c = find('rules', 'tap-cell') as Extract<FoundationCard, { kind: 'tap-cell' }>;
    const { grid, givens } = handPosition(c.position);
    const conflicts = [...findConflicts(grid)];
    expect(conflicts).toHaveLength(2); // one duplicated pair
    const entries = conflicts.filter((i) => !givens[i]);
    expect(entries).toEqual(c.answers);
  });

  it('"Givens vs entries": answers are exactly the non-given filled cells', () => {
    const c = find('givens', 'tap-cell') as Extract<FoundationCard, { kind: 'tap-cell' }>;
    const { grid, givens } = handPosition(c.position);
    const entries = grid.map((v, i) => (v && !givens[i] ? i : -1)).filter((i) => i >= 0);
    expect([...c.answers].sort((a, b) => a - b)).toEqual(entries);
    expect(findConflicts(grid).size).toBe(0);
  });

  it('"Scanning": the cross-hatching answer is the only place for the digit in its box, and matches the solution', () => {
    const c = find('scanning', 'place-digit') as Extract<FoundationCard, { kind: 'place-digit' }>;
    const { grid } = handPosition(c.position);
    const cands = computeCandidates(grid);
    const box = BOXES.find((b) => b.includes(c.cell))!;
    expect(box.filter((x) => cands[x] & bit(c.digit))).toEqual([c.cell]);
    expect(Number(BASE_SOLUTION[c.cell])).toBe(c.digit);
  });

  it('"Systematic scanning": the column answer is the only place for the digit in its column', () => {
    const c = find('systematic-scanning', 'place-digit') as Extract<FoundationCard, { kind: 'place-digit' }>;
    const { grid } = handPosition(c.position);
    const cands = computeCandidates(grid);
    const col = COLS[c.cell % 9];
    expect(col.filter((x) => cands[x] & bit(c.digit))).toEqual([c.cell]);
    expect(Number(BASE_SOLUTION[c.cell])).toBe(c.digit);
  });

  it('"Pencil marks": the candidate exercise answer equals computeCandidates', () => {
    const c = find('candidates', 'fill-candidates') as Extract<FoundationCard, { kind: 'fill-candidates' }>;
    const { grid } = handPosition(c.position);
    expect(grid[c.cell]).toBe(0);
    expect(computeCandidates(grid)[c.cell]).toBe(bit(1) | bit(2) | bit(4));
    expect(c.success).toMatch(/1, 2 and 4/);
  });

  it('"Contradictions": exactly one empty cell has no candidates, and it is the answer', () => {
    const c = find('contradictions', 'tap-cell') as Extract<FoundationCard, { kind: 'tap-cell' }>;
    const { grid } = handPosition(c.position);
    const cands = computeCandidates(grid);
    const dead = grid.map((v, i) => (!v && cands[i] === 0 ? i : -1)).filter((i) => i >= 0);
    expect(dead).toEqual(c.answers);
    expect(findConflicts(grid).size).toBe(0); // the contradiction is a dead cell, not a duplicate
  });

  it('"Candidate management": the answers are exactly the peers that held the placed digit', () => {
    const c = find('candidate-management', 'remove-candidates') as Extract<FoundationCard, { kind: 'remove-candidates' }>;
    const { grid } = handPosition(c.position);
    const focus = c.focusCell!;
    const d = grid[focus];
    expect(Number(BASE_SOLUTION[focus])).toBe(d);
    const shown = staleCandidates(grid, focus);
    const expected = PEERS[focus].filter((p) => !grid[p] && shown[p] & bit(d)).sort((a, b) => a - b);
    expect(c.answers.map((a) => a.cell).sort((a, b) => a - b)).toEqual(expected);
    expect(c.answers.every((a) => a.digit === d)).toBe(true);
  });

  it('rows/columns/boxes helpers line up with the unit ids used in diagrams', () => {
    expect(ROWS[0]).toContain(0);
    expect(COLS[0]).toContain(0);
    expect(BOXES[0]).toContain(0);
  });
});
