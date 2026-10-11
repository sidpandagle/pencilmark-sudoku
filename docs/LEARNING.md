# Pencilmark — Learning mode

Learning mode teaches Sudoku from the rules up to forcing chains. Every technique lesson is built on the
engine: the positions are mined from real solving paths, the overlays are the engine's own `Step`
highlights, and every answer a learner gives is checked against the engine's step for that position.
Nothing here needs a network or an account.

## Code map

| Path | What it is |
|---|---|
| `src/learn/types.ts` | Lesson, technique content and foundation card types. |
| `src/learn/content/level1.ts` … `level5.ts` | All teaching text, by level. Foundation lessons (with hand-built positions) and technique content. `level5.ts` also holds extra concept cards (Nishio, uniqueness). |
| `src/learn/curriculum.ts` | `LEVELS`, `LESSONS` (curriculum order), prerequisites (engine catalog + foundation links), lookup helpers. |
| `src/learn/lessonCards.ts` | Turns a lesson into the card sequence the player shows. |
| `src/learn/positions.ts` | Lesson positions: mined examples (`getTechniqueExamples`) and positions mined on the fly from practice puzzles. |
| `src/learn/exercise.ts` | Answer checking and kind feedback; progressive help text. |
| `src/learn/phases.ts` | Demonstration phases (units → pattern → effect → result) and overlay helpers. |
| `src/learn/progress.ts` | Pure progress model: completion, mastery, spaced review, struggle signals, validation, v1→v2 migration. |
| `src/learn/practice.ts` | Practice puzzle selection (`getPracticePuzzles` + random symmetry; honest fallback). |
| `src/learn/solveSession.ts` | Guided solving: full logical path with a frame per step; alternative moves. |
| `src/learn/components/` | React pieces: `StepDemo`, `ExerciseView`, `FoundationCardView`, `MasteryCheck`, `PracticeLauncher`, `DigitChips`, board sizing. |
| `src/app/learn/index.tsx` | Curriculum map (learn home). |
| `src/app/learn/[lessonId].tsx` | Lesson player. `?card=mastery` jumps to the mastery check (used by reviews). |
| `src/app/learn/solve.tsx` | Guided step-by-step solving (`?source=game`, `?source=random&difficulty=…`, `?puzzle=<81 digits>`). |
| `src/state/learning.ts` | Actions: `completeLesson`, `recordMasteryCheck`, `recordHintTechnique`, `useLearning`. |

Small additions outside these folders: `Board`/`Cell` candidate-tap mode (`onCandidatePress`), the hint
panel's "Lesson" button, the play menu's "Solve step by step" and "Learn techniques" entries,
hint usage recorded as a learning signal, and the versioned `learning` storage namespace (v2).

## Curriculum map

42 lessons in five levels. Technique lesson ids are engine technique ids. Arrows in the map are the
prerequisites; a lesson unlocks when all its prerequisites are **completed** (not mastered).

| Level | Lessons (map order) |
|---|---|
| 1 · First steps | The rules · Givens vs your entries · Scanning and cross-hatching · Full House · Hidden Single · Pencil marks (candidates) · Naked Single · Contradictions · Logic vs guessing |
| 2 · Beginner | Systematic scanning · Candidate management · Pointing Pair/Triple · Box/Line Reduction · Naked Pair · Hidden Pair · Naked Triple · Hidden Triple |
| 3 · Intermediate | X-Wing · Strong and weak links (chains intro) · Skyscraper · Two-String Kite · Simple Colouring · Swordfish · XY-Wing · XYZ-Wing · Naked Quad · Hidden Quad |
| 4 · Advanced | Turbot Fish · Finned X-Wing · Finned Swordfish · Jellyfish · W-Wing · Unique Rectangle 1/2/4 · BUG+1 · X-Chain · XY-Chain · AIC · ALS-XZ |
| 5 · Expert | Sue de Coq · Forcing Chain (with an honest note on Nishio) |

Levels follow the engine catalog's `level` for every technique (a test enforces it). Prerequisites are the
catalog's technique prerequisites plus a few links to foundation lessons (Full House ← Scanning, Naked
Single ← Candidates, Pointing ← Candidate management, Skyscraper/Kite/Colouring ← Strong and weak links).
Tests check that every prerequisite exists, is at the same or a lower level, appears earlier in the map,
and that the graph has no cycle.

Locks are gentle: tapping a locked lesson explains what it builds on ("Unlocks after Naked Pair") and
offers **Preview anyway**. Opening a locked lesson by other routes (e.g. from a hint) shows a small
"Preview" note instead of blocking.

## Pedagogy

Each technique lesson is a short sequence of cards:

1. **What it is** — a plain-language explanation (≤ 120 words, tested) and a diagram: the pattern drawn on a
   real puzzle (mined example 0) with the engine overlay. Screen readers get the engine explanation as the
   image description.
2. **Why it works** — the logical argument, so the learner can trust (and re-derive) the move.
3. Extra cards where needed (uniqueness assumption; forcing chains vs Nishio vs guessing).
4. **Watch out** — 2-3 common mistakes, naming conventions (claiming, sashimi, Y-Wing, Eureka notation…),
   limits (uniqueness, Pencilmark's detector caps), and the expected difficulty.
5. **See it in a puzzle** — mined example 0 with the engine's candidates, stepped through in parts:
   where to look (units) → the pattern → the deduction (eliminations/placement) → the resulting board.
   Numbered part tabs, "Next part" and Replay (auto-advance, off with reduce motion).
6. **Your turn** (guided) — mined example 1. The learner performs the move: for placements, tap the cell and
   pick the digit; for eliminations, tap candidates on the board (or tap a cell and toggle large chips).
   Help is progressive: nudge (`nudgeFor`) → highlight the pattern → show the answer. The learner must still
   enter the answer to continue.
7. **Lesson complete + practice** — reaching this card marks the lesson completed. "Try it in a puzzle"
   starts a `practice` game.
8. **Mastery check** — 2-3 positions, no help, one submission each.

Foundation lessons (rules, givens, scanning, candidates, contradictions, logic vs guessing, systematic
scanning, candidate management, strong and weak links) use concept cards and small interactive exercises:
tap the conflicting cell, tap a cell you may change, place a cross-hatched digit, fill a cell's candidates,
find the dead cell, clean up notes after a placement, and multiple choice. All hand-built positions come
from one classic puzzle and are verified in `src/learn/__tests__/foundations.test.ts` (exactly one conflict;
the candidate answer equals `computeCandidates`; exactly one dead cell; the clean-up answer equals the peers
holding the digit; placements match the brute-force solution).

### Answer checking

The correct answer is exactly the engine step's effects (its placements, or its set of eliminations).
Wrong picks get a short reason instead of a bare "wrong":

- the candidate is part of the pattern ("…is part of the pattern itself, so it stays");
- the deduction is about another digit;
- the candidate is out of the pattern's reach, followed by the technique's target rule (for example "Only
  cells in the two cover lines, outside the two base lines, lose the digit");
- for placements: right cell but wrong digit, or wrong cell plus the target rule;
- partial answers: "Good so far: 1 of 2 found."

Other valid deductions elsewhere on the board are not accepted (by design, for simplicity): the lesson
looks for the specific instance the engine found.

## Content per level (what each lesson teaches)

- **Level 1**: units and "seeing"; givens are fixed, entries are not; cross-hatching; candidates as an
  honest record of eliminations; contradictions as proof of an error; logic over guessing; Full House,
  Hidden Single (digit with one cell) vs Naked Single (cell with one digit).
- **Level 2**: a fixed scanning routine; keeping notes current after every placement; pointing vs claiming
  (which unit is the source, where the digit is removed); naked vs hidden subsets (where the eliminations
  happen), locked pairs.
- **Level 3**: base and cover lines for fish (X-Wing, Swordfish); strong vs weak links and Eureka notation;
  skyscraper and kite as three-link chains; colour trap and colour wrap; XY-Wing vs XYZ-Wing (why only cells
  seeing all three cells qualify); quads and why hidden quads are rarely needed.
- **Level 4**: turbot fish as the general strong–weak–strong chain; finned and sashimi fish (only cells in the
  fin box); jellyfish and its usual complementary smaller fish; W-Wing; deadly patterns and unique rectangles
  1, 2, 4 and BUG+1, all marked "only valid with exactly one solution"; X-Chain, XY-Chain, AIC; ALS-XZ
  (restricted common X, eliminated Z).
- **Level 5**: Sue de Coq (two-sector disjoint subsets); forcing chains (cell, unit and contradiction, singles
  only) and how they differ from Nishio and from guessing. The lesson says plainly that Pencilmark has no
  separate Nishio technique.

Every description was cross-checked against the detector in `src/engine/techniques/` (what it searches,
which cells lose a candidate, how its explanation reads). Examples: Pencilmark's UR2 requires the floor
corners to share a line; simple colouring needs clusters of three or more cells; X-Chains shown are usually
5+ links because 3-link chains are found earlier as skyscraper/kite/turbot; AICs use single candidates only.

## Progress, mastery and spaced review

Stored per lesson (`src/learn/progress.ts`):

| Field | Meaning |
|---|---|
| `completedAt` | First time the teaching cards were finished (reaching the practice / done card). |
| `attempts` | Mastery checks taken (first check and reviews). |
| `lastScore`, `bestScore` | Fraction correct, 0..1. |
| `masteredAt` | First passed mastery check. |
| `lastReviewedAt`, `nextReviewAt`, `intervalIndex` | Spaced review schedule. |
| `lastResult` | `pass` / `fail` of the latest check. |

- **Completion ≠ mastery.** Completion unlocks later lessons; mastery is a passed check.
- **Mastery** = every position correct with no answer revealed.
- **Spaced review**: after mastery the first review is due in 1 day; each passed review moves to the next
  interval of 1, 3, 7, 14, 30 days (capped at 30). A failed review resets the interval to 1 day and the
  lesson shows "Needs review" (mastery itself is kept).
- **Status on the map**: locked, available ("Ready"), completed, mastered, needs review.
- **Recommended next**: the first available lesson in curriculum order; otherwise the first completed lesson
  that is not yet mastered ("Take the mastery check").
- **Due for review** lists mastered lessons whose review is due or whose last review failed, most overdue
  first; "Review" opens the lesson straight at the mastery check.
- **Weak spots** ("Practice your weak spots"): every hint that shows a logical step in a game records its
  technique (timestamps, 20 per technique). Techniques with hints in the last 14 days and lessons whose last
  check failed are listed, strongest signal first, with "Lesson" and "Practice" buttons.

Mastery positions: mined examples 2 and 3, plus one position mined on the fly from a practice puzzle (the
first step of that technique on its easiest-first solving path, validated with `validateStep` against the
brute-force solution). The practice puzzle rotates with the attempt count, so reviews differ.

### Storage

Namespace `pencilmark:learning`, envelope `{ v: 2, savedAt, data }`, data = `LearningState
{ lessons, struggles }`. Migration 1 → 2 turns the reserved free-form v1 object into the structured state
(keeping `lessons`/`struggles` if present). `sanitizeLearning` repairs field by field (ids must match
`[a-z0-9-]`, times must be positive numbers, scores clamped to 0..1, review fields repaired from mastery).
Unreadable JSON or a future version is backed up to `pencilmark:backup:learning` and replaced with an empty
state, like every other namespace.

## Practice by technique

"Try it in a puzzle" (lesson) and "Practice" (weak spots) start a game with source `practice` from
`getPracticePuzzles(technique)`, relabelled and shuffled with a random Sudoku symmetry (which keeps the
solution unique and the technique profile unchanged). Replacing an unfinished game asks first (the old game
goes to history). Hidden Quad has no practice puzzle (such puzzles are extremely rare); the lesson says so
and offers a puzzle of similar difficulty, clearly labelled as possibly not needing a hidden quad.

## Guided solving

`/learn/solve` runs `solveLogically` from the start position and keeps the board before every step.
Each step is shown in two parts (pattern, then the full deduction with explanation); Back, Replay, Next,
Jump to end, and a candidate view toggle. "Learn this technique" opens the lesson. "Other moves here" runs
each technique detector on its own via `findNextStep(grid, candidates, { techniques: [id] })` (forcing
chains skipped, at most 6 shown) and previews any of them on the board.

Entry points: the play menu's **Solve step by step** (from the current position; entries that disagree with
the solution must be cleared first: the dialog explains why and offers to clear them), and the learn home's
**Explore a puzzle** (current game, a generated Easy/Medium/Hard/Expert puzzle, or a pasted puzzle). If the
solver gets stuck it says: "The remaining position needs techniques Pencilmark does not implement yet."
Player notes are not used: the session starts from the placed digits with computed candidates.

## Accessibility

- All cells keep their spoken labels ("Row 3, column 4, empty, candidates 2, 6, 9"), including on lesson
  boards; diagrams are single images with a text description.
- Candidate taps on a 36-40 dp cell are hard, so every candidate exercise also works by tapping the cell
  and toggling **large 48 dp chips** with labels like "Candidate 6 in r2c4, marked for removal". The tiny
  candidate slots are hidden from screen readers so the accessible path is the chips.
- Feedback areas are live regions; demonstration parts are tabs with "Part 2 of 4: The pattern".
- Colour is never the only cue: eliminations have a strike, placements a filled disc, fins a square.

## Limitations

- Guided and mastery answers must match the engine's step exactly; a different valid instance of the same
  technique is not accepted (the feedback explains "out of the pattern's reach", which can feel strict).
- Mining a mastery position on the fly takes up to about 1 s on desktop for the hardest techniques (forcing
  chains, Sue de Coq); a spinner is shown. On slow phones it may take a few seconds.
- Guided solving computes the whole path up front; expert puzzles that need many forcing chains can take a
  few seconds before the first step appears.
- Foundation exercises use one classic puzzle; there is no randomisation yet.
- Hidden Quad has no practice puzzle (see above).
- `npx expo lint` is not run: the project has no ESLint configuration, and the command would install
  packages over the network.

## Engine issues

No incorrect deduction was found: every one of the 132 stored examples and every mined mastery position
re-validates against the brute-force solution (`src/learn/__tests__/positions.test.ts`).

Two explanation/fixture issues found while building learning mode were **fixed in review cycle 4**:

1. **Contradiction forcing-chain explanations showed propagation order as if it were a chain.** The text was
   built from breadth-first propagation order joined with " → ", so consecutive entries were often siblings,
   not cause and effect. Fixed in `src/engine/techniques/forcing.ts`: each branch now records which placement
   triggered the contradiction (`whyAt`), and the explanation shows only that causal trail (each placement
   triggered by the previous one). The trail cells are also highlighted. Stored fixtures were refreshed.
2. **Single-technique fixtures were near-complete grids** (Full House examples had one empty cell in the
   whole grid), which made the first lessons trivial. The mining score preferred fewer empty cells. Fixed in
   `scripts/engine-mine-examples.ts`, which now prefers early positions. Re-mined with `--singles`: Full House
   examples have 55 empty cells, Naked Single 57–58, Hidden Single 59–60.

Related UX fix (cycle 4): guided and mastery exercises used to accept only the engine's exact step. Now any
other valid Full House / Naked Single / Hidden Single in the position is accepted (checked directly on the
displayed candidates). Answers that are true but not the exercise's pattern get a kind "try again" instead
of being marked wrong (`src/learn/exercise.ts`, tests in `src/learn/__tests__/exercise.test.ts`).
