# Pencilmark Sudoku — Engine

The engine (`src/engine/**`) is pure TypeScript with no UI or React Native imports. UI code imports only
from `src/engine` (`index.ts`). Correctness is the top priority: every deduction shown to a learner must be
true, so every technique is checked against a brute-force solution in tests and in a stress script.

## Architecture

| Path | Role |
|---|---|
| `types.ts`, `grid.ts`, `rng.ts` | Grid model (81 numbers, 0 = empty), units/peers, 9-bit candidate masks, parsing, seeded PRNG. |
| `bruteSolver.ts` | Exhaustive solver (propagation + MRV). Counts solutions up to a limit; used for uniqueness and validation, never for teaching. |
| `generator.ts` | Random solved grid + clue carving with a uniqueness check after every removal (symmetric or non-symmetric). |
| `solver/state.ts` | Candidate-state model `SolverState { grid, cands, unique }`, `createState`, `applyStep`, `isBrokenState`. |
| `solver/solve.ts` | `findStepInState`, `findNextStepFor`, `solveLogically` (easiest-first, restart after each step). |
| `solver/validate.ts` | Safety net: `validateStep(step, solution, state)` and `stateConsistent`. |
| `techniques/*.ts` | One detector module per technique family; `catalog.ts` (taxonomy metadata) and `registry.ts` (id → detector). |
| `difficulty.ts` | `classifyDifficulty`, `ratePuzzle`. |
| `transform.ts` | Sudoku symmetries (digit relabel, row/column swaps in bands/stacks, band/stack swaps, transpose). |
| `bank/` | Generated puzzle bank (`bank.ts`) + picker. |
| `fresh.ts` | Slow path `generateFreshPuzzle`, clue tuning used by the bank builder. |
| `hints.ts` | `getHint`, `nudgeFor`. |
| `fixtures/` | Mined technique examples and practice puzzles + accessors. |
| `index.ts` | Public API. |

### Step contract

Every detector is `(state: SolverState) => Step | null` and returns only steps that make progress (at least
one placement into an empty cell that allows the digit, or one elimination of a candidate that is currently
present). The solver double-checks this (`makesProgress`). A `Step` carries `placements`, `eliminations`,
`patternCells`, `supportCells`, `units`, role-tagged `candidates` (`pattern`, `eliminate`, `place`,
`color-a`, `color-b`, `fin`), `links` for chains/colouring, and a one- or two-sentence `explanation` using
`r#c#` names (forcing chains need longer text).

### Public API (additive to the original scaffold)

Original signatures are unchanged: `generatePuzzle`, `getDailyPuzzle`, `findNextStep`, `getHint`,
`analyzePuzzle`, `techniqueName`, `isSolvable`, `Hint`, `PuzzleAnalysis`.
Additions: `findNextStep(grid, candidates?, opts?)` (optional third argument), `solveLogically`,
`applyStep` (on a `SolverState`), `applyStepToGrid`, `createSolverState`, `isBrokenState`, `TECHNIQUES`,
`TECHNIQUE_IDS`, `techniqueInfo`, `techniqueRank`, `classifyDifficulty`, `ratePuzzle`, `validateStep`,
`stateConsistent`, `generateFreshPuzzle`, `dailyDifficulty`, `nudgeFor`, `getTechniqueExamples`,
`getPracticePuzzles`, `encodeCandidates`/`decodeCandidates`, `bankSize`, `randomTransform`/`applyTransform`.

## Logical solver

`solveLogically(grid, opts?)` returns `{ steps, solved, stuckGrid?, stuckCandidates?, hardestTechnique, score,
techniqueCounts }`. It always tries techniques in catalog order (easiest first) and restarts from the top after
each step. Candidate states supplied by callers are intersected with the candidates implied by placed digits.
Detectors never run on a broken state (duplicate digits, an empty cell without candidates, or a unit where a
missing digit has nowhere to go); `findNextStep` returns null there.

Uniqueness techniques run only when `state.unique` is true. `findNextStep`/`solveLogically` set it
automatically by counting solutions of the current grid (about 1 ms); callers may override with
`opts.uniqueness`. A unique current grid is exactly what the deadly-pattern argument needs.

## Techniques

Solver order = table order. Tier is the puzzle difficulty implied when the technique is the hardest one needed.

| # | Id | Name | Level | Tier | Weight | Notes / conventions |
|---|---|---|---|---|---|---|
| 1 | full-house | Full House | 1 | easy | 1 | Last empty cell of a unit. |
| 2 | hidden-single | Hidden Single | 1 | easy | 2 | Boxes searched first, then rows, then columns. |
| 3 | naked-single | Naked Single | 1 | easy | 3 | |
| 4 | pointing | Pointing Pair/Triple | 2 | medium | 8 | Locked candidates type 1. |
| 5 | box-line-reduction | Box/Line Reduction | 2 | medium | 9 | Claiming, locked candidates type 2. |
| 6 | naked-pair | Naked Pair | 2 | medium | 10 | Locked pairs eliminate in both shared units. |
| 7 | hidden-pair | Hidden Pair | 2 | medium | 12 | |
| 8 | naked-triple | Naked Triple | 2 | medium | 14 | |
| 9 | hidden-triple | Hidden Triple | 2 | medium | 16 | |
| 10 | x-wing | X-Wing | 3 | hard | 24 | Size-2 basic fish. |
| 11 | skyscraper | Skyscraper | 3 | hard | 26 | Turbot shape: two parallel conjugate pairs. |
| 12 | two-string-kite | Two-String Kite | 3 | hard | 26 | Turbot shape: row + column pair joined in a box. |
| 13 | xy-wing | XY-Wing | 3 | hard | 28 | Y-Wing; shortest XY-Chain. |
| 14 | xyz-wing | XYZ-Wing | 3 | hard | 30 | |
| 15 | simple-coloring | Simple Colouring | 3 | hard | 32 | Colour wrap and colour trap; clusters of 3+ cells. |
| 16 | swordfish | Swordfish | 3 | hard | 34 | Size-3 basic fish. |
| 17 | naked-quad | Naked Quad | 3 | hard | 36 | |
| 18 | hidden-quad | Hidden Quad | 3 | hard | 38 | |
| 19 | turbot-fish | Turbot Fish | 4 | hard | 40 | General 4-cell X-Chain (strong–weak–strong, any unit types). Skyscraper and kite are turbot instances found first, so this id covers the remaining shapes (box conjugate pairs, empty-rectangle-like). |
| 20 | w-wing | W-Wing | 4 | hard | 42 | |
| 21 | unique-rectangle-1 | Unique Rectangle Type 1 | 4 | hard | 42 | Uniqueness. |
| 22 | unique-rectangle-2 | Unique Rectangle Type 2 | 4 | hard | 44 | Uniqueness. Floor corners share a row/column (no diagonal type). |
| 23 | unique-rectangle-4 | Unique Rectangle Type 4 | 4 | hard | 44 | Uniqueness. |
| 24 | bug-plus-one | BUG+1 | 4 | hard | 44 | Uniqueness. Strict check: every unit/digit count is 0 or 2 except the extra digit (3 in the cell's three units). |
| 25 | finned-x-wing | Finned X-Wing | 4 | hard | 46 | Includes sashimi (a base line with one cover candidate); the explanation says "Sashimi" then. |
| 26 | jellyfish | Jellyfish | 4 | hard | 48 | Size-4 basic fish. |
| 27 | finned-swordfish | Finned Swordfish | 4 | hard | 50 | Includes sashimi. |
| 28 | x-chain | X-Chain | 4 | expert | 60 | Single-digit AIC, up to 11 links. |
| 29 | xy-chain | XY-Chain | 4 | expert | 62 | Bivalue cells only, up to 13 links. |
| 30 | aic | Alternating Inference Chain | 4 | expert | 70 | Mixed bivalue/bilocal links, single-candidate nodes (no grouped nodes), up to 11 links. |
| 31 | als-xz | ALS-XZ | 4 | expert | 72 | Singly linked, ALSs of 1-4 cells, no overlap. |
| 32 | sue-de-coq | Sue de Coq | 5 | expert | 80 | Intersection of 2-3 cells; line and box parts of 1-3 cells. |
| 33 | forcing-chain | Forcing Chain | 5 | expert | 100 | Last resort. Cell, unit and contradiction forcing chains with singles-only propagation. |

Prerequisites, descriptions and conventions live in `techniques/catalog.ts` (`TECHNIQUES`).

### Algorithms (summary)

- **Singles / intersections / subsets**: direct scans; subsets use combinations of cells (naked) or digits
  (hidden) of size 2-4 inside one unit.
- **Fish**: per digit and orientation, 9-bit masks of positions per line. Basic fish: n base lines whose union
  of cover positions has size n. Finned: n base lines, every n-subset of their union as cover; fins (base
  candidates outside the cover) must lie in one box; eliminations are cover-line cells in the fin box outside
  the base lines. Proof: if no fin is true the fish holds; if a fin is true every target sees it.
- **Single-digit patterns**: conjugate pairs (exactly two positions in a unit). Skyscraper / kite / turbot are
  the chain `b1 = a1 – a2 = b2`; cells seeing both b1 and b2 lose the digit.
- **Wings**: bivalue-cell scans (XY, W) and trivalue pivots (XYZ).
- **Colouring**: BFS 2-colouring of each conjugate-pair cluster (skipping non-bipartite clusters).
- **Uniqueness**: rectangles over exactly two rows, two columns and two boxes, all four cells empty.
- **Chains**: a candidate graph with strong links (bivalue cells, bilocal units) and weak links (same cell,
  same digit in peer cells). Breadth-first search from every node, starting with a strong link and
  alternating; any chain ending with a strong link after at least 3 links proves "A or B", so every candidate
  weakly linked to both ends is removed. The implication holds for any alternating path, so soundness only
  depends on the link builders. The shortest chain with eliminations wins (ties: more eliminations).
- **ALS-XZ**: enumerate ALSs (N cells, N+1 digits) of size 1-4 in every unit; for each disjoint pair with a
  restricted common digit X, remove each other common digit Z from cells seeing all Z cells of both sets.
- **Sue de Coq**: for every box/line intersection subset C (2-3 cells, |V| >= |C|+2) and disjoint-candidate
  sets D (line) and E (box), require |C ∪ D ∪ E| cells to hold exactly that many digits. All those cells then
  hold different digits, so D's digits (and V's digits E cannot hold) stay in the line, and vice versa.
- **Forcing chains**: assumptions are propagated with event-driven naked/hidden singles. Branch sets are cells
  with 2-3 candidates and digits with 2-3 places in a unit (search cap). Conclusions: a contradiction refutes
  an assumption; a placement or elimination shared by every branch of a set is true. The conclusion with the
  shortest derivation is reported.
- **Death blossom** was not implemented: the stem/petal search is combinatorial, and ALS-XZ plus forcing
  chains already solve every generated puzzle we rated.

## Difficulty

`classifyDifficulty(hardest)` = tier of the hardest technique used by `solveLogically`:

- **easy**: singles only (full house, hidden single, naked single);
- **medium**: needs intersections or pairs/triples, nothing harder;
- **hard**: needs a level-3 or non-chain level-4 pattern: fish (incl. finned/sashimi, jellyfish), wings,
  colouring, skyscraper/kite/turbot, quads, unique rectangles, BUG+1;
- **expert**: needs X-Chain, XY-Chain, AIC, ALS-XZ, Sue de Coq or forcing chains, and is still fully solved.

Puzzles the logical solver cannot finish are **unrated** and never labelled (`analyzePuzzle` sets
`beyondTechniques: true` and no `difficulty`). The numeric **score** is the sum of technique weights over all
steps and orders puzzles within a level.

Clue tuning (bank builder): carved puzzles are filed under their natural difficulty or tuned down by adding
clues from the solution (which keeps uniqueness). Easy puzzles are topped up to 36-42 givens (singles only),
medium puzzles to 28-32 givens while staying medium.

## Puzzle bank and instant generation

`scripts/engine-build-bank.ts` writes `bank/bank.ts` (81-char strings + score + hardest technique).
`generatePuzzle(difficulty, seed)` picks an entry by seed, applies a random symmetry (`transform.ts`) and
solves it with `countSolutions` for the solution. The returned `hardestTechnique` and `score` are the bank
entry's. A test maps every solving step through the transform and replays it on the transformed puzzle:
every mapped step is valid, of the same technique, and the replay reproduces the stored score and hardest
technique exactly (a symmetry maps every technique instance onto an instance of the same technique).
Re-rating a transformed copy with the greedy solver can visit cells in a different order, so its step counts
and score can differ slightly; its difficulty and hardest technique matched in every case checked (see
below).

`getDailyPuzzle(dateKey)`: seed = FNV-1a of `daily:YYYY-MM-DD`; difficulty by weekday of the date
(Mon/Tue easy, Wed/Thu medium, Fri/Sat hard, Sun expert; invalid keys fall back to medium).
`generateFreshPuzzle(difficulty, seed, maxAttempts)` is the slow path for tools/tests.

## Hints

`getHint(grid, solution, notes?)`:
1. wrong digits (`mistake`), 2. notes that exclude the solution digit (`bad-notes`), 3. otherwise the next step
on the candidate state = computed candidates ∩ notes (cells with notes) — `{ kind: 'step', step, nudge,
techniqueName }` — or `none`. `nudgeFor(step)` names the unit for basic techniques and only the technique
family for advanced ones; it never names the digit or the target cells (tested on all mined examples).

## Learning fixtures

`scripts/engine-mine-examples.ts` records, from solving paths, positions where a technique is the next step
(all easier techniques exhausted), keeping the clearest few (small pattern, short chain, few eliminations), and
practice puzzles whose hardest technique is each technique. `getTechniqueExamples(id)` /
`getPracticePuzzles(id)` read them. Every stored example is re-validated by a test: the solver's next step on
the stored position is exactly the stored step, and it agrees with the brute-force solution.

## Validation evidence

All numbers below come from runs of `scripts/engine-stress.ts` (bun 1.4, Windows desktop, often with another
bun job running in parallel, so timings are conservative). "All-detector" runs execute every detector on every
intermediate state of the solving path and validate each step it returns, not just the step the solver picks.

| Run | Puzzles | Solver-path steps checked | Extra detector steps checked | Violations |
|---|---|---|---|---|
| All-detector, symmetric carving (final code) | 150 | 8,434 | 128,476 | 0 |
| All-detector, minimal non-symmetric (final code) | 150 | 9,233 | 133,869 | 0 |
| All-detector, bank sample of 300 (final code) | 300 | 16,991 | 235,497 | 0 (0 rating mismatches) |
| All-detector, symmetric + minimal (earlier build, before performance work) | 400 | 23,427 | 349,534 | 0 |
| Solver path, symmetric carving (†) | 2,000 | 111,489 | — | 0 |
| Solver path, minimal non-symmetric (†) | 2,000 | 123,739 | — | 0 |
| Solver path, whole bank + re-rating | 1,200 | 67,958 | — | 0 (0 rating mismatches) |

(†) Run before the last ALS-XZ / finned-fish / Sue de Coq speed-ups. Those changes keep the search order and results the same: the whole bank re-rates identically and every mined example re-validates.

Totals for the final code: 600 puzzles, 34,658 solver-path steps and 497,842 extra detector steps validated, 0 violations. Every technique produced validated steps in the all-detector runs (on the bank sample, for example: forcing chain 16,082, ALS-XZ 14,260, AIC 13,282, jellyfish 3,854, UR2 395, BUG+1 13); BUG+1 is the rarest because it needs an all-bivalue position.

**Difficulty distribution of freshly carved puzzles** (the † runs above):

| Carving | easy | medium | hard | expert | unrated |
|---|---|---|---|---|---|
| 180° symmetric, 2,000 puzzles | 1,341 (67%) | 210 (10.5%) | 262 (13.1%) | 187 (9.4%) | 0 |
| non-symmetric minimal, 2,000 puzzles | 808 (40%) | 374 (18.7%) | 402 (20.1%) | 416 (20.8%) | 0 |

No generated puzzle in these runs was unrated: forcing chains finished all of them.

**Bank** (`bank/bank.ts`, built in 405 s from 1,966 carving attempts; natural difficulty of the carved
puzzles: easy 1,048, medium 300, hard 310, expert 308):

| Difficulty | Puzzles | Avg givens | Hardest technique mix |
|---|---|---|---|
| easy | 300 | 39.2 | hidden single 300 |
| medium | 300 | 30.0 | pointing 208, naked pair 44, box/line 38, hidden pair 8, naked triple 2 |
| hard | 300 | 25.8 | skyscraper 109, XY-Wing 75, W-Wing 41, two-string kite 13, XYZ-Wing 11, X-Wing 8, BUG+1 8, UR1 8, finned X-Wing 7, finned Swordfish 7, simple colouring 4, UR2 3, UR4 3, turbot 2, naked quad 1 |
| expert | 300 | 25.2 | AIC 157, XY-Chain 99, forcing chain 29, ALS-XZ 11, X-Chain 3, Sue de Coq 1 |

**Transform invariance**: 2,400 transformed bank puzzles (2 random symmetries each) re-rated with the greedy
solver: 0 difficulty mismatches, 0 hardest-technique mismatches; the score differed in 1,395 cases (different
visiting order; the stored score is reproduced exactly by the mapped path, which a test checks).

**Timings** (bun, desktop):
- `generatePuzzle` (bank + transform + brute-force solution): average 1.0-1.5 ms, p99 3.7-8.6 ms, worst
  observed 43 ms (a GC pause under load). Hermes on a phone is slower than bun, but this leaves a large margin
  under 50 ms.
- `findNextStep` on solving-path states: p50 about 0.1 ms, p90 about 0.3 ms, p99 12-18 ms. Positions that
  need forcing chains cost 50-100 ms (all cheaper detectors fail first); single outliers up to about 230 ms
  were seen under parallel load.
- Raw carving: 60-130 ms per puzzle; logical solve of a whole puzzle: about 36-58 ms on average.

**Fixtures**: 4 mined examples for every one of the 33 techniques (132 positions, mined from 41,297 solved puzzles in total). Practice puzzles: 6 per technique, except naked quad 3, jellyfish 2 and hidden quad 0. Puzzles whose hardest step is a hidden quad or a jellyfish are very rare. A hidden quad is the next step only when no naked subset of size 4 or less gives the same eliminations, and a jellyfish only when its complementary fish (size 3 or less) in the other direction does not exist. The full-house practice puzzles are built by removing one cell from each row, column and box of a solved grid.

**Tests**: `npx jest src/engine`: 7 suites, 218 tests, about 35 s (jest-expo startup included).

## Scripts (bun)

| Script | Purpose |
|---|---|
| `bun scripts/engine-stress.ts [n] [--seed=S] [--minimal] [--no-all] [--bank]` | Generate, solve and validate; `--bank` also re-rates bank entries. Exits non-zero on any violation. |
| `bun scripts/engine-build-bank.ts [--per=300] [--expert=300] [--seed=S]` | Rebuild `bank/bank.ts` (about 7 minutes). Needed after any detector change that alters results. |
| `bun scripts/engine-mine-examples.ts [--minutes=M] [--seed=S]` | Mine fixtures from scratch; `--merge` keeps stored fixtures and mines more; `--refresh` recomputes the stored steps (explanation text) for the stored positions. |
| `bun scripts/engine-check-invariance.ts [k]` | Re-rate every bank puzzle under k random symmetries. |
| `bun scripts/engine-bench-detector.ts <id> [n]` | Time one detector on every solving-path state. |

## Known limitations

- Chains use single-candidate nodes only (no grouped nodes, no ALS nodes); chain length is capped.
- Unique rectangle types 3, 5, 6 and hidden rectangles are not implemented; type 2 requires the floor
  corners to share a row/column.
- Forcing chains propagate with singles only and only branch on cells with 2-3 candidates and digits with
  2-3 places in a unit; puzzles needing more are reported as unrated / beyond techniques.
- Death blossom, finned jellyfish, Franken/mutant fish, empty rectangles (as a named technique) and
  3D Medusa are not implemented.
- The greedy easiest-first path depends on scan order, so the score of a transformed copy can differ
  slightly from the stored score (difficulty and hardest technique do not change in practice).
