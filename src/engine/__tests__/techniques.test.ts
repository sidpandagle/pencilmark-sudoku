/**
 * Hand-verified detector tests on synthetic candidate states. Each positive case builds exactly one pattern
 * (every other cell keeps all nine candidates) and asserts the exact eliminations / placements worked out by
 * hand in the comments. Negative cases break the pattern and expect null.
 */
import { countSolutions } from '../bruteSolver';
import { parseGrid } from '../grid';
import { createState } from '../solver/state';
import { findAlsXZ } from '../techniques/als';
import { findAIC, findXChain, findXYChain } from '../techniques/chains';
import { findSimpleColoring } from '../techniques/coloring';
import { findFinnedSwordfish, findFinnedXWing, findJellyfish, findSwordfish, findXWing } from '../techniques/fish';
import { findForcingChain } from '../techniques/forcing';
import { findBoxLineReduction, findPointing } from '../techniques/intersections';
import { findFullHouse, findHiddenSingle, findNakedSingle } from '../techniques/singles';
import { findSkyscraper, findTurbotFish, findTwoStringKite } from '../techniques/singleDigit';
import { findHiddenPair, findHiddenQuad, findHiddenTriple, findNakedPair, findNakedQuad, findNakedTriple } from '../techniques/subsets';
import { findSueDeCoq } from '../techniques/sueDeCoq';
import { findBugPlusOne, findUniqueRectangle1, findUniqueRectangle2, findUniqueRectangle4 } from '../techniques/uniqueness';
import { findWWing, findXYWing, findXYZWing } from '../techniques/wings';
import { box, cd, col, expectElims, expectPlacement, rc, restrict, row, setCands, sortCD, synth } from '../__testutils__/synth';

const KNOWN = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
const SOLVED = countSolutions(parseGrid(KNOWN), 1).solution!;

describe('singles', () => {
  it('full house: last empty cell of a unit', () => {
    const g = SOLVED.slice();
    g[rc(1, 1)] = 0; // row 1, column 1 and box 1 each have one empty cell
    const step = findFullHouse(createState(g));
    expectPlacement(step, cd(rc(1, 1), SOLVED[rc(1, 1)]));
    expect(step!.technique).toBe('full-house');
  });
  it('full house: null when every unit has two or more empty cells', () => {
    const g = SOLVED.slice();
    for (const c of [rc(1, 1), rc(1, 2), rc(2, 1), rc(2, 2)]) g[c] = 0;
    expect(findFullHouse(createState(g))).toBeNull();
  });
  it('hidden single: 5 only in r2c3 within box 1', () => {
    const s = synth();
    restrict(s, box(1), 5, [rc(2, 3)]);
    const step = findHiddenSingle(s);
    expectPlacement(step, cd(rc(2, 3), 5));
    expect(step!.units).toEqual([box(1)]);
    expect(step!.explanation).toBe('In box 1, 5 can only go in r2c3, so r2c3 = 5.');
  });
  it('hidden single: null with two positions', () => {
    const s = synth();
    restrict(s, box(1), 5, [rc(2, 3), rc(3, 3)]);
    expect(findHiddenSingle(s)).toBeNull();
  });
  it('naked single: one candidate left', () => {
    const s = synth();
    setCands(s, rc(5, 5), [7]);
    expectPlacement(findNakedSingle(s), cd(rc(5, 5), 7));
    setCands(s, rc(5, 5), [7, 8]);
    expect(findNakedSingle(s)).toBeNull();
  });
});

describe('intersections', () => {
  it('pointing: 4 in box 1 only in row 1 → removed from r1c4..r1c9', () => {
    const s = synth();
    restrict(s, box(1), 4, [rc(1, 1), rc(1, 2)]);
    expectElims(findPointing(s), [4, 5, 6, 7, 8, 9].map((c) => cd(rc(1, c), 4)));
  });
  it('pointing: null when the box positions are not aligned', () => {
    const s = synth();
    restrict(s, box(1), 4, [rc(1, 1), rc(2, 2)]);
    expect(findPointing(s)).toBeNull();
  });
  it('box/line reduction: 6 in row 1 only in box 1 → removed from rows 2-3 of box 1', () => {
    const s = synth();
    restrict(s, row(1), 6, [rc(1, 1), rc(1, 3)]);
    const expected = [rc(2, 1), rc(2, 2), rc(2, 3), rc(3, 1), rc(3, 2), rc(3, 3)].map((c) => cd(c, 6));
    expectElims(findBoxLineReduction(s), expected);
  });
  it('box/line reduction: null when the row positions span two boxes', () => {
    const s = synth();
    restrict(s, row(1), 6, [rc(1, 1), rc(1, 4)]);
    expect(findBoxLineReduction(s)).toBeNull();
  });
});

describe('subsets', () => {
  it('naked pair {1,2} in r1c1 and r1c5 → removed from the rest of row 1', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    setCands(s, rc(1, 5), [1, 2]);
    const others = [2, 3, 4, 6, 7, 8, 9].map((c) => rc(1, c));
    expectElims(findNakedPair(s), others.flatMap((c) => [cd(c, 1), cd(c, 2)]));
  });
  it('naked pair inside box and row (locked pair) removes from both units', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    setCands(s, rc(1, 2), [1, 2]);
    const step = findNakedPair(s);
    // 7 other cells of row 1 + 6 other cells of box 1 outside row 1 = 13 cells × 2 digits.
    expect(step!.eliminations).toHaveLength(26);
  });
  it('naked pair: null for {1,2} + {1,3}', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    setCands(s, rc(1, 5), [1, 3]);
    expect(findNakedPair(s)).toBeNull();
  });
  it('hidden pair: 3 and 4 only in r1c2 and r1c7', () => {
    const s = synth();
    restrict(s, row(1), 3, [rc(1, 2), rc(1, 7)]);
    restrict(s, row(1), 4, [rc(1, 2), rc(1, 7)]);
    const expected = [rc(1, 2), rc(1, 7)].flatMap((c) => [1, 2, 5, 6, 7, 8, 9].map((d) => cd(c, d)));
    expectElims(findHiddenPair(s), expected);
  });
  it('hidden pair: null when the two digits use three cells', () => {
    const s = synth();
    restrict(s, row(1), 3, [rc(1, 2), rc(1, 7)]);
    restrict(s, row(1), 4, [rc(1, 2), rc(1, 8)]);
    expect(findHiddenPair(s)).toBeNull();
  });
  it('naked triple {1,2},{2,3},{1,3} in row 5', () => {
    const s = synth();
    setCands(s, rc(5, 1), [1, 2]);
    setCands(s, rc(5, 4), [2, 3]);
    setCands(s, rc(5, 9), [1, 3]);
    const others = [2, 3, 5, 6, 7, 8].map((c) => rc(5, c));
    expectElims(findNakedTriple(s), others.flatMap((c) => [1, 2, 3].map((d) => cd(c, d))));
    setCands(s, rc(5, 9), [1, 4]);
    expect(findNakedTriple(s)).toBeNull();
  });
  it('hidden triple: 7, 8, 9 only in r1c3, r4c3, r8c3', () => {
    const s = synth();
    const cells = [rc(1, 3), rc(4, 3), rc(8, 3)];
    for (const d of [7, 8, 9]) restrict(s, col(3), d, cells);
    expectElims(findHiddenTriple(s), cells.flatMap((c) => [1, 2, 3, 4, 5, 6].map((d) => cd(c, d))));
  });
  it('hidden triple: null when one digit has a fourth cell', () => {
    const s = synth();
    const cells = [rc(1, 3), rc(4, 3), rc(8, 3)];
    for (const d of [7, 8]) restrict(s, col(3), d, cells);
    restrict(s, col(3), 9, [...cells, rc(5, 3)]);
    expect(findHiddenTriple(s)).toBeNull();
  });
  it('naked quad {1,2},{2,3},{3,4},{1,4} in row 9', () => {
    const s = synth();
    setCands(s, rc(9, 1), [1, 2]);
    setCands(s, rc(9, 3), [2, 3]);
    setCands(s, rc(9, 5), [3, 4]);
    setCands(s, rc(9, 7), [1, 4]);
    const others = [2, 4, 6, 8, 9].map((c) => rc(9, c));
    expectElims(findNakedQuad(s), others.flatMap((c) => [1, 2, 3, 4].map((d) => cd(c, d))));
    setCands(s, rc(9, 7), [1, 5]);
    expect(findNakedQuad(s)).toBeNull();
  });
  it('hidden quad: 1-4 only in four cells of column 9', () => {
    const s = synth();
    const cells = [rc(1, 9), rc(3, 9), rc(5, 9), rc(7, 9)];
    for (const d of [1, 2, 3, 4]) restrict(s, col(9), d, cells);
    expectElims(findHiddenQuad(s), cells.flatMap((c) => [5, 6, 7, 8, 9].map((d) => cd(c, d))));
    restrict(s, col(9), 4, [rc(1, 9), rc(3, 9), rc(5, 9), rc(7, 9), rc(9, 9)]);
    s.cands[rc(9, 9)] |= 1 << 3;
    expect(findHiddenQuad(s)).toBeNull();
  });
});

describe('fish', () => {
  it('x-wing on 5: rows 2 and 7, columns 3 and 8', () => {
    const s = synth();
    restrict(s, row(2), 5, [rc(2, 3), rc(2, 8)]);
    restrict(s, row(7), 5, [rc(7, 3), rc(7, 8)]);
    const expected = [1, 3, 4, 5, 6, 8, 9].flatMap((r) => [cd(rc(r, 3), 5), cd(rc(r, 8), 5)]);
    expectElims(findXWing(s), expected);
  });
  it('x-wing: null when the second row does not line up', () => {
    const s = synth();
    restrict(s, row(2), 5, [rc(2, 3), rc(2, 8)]);
    restrict(s, row(7), 5, [rc(7, 3), rc(7, 9)]);
    expect(findXWing(s)).toBeNull();
  });
  it('swordfish on 2: rows 1, 5, 9 in columns 1, 5, 9', () => {
    const s = synth();
    restrict(s, row(1), 2, [rc(1, 1), rc(1, 5)]);
    restrict(s, row(5), 2, [rc(5, 5), rc(5, 9)]);
    restrict(s, row(9), 2, [rc(9, 1), rc(9, 9)]);
    const expected = [2, 3, 4, 6, 7, 8].flatMap((r) => [1, 5, 9].map((c) => cd(rc(r, c), 2)));
    expectElims(findSwordfish(s), expected);
    restrict(s, row(9), 2, []);
    s.cands[rc(9, 1)] |= 2;
    s.cands[rc(9, 8)] |= 2;
    expect(findSwordfish(s)).toBeNull();
  });
  it('jellyfish on 3: rows 1, 3, 5, 7 in columns 1-4', () => {
    const s = synth();
    restrict(s, row(1), 3, [rc(1, 1), rc(1, 2)]);
    restrict(s, row(3), 3, [rc(3, 2), rc(3, 3)]);
    restrict(s, row(5), 3, [rc(5, 3), rc(5, 4)]);
    restrict(s, row(7), 3, [rc(7, 4), rc(7, 1)]);
    const expected = [2, 4, 6, 8, 9].flatMap((r) => [1, 2, 3, 4].map((c) => cd(rc(r, c), 3)));
    expectElims(findJellyfish(s), expected);
    // Row 7 now uses columns 4 and 5: the four rows cover five columns.
    restrict(s, row(7), 3, [rc(7, 4)]);
    s.cands[rc(7, 5)] |= 1 << 2;
    expect(findJellyfish(s)).toBeNull();
  });
  it('finned x-wing on 7: rows 1 and 5, columns 2 and 8, fin r5c9 → r4c8 and r6c8', () => {
    const s = synth();
    restrict(s, row(1), 7, [rc(1, 2), rc(1, 8)]);
    restrict(s, row(5), 7, [rc(5, 2), rc(5, 8), rc(5, 9)]);
    const step = findFinnedXWing(s);
    expectElims(step, [cd(rc(4, 8), 7), cd(rc(6, 8), 7)]);
    expect(step!.candidates).toContainEqual({ cell: rc(5, 9), digit: 7, role: 'fin' });
  });
  it('finned x-wing: null when the fin box holds no cover cell', () => {
    const s = synth();
    restrict(s, row(1), 7, [rc(1, 2), rc(1, 8)]);
    restrict(s, row(5), 7, [rc(5, 2), rc(5, 8), rc(5, 5)]);
    expect(findFinnedXWing(s)).toBeNull();
  });
  it('sashimi x-wing: base row with a single cover candidate', () => {
    // Row 1: 7 at c2, c8. Row 5: 7 at c2 and fins r5c7, r5c9 (box 6) — the c8 body cell is missing.
    const s = synth();
    restrict(s, row(1), 7, [rc(1, 2), rc(1, 8)]);
    restrict(s, row(5), 7, [rc(5, 2), rc(5, 7), rc(5, 9)]);
    const step = findFinnedXWing(s);
    // Either row 5's 7 is r5c2 (then r1c8 = 7) or a fin in box 6 is 7: r4c8 / r6c8 see both cases.
    expectElims(step, [cd(rc(4, 8), 7), cd(rc(6, 8), 7)]);
    expect(step!.explanation.startsWith('Sashimi')).toBe(true);
  });
  it('finned swordfish on 4: rows 1, 4, 7 / columns 1, 5, 9, fin r7c8', () => {
    const s = synth();
    restrict(s, row(1), 4, [rc(1, 1), rc(1, 5)]);
    restrict(s, row(4), 4, [rc(4, 5), rc(4, 9)]);
    restrict(s, row(7), 4, [rc(7, 1), rc(7, 9), rc(7, 8)]);
    expectElims(findFinnedSwordfish(s), [cd(rc(8, 9), 4), cd(rc(9, 9), 4)]);
    // Pattern present but nothing left to eliminate → null.
    s.cands[rc(8, 9)] &= ~(1 << 3);
    s.cands[rc(9, 9)] &= ~(1 << 3);
    expect(findFinnedSwordfish(s)).toBeNull();
  });
});

describe('single-digit patterns', () => {
  it('skyscraper on 6: rows 1 and 5 share column 1', () => {
    const s = synth();
    restrict(s, row(1), 6, [rc(1, 1), rc(1, 4)]);
    restrict(s, row(5), 6, [rc(5, 1), rc(5, 6)]);
    expectElims(findSkyscraper(s), [cd(rc(2, 6), 6), cd(rc(3, 6), 6), cd(rc(4, 4), 6), cd(rc(6, 4), 6)]);
  });
  it('skyscraper: null when both roofs line up (that is an X-Wing)', () => {
    const s = synth();
    restrict(s, row(1), 6, [rc(1, 1), rc(1, 4)]);
    restrict(s, row(5), 6, [rc(5, 1), rc(5, 4)]);
    expect(findSkyscraper(s)).toBeNull();
  });
  it('two-string kite on 8: row 1 and column 1 meet in box 1', () => {
    const s = synth();
    restrict(s, row(1), 8, [rc(1, 2), rc(1, 7)]);
    restrict(s, col(1), 8, [rc(3, 1), rc(8, 1)]);
    expectElims(findTwoStringKite(s), [cd(rc(8, 7), 8)]);
  });
  it('two-string kite: null when the near ends are in different boxes', () => {
    const s = synth();
    restrict(s, row(1), 8, [rc(1, 2), rc(1, 7)]);
    restrict(s, col(1), 8, [rc(4, 1), rc(8, 1)]);
    expect(findTwoStringKite(s)).toBeNull();
  });
  it('turbot fish on 9: box 1 conjugate pair + column 6 conjugate pair', () => {
    const s = synth();
    restrict(s, box(1), 9, [rc(1, 1), rc(3, 3)]);
    restrict(s, col(6), 9, [rc(3, 6), rc(7, 6)]);
    // 9r1c1 = 9r3c3 – 9r3c6 = 9r7c6: r7c1 sees both ends (r1c6 already lost 9 to the column restriction).
    expectElims(findTurbotFish(s), [cd(rc(7, 1), 9)]);
    s.cands[rc(7, 1)] &= ~(1 << 8);
    expect(findTurbotFish(s)).toBeNull();
  });
});

describe('wings', () => {
  it('xy-wing: pivot r5c5 {1,2}, pincers r5c1 {1,3} and r2c5 {2,3} → r2c1 ≠ 3', () => {
    const s = synth();
    setCands(s, rc(5, 5), [1, 2]);
    setCands(s, rc(5, 1), [1, 3]);
    setCands(s, rc(2, 5), [2, 3]);
    expectElims(findXYWing(s), [cd(rc(2, 1), 3)]);
    setCands(s, rc(2, 5), [2, 4]);
    expect(findXYWing(s)).toBeNull();
  });
  it('xyz-wing: pivot r5c5 {1,2,3}, pincers r5c4 {1,3}, r2c5 {2,3} → r4c5, r6c5 ≠ 3', () => {
    const s = synth();
    setCands(s, rc(5, 5), [1, 2, 3]);
    setCands(s, rc(5, 4), [1, 3]);
    setCands(s, rc(2, 5), [2, 3]);
    expectElims(findXYZWing(s), [cd(rc(4, 5), 3), cd(rc(6, 5), 3)]);
    setCands(s, rc(2, 5), [2, 4]);
    expect(findXYZWing(s)).toBeNull();
  });
  it('w-wing: r2c1 and r8c6 {4,7} linked by the 4s of row 5 → r2c6, r8c1 ≠ 7', () => {
    const s = synth();
    setCands(s, rc(2, 1), [4, 7]);
    setCands(s, rc(8, 6), [4, 7]);
    restrict(s, row(5), 4, [rc(5, 1), rc(5, 6)]);
    expectElims(findWWing(s), [cd(rc(2, 6), 7), cd(rc(8, 1), 7)]);
    setCands(s, rc(8, 6), [4, 8]);
    expect(findWWing(s)).toBeNull();
  });
});

describe('simple colouring', () => {
  it('colour trap on 1: chain r1c1 = r1c7 = r5c7 = r5c3', () => {
    const s = synth();
    restrict(s, row(1), 1, [rc(1, 1), rc(1, 7)]);
    restrict(s, col(7), 1, [rc(1, 7), rc(5, 7)]);
    restrict(s, row(5), 1, [rc(5, 7), rc(5, 3)]);
    expectElims(findSimpleColoring(s), [rc(2, 3), rc(3, 3), rc(4, 1), rc(6, 1)].map((c) => cd(c, 1)));
  });
  it('colour wrap on 1: two same-coloured cells share box 1', () => {
    const s = synth();
    restrict(s, row(1), 1, [rc(1, 1), rc(1, 4)]);
    restrict(s, col(4), 1, [rc(1, 4), rc(4, 4)]);
    restrict(s, row(4), 1, [rc(4, 4), rc(4, 2)]);
    restrict(s, col(2), 1, [rc(4, 2), rc(2, 2)]);
    // Colours alternate r1c1, r1c4, r4c4, r4c2, r2c2: r1c1 and r2c2 share a colour and see each other.
    expectElims(findSimpleColoring(s), [rc(1, 1), rc(4, 4), rc(2, 2)].map((c) => cd(c, 1)));
  });
  it('null for a short cluster with no trap', () => {
    const s = synth();
    restrict(s, row(1), 1, [rc(1, 1), rc(1, 7)]);
    restrict(s, col(7), 1, [rc(1, 7), rc(5, 7)]);
    expect(findSimpleColoring(s)).toBeNull();
  });
});

describe('uniqueness', () => {
  const ur = (unique: boolean) => {
    const s = synth(unique);
    setCands(s, rc(1, 1), [2, 5]);
    setCands(s, rc(1, 4), [2, 5]);
    setCands(s, rc(3, 1), [2, 5]);
    setCands(s, rc(3, 4), [2, 5, 7, 9]);
    return s;
  };
  it('unique rectangle type 1: r3c4 loses 2 and 5', () => {
    expectElims(findUniqueRectangle1(ur(true)), [cd(rc(3, 4), 2), cd(rc(3, 4), 5)]);
  });
  it('uniqueness techniques are disabled for non-unique states', () => {
    expect(findUniqueRectangle1(ur(false))).toBeNull();
    expect(findUniqueRectangle2(ur(false))).toBeNull();
    expect(findUniqueRectangle4(ur(false))).toBeNull();
    expect(findBugPlusOne(ur(false))).toBeNull();
  });
  it('unique rectangle type 1: null for a rectangle spanning four boxes', () => {
    const s = synth(true);
    setCands(s, rc(1, 1), [2, 5]);
    setCands(s, rc(1, 4), [2, 5]);
    setCands(s, rc(5, 1), [2, 5]);
    setCands(s, rc(5, 4), [2, 5, 7]);
    expect(findUniqueRectangle1(s)).toBeNull();
  });
  it('unique rectangle type 2: roof {2,5,8} → 8 leaves the rest of row 3', () => {
    const s = synth(true);
    setCands(s, rc(1, 1), [2, 5]);
    setCands(s, rc(1, 4), [2, 5]);
    setCands(s, rc(3, 1), [2, 5, 8]);
    setCands(s, rc(3, 4), [2, 5, 8]);
    expectElims(findUniqueRectangle2(s), [2, 3, 5, 6, 7, 8, 9].map((c) => cd(rc(3, c), 8)));
    setCands(s, rc(3, 4), [2, 5, 9]);
    expect(findUniqueRectangle2(s)).toBeNull();
  });
  it('unique rectangle type 4: 2 locked to the roof in row 3 → roof loses 5', () => {
    const s = synth(true);
    setCands(s, rc(1, 1), [2, 5]);
    setCands(s, rc(1, 4), [2, 5]);
    setCands(s, rc(3, 1), [2, 5, 6, 7]);
    setCands(s, rc(3, 4), [2, 5, 8]);
    restrict(s, row(3), 2, [rc(3, 1), rc(3, 4)]);
    expectElims(findUniqueRectangle4(s), [cd(rc(3, 1), 5), cd(rc(3, 4), 5)]);
    s.cands[rc(3, 7)] |= 2;
    expect(findUniqueRectangle4(s)).toBeNull();
  });
  it('bug+1: null when several cells have three or more candidates', () => {
    expect(findBugPlusOne(synth(true))).toBeNull();
  });
});

describe('chains', () => {
  it('x-chain on 3 (five links): r2c2, r3c2, r7c1, r9c1 lose 3', () => {
    const s = synth();
    restrict(s, row(1), 3, [rc(1, 1), rc(1, 4)]);
    restrict(s, row(5), 3, [rc(5, 4), rc(5, 8)]);
    restrict(s, row(8), 3, [rc(8, 8), rc(8, 2)]);
    const step = findXChain(s);
    expectElims(step, [rc(2, 2), rc(3, 2), rc(7, 1), rc(9, 1)].map((c) => cd(c, 3)));
    expect(step!.links).toHaveLength(5);
    expect(step!.links!.map((l) => l.type)).toEqual(['strong', 'weak', 'strong', 'weak', 'strong']);
  });
  it('xy-chain: {1,2}-{2,3}-{3,4}-{4,1} → r1c9, r6c1 lose 1', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    setCands(s, rc(1, 5), [2, 3]);
    setCands(s, rc(6, 5), [3, 4]);
    setCands(s, rc(6, 9), [1, 4]);
    expectElims(findXYChain(s), [cd(rc(1, 9), 1), cd(rc(6, 1), 1)]);
    setCands(s, rc(6, 9), [1, 5]);
    expect(findXYChain(s)).toBeNull();
  });
  it('aic: bivalue cell + conjugate pairs on two digits', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    restrict(s, col(6), 2, [rc(1, 6), rc(7, 6)]);
    restrict(s, row(7), 1, [rc(7, 6), rc(7, 1)]);
    const step = findAIC(s);
    // 1r1c1 = 2r1c1 – 2r1c6 = 2r7c6 – 1r7c6 = 1r7c1 → column 1 loses 1, or the reverse reading
    // 2r1c6 = 2r7c6 – 1r7c6 = 1r7c1 – 1r1c1 = 2r1c1 → row 1 loses 2. Both are valid; either may be reported.
    const colOne = [2, 3, 4, 5, 6, 8, 9].map((r) => cd(rc(r, 1), 1));
    const rowOne = [2, 3, 4, 5, 7, 8, 9].map((c) => cd(rc(1, c), 2));
    expect([JSON.stringify(sortCD(colOne)), JSON.stringify(sortCD(rowOne))]).toContain(JSON.stringify(sortCD(step!.eliminations)));
    expect(step!.links).toHaveLength(5);
  });
  it('chains: null on an open grid', () => {
    const s = synth();
    expect(findXChain(s)).toBeNull();
    expect(findXYChain(s)).toBeNull();
    expect(findAIC(s)).toBeNull();
  });
});

describe('ALS and Sue de Coq', () => {
  it('als-xz: {r1c1,r1c2} {1,2,3} and r5c1 {1,3}, X = 1, Z = 3', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    setCands(s, rc(1, 2), [2, 3]);
    setCands(s, rc(5, 1), [1, 3]);
    expectElims(findAlsXZ(s), [rc(2, 1), rc(3, 1), rc(4, 2), rc(5, 2), rc(6, 2)].map((c) => cd(c, 3)));
    setCands(s, rc(5, 1), [1, 4]);
    expect(findAlsXZ(s)).toBeNull();
  });
  it('sue de coq: r1c1 {1,2,3} r1c2 {1,2,4} + r1c5 {1,2} + r2c2 {3,4}', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2, 3]);
    setCands(s, rc(1, 2), [1, 2, 4]);
    setCands(s, rc(1, 5), [1, 2]);
    setCands(s, rc(2, 2), [3, 4]);
    const expected = [
      ...[4, 6, 7, 8, 9].flatMap((c) => [cd(rc(1, c), 1), cd(rc(1, c), 2)]),
      ...[rc(2, 1), rc(2, 3), rc(3, 1), rc(3, 2), rc(3, 3)].flatMap((c) => [cd(c, 3), cd(c, 4)]),
      ...[1, 2, 3, 4].map((d) => cd(rc(1, 3), d)),
    ];
    expectElims(findSueDeCoq(s), expected);
    setCands(s, rc(2, 2), [3, 5]);
    expect(findSueDeCoq(s)).toBeNull();
  });
});

describe('forcing chains', () => {
  it('every conclusion follows from the small locked set in box 1', () => {
    const s = synth();
    setCands(s, rc(1, 1), [1, 2]);
    setCands(s, rc(1, 2), [1, 3]);
    setCands(s, rc(2, 1), [2, 3]);
    const step = findForcingChain(s);
    expect(step).not.toBeNull();
    // Hand-derived valid conclusions: 1, 2, 3 leave the other cells of box 1; 1 leaves the rest of row 1;
    // 2 leaves the rest of column 1.
    const box1 = [rc(1, 3), rc(2, 2), rc(2, 3), rc(3, 1), rc(3, 2), rc(3, 3)];
    const valid = new Set<string>([
      ...box1.flatMap((c) => [1, 2, 3].map((d) => `${c}:${d}`)),
      ...[3, 4, 5, 6, 7, 8, 9].map((c) => `${rc(1, c)}:1`),
      ...[3, 4, 5, 6, 7, 8, 9].map((r) => `${rc(r, 1)}:2`),
    ]);
    expect(step!.placements).toEqual([]);
    for (const e of step!.eliminations) expect(valid.has(`${e.cell}:${e.digit}`)).toBe(true);
  });
  it('null on an open grid', () => {
    expect(findForcingChain(synth())).toBeNull();
  });
});
