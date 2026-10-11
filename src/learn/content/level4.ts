import type { TechniqueContent } from '../types';

/** Level 4 — Advanced: turbot, finned fish, jellyfish, W-Wing, uniqueness, chains and ALS-XZ. */

const UNIQUENESS_LIMIT =
  'Only valid when the puzzle has exactly one solution. Pencilmark checks this before it uses any uniqueness technique; on an imported puzzle with several solutions they are switched off.';

export const LEVEL4_TECHNIQUES: TechniqueContent[] = [
  {
    technique: 'turbot-fish',
    summary: 'Strong – weak – strong on one digit.',
    concept:
      'The general shape behind skyscrapers and kites: a single-digit chain strong – weak – strong. A strong link is a conjugate pair (the only two places for the digit in a row, column or box). Start at one end of a pair, cross to its partner, step to a cell that sees it, and finish across another pair. One of the two chain ends must hold the digit, so a cell that sees both ends loses it.',
    why: 'Write the chain as A = B – C = D. If A is not the digit, B is (strong link), so C is not (weak link), so D is (strong link). Either A or D holds the digit.',
    mistakes: [
      'Treating the weak step as strong: a weak link only means "not both".',
      'Starting or ending on a weak link: both ends must come off strong links.',
      'Removing the digit from cells that see only one end.',
    ],
    naming: 'Pencilmark names skyscrapers and two-string kites separately and uses "Turbot Fish" for the remaining shapes, which usually use a conjugate pair inside a box (an "empty rectangle"-like shape).',
    limits: '',
    targetRule: 'Only cells that see both ends of the chain lose the digit.',
    patternCaption: 'Solid arrows: conjugate pairs (strong links). Dashed arrow: the two middle cells see each other (weak link).',
  },
  {
    technique: 'finned-x-wing',
    summary: 'An almost-X-Wing with extra candidates in one box.',
    concept:
      'In two base lines a digit fits the two cover lines, except for one or two extra candidates, the fins, all in one box. Either the X-Wing is real, or a fin holds the digit. Cells that the X-Wing would clear and that also see every fin lose the digit either way: cells in a cover line, inside the fin box, outside the base lines.',
    why: 'Case 1: no fin is the digit, so the X-Wing holds and clears the cover lines. Case 2: a fin is the digit, and it clears every cell it sees. Only cells caught by both cases are safe to clear.',
    mistakes: [
      'Clearing the whole cover lines as if the X-Wing were complete.',
      'Fins spread over two boxes: all fins must share one box.',
      'Choosing a target outside the fin box: the target must see the fins.',
    ],
    naming: 'A sashimi X-Wing is a finned X-Wing where one base line has only one candidate in the cover lines, so without the fin there would be no fish at all. Pencilmark’s explanation says "Sashimi" then.',
    limits: '',
    targetRule: 'Only cells in a cover line, inside the fin’s box and outside the base lines, lose the digit.',
    patternCaption: 'The fish body (ringed candidates) plus the fin (square outline) inside one box.',
  },
  {
    technique: 'finned-swordfish',
    summary: 'A Swordfish with fins in one box.',
    concept:
      'Three base lines restrict a digit to three cover lines, except for fins that all sit in one box. Either the Swordfish holds or a fin is the digit. Cells in a cover line, inside the fin box and outside the base lines see the fins and would also be cleared by the fish, so they lose the digit.',
    why: 'If no fin is the digit, the Swordfish clears its cover lines. If a fin is, it clears the cells it sees. The targets are in both groups, so the digit cannot be there in any case.',
    mistakes: [
      'Clearing every cover-line cell: only those inside the fin box qualify.',
      'Fins in different boxes.',
      'Forgetting that sashimi shapes (a base line with a single cover candidate) still need the fin argument.',
    ],
    naming: 'Includes sashimi Swordfish (a base line with only one candidate in the cover lines).',
    limits: '',
    targetRule: 'Only cells in a cover line, inside the fin’s box and outside the base lines, lose the digit.',
    patternCaption: 'The swordfish body (ringed) plus the fin (square outline) inside one box.',
  },
  {
    technique: 'jellyfish',
    summary: 'A fish with four lines.',
    concept:
      'In four base rows a digit fits only within the same four columns (two to four spots per row). The four copies must land in four different columns, filling all four. So the digit leaves those columns outside the four base rows. Columns can be the base too.',
    why: 'Four rows, one copy each, at most one copy per column: the copies occupy all four cover columns, so no other cell of those columns can take the digit.',
    mistakes: [
      'Letting the union grow to five cover lines.',
      'Removing from the base lines instead of the cover lines.',
      'Spending time on it early: a smaller fish or simpler move is almost always available first.',
    ],
    naming: 'A size-4 fish.',
    limits: 'Rarely needed: a jellyfish usually comes with a smaller fish in the other direction that gives the same eliminations, and that one is found first.',
    targetRule: 'Only cells in the four cover lines, outside the four base lines, lose the digit.',
    patternCaption: 'In four base lines, the digit fits only within four cover lines.',
  },
  {
    technique: 'w-wing',
    summary: 'Two identical bivalue cells joined by a conjugate pair.',
    concept:
      'Find two cells with the same two candidates {x,y} that do not see each other. Then find a conjugate pair on x: one end sees the first cell, the other end sees the second. The two cells cannot both be x, so at least one of them is y. Any cell that sees both loses y.',
    why: 'If both cells were x, each would remove x from the pair end it sees, leaving that unit with no place for x. So one of them is y.',
    mistakes: [
      'Bivalue cells with different pairs: both must be exactly {x,y}.',
      'A linking unit where x has three places: it must be exactly two.',
      'Removing x instead of y.',
    ],
    naming: 'Named after its shape. As a chain: y = x – x = x – x = y.',
    limits: '',
    targetRule: 'Only y (the digit the linking pair is not about) is removed, from cells that see both bivalue cells.',
    patternCaption: 'Two identical bivalue cells, joined by a conjugate pair on one of their digits (orange).',
  },
  {
    technique: 'unique-rectangle-1',
    summary: 'Three corners of a deadly rectangle protect the fourth.',
    concept:
      'Look at four empty cells at the corners of a rectangle that spans two rows, two columns and exactly two boxes. If three corners have exactly the candidates {a,b}, the fourth cannot be a or b: then all four could only be a and b, and swapping them would give a second solution. Remove a and b from the fourth corner.',
    why: 'If the corners were a and b in a checkerboard, swapping a and b in all four would keep every row, column and box valid, because each unit contains either both swapped cells or none of them. A puzzle with one solution cannot allow that.',
    mistakes: [
      'Using a rectangle that spans four boxes: the swap would break the boxes, so there is no deadly pattern.',
      'Using it on a puzzle that might have several solutions.',
      'Including a corner that is already filled: all four must be empty.',
    ],
    naming: 'Unique rectangle type 1. The all-{a,b} rectangle is called a deadly pattern.',
    limits: UNIQUENESS_LIMIT,
    targetRule: 'Only a and b are removed, and only from the one corner that has extra candidates.',
    patternCaption: 'Three corners of a two-box rectangle hold exactly the same two candidates.',
  },
  {
    technique: 'unique-rectangle-2',
    summary: 'Two roof corners share one extra digit.',
    concept:
      'Two corners in the same row or column (the floor) are exactly {a,b}. The other two corners (the roof) are both {a,b,x} with the same single extra digit x. If neither roof corner were x, all four would be a and b: a deadly pattern. So one roof corner is x, and any cell that sees both roof corners loses x.',
    why: 'Uniqueness forbids the four corners from being only a and b, so at least one roof corner must take its extra digit x. Both roof corners have the same x, so a cell that sees both cannot be x.',
    mistakes: [
      'Roof corners with different extras, or more than one extra digit.',
      'Removing a or b instead of x.',
      'Using it on a puzzle that might have several solutions.',
    ],
    naming: 'Unique rectangle type 2. Pencilmark requires the two exact corners to share a row or column (the diagonal case is not used).',
    limits: UNIQUENESS_LIMIT,
    targetRule: 'Only the extra digit x is removed, from cells that see both roof corners.',
    patternCaption: 'The floor corners are exactly {a,b}; the roof corners are {a,b,x}. Blue marks the extra digit x.',
  },
  {
    technique: 'unique-rectangle-4',
    summary: 'A locked digit on the roof removes the other.',
    concept:
      'The floor corners (same row or column) are exactly {a,b}. The roof corners share a unit in which digit a can only go in those two corners, so one of them is a. If either roof corner were b, the rectangle would hold only a and b: a deadly pattern. So b is removed from both roof corners.',
    why: 'One roof corner must be a, because a has no other place in that unit. If the other roof corner were b, all four corners would hold only a and b, giving two solutions. We do not know which roof corner is the a, so neither of them may be b.',
    mistakes: [
      'Removing a, the locked digit, instead of b.',
      'Skipping the check that a is really limited to the two roof corners in a unit they share.',
      'Using it on a puzzle that might have several solutions.',
    ],
    naming: 'Unique rectangle type 4.',
    limits: UNIQUENESS_LIMIT,
    targetRule: 'Only b (the digit that is not locked) is removed, from the two roof corners.',
    patternCaption: 'The floor corners are exactly {a,b}; in a unit holding both roof corners, a can only go there.',
  },
  {
    technique: 'bug-plus-one',
    summary: 'All cells bivalue but one: that one takes its extra digit.',
    concept:
      'BUG means Bivalue Universal Grave: every empty cell has exactly two candidates and each candidate appears exactly twice in every row, column and box. Such a position never has exactly one solution. In BUG+1, all cells are bivalue except one with three candidates. That cell must take the digit that appears three times in its row, column and box; otherwise a BUG would remain.',
    why: 'If the three-candidate cell took one of its other two digits, the rest of the grid would be a BUG, which has no solution or several. A puzzle with exactly one solution cannot reach that, so the cell takes the extra digit.',
    mistakes: [
      'Using it when more than one cell has three candidates.',
      'Picking the wrong digit: it is the one that appears three times in the cell’s row, column and box.',
      'Using it on a puzzle that might have several solutions.',
    ],
    naming: 'Bivalue Universal Grave + 1.',
    limits: `${UNIQUENESS_LIMIT} Pencilmark also checks strictly that every other digit appears 0 or 2 times in every unit.`,
    targetRule: 'The answer is a placement: the one cell with three candidates gets its extra digit.',
    patternCaption: 'Every empty cell has two candidates, except this one.',
  },
  {
    technique: 'x-chain',
    summary: 'A longer alternating chain on one digit.',
    concept:
      'A chain on one digit that alternates strong links (conjugate pairs: at least one is true) and weak links (cells that see each other: at most one is true). If it starts and ends with a strong link, one of its two ends must hold the digit. Any cell that sees both ends loses it.',
    why: 'Suppose the first end is false. The strong link makes the next cell true, the weak link makes the following one false, and so on, until the last strong link makes the far end true. So at least one end holds the digit.',
    mistakes: [
      'Calling a link strong when the digit has three places in that unit.',
      'Ending on a weak link: then nothing follows.',
      'Reading it as "both ends are true": it only proves that at least one is.',
    ],
    naming: 'Skyscrapers, kites and turbot fish are 3-link X-Chains; Pencilmark finds those first, so its X-Chains usually have 5 or more links. Eureka notation: "=" strong, "–" weak.',
    limits: 'Pencilmark searches chains of up to 11 links and shows the shortest one that removes something.',
    targetRule: 'Only cells that see both ends of the chain lose the digit.',
    patternCaption: 'A chain on one digit: solid arrows are strong links, dashed arrows weak links.',
  },
  {
    technique: 'xy-chain',
    summary: 'A chain of bivalue cells.',
    concept:
      'A chain made only of cells with two candidates. Inside each cell the two digits form a strong link (if one is false the other is true). Between cells, the same digit in two cells that see each other forms a weak link. When the chain starts and ends with the same digit z, one of the two end cells is z, so any cell seeing both ends loses z.',
    why: 'If the first cell is not z, it is its other digit, which removes that digit from the next cell, which therefore takes its other digit, and so on down the chain until the last cell is z.',
    mistakes: [
      'Including a cell with three candidates: every cell must be bivalue.',
      'Linking two cells that do not see each other.',
      'Removing the wrong digit: it is the digit at both ends of the chain.',
    ],
    naming: 'The XY-Wing is a three-cell XY-Chain.',
    limits: 'Pencilmark searches XY-Chains of up to 13 links.',
    targetRule: 'Only the end digit is removed, from cells that see both ends of the chain.',
    patternCaption: 'Each arrow inside a cell is a strong link; each arrow between cells is a weak link on one digit.',
  },
  {
    technique: 'aic',
    summary: 'Chains that mix cells, pairs and digits.',
    concept:
      'An alternating inference chain mixes every kind of link: strong links inside bivalue cells and between the only two places of a digit in a unit, joined by weak links (two digits in one cell, or one digit in two cells that see each other). The digit may change along the way. As always, a chain that starts and ends with strong links proves that one end is true, so any candidate that conflicts with both ends is removed.',
    why: 'If the first end is false, each strong link forces its partner true and each weak link forces its partner false, all the way to the last strong link, which makes the far end true.',
    mistakes: [
      'Using a weak link where a strong one is needed: check every "=".',
      'Misjudging "conflicts with both ends": it means the same digit in a cell that sees an end, or another digit inside an end’s own cell.',
      'Losing track in long chains: write them down in Eureka notation.',
    ],
    naming: 'Eureka notation: "=" strong, "–" weak. X-Chains (one digit) and XY-Chains (bivalue cells) are special AICs.',
    limits: 'Pencilmark’s AICs use single candidates only (no grouped nodes, no ALS nodes) and up to 11 links.',
    targetRule: 'Only candidates that conflict with both ends of the chain are removed.',
    patternCaption: 'The chain, with strong links solid and weak links dashed. Its ends are what matter.',
  },
  {
    technique: 'als-xz',
    summary: 'Two almost locked sets share a restricted digit.',
    concept:
      'An almost locked set (ALS) is N cells in one unit holding N+1 digits between them; a bivalue cell is the smallest one. Take two ALSs, A and B, sharing a digit X where every X in A sees every X in B: they cannot both contain X. The set without X is locked and holds all its other digits. If both sets contain digit Z, one of them holds Z, so cells seeing every Z in both sets lose Z.',
    why: 'At least one set has no X, so its N cells hold exactly its other N digits, which include Z. Either way Z is in A or in B, in one of the cells the target sees.',
    mistakes: [
      'An X that is not restricted: every X in one set must see every X in the other.',
      'A target that sees only some of the Z candidates of the two sets.',
      'Overlapping sets: A and B must not share cells.',
    ],
    naming: 'Singly linked ALS-XZ. X is the restricted common candidate, Z the digit removed.',
    limits: 'Pencilmark uses ALSs of 1-4 cells and does not use the doubly linked variant.',
    targetRule: 'Only Z is removed, from cells outside both sets that see every Z of both sets.',
    patternCaption: 'Two almost locked sets. Orange: the restricted digit X. Blue: the digit Z.',
  },
];
