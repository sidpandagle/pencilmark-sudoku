import type { FoundationContent, TechniqueContent } from '../types';
import { BASE } from './level1';

/** Level 2 — Beginner: systematic scanning, candidate management, intersections, pairs and triples. */

const PLACED_GRID = (() => {
  const g = BASE.split('');
  g[40] = '5'; // r5c5 = 5 (a naked single in BASE)
  return g.join('');
})();

export const LEVEL2_FOUNDATIONS: FoundationContent[] = [
  {
    id: 'systematic-scanning',
    title: 'Systematic scanning',
    level: 2,
    summary: 'A routine that never misses an easy move.',
    prerequisites: ['hidden-single'],
    cards: [
      {
        kind: 'concept',
        title: 'Scan in a fixed order',
        body: [
          'Random searching misses things. Instead, take the digits in order, 1 to 9. For each digit, cross-hatch every box, then check each row and column for a single place.',
          'When you place a digit, check the units around it straight away: one placement often unlocks the next.',
          'Only when a full pass finds nothing is it time to write candidates and look for patterns.',
        ],
      },
      {
        kind: 'place-digit',
        title: 'Scan a column',
        prompt: 'Look at column 8 and the digit 1. Every other empty cell of the column is blocked by a 1 in its row or box. Tap where 1 goes in column 8, then choose 1.',
        position: { grid: BASE },
        cell: 7,
        digit: 1,
        success: 'Right: the 1 in r2c4 blocks row 2, the 1 in r8c5 blocks row 8, and the 1 in r5c9 blocks row 5 and all of box 6. Only r1c8 remains.',
        retry: 'Not that cell. For each empty cell of column 8, check whether its row or box already has a 1.',
      },
    ],
  },
  {
    id: 'candidate-management',
    title: 'Candidate management',
    level: 2,
    summary: 'Keep your pencil marks correct as you solve.',
    prerequisites: ['candidates', 'naked-single'],
    cards: [
      {
        kind: 'concept',
        title: 'Notes go stale',
        body: [
          'Candidates are only useful while they are correct. Every time you place a digit, remove it from the notes of every cell that sees it: its row, its column and its box.',
          'Pencilmark can do this for you (Settings → auto-remove notes), but doing it by hand a few times builds the habit of checking the units around each placement.',
          'Fill candidates when scanning stops working, not before: early on there are too many to be useful.',
        ],
      },
      {
        kind: 'remove-candidates',
        title: 'Clean up after a placement',
        prompt: 'A 5 was just placed in r5c5 (green ring). Tap every 5 in the notes that must now be removed, then press Check.',
        position: { grid: PLACED_GRID, givens: BASE.split('').map((ch) => (ch !== '0' ? 'g' : '.')).join('') },
        answers: [
          { cell: 30, digit: 5 },
          { cell: 37, digit: 5 },
          { cell: 38, digit: 5 },
          { cell: 42, digit: 5 },
          { cell: 43, digit: 5 },
          { cell: 48, digit: 5 },
          { cell: 58, digit: 5 },
        ],
        focusCell: 40,
        success: 'All clean: the 5 left the notes in row 5, column 5 and box 5.',
      },
    ],
  },
];

export const LEVEL2_TECHNIQUES: TechniqueContent[] = [
  {
    technique: 'pointing',
    summary: 'A digit locked to one line inside a box leaves the rest of that line.',
    concept:
      'Look inside one box at a single digit. If all of its candidates sit in the same row (or the same column), the box’s copy of that digit must be in that line. So the digit cannot appear in that row or column outside the box: remove it there. Two candidates make a pointing pair, three a pointing triple.',
    why: 'The box needs the digit exactly once, and every place it could go lies in one row. Wherever it ends up, that row already has the digit inside this box, so no other cell of the row may hold it.',
    mistakes: [
      'Removing the digit from the rest of the box instead of the rest of the line. That is the reverse move (box/line reduction) and needs the reverse condition.',
      'Ignoring one stray candidate: every candidate for the digit in the box must lie in the line.',
      'Applying it to a digit that is already placed in the box.',
    ],
    naming: 'Also called locked candidates type 1. Covers pointing pairs and pointing triples.',
    limits: '',
    targetRule: 'Only cells in the same row or column as the pattern, outside its box, lose the digit.',
    patternCaption: 'Inside this box, every candidate for the digit lies in one line.',
  },
  {
    technique: 'box-line-reduction',
    summary: 'A digit locked to one box inside a line leaves the rest of that box.',
    concept:
      'This is pointing in reverse. Look along one row or column at a single digit. If all its candidates in that line fall inside one box, the line’s copy of the digit is in that box. So the box cannot have it anywhere else: remove the digit from the box cells outside the line.',
    why: 'The row needs the digit once, and every possibility lies inside one box. So the box’s copy of the digit is the row’s copy and sits in the row. The box cannot have a second one, so its cells off the row lose the candidate.',
    mistakes: [
      'Removing the digit from the rest of the line instead of the rest of the box.',
      'Checking the wrong unit: the condition is on the line. The box may have candidates elsewhere, and those are exactly what gets removed.',
      'Mixing up the two intersection moves: pointing starts from a box, claiming starts from a line.',
    ],
    naming: 'Also called claiming or locked candidates type 2.',
    limits: '',
    targetRule: 'Only cells in the same box as the pattern, outside its row or column, lose the digit.',
    patternCaption: 'Along this line, every candidate for the digit lies inside one box.',
  },
  {
    technique: 'naked-pair',
    summary: 'Two cells with the same two candidates claim both digits.',
    concept:
      'Find two cells in the same unit that have exactly the same two candidates, say {3,7}. Between them they must use the 3 and the 7, one each. So no other cell of that unit can be 3 or 7: remove those digits from the rest of the unit.',
    why: 'Each of the two cells must be 3 or 7, and they cannot both hold the same digit because they share a unit. So one is 3 and the other is 7. Any other cell of the unit holding 3 or 7 would repeat a digit.',
    mistakes: [
      'Using two cells that contain 3 and 7 among other candidates. Both cells must have only those two.',
      'Removing the digits from a unit the two cells do not both belong to.',
      'Missing the bonus: if the pair also shares a box (a "locked pair"), both the line and the box lose the digits.',
    ],
    naming: 'Part of the naked subset family (pairs, triples, quads). A naked pair inside one box and one line is a locked pair; Pencilmark then removes the digits from both units.',
    limits: '',
    targetRule: 'Only the pair’s two digits are removed, and only from other cells of a unit that both pair cells share.',
    patternCaption: 'These two cells hold the same two candidates and nothing else.',
  },
  {
    technique: 'hidden-pair',
    summary: 'Two digits that fit only two cells reserve those cells.',
    concept:
      'Look at one unit and two digits. If both digits can only go in the same two cells, those cells are reserved: one gets each digit. Any other candidates in those two cells can be removed. The pair is "hidden" because the cells still show extra candidates until you clean them up.',
    why: 'Digit a must go in one of the two cells, and so must digit b. Two digits for two cells fill both. A third digit in either cell would leave a or b without a place in the unit.',
    mistakes: [
      'Expecting the cells to have only two candidates: that would be a naked pair. In a hidden pair, the extra candidates are what you remove.',
      'Checking only one digit: both digits must be limited to the same two cells.',
      'Removing the pair digits elsewhere: by definition they are not elsewhere in the unit. The eliminations are the other digits inside the two cells.',
    ],
    naming: 'Part of the hidden subset family. Every hidden subset has a matching naked subset among the other empty cells of the unit; Pencilmark tries naked pairs before hidden pairs.',
    limits: '',
    targetRule: 'Only the other candidates inside the two pair cells are removed.',
    patternCaption: 'In this unit, these two digits fit only these two cells.',
  },
  {
    technique: 'naked-triple',
    summary: 'Three cells holding only three digits between them.',
    concept:
      'Three cells in one unit whose candidates, combined, are only three digits form a naked triple. Each cell does not need all three: {4,5}, {5,6} and {4,6} is a perfect triple. The three cells must take those three digits between them, so the digits leave every other cell of the unit.',
    why: 'Three cells need three different values, all drawn from the same three digits, so these cells use up all three digits. Another cell of the unit holding one of them would force a repeat.',
    mistakes: [
      'Thinking each cell must show all three candidates.',
      'Combining cells from different units: all three must share the unit you remove digits from.',
      'Including a cell with a fourth digit: the union of the three cells must be exactly three digits.',
    ],
    naming: 'Part of the naked subset family. Each cell may hold two or three of the digits.',
    limits: '',
    targetRule: 'Only the triple’s three digits are removed, and only from other cells of the unit the three cells share.',
    patternCaption: 'These three cells hold only three digits between them.',
  },
  {
    technique: 'hidden-triple',
    summary: 'Three digits that fit only three cells reserve those cells.',
    concept:
      'Three digits that, within one unit, can only go in the same three cells form a hidden triple. Those cells are reserved for the three digits, so every other candidate in the three cells can be removed. Each digit does not need to appear in all three cells.',
    why: 'Each of the three digits must find a home in the unit, and only these three cells can take any of them. They fill the three cells, leaving no room for any other digit there.',
    mistakes: [
      'Looking at cells instead of digits: the test is where each digit can go.',
      'Allowing one of the digits a fourth possible cell: then there is no triple.',
      'Removing the three digits elsewhere: the eliminations happen inside the triple.',
    ],
    naming: 'Part of the hidden subset family.',
    limits: '',
    targetRule: 'Only the other candidates inside the three cells are removed.',
    patternCaption: 'In this unit, these three digits fit only these three cells.',
  },
];
