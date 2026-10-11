import type { TechniqueContent } from '../types';

/** Level 5 — Expert: Sue de Coq and forcing chains (with an honest note on Nishio). */

export const LEVEL5_TECHNIQUES: TechniqueContent[] = [
  {
    technique: 'sue-de-coq',
    summary: 'Digits locked into a line and a box at once.',
    concept:
      'Look where a box meets a row or column. Take 2-3 empty cells there (C) holding at least two more digits than cells. Add cells D from the rest of the line and E from the rest of the box, so that D and E share no digit and all the cells together hold exactly as many digits as cells. Then D’s digits stay in the line and E’s digits stay in the box: remove them from the rest.',
    why: 'C and D share a line, so their digits differ; C and E share a box, so theirs differ too; and D and E have no digit in common. So all N cells hold N different digits, each exactly once. A digit of D sits in C or D, inside the line, so the rest of the line cannot have it. The same goes for E’s digits and the box.',
    mistakes: [
      'D and E sharing a candidate: they must be disjoint.',
      'Miscounting: the number of different digits must equal the number of cells.',
      'Removing line digits from the box or box digits from the line.',
    ],
    naming: 'Also called two-sector disjoint subsets. Named after the forum member who first described it.',
    limits: 'Pencilmark uses intersections of 2-3 cells and line and box parts of 1-3 cells.',
    targetRule: 'Line-part digits leave the rest of the line; box-part digits leave the rest of the box.',
    patternCaption: 'Ringed: the intersection cells. Blue: the line part. Orange: the box part.',
  },
  {
    technique: 'forcing-chain',
    summary: 'Try every option; keep only what they all agree on.',
    concept:
      'When patterns run out, test every option without guessing. Take a cell with two or three candidates, or a digit with two or three places in a unit. For each option, follow the singles it forces. If every option leads to the same placement or elimination, that result is true. If one option leads to a contradiction (a cell with no candidates, or a digit with no place), that option is false.',
    why: 'Exactly one option of the set is true in the real solution. If all options agree on a result, the true one does too. And an assumption that leads to a contradiction cannot be the truth.',
    mistakes: [
      'Skipping an option: the conclusion only holds when every option of the set has been followed.',
      'Using doubtful moves inside a branch: keep branches to plain singles so each step is certain.',
      'Treating it as guessing: you never commit to a branch. You keep only what every branch agrees on, or what a contradiction proves.',
    ],
    naming: 'Pencilmark covers cell forcing chains, unit (digit) forcing chains and contradiction chains, each followed with singles only (sometimes called a forcing net of singles).',
    limits: 'Branches use naked and hidden singles only, and only cells with 2-3 candidates or digits with 2-3 places are tried. A puzzle that needs more is reported as beyond Pencilmark’s techniques.',
    targetRule: 'The conclusion is the result every branch agrees on, or the removal of an assumption that leads to a contradiction.',
    patternCaption: 'The coloured candidate is the assumption; the shaded cells are the singles it forces.',
  },
];

/** Extra concept cards shown in specific technique lessons (after "Why it works"). */
export const EXTRA_CARDS: Partial<Record<string, { title: string; body: string[] }[]>> = {
  'forcing-chain': [
    {
      title: 'Forcing chains, Nishio and guessing',
      body: [
        'Nishio is a related idea: assume one candidate is true and look only at that digit. If the remaining copies of the digit can no longer all be placed, the assumption was false. A Nishio step is a contradiction argument about a single digit.',
        'Pencilmark has no separate Nishio technique. Its contradiction chains follow singles of every digit, so some of them happen to use one digit only (that is a Nishio-style deduction), and others mix several digits. A full Nishio check, which tries every way the digit could still be placed, can reach some eliminations that singles cannot.',
        'Neither is guessing: a guess commits to an answer and hopes. A forcing chain or a Nishio step tests an option to the end and keeps only what is proven.',
      ],
    },
  ],
  'unique-rectangle-1': [
    {
      title: 'About uniqueness',
      body: [
        'Uniqueness techniques do not follow from the rules alone. They use one extra fact: the puzzle has exactly one solution.',
        'Puzzles from Pencilmark always do. Puzzles from elsewhere usually do, but if an imported puzzle has several solutions, Pencilmark switches these techniques off, because their conclusions could then be wrong.',
      ],
    },
  ],
};
