import type { FoundationContent, TechniqueContent } from '../types';

/**
 * Level 1 — Absolute beginner: the rules, givens, scanning, candidates, singles, contradictions, logic vs guessing.
 *
 * Hand-built positions below are all derived from one classic puzzle (BASE) so learners meet a familiar board.
 * Every position and answer is verified in src/learn/__tests__/foundations.test.ts.
 */

/** Classic puzzle with a unique solution (also used in the app's own tests). */
export const BASE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
export const BASE_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

const withEntries = (entries: Record<number, number>) => {
  const g = BASE.split('');
  for (const [cell, d] of Object.entries(entries)) g[Number(cell)] = String(d);
  return g.join('');
};
const givensOf = (grid: string) => grid.split('').map((ch, i) => (BASE[i] !== '0' && ch !== '0' ? 'g' : '.')).join('');

const CONFLICT_GRID = withEntries({ 2: 8 }); // r1c3 = 8 repeats the 8 at r3c3 (same column and box)
const ENTRIES_GRID = withEntries({ 2: 4, 40: 5, 47: 3 });
const CONTRADICTION_GRID = withEntries({ 37: 5 }); // r5c2 = 5 (wrong) leaves r5c5 with no candidates

export const LEVEL1_FOUNDATIONS: FoundationContent[] = [
  {
    id: 'rules',
    title: 'The rules',
    level: 1,
    summary: 'Rows, columns and boxes: each digit once.',
    prerequisites: [],
    cards: [
      {
        kind: 'concept',
        title: 'One rule, three places',
        body: [
          'A Sudoku grid has 81 cells in 9 rows, 9 columns and 9 boxes (the 3×3 blocks with thick borders).',
          'Fill every empty cell with a digit from 1 to 9 so that each row, each column and each box contains every digit exactly once.',
          'Rows, columns and boxes are all called units. Every cell belongs to exactly three units: its row, its column and its box.',
        ],
        position: { grid: BASE },
        overlayUnits: [0, 9, 18],
        diagramLabel: 'The puzzle board with row 1, column 1 and box 1 outlined: the three units of the top-left cell.',
      },
      {
        kind: 'concept',
        title: 'Cells that see each other',
        body: [
          'Two cells that share a row, column or box "see" each other. Cells that see each other can never hold the same digit.',
          'Each cell sees 20 others: 8 in its row, 8 in its column and 4 more in its box. Almost every technique in this app is built on that one fact.',
        ],
      },
      {
        kind: 'tap-cell',
        title: 'Spot the broken rule',
        prompt: 'One of your entries (blue) repeats a digit in one of its units. Tap the cell that breaks the rule.',
        position: { grid: CONFLICT_GRID, givens: givensOf(BASE) },
        answers: [2],
        success: 'Right: the 8 in r1c3 repeats the 8 in r3c3, which is in the same column and the same box.',
        retry: 'Not that one. Look for a digit that appears twice in one row, column or box. The culprit is one of your blue entries.',
      },
    ],
  },
  {
    id: 'givens',
    title: 'Givens vs your entries',
    level: 1,
    summary: 'What the puzzle gives you, and what you add.',
    prerequisites: ['rules'],
    cards: [
      {
        kind: 'concept',
        title: 'Givens are fixed',
        body: [
          'The digits printed at the start are the givens (dark, heavier digits). They are part of the puzzle and can never change.',
          'Digits you add are your entries, shown in blue. Entries can be wrong: you can erase or change them at any time.',
          'A well-made puzzle has exactly one solution, and the givens alone are enough to reach it by logic.',
        ],
      },
      {
        kind: 'tap-cell',
        title: 'Which cells can you change?',
        prompt: 'Three cells hold your entries. Tap any one of them.',
        position: { grid: ENTRIES_GRID, givens: givensOf(BASE) },
        answers: [2, 40, 47],
        success: 'Yes. Entries are blue and lighter; you can always erase them. Givens stay put.',
        retry: 'That digit is a given: it came with the puzzle and cannot change. Look for a blue digit.',
      },
      {
        kind: 'choice',
        title: 'Quick check',
        prompt: 'An entry of yours turns out to clash with a given. Which one is wrong?',
        options: [
          { label: 'My entry', correct: true, feedback: 'Correct. Givens are always right in a valid puzzle, so the entry must go.' },
          { label: 'The given', correct: false, feedback: 'Givens are part of the puzzle and are always correct. Your entry is the one to fix.' },
          { label: 'Could be either', correct: false, feedback: 'In a valid puzzle the givens are always correct, so it is the entry.' },
        ],
      },
    ],
  },
  {
    id: 'scanning',
    title: 'Scanning and cross-hatching',
    level: 1,
    summary: 'Use the digits you see to find where a digit must go.',
    prerequisites: ['givens'],
    cards: [
      {
        kind: 'concept',
        title: 'Cross-hatching',
        body: [
          'Pick a digit, say 8, and a box that does not have it yet. Every 8 already on the board blocks its whole row and column.',
          'Imagine drawing lines through those rows and columns. If only one empty cell in the box is left uncrossed, the 8 must go there.',
          'This is called cross-hatching. It is the fastest way to start any puzzle.',
        ],
        position: { grid: BASE },
        overlayUnits: [19],
        overlayCells: [5],
        diagramLabel: 'The puzzle with box 2 outlined and cell r1c6 highlighted: the only place for 8 in box 2.',
      },
      {
        kind: 'place-digit',
        title: 'Your turn',
        prompt: 'Box 2 (top middle) needs an 8. The 8s in column 4, column 5 and row 3 block the other cells. Tap the cell where 8 must go, then choose 8.',
        position: { grid: BASE },
        cell: 5,
        digit: 8,
        success: 'Exactly. The 8s in r5c4 and r9c5 block columns 4 and 5, and the 8 in r3c3 blocks row 3. Only r1c6 is left.',
        retry: 'Not quite. Follow each 8 on the board along its row and column. Which empty cell of box 2 is not blocked?',
      },
    ],
  },
  {
    id: 'candidates',
    title: 'Pencil marks (candidates)',
    level: 1,
    summary: 'Write down every digit a cell could still hold.',
    prerequisites: ['scanning'],
    cards: [
      {
        kind: 'concept',
        title: 'What candidates are',
        body: [
          'The candidates of an empty cell are the digits it could still hold: those not already in its row, column or box.',
          'Writing them as small pencil marks turns a hard search into a visible one. Most techniques from level 2 on work directly on candidates.',
          'Candidates are a record of what you have ruled out. Keep them honest: never remove one without a reason.',
        ],
      },
      {
        kind: 'fill-candidates',
        title: 'Fill in r1c3',
        prompt: 'Select every digit that r1c3 could still hold. Check its row, its column and its box.',
        position: { grid: BASE },
        cell: 2,
        success: 'Right: row 1 has 3, 5 and 7, column 3 has 8, and box 1 adds 6 and 9. That leaves 1, 2 and 4.',
      },
    ],
  },
  {
    id: 'contradictions',
    title: 'Contradictions',
    level: 1,
    summary: 'How a wrong digit shows itself.',
    prerequisites: ['candidates'],
    cards: [
      {
        kind: 'concept',
        title: 'When something is impossible',
        body: [
          'A contradiction is a position that breaks the rules or cannot be finished: two equal digits in a unit, a cell with no candidates left, or a digit that has no place left in some unit.',
          'If the givens are correct, a contradiction always means one of your entries (or a removed candidate) was wrong.',
          'Later, contradictions become a tool: if assuming something leads to a contradiction, that assumption is false.',
        ],
      },
      {
        kind: 'tap-cell',
        title: 'Find the dead end',
        prompt: 'Someone entered 5 in r5c2 (blue). Now one empty cell has no possible digit at all. Tap it.',
        position: { grid: CONTRADICTION_GRID, givens: givensOf(BASE) },
        answers: [40],
        success: 'Yes: r5c5 sees 1, 2, 3, 4, 6, 7, 8 and 9 in its units, and now the 5 in its row too. Nothing is left, so the 5 in r5c2 was a mistake.',
        retry: 'That cell still has at least one candidate. Look near the new 5: which empty cell in row 5 now sees every digit?',
      },
    ],
  },
  {
    id: 'logic-vs-guessing',
    title: 'Logic vs guessing',
    level: 1,
    summary: 'Every move should have a reason you can explain.',
    prerequisites: ['contradictions'],
    cards: [
      {
        kind: 'concept',
        title: 'Why logic',
        body: [
          'A logical move follows from the rules and the digits on the board: "8 must go here because every other cell of the box is blocked."',
          'A guess is a move without a proof. It might be right, but if it is wrong you only find out much later, and undoing it is painful.',
          'Every puzzle in this app can be solved by logic alone. Hints always show a reason, never a guess.',
        ],
      },
      {
        kind: 'choice',
        title: 'Logic or guess?',
        prompt: 'A cell has candidates {2,7}. Which is a logical reason to write 7?',
        options: [
          { label: 'The 2 already appears in its box', correct: true, feedback: 'Yes. That rules out 2, so 7 is the only digit left: a naked single.' },
          { label: '7 feels more likely', correct: false, feedback: 'That is a guess. Look for a reason that rules out the 2.' },
          { label: 'Fewer 7s than 2s are on the board', correct: false, feedback: 'Counting digits can tell you where to look, but it is not a reason. You need something that rules out the 2.' },
        ],
      },
    ],
  },
];

export const LEVEL1_TECHNIQUES: TechniqueContent[] = [
  {
    technique: 'full-house',
    summary: 'The last empty cell of a row, column or box.',
    concept:
      'Every row, column and box holds each digit 1–9 exactly once. When a unit has eight digits filled in, its last empty cell can only take the one digit that is missing. Find the gap, name the missing digit, fill it in. Full houses appear constantly near the end of a puzzle.',
    why: 'A unit has nine cells and needs nine different digits. If eight cells already hold eight different digits, exactly one digit is unused and exactly one cell is free. The digit must go somewhere in the unit, so it goes in the free cell.',
    mistakes: [
      'Trusting a unit whose "filled" cells include a wrong entry: a full house is only as good as the digits around it.',
      'Checking only rows. Columns and boxes give full houses just as often.',
      'Writing the digit you expect instead of the one that is missing: list the eight digits you see, then name the ninth.',
    ],
    naming: 'Also called "last digit" or "last free cell". Pencilmark checks boxes first, then rows, then columns.',
    limits: '',
    targetRule: 'Look for a row, column or box with exactly one empty cell; that cell gets the missing digit.',
    patternCaption: 'This unit has only one empty cell left.',
  },
  {
    technique: 'hidden-single',
    summary: 'A digit with only one possible cell in a unit.',
    concept:
      'Pick a digit and a unit. If the digit has only one possible cell left in that unit, it must go there, even when the cell itself still has other candidates. The other cells are blocked: they are filled, or the digit already appears in their row, column or box. Cross-hatching finds hidden singles in boxes. Most easy puzzles are solved with hidden singles alone.',
    why: 'Each unit must contain every digit once. If every cell but one is ruled out for the digit, the only way the unit can contain it is in that last cell.',
    mistakes: [
      'Confusing it with a naked single: the cell may still have several candidates. What matters is that the digit has only one home.',
      'Forgetting earlier eliminations: when you use pencil marks, a cell is also blocked once the digit is no longer among its candidates.',
      'Only scanning boxes. A digit can be hidden in a row or column too.',
    ],
    naming: 'Also called a "pinned digit" or "unique candidate". Pencilmark searches boxes first, then rows, then columns, so its hints usually name a box.',
    limits: '',
    targetRule: 'Choose a unit and a digit: the answer is the only cell of that unit where the digit can still go.',
    patternCaption: 'In this unit the digit has just one possible cell. Shaded cells hold the digits that block the others.',
  },
  {
    technique: 'naked-single',
    summary: 'A cell with only one candidate left.',
    concept:
      'Look at one empty cell and check its row, column and box. If eight different digits already appear among them, only one digit is left for the cell. With pencil marks it is even easier: a cell whose candidates have shrunk to a single digit gets that digit.',
    why: 'A cell cannot repeat a digit that its row, column or box already holds. If eight digits are excluded, the ninth is the only value that keeps all three units valid, and since the puzzle has a solution, the cell must take it.',
    mistakes: [
      'Forgetting the box: rows and columns alone often leave two digits.',
      'Trusting notes that were never updated: after placing a digit, remove it from the notes of every cell that sees it.',
      'Mixing it up with a hidden single: a naked single is about one cell having one candidate, not one digit having one cell.',
    ],
    naming: 'Also called a "sole candidate" or "singleton".',
    limits: '',
    targetRule: 'Find the empty cell whose row, column and box together already rule out eight digits.',
    patternCaption: 'This cell has only one candidate left: the shaded cells in its row, column and box rule out the rest.',
  },
];
