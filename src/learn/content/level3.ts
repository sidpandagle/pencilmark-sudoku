import type { FoundationContent, TechniqueContent } from '../types';

/** Level 3 — Intermediate: fish, wings, colouring, the first chains, quads. */

export const LEVEL3_FOUNDATIONS: FoundationContent[] = [
  {
    id: 'chains-intro',
    title: 'Strong and weak links',
    level: 3,
    summary: 'The two kinds of link behind every chain.',
    prerequisites: ['x-wing'],
    cards: [
      {
        kind: 'concept',
        title: 'Strong links',
        body: [
          'When a digit has exactly two possible cells in a unit, those two cells form a conjugate pair. At least one of them must hold the digit, and (since they share a unit) at most one does.',
          'Chains use the "at least one" half: if one end is false, the other is true. That is a strong link, written with "=", for example 7r3c2 = 7r3c8.',
          'A cell with exactly two candidates gives a strong link too: if it is not one digit, it is the other.',
        ],
      },
      {
        kind: 'concept',
        title: 'Weak links',
        body: [
          'Two candidates that cannot both be true form a weak link, written with "–": the same digit in two cells that see each other, or two digits in the same cell.',
          'A weak link only says "not both". Knowing one end is false tells you nothing about the other.',
          'Chains alternate: strong, weak, strong… If a chain starts and ends with a strong link, at least one of its two ends is true. Skyscrapers, kites, colouring and every chain technique use exactly this idea.',
        ],
      },
      {
        kind: 'choice',
        title: 'Strong or weak?',
        prompt: 'In row 4, digit 6 can go in three cells. Two of them are r4c2 and r4c7. What kind of link joins 6r4c2 and 6r4c7?',
        options: [
          { label: 'Weak: they cannot both be 6', correct: true, feedback: 'Right. With a third possible cell, neither might be 6, so the link is only weak.' },
          { label: 'Strong: one of them must be 6', correct: false, feedback: 'Only if 6 had exactly two places in the row. With a third option, both could be empty of 6.' },
          { label: 'No link at all', correct: false, feedback: 'They see each other (same row), so they cannot both be 6: that is a weak link.' },
        ],
      },
      {
        kind: 'choice',
        title: 'Reading a chain',
        prompt: 'A chain reads 3r1c1 = 3r1c8 – 3r5c8 = 3r5c4. What does it prove?',
        options: [
          { label: 'r1c1 or r5c4 (or both) is 3', correct: true, feedback: 'Yes. If r1c1 is not 3, then r1c8 is, so r5c8 is not, so r5c4 is.' },
          { label: 'r1c1 and r5c4 are both 3', correct: false, feedback: 'A chain only proves that at least one end is true, not both.' },
          { label: 'r1c8 is 3', correct: false, feedback: 'The middle of a chain stays undecided; only the ends are tied together.' },
        ],
      },
    ],
  },
];

export const LEVEL3_TECHNIQUES: TechniqueContent[] = [
  {
    technique: 'x-wing',
    summary: 'A digit restricted to the same two columns in two rows.',
    concept:
      'Pick a digit. Find two rows where it has exactly two possible cells, and those cells sit in the same two columns: the corners of a rectangle. The digit must take two diagonal corners, so either way each of the two columns gets its copy inside these two rows. Remove the digit from every other cell of those columns. It also works with columns as the base and rows as the cover.',
    why: 'Row A’s copy of the digit is in one of the two columns and row B’s copy is in the other: they cannot share a column. So both columns already have their copy inside rows A and B, and any other cell of those columns holding the digit would be a second copy.',
    mistakes: [
      'Using a row where the digit has three or more places: each base row needs exactly two, both in the cover columns.',
      'Removing the digit from the base rows instead of the cover columns.',
      'Mixing digits: all four corners must be candidates for the same digit.',
    ],
    naming: 'A size-2 fish. The lines where the digit is restricted are the base lines; the lines where it is removed are the cover lines. Swordfish (3) and Jellyfish (4) are bigger fish.',
    limits: '',
    targetRule: 'Only cells in the two cover lines, outside the two base lines, lose the digit.',
    patternCaption: 'In the two base lines the digit fits only these four cells, lined up in two cover lines.',
  },
  {
    technique: 'skyscraper',
    summary: 'Two conjugate pairs that share a base line.',
    concept:
      'Pick a digit and find two rows where it has exactly two places each. One end of each pair sits in the same column: that is the base. The other two ends are the roof, and they are not in the same column. Only one base cell can hold the digit, so at least one roof cell does. Any cell that sees both roof cells loses the digit. It works with columns too.',
    why: 'The base cells share a column, so at most one of them is the digit. If base cell 1 is not, its row partner (roof 1) is. If base cell 2 is not, roof 2 is. One of those always happens, so at least one roof cell holds the digit, and a cell seeing both cannot.',
    mistakes: [
      'Roof cells in the same column as well: then it is an X-Wing, not a skyscraper.',
      'Removing the digit from cells that see only one roof cell.',
      'Using a row with a third possible cell: both rows need exactly two places.',
    ],
    naming: 'A turbot fish (a single-digit chain of three links) with both strong links in rows or both in columns. Eureka notation: roof1 = base1 – base2 = roof2.',
    limits: '',
    targetRule: 'Only cells that see both roof ends (the two ends that are not lined up) lose the digit.',
    patternCaption: 'Two conjugate pairs on one digit. Solid arrows are the pairs; the dashed arrow joins the two lined-up base cells.',
  },
  {
    technique: 'two-string-kite',
    summary: 'A row pair and a column pair tied together in a box.',
    concept:
      'Pick a digit with a conjugate pair in a row and another in a column. If one end of the row pair and one end of the column pair sit in the same box (as two different cells), only one of them can be the digit. So one of the two far ends must be. A cell that sees both far ends loses the digit.',
    why: 'The two box cells see each other, so at most one holds the digit. If the row’s box cell is not the digit, the row’s far end is. If the column’s box cell is not, the column’s far end is. At least one far end holds the digit, so a cell seeing both cannot.',
    mistakes: [
      'Using the same cell as both box ends: they must be two different cells.',
      'Far ends inside the joining box: both far ends must lie outside it.',
      'Removing the digit from a cell that sees only one far end.',
    ],
    naming: 'Another turbot fish shape: a row "string" and a column "string" tied together in a box.',
    limits: '',
    targetRule: 'Only cells that see both far ends of the kite lose the digit; usually that is the cell where their row and column cross.',
    patternCaption: 'A row pair and a column pair on one digit meet inside one box.',
  },
  {
    technique: 'xy-wing',
    summary: 'A bivalue pivot and two pincers that share a digit.',
    concept:
      'Find a pivot cell with two candidates {x,y}. It sees two pincer cells, also with two candidates: one is {x,z} and the other {y,z}. If the pivot is x, the first pincer becomes z; if the pivot is y, the second pincer becomes z. Either way one pincer is z, so any cell that sees both pincers cannot be z.',
    why: 'The pivot must be x or y. Each choice removes that digit from the pincer that sees it, forcing that pincer to z. So at least one pincer is z, and a cell sharing a unit with both cannot be z.',
    mistakes: [
      'Choosing pincers that do not both see the pivot.',
      'Removing z from cells that see the pivot and only one pincer.',
      'Using cells with extra candidates: pivot and pincers must have exactly two each.',
    ],
    naming: 'Also called Y-Wing. It is the shortest XY-Chain (three cells).',
    limits: '',
    targetRule: 'Only the shared digit z is removed, and only from cells that see both pincers.',
    patternCaption: 'The pivot {x,y} sees two pincers {x,z} and {y,z}. The blue digits are the z candidates.',
  },
  {
    technique: 'xyz-wing',
    summary: 'An XY-Wing whose pivot also holds the shared digit.',
    concept:
      'Like an XY-Wing, but the pivot has three candidates {x,y,z} and the pincers are {x,z} and {y,z}. Now z can also be in the pivot. One of the three cells must be z, so only cells that see all three lose z. Such cells share the pivot’s box or line with both pincers.',
    why: 'If the pivot is z, done. If it is x, the {x,z} pincer becomes z; if it is y, the {y,z} pincer becomes z. So z sits in one of the three cells, and a cell seeing all three cannot be z.',
    mistakes: [
      'Removing z from cells that see only the two pincers: that is XY-Wing logic and is not valid here, because the pivot itself might be z.',
      'Pincers with a digit the pivot does not have.',
      'Pincers with three candidates: only the pivot has three.',
    ],
    naming: 'An extension of the XY-Wing.',
    limits: '',
    targetRule: 'Only z is removed, and only from cells that see the pivot and both pincers.',
    patternCaption: 'The pivot holds {x,y,z}; each pincer holds z and one of x or y. Blue marks every z.',
  },
  {
    technique: 'simple-coloring',
    summary: 'Colour the conjugate pairs of one digit in two colours.',
    concept:
      'Pick one digit and follow its conjugate pairs (units where it has exactly two places). Colour linked cells alternately blue and orange. In each pair exactly one cell holds the digit, so either all blue cells are true or all orange ones are. Colour trap: an uncoloured cell that sees a blue and an orange cell cannot hold the digit. Colour wrap: if two cells of one colour see each other, that colour is false everywhere.',
    why: 'Every link means "exactly one of these two". Along the chain the colours alternate, so one whole colour holds the digit. A cell seeing both colours sees the true copy either way; a colour with two cells in one unit would put the digit there twice.',
    mistakes: [
      'Linking through a unit where the digit has three or more places: only conjugate pairs give a link.',
      'Colouring two digits at once: simple colouring uses one digit.',
      'In a colour trap, removing the digit from a cell that sees only one colour.',
    ],
    naming: 'Also called single-digit colouring or singles chains. Pencilmark covers colour trap and colour wrap on clusters of at least three cells.',
    limits: 'Pencilmark skips clusters that cannot be two-coloured. Multi-colouring and 3D Medusa (colouring across several digits) are not implemented.',
    targetRule: 'A colour trap removes the digit from cells that see both a blue and an orange cell; a colour wrap removes it from every cell of the false colour.',
    patternCaption: 'The conjugate pairs of one digit, coloured alternately blue and orange.',
  },
  {
    technique: 'swordfish',
    summary: 'An X-Wing with three lines.',
    concept:
      'Pick a digit and three rows where it fits only within the same three columns (each row having two or three of those spots). The three rows must place their three copies in three different columns, so all three columns get their copy inside these rows. Remove the digit from those columns everywhere else.',
    why: 'Three rows, one copy each, at most one copy per column: the copies occupy all three columns. No other cell of those columns can take the digit.',
    mistakes: [
      'Thinking every row needs all three spots: two is enough, as long as the three rows together use exactly three columns.',
      'Allowing a row with a spot outside the three columns.',
      'Removing the digit from the base rows instead of the cover columns.',
    ],
    naming: 'A size-3 fish, with base and cover lines as in the X-Wing.',
    limits: '',
    targetRule: 'Only cells in the three cover lines, outside the three base lines, lose the digit.',
    patternCaption: 'In three base lines, the digit fits only within the same three cover lines.',
  },
  {
    technique: 'naked-quad',
    summary: 'Four cells holding only four digits between them.',
    concept:
      'Four cells in one unit whose candidates, combined, are exactly four digits form a naked quad. The four cells must take those four digits, so the digits leave every other cell of the unit. Each cell may show two, three or four of them.',
    why: 'Four cells need four different values drawn from the same four digits, so these cells use up all four. Any other cell of the unit holding one of them would force a repeat.',
    mistakes: [
      'Letting the union grow to five digits: it must be exactly four.',
      'Using cells from different units.',
      'Forgetting the simpler view: in a unit with few empty cells, a naked quad often hides a smaller hidden subset in the remaining cells.',
    ],
    naming: 'Part of the naked subset family.',
    limits: 'Quads are hard to see, so Pencilmark tries them after X-Wing, colouring and Swordfish.',
    targetRule: 'Only the quad’s four digits are removed, and only from other cells of the unit the four cells share.',
    patternCaption: 'These four cells hold only four digits between them.',
  },
  {
    technique: 'hidden-quad',
    summary: 'Four digits that fit only four cells reserve those cells.',
    concept:
      'Four digits that, within one unit, can only go in the same four cells form a hidden quad. The cells are reserved for those digits, so every other candidate in them can be removed.',
    why: 'Each of the four digits needs a home in the unit and only these four cells can take any of them, so the four digits fill the four cells.',
    mistakes: [
      'Allowing one of the digits a fifth place in the unit.',
      'Removing the four digits from other cells: the eliminations are the other candidates inside the quad.',
      'Hunting for hidden quads early: the matching naked subset in the other cells is usually easier to see.',
    ],
    naming: 'Part of the hidden subset family.',
    limits: 'Rarely needed: a hidden quad always comes with a complementary naked subset in the remaining cells of the unit, which is usually found first. Pencilmark has no practice puzzle that needs one.',
    targetRule: 'Only the other candidates inside the four quad cells are removed.',
    patternCaption: 'In this unit, these four digits fit only these four cells.',
  },
];
