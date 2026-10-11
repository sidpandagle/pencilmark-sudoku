# Pencilmark Sudoku — Educational Series ("One Technique")

> Status: **planning document. Nothing is published.** Every episode needs the owner's approval before posting.
> Written 2026-10-11. Follows the app curriculum exactly: `marketing/data/curriculum.json` (42 lessons, 5 levels).

Format, brand, safe area and export rules: `VIDEO_SCRIPTS.md` sections 0 and 7 (series template F1).
Calendar placement: `CONTENT_CALENDAR.md`.

## How to read this document

- **One concept per episode.** Episode number = curriculum position (E01–E42). Seasons = levels.
- **Board** is always a real engine position: `technique-id #index` for fixture examples from
  `marketing/data/technique-examples.json` (example 0 of each technique), or `technique (mined: practice:<source>#<n>
  step <k>)` for positions mined from another technique's practice puzzle (`marketing/data/explainers.json` →
  `source` / `minedFrom`). Cell names use the engine's `r#c#` notation (row, column).
- **Engine explanation** is quoted verbatim. On-screen text may split it across beats but must not change the logic.
  The VO may paraphrase, but must say the same thing.
- **Result**: the engine's next step after the deduction ("payoff") when the export has one; otherwise show the
  candidate(s) removed and stop there.
- **Foundation lessons** (no engine technique) use either an engine example that illustrates the idea, a real
  practice puzzle, or the app lesson's own hand-built positions (all from one classic puzzle, verified in
  `src/learn/__tests__/foundations.test.ts`) shown via screen capture.
- **Uniqueness techniques** (E33–E36) must show: "Only valid when the puzzle has exactly one solution."
- **Format per episode:** Short 30–45 s (9:16, 1080×1920, `explainer.html?tech=<id>` or `showcase.html`) plus an
  optional 2–4 min long-form segment (16:9) that adds the "Why it works" and "Watch out" cards. Season compilations
  stitch the long-form segments.
- **Rendered** episodes: E05, E14, E18 (see `marketing/MANIFEST.md`; files in `marketing/renders/`). All others: storyboard only. To render
  another technique, add it to `explainers.json` with `scripts/export-data.ts` and write its caption script in
  `src/scenes/explainer.html`.
- **No lesson spoilers:** in the app, fixture example #0 is the lesson's "See it in a puzzle" demo, #1 is the "Your
  turn" exercise and #2–#3 are the mastery check. Marketing uses only #0 or positions mined from *other* techniques'
  practice puzzles (the app mines extra mastery positions only from the technique's own practice list), so no lesson
  is spoiled. The rendered explainers follow this: `hidden-single #0` (fixture), `naked-pair (mined:
  practice:simple-coloring#2 step 25)`, `x-wing (mined: practice:unique-rectangle-4#5 step 17)`. Never screen-capture
  a lesson's "Your turn" or mastery board.
- **Stills** for posting (see MANIFEST.md): `marketing/exports/yt-thumbnail-{hidden-single,naked-pair,x-wing}-1280x720.png`,
  `shorts-cover-{hidden-single,naked-pair,x-wing}-1080x1920.png`, `background-{light,dark,brand}-{1920x1080,1080x1920}.png`
  (thumbnails and covers for other episodes: a background plus the episode title).

## Season overview

| Season | Level | Episodes | Theme (curriculum.json blurb) |
|---|---|---|---|
| 1 | 1 · First steps | E01–E09 (9) | The rules, scanning, candidates and the three singles. |
| 2 | 2 · Beginner | E10–E17 (8) | Keep notes tidy, then use intersections, pairs and triples. |
| 3 | 3 · Intermediate | E18–E27 (10) | Fish, wings, colouring and your first chains. |
| 4 | 4 · Advanced | E28–E40 (13) | Finned fish, uniqueness, longer chains and almost locked sets. |
| 5 | 5 · Expert | E41–E42 (2) | Sue de Coq and forcing chains, the last resort. |

---

## Season 1 — Level 1 · First steps

### E01 · The rules
- **Level / lesson id:** 1 / `rules` (foundation)
- **Learning goal:** Each row, column and 3×3 box holds every digit 1–9 exactly once; these 27 groups are "units".
- **Board:** no deduction. Use the real solved grid from `solve-loop.json` (solution of puzzle
  `5.2...697..4...1...63..7254..974..283...5...14.7.819...48219.36..5...412.31..48.9`) to show a complete valid grid, and
  the app lesson's hand-built "tap the conflicting cell" exercise (exactly one conflict, verified) via `cap:lesson-rules`.
- **Engine explanation:** none (foundation).
- **Beats:** Hook "Three rules. That's all Sudoku is." → Where to look: one row, one column, one box lit in turn →
  Pattern: digits 1–9 tick off in each → Deduction: a duplicate is impossible (lesson's conflict exercise) →
  Result: a full valid grid → Takeaway.
- **Takeaway:** Every row, column and box: digits 1 to 9, once each.
- **Common mistake:** Forgetting that boxes are units too, not just rows and columns.
- **Length / format:** Short 25–30 s; long-form segment 1 min (units and peers: a cell "sees" 20 other cells).
- **In-app tie-in:** Learn → Level 1 → "The rules".

### E02 · Givens vs your entries
- **Level / lesson id:** 1 / `givens` (foundation)
- **Learning goal:** Givens are fixed; your entries can be changed. Pencilmark shows givens in heavy ink and your
  digits in blue.
- **Board:** real app capture `play-entries.png` (puzzle of `x-wing (mined: practice:unique-rectangle-4#5 step 17)`, imported; givens ink, entries blue); app lesson
  "tap a cell you may change" exercise via `cap:lesson-givens`.
- **Engine explanation:** none (foundation).
- **Beats:** Hook "Which of these digits can you change?" → Where: the board → Pattern: ink vs blue →
  Deduction: only blue cells are yours → Result: lesson exercise answer → Takeaway.
- **Takeaway:** Never doubt a given; always be ready to doubt your own entries.
- **Common mistake:** Treating an early entry as if it were a given and building on a wrong digit.
- **Length / format:** Short 20–30 s; no long-form needed (fold into the E01 long-form).
- **In-app tie-in:** "Givens vs your entries".

### E03 · Scanning and cross-hatching
- **Level / lesson id:** 1 / `scanning` (foundation)
- **Learning goal:** Use digits outside a box to rule out cells inside it.
- **Board:** `hidden-single #0` cross-hatch data (`explainers.json` → `crossHatch`): the 5 at r9c4 rules out r1c4 and
  r3c4 (column 4); the 5 at r2c7 rules out r2c5 and r2c6 (row 2); the 5 at r6c6 rules out r3c6 (column 6).
  (Rendered inside `explainer-hidden-single-1080x1920.mp4`; reuse that segment.)
- **Engine explanation (resulting step):** "In box 2, 5 can only go in r1c5, so r1c5 = 5."
- **Beats:** Hook "Where can the 5 go in box 2?" → Where: box 2, its 6 empty cells → Pattern: 5s in column 4, row 2
  and column 6 → Deduction: lines sweep, five cells struck → Result: one cell left, r1c5 → Takeaway.
- **Takeaway:** Pick a digit, pick a box, and let the digits outside cross cells out.
- **Common mistake:** Scanning only rows; columns cross-hatch just as often.
- **Length / format:** Short 30 s (trim of the rendered explainer, 0–18.6 s + end card); long-form 1–2 min.
- **In-app tie-in:** "Scanning and cross-hatching" (its exercise: place a cross-hatched digit).

### E04 · Full House
- **Level / lesson id:** 1 / `full-house`
- **Learning goal:** The last empty cell of a unit takes the missing digit.
- **Board:** `full-house #0`.
- **Engine explanation:** "Box 3 has only one empty cell left, so r1c8 must be 1, the missing digit."
- **Beats:** Hook "One empty cell. Which digit?" → Where: box 3 → Pattern: eight digits present, r1c8 empty →
  Deduction: the missing digit is 1 → Result (payoff): "In column 2, 9 can only go in r1c2, so r1c2 = 9." → Takeaway.
- **Takeaway:** List the eight digits you see; name the ninth.
- **Common mistake:** Writing the digit you expect instead of the one that is missing (and trusting a unit that
  contains a wrong entry).
- **Length / format:** Short 25–30 s; long-form 1 min.
- **In-app tie-in:** "Full House".

### E05 · Hidden Single — Rendered: yes — see MANIFEST.md
- **Level / lesson id:** 1 / `hidden-single`
- **Learning goal:** A digit with only one possible cell in a unit goes there, even if that cell has other candidates.
- **Board:** `hidden-single #0` (`explainers.json`, fixture — the lesson's own worked demo; rendered as
  `explainer-hidden-single-1080x1920.mp4`).
- **Engine explanation:** "In box 2, 5 can only go in r1c5, so r1c5 = 5."
- **Beats:** Hook "Box 2 needs a 5. Only one cell can take it. Can you spot it?" → Where: box 2 → Pattern: 5s in column 4,
  row 2 and column 6 → Deduction: r1c4, r3c4, r2c5, r2c6, r3c6 ruled out → Result: r1c5 = 5, then payoff "In box 2, 8
  can only go in r2c5, so r2c5 = 8." → Takeaway.
- **Takeaway:** Pick a digit and a box. Cross out every cell it can't use. One left? Place it.
- **Common mistake:** Confusing it with a naked single — r1c5 still has candidates 2, 3, 4, 5, 6, 8; what matters is that the
  digit 5 has only one home.
- **Length / format:** Short 31 s incl. end card (rendered); long-form 2 min (same position, plus the payoff and the
  "Why it works" card).
- **In-app tie-in:** "Hidden Single".

### E06 · Pencil marks (candidates)
- **Level / lesson id:** 1 / `candidates` (foundation)
- **Learning goal:** A cell's candidates are the digits not yet seen in its row, column or box; notes are an honest
  record of eliminations.
- **Board:** app captures `notes-1-manual.png`, `notes-1b-manual.png`, `notes-2-autofill.png` (puzzle of `x-wing (mined: practice:unique-rectangle-4#5 step 17)`);
  the lesson's "fill a cell's candidates" exercise (answer verified equal to `computeCandidates`) via `cap:lesson-candidates`.
- **Engine explanation:** none (foundation).
- **Beats:** Hook "What could this cell still be?" → Where: one empty cell and its row/column/box → Pattern: digits it
  sees → Deduction: the rest are candidates → Result: auto-fill for the whole board → Takeaway.
- **Takeaway:** Candidates = 1–9 minus everything the cell can see.
- **Common mistake:** Leaving out a candidate "because it feels unlikely"; notes must be complete to be trusted.
- **Length / format:** Short 30–35 s; long-form 1–2 min (manual vs auto-fill notes).
- **In-app tie-in:** "Pencil marks (candidates)"; in play, Notes and Auto-fill notes.

### E07 · Naked Single
- **Level / lesson id:** 1 / `naked-single`
- **Learning goal:** A cell with only one remaining candidate takes it.
- **Board:** `naked-single #0`.
- **Engine explanation:** "Every digit except 3 already appears in the row, column or box of r1c8, so r1c8 = 3."
- **Beats:** Hook "This cell can only be one digit. Which?" → Where: r1c8 with its row, column and box → Pattern:
  digits seen tick off 1–9 → Deduction: only 3 remains → Result (payoff): "In column 7, 3 can only go in r7c7, so
  r7c7 = 3." → Takeaway.
- **Takeaway:** Check the cell's row, column and box together; if eight digits are seen, place the ninth.
- **Common mistake:** Forgetting the box — rows and columns alone often leave two digits.
- **Length / format:** Short 30 s; long-form 1 min, paired with E05 ("hidden vs naked").
- **In-app tie-in:** "Naked Single".

### E08 · Contradictions
- **Level / lesson id:** 1 / `contradictions` (foundation)
- **Learning goal:** A wrong digit shows itself as a duplicate, a cell with no candidates, or a digit with no place in
  a unit.
- **Board:** the app lesson's hand-built positions (exactly one conflict; exactly one dead cell; verified) via
  `cap:lesson-contradictions`. Optional long-form illustration of "a digit with no place left" from
  `forcing-chain #0` (see E42) — label it as an expert-level example.
- **Engine explanation:** none for the Short; long-form quote: "Forcing chain (contradiction): if r5c9 were 1, singles
  would follow (r5c9 = 1 → r7c3 = 1), and then 1 would have no place left in box 9. So r5c9 cannot be 1."
- **Beats:** Hook "How do you know you made a mistake?" → Where: lesson board → Pattern: the dead cell (no candidates)
  → Deduction: something earlier was wrong → Result: lesson answer → Takeaway.
- **Takeaway:** A cell with no candidates means an earlier digit is wrong — go back, don't push on.
- **Common mistake:** Erasing the cell that shows the problem instead of finding the entry that caused it.
- **Length / format:** Short 30 s; long-form 1–2 min.
- **In-app tie-in:** "Contradictions".

### E09 · Logic vs guessing
- **Level / lesson id:** 1 / `logic-vs-guessing` (foundation)
- **Learning goal:** Every move should have a reason you can explain; a well-made puzzle never needs a guess.
- **Board:** app lesson cards via `cap:lesson-logic-vs-guessing`; `hint-3-explain.png` as an example of a stated reason
  (`x-wing (mined: practice:unique-rectangle-4#5 step 17)`). Every Pencilmark puzzle has exactly one solution
  (PLAY_STORE.md).
- **Engine explanation:** none (foundation). If a reason is shown, use the hint capture's text: "X-Wing on 1: in rows 2
  and 9, 1 can only go in columns 1 and 4. One 1 per base line fills each of those columns, so remove 1 from r3c4."
- **Beats:** Hook "If you can't explain the move, it's a guess." → Where: lesson card → Pattern: reason first, digit
  second → Deduction: hint panel shows a reason → Result: confidence, no erasing → Takeaway.
- **Takeaway:** Before you write a digit, say why. No reason, no digit.
- **Common mistake:** "Trying a number to see what happens" and losing track of which digits were guesses.
- **Length / format:** Short 28–35 s; long-form 2 min (what forcing chains are, and why they are not guessing — link to E42).
- **In-app tie-in:** "Logic vs guessing".

---

## Season 2 — Level 2 · Beginner

### E10 · Systematic scanning
- **Level / lesson id:** 2 / `systematic-scanning` (foundation)
- **Learning goal:** A fixed routine that never misses an easy move (Pencilmark's solver looks for hidden singles in
  boxes first, then rows, then columns).
- **Board:** `grid-loop-1080x1920.mp4` (rendered; `solve-loop.json`: a real easy puzzle solved in engine order, 21 Full
  House + 18 Hidden Single steps); lesson routine via `cap:lesson-systematic-scanning`.
- **Engine explanation:** none (foundation); optionally show the first steps' explanations from a `cap:guided-solve` run
  of the same puzzle.
- **Beats:** Hook "39 moves, no guessing, one routine." → Where: digit by digit, box by box → Pattern: full houses and
  hidden singles appear → Deduction: each placement opens the next → Result: solved grid → Takeaway.
- **Takeaway:** Go digit by digit through every box, then rows, then columns; repeat after each placement.
- **Common mistake:** Jumping to advanced techniques while an easy single is still on the board.
- **Length / format:** Short 25–30 s (grid loop + captions); long-form 2 min.
- **In-app tie-in:** "Systematic scanning"; "Explore a puzzle" on the learn home.

### E11 · Candidate management
- **Level / lesson id:** 2 / `candidate-management` (foundation)
- **Learning goal:** Keep pencil marks correct after every placement.
- **Board:** `notes-2-autofill.png` → `play-notes.png` (puzzle of `x-wing (mined: practice:unique-rectangle-4#5 step 17)`); the lesson's "clean up notes after a
  placement" exercise (answer verified = the peers holding the digit) via `cap:lesson-candidate-management`.
- **Engine explanation:** none (foundation).
- **Beats:** Hook "Your notes are lying to you." → Where: a fresh placement → Pattern: same digit in notes of its peers
  → Deduction: remove them → Result: cleaner board → Takeaway.
- **Takeaway:** Place a digit, then erase it from every note in its row, column and box.
- **Common mistake:** Trusting notes that were never updated.
- **Length / format:** Short 25–30 s (see VIDEO_SCRIPTS M5); long-form 1 min.
- **In-app tie-in:** "Candidate management".

### E12 · Pointing Pair/Triple
- **Level / lesson id:** 2 / `pointing`
- **Learning goal:** If a digit's candidates in a box all lie in one line, that digit leaves the rest of the line.
- **Board:** `pointing #0`.
- **Engine explanation:** "In box 1, 3 can only be in row 3 (r3c1 and r3c2), a pointing pair. So 3 can be removed from
  the rest of row 3: r3c9."
- **Beats:** Hook "The box points. The row obeys." → Where: box 1 → Pattern: 3 only in r3c1, r3c2 → Deduction: strike 3
  in r3c9 → Result (payoff): "r3c9 has only one candidate left, 9, so r3c9 = 9." → Takeaway.
- **Takeaway:** Box → line: if a digit is stuck on one line inside a box, clear it from the rest of that line.
- **Common mistake:** Removing the digit from the rest of the box instead of the rest of the line.
- **Length / format:** Short 30–35 s; long-form 2 min with E13.
- **In-app tie-in:** "Pointing Pair/Triple".

### E13 · Box/Line Reduction
- **Level / lesson id:** 2 / `box-line-reduction`
- **Learning goal:** If a digit's candidates in a line all lie in one box, that digit leaves the rest of the box ("claiming").
- **Board:** `box-line-reduction #0`.
- **Engine explanation:** "In row 3, 3 can only be in box 2 (r3c4 and r3c6). So 3 can be removed from the rest of
  box 2: r1c4."
- **Beats:** Hook "Now the row gives the orders." → Where: row 3 → Pattern: 3 only in r3c4, r3c6, both in box 2 →
  Deduction: strike 3 in r1c4 → Result (payoff): "r1c4 has only one candidate left, 7, so r1c4 = 7." → Takeaway.
- **Takeaway:** Line → box: if a digit is stuck in one box along a line, clear it from the rest of that box.
- **Common mistake:** Mixing up the two intersection moves: pointing starts from a box, claiming starts from a line.
- **Length / format:** Short 30–35 s; long-form shared with E12 (see VIDEO_SCRIPTS TT3).
- **In-app tie-in:** "Box/Line Reduction".

### E14 · Naked Pair — Rendered: yes — see MANIFEST.md
- **Level / lesson id:** 2 / `naked-pair`
- **Learning goal:** Two cells in a unit with the same two candidates claim both digits; those digits leave the rest
  of the unit.
- **Board:** `naked-pair (mined: practice:simple-coloring#2 step 25)` (`explainers.json`, rendered as
  `explainer-naked-pair-1080x1920.mp4`). Long-form adds
  `naked-pair #0`: "In box 2, r2c4 and r3c5 contain only the candidates {5,7}, a naked pair, so those digits must go in
  these cells. Remove 7 from r1c5."
- **Engine explanation:** "In row 5, r5c1 and r5c4 contain only the candidates {1,2}, a naked pair, so those digits must
  go in these cells. Remove 1 from r5c3, r5c6 and r5c7 and 2 from r5c3 and r5c6."
- **Beats:** Hook "Two cells, two digits, and a guaranteed elimination." → Where: row 5 → Pattern: r5c1, r5c4 = {1,2}
  → Deduction: strike 1 in r5c3, r5c6, r5c7 and 2 in r5c3, r5c6 → Result (payoff): "r5c3 has only one candidate left,
  3, so r5c3 = 3." (r5c3 was {1,2,3}) → Takeaway.
- **Takeaway:** Two cells with the same two candidates? Clear those digits from the rest of the unit.
- **Common mistake:** Using cells that contain the two digits among other candidates — both cells must have only those two.
- **Length / format:** Short 31 s incl. end card (rendered); long-form 2 min with both positions.
- **In-app tie-in:** "Naked Pair".

### E15 · Hidden Pair
- **Level / lesson id:** 2 / `hidden-pair`
- **Learning goal:** Two digits that fit only the same two cells of a unit reserve those cells; other candidates leave them.
- **Board:** `hidden-pair #0`.
- **Engine explanation:** "In box 2, the digits 4 and 8 can only go in r2c4 and r3c4, a hidden pair. So these cells
  cannot hold anything else: remove 7 from r3c4."
- **Beats:** Hook "The pair is hiding behind extra notes." → Where: box 2 → Pattern: 4 and 8 only in r2c4, r3c4 →
  Deduction: strike 7 in r3c4 → Result: r3c4 left with the pair (no payoff in export) → Takeaway.
- **Takeaway:** Look at digits, not cells: two digits, same two homes → everything else leaves those cells.
- **Common mistake:** Removing the pair digits elsewhere — the eliminations are the *other* digits inside the two cells.
- **Length / format:** Short 30–35 s; long-form 1–2 min contrasting naked vs hidden.
- **In-app tie-in:** "Hidden Pair".

### E16 · Naked Triple
- **Level / lesson id:** 2 / `naked-triple`
- **Learning goal:** Three cells in a unit holding only three digits between them claim those digits.
- **Board:** `naked-triple #0`.
- **Engine explanation:** "In row 7, r7c1, r7c6 and r7c8 contain only the candidates {4,5,6}, a naked triple, so those
  digits must go in these cells. Remove 5 from r7c9."
- **Beats:** Hook "Three cells, three digits — even if no cell shows all three." → Where: row 7 → Pattern: union of
  r7c1, r7c6, r7c8 = {4,5,6} → Deduction: strike 5 in r7c9 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** Count the union: three cells, three digits total → those digits leave the rest of the unit.
- **Common mistake:** Thinking each cell must show all three candidates.
- **Length / format:** Short 30–35 s; long-form 1 min.
- **In-app tie-in:** "Naked Triple".

### E17 · Hidden Triple
- **Level / lesson id:** 2 / `hidden-triple`
- **Learning goal:** Three digits that fit only the same three cells of a unit reserve those cells.
- **Board:** `hidden-triple #0`.
- **Engine explanation:** "In box 1, the digits 6, 7 and 8 can only go in r1c1, r3c1 and r3c3, a hidden triple. So
  these cells cannot hold anything else: remove 9 from r3c3."
- **Beats:** Hook "Three digits, three homes." → Where: box 1 → Pattern: 6, 7, 8 only in r1c1, r3c1, r3c3 →
  Deduction: strike 9 in r3c3 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** Three digits confined to three cells → clear every other digit from those cells.
- **Common mistake:** Looking at cells instead of digits; the test is where each digit can go.
- **Length / format:** Short 30–35 s; long-form 1 min.
- **In-app tie-in:** "Hidden Triple".

---

## Season 3 — Level 3 · Intermediate

### E18 · X-Wing — Rendered: yes — see MANIFEST.md
- **Level / lesson id:** 3 / `x-wing`
- **Learning goal:** Base lines and cover lines: if a digit fits only the same two positions in two lines, it leaves
  the crossing lines.
- **Board:** `x-wing (mined: practice:unique-rectangle-4#5 step 17)` (`explainers.json`, rendered as
  `explainer-x-wing-1080x1920.mp4`; the in-game hint captures show the same position). Long-form adds `x-wing #0`
  (also the in-app lesson demo, captured in `lesson-demo-*.png`): "X-Wing on 2: in columns 3 and 6, 2 can only go in
  rows 3 and 5. One 2 per base line fills each of those rows, so remove 2 from r3c5."
- **Engine explanation:** "X-Wing on 1: in rows 2 and 9, 1 can only go in columns 1 and 4. One 1 per base line fills
  each of those columns, so remove 1 from r3c4."
- **Beats:** Hook "Four cells, one digit, one safe elimination." → Where: rows 2 and 9 → Pattern: r2c1, r2c4, r9c1,
  r9c4 → Deduction: strike 1 in r3c4 → Result (payoff): "r3c4 has only one candidate left, 7, so r3c4 = 7." → Takeaway.
- **Takeaway:** One digit, two lines, the same two spots? Clear it from the crossing lines.
- **Common mistake:** Removing the digit from the base lines (or the corners) instead of the cover lines.
- **Length / format:** Short 35 s incl. end card (rendered); long-form 3 min (lesson demo captures + in-game hint, see VIDEO_SCRIPTS T4).
- **In-app tie-in:** "X-Wing"; hint panel "Lesson" button.

### E19 · Strong and weak links (chains intro)
- **Level / lesson id:** 3 / `chains-intro` (foundation)
- **Learning goal:** Strong link (=) means at least one is true; weak link (–) means at most one is true; chains
  alternate them. Eureka notation.
- **Board:** `skyscraper #0` chain as the worked illustration: "1r5c1 = 1r5c4 – 1r9c4 = 1r9c3" (row 5 has 1 in only two
  cells → strong; r5c4 and r9c4 share column 4 → weak). Definitions as printed by the engine in `x-chain #0`:
  "("=" means at least one is true, "–" means at most one is true)". App lesson cards via `cap:lesson-chains-intro`.
- **Engine explanation (illustration):** see E20.
- **Beats:** Hook "Two kinds of link run every chain." → Where: row 5's two 1s → Pattern: strong link drawn solid,
  weak link dashed → Deduction: strong–weak–strong means one end is true → Result: preview of the skyscraper
  elimination → Takeaway.
- **Takeaway:** "=" at least one; "–" not both. Alternate them, start and end strong.
- **Common mistake:** Treating a weak link as strong (a weak link only means "not both").
- **Length / format:** Short 35–45 s; long-form 3 min (foundation for E20–E22, E28, E37–E39).
- **In-app tie-in:** "Strong and weak links".

### E20 · Skyscraper
- **Level / lesson id:** 3 / `skyscraper`
- **Learning goal:** Two parallel conjugate pairs sharing one end line; a cell seeing both other ends loses the digit.
- **Board:** `skyscraper #0`.
- **Engine explanation:** "Skyscraper on 1: row 5 and row 9 each have 1 in only two cells, and r5c4 and r9c4 line up in
  column 4 (only one of them can be 1), so at least one of r5c1 and r9c3 is 1 (chain 1r5c1 = 1r5c4 – 1r9c4 = 1r9c3).
  Remove 1 from r6c3, which sees both."
- **Beats:** Hook "Two towers, one digit." → Where: rows 5 and 9 → Pattern: r5c1, r5c4, r9c3, r9c4 → Deduction: strike 1
  in r6c3 → Result (payoff): "In column 3, 1 can only go in r9c3, so r9c3 = 1." → Takeaway.
- **Takeaway:** Two lines with a digit in exactly two places, one end lined up → cells seeing both tops lose it.
- **Common mistake:** Removing the digit from cells that see only one roof cell.
- **Length / format:** Short 35 s (VIDEO_SCRIPTS A1); long-form 2 min.
- **In-app tie-in:** "Skyscraper".

### E21 · Two-String Kite
- **Level / lesson id:** 3 / `two-string-kite`
- **Learning goal:** A row conjugate pair and a column conjugate pair tied in a box; a cell seeing both far ends loses
  the digit.
- **Board:** `two-string-kite #0`.
- **Engine explanation:** "Two-string kite on 4: row 2 and column 3 each have 4 in only two cells, and r2c1 and r1c3
  share box 1 (only one of them can be 4), so at least one of r2c5 and r8c3 is 4 (chain 4r2c5 = 4r2c1 – 4r1c3 = 4r8c3).
  Remove 4 from r8c5, which sees both."
- **Beats:** Hook "A row, a column, and a knot in box 1." → Where: row 2 and column 3 → Pattern: r2c1, r2c5, r1c3,
  r8c3 → Deduction: strike 4 in r8c5 → Result (payoff): "r8c5 has only one candidate left, 9, so r8c5 = 9." → Takeaway.
- **Takeaway:** Tie a row pair and a column pair in one box; the far ends' common peer loses the digit.
- **Common mistake:** Using the same cell as both box ends — they must be two different cells.
- **Length / format:** Short 35 s; long-form 2 min.
- **In-app tie-in:** "Two-String Kite".

### E22 · Simple Colouring
- **Level / lesson id:** 3 / `simple-coloring`
- **Learning goal:** Colour a digit's conjugate-pair chain in two colours; exactly one colour is true (colour trap /
  colour wrap).
- **Board:** `simple-coloring #0` (pattern cells r2c5, r3c4, r8c5, r8c9). Colour roles must come from the engine step
  (`color-a` / `color-b`), which needs an `export-data.ts` change — do not hand-assign.
- **Engine explanation:** "Simple colouring on 4: colour the chain of conjugate pairs alternately; one colour holds all
  the 4s. r3c9 sees both a blue and an orange cell, so remove 4 from it."
- **Beats:** Hook "Colour the 4s. One colour is the truth." → Where: units where 4 has two places → Pattern: chain
  coloured blue/orange → Deduction: r3c9 sees both colours, strike 4 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** Whichever colour is true, a cell that sees both colours can't hold the digit.
- **Common mistake:** In a colour trap, removing the digit from a cell that sees only one colour.
- **Length / format:** Short 35 s (VIDEO_SCRIPTS A3); long-form 3 min (trap vs wrap; Pencilmark uses clusters of 3+ cells).
- **In-app tie-in:** "Simple Colouring".

### E23 · Swordfish
- **Level / lesson id:** 3 / `swordfish`
- **Learning goal:** The X-Wing idea with three base lines and three cover lines.
- **Board:** `swordfish #0`.
- **Engine explanation:** "Swordfish on 3: in columns 1, 7 and 9, 3 can only go in rows 1, 6 and 9. One 3 per base line
  fills each of those rows, so remove 3 from r1c2 and r9c8."
- **Beats:** Hook "An X-Wing with a third line." → Where: columns 1, 7, 9 → Pattern: r1c1, r1c7, r6c7, r6c9, r9c1, r9c9
  → Deduction: strike 3 in r1c2 and r9c8 → Result: candidates removed (no payoff) → Takeaway.
- **Takeaway:** Three lines whose candidates for a digit fit inside three crossing lines → clear the rest of those crossing lines.
- **Common mistake:** Thinking every base line needs all three spots — two is enough if the three lines together use
  exactly three cover lines (this example's columns each have only two).
- **Length / format:** Short 35–40 s; long-form 2 min.
- **In-app tie-in:** "Swordfish".

### E24 · XY-Wing
- **Level / lesson id:** 3 / `xy-wing`
- **Learning goal:** A bivalue pivot {x,y} sees pincers {x,z} and {y,z}; cells seeing both pincers lose z.
- **Board:** `xy-wing #0`.
- **Engine explanation:** "XY-Wing: pivot r7c3 {6,7} sees r7c8 {5,6} and r8c1 {5,7}. Whether the pivot is 6 or 7, one of
  the pincers must be 5, so remove 5 from r8c8."
- **Beats:** Hook "Three cells. Two cases. Same answer." → Where: pivot r7c3 → Pattern: pincers r7c8, r8c1 → Deduction:
  strike 5 in r8c8 → Result (payoff): "In box 9, 5 can only go in r7c8, so r7c8 = 5." → Takeaway.
- **Takeaway:** If every case of the pivot makes some pincer z, cells seeing both pincers can't be z.
- **Common mistake:** Removing z from cells that see the pivot and only one pincer.
- **Length / format:** Short 32 s (VIDEO_SCRIPTS A2); long-form 2 min.
- **In-app tie-in:** "XY-Wing".

### E25 · XYZ-Wing
- **Level / lesson id:** 3 / `xyz-wing`
- **Learning goal:** A pivot {x,y,z} with pincers {x,z} and {y,z}; only cells seeing all three lose z.
- **Board:** `xyz-wing #0`.
- **Engine explanation:** "XYZ-Wing: pivot r5c4 {4,7,8} sees r3c4 {7,8} and r6c6 {4,8}. One of these three cells must
  be 8, so remove 8 from r4c4, which sees all three."
- **Beats:** Hook "The pivot can be the answer too." → Where: pivot r5c4 → Pattern: pincers r3c4, r6c6 → Deduction:
  strike 8 in r4c4 → Result (payoff): "In row 4, 8 can only go in r4c7, so r4c7 = 8." → Takeaway.
- **Takeaway:** With a three-candidate pivot, the target must see the pivot and both pincers.
- **Common mistake:** Removing z from cells that see only the two pincers — the pivot itself might be z.
- **Length / format:** Short 35 s; long-form 2 min paired with E24.
- **In-app tie-in:** "XYZ-Wing".

### E26 · Naked Quad
- **Level / lesson id:** 3 / `naked-quad`
- **Learning goal:** Four cells holding only four digits between them claim those digits.
- **Board:** `naked-quad #0`.
- **Engine explanation:** "In box 2, r1c5, r1c6, r2c5 and r3c5 contain only the candidates {3,4,6,8}, a naked quad, so
  those digits must go in these cells. Remove 8 from r2c6."
- **Beats:** Hook "Four cells, four digits." → Where: box 2 → Pattern: r1c5, r1c6, r2c5, r3c5 = {3,4,6,8} →
  Deduction: strike 8 in r2c6 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** Same rule as pairs and triples: N cells, N digits → those digits leave the rest of the unit.
- **Common mistake:** Letting the union grow to five digits — it must be exactly four.
- **Length / format:** Short 30–35 s; long-form 1 min.
- **In-app tie-in:** "Naked Quad".

### E27 · Hidden Quad
- **Level / lesson id:** 3 / `hidden-quad`
- **Learning goal:** Four digits that fit only four cells reserve them; and why this is rarely the easiest view.
- **Board:** `hidden-quad #0`.
- **Engine explanation:** "In row 6, the digits 2, 5, 6 and 8 can only go in r6c2, r6c7, r6c8 and r6c9, a hidden quad.
  So these cells cannot hold anything else: remove 1 from r6c9."
- **Beats:** Hook "The rarest subset." → Where: row 6 → Pattern: 2, 5, 6, 8 only in r6c2, r6c7, r6c8, r6c9 →
  Deduction: strike 1 in r6c9 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** Four digits, four homes → clear the other digits from those cells; check for a simpler naked subset first.
- **Common mistake:** Hunting for hidden quads early — the matching naked subset in the other cells is usually easier to see.
- **Length / format:** Short 30–35 s; long-form optional.
- **In-app tie-in:** "Hidden Quad". Note: there is no hidden-quad practice puzzle (they are extremely rare); the
  lesson says so and offers a similar-difficulty puzzle labelled as possibly not needing one. Say this in the video.

---

## Season 4 — Level 4 · Advanced

### E28 · Turbot Fish
- **Level / lesson id:** 4 / `turbot-fish`
- **Learning goal:** The general strong–weak–strong chain on one digit (skyscraper and kite are special shapes).
- **Board:** `turbot-fish #0`.
- **Engine explanation:** "Turbot fish on 3: r7c1 and r7c8 are the only places for 3 in row 7, r1c8 and r3c9 are the
  only places in box 3, and r7c8 sees r1c8, so at least one of r7c1 and r3c9 is 3 (chain 3r7c1 = 3r7c8 – 3r1c8 =
  3r3c9). Remove 3 from r3c1, which sees both."
- **Beats:** Hook "The shape behind skyscrapers and kites." → Where: row 7 and box 3 → Pattern: r7c1, r7c8, r1c8, r3c9
  → Deduction: strike 3 in r3c1 → Result (payoff): "In column 1, 3 can only go in r7c1, so r7c1 = 3." → Takeaway.
- **Takeaway:** Strong, weak, strong on one digit → a cell seeing both ends loses it, whatever units the links use.
- **Common mistake:** Starting or ending on a weak link — both ends must come off strong links.
- **Length / format:** Short 35–40 s; long-form 2 min.
- **In-app tie-in:** "Turbot Fish".

### E29 · Finned X-Wing
- **Level / lesson id:** 4 / `finned-x-wing`
- **Learning goal:** An almost-X-Wing with extra candidates (fins) in one box; only cover-line cells that see the fin lose the digit.
- **Board:** `finned-x-wing #0`.
- **Engine explanation:** "Finned X-Wing on 4: in columns 3 and 7, 4 is limited to rows 5 and 7 except for the fin at
  r9c3 in box 7. Either the fish holds or a fin is 4; both remove 4 from r7c2, which is in a cover row and sees the fin."
- **Beats:** Hook "An X-Wing with a fin." → Where: columns 3 and 7 → Pattern: r5c3, r5c7, r7c3, r7c7 + fin r9c3 →
  Deduction: strike 4 in r7c2 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** Either the fish is real or the fin is true; only targets that are in a cover line *and* see the fin are safe.
- **Common mistake:** Clearing the whole cover lines as if the X-Wing were complete.
- **Length / format:** Short 35–40 s; long-form 2 min (sashimi variant, see E30).
- **In-app tie-in:** "Finned X-Wing".

### E30 · Finned Swordfish
- **Level / lesson id:** 4 / `finned-swordfish`
- **Learning goal:** The same fin argument on a Swordfish, including sashimi shapes.
- **Board:** `finned-swordfish #0` (the engine labels this instance "Sashimi").
- **Engine explanation:** "Sashimi Swordfish on 3: in columns 3, 6 and 8, 3 is limited to rows 2, 5 and 8 except for
  the fin at r1c8 in box 3. Either the fish holds or a fin is 3; both remove 3 from r2c9, which is in a cover row and
  sees the fin."
- **Beats:** Hook "A swordfish missing a corner." → Where: columns 3, 6, 8 → Pattern: r2c6, r5c3, r5c8, r8c3, r8c6 +
  fin r1c8 → Deduction: strike 3 in r2c9 → Result (payoff): "In box 3, 3 can only go in r1c8, so r1c8 = 3." → Takeaway.
- **Takeaway:** Fins must share one box; targets are cover-line cells inside that box.
- **Common mistake:** Forgetting that sashimi shapes (a base line with a single cover candidate) still need the fin argument.
- **Length / format:** Short 40 s; long-form 2 min.
- **In-app tie-in:** "Finned Swordfish".

### E31 · Jellyfish
- **Level / lesson id:** 4 / `jellyfish`
- **Learning goal:** The size-4 fish, and why a smaller fish is almost always available first.
- **Board:** `jellyfish #0`.
- **Engine explanation:** "Jellyfish on 3: in rows 1, 2, 5 and 8, 3 can only go in columns 2, 3, 8 and 9. One 3 per
  base line fills each of those columns, so remove 3 from r4c8, r6c2 and r9c3."
- **Beats:** Hook "Four lines. One fish." → Where: rows 1, 2, 5, 8 → Pattern: r1c3, r1c9, r2c2, r2c9, r5c2, r5c8, r8c3,
  r8c8 → Deduction: strike 3 in r4c8, r6c2, r9c3 → Result: candidates removed (no payoff) → Takeaway.
- **Takeaway:** Fish scale: 2 lines X-Wing, 3 Swordfish, 4 Jellyfish — same base/cover rule.
- **Common mistake:** Spending time on it early — a smaller fish or simpler move is almost always available first.
- **Length / format:** Short 40 s; long-form optional (fish family compilation E18/E23/E31).
- **In-app tie-in:** "Jellyfish" (practice puzzles are few: 2).

### E32 · W-Wing
- **Level / lesson id:** 4 / `w-wing`
- **Learning goal:** Two identical bivalue cells {x,y} joined by a conjugate pair on x; cells seeing both lose y.
- **Board:** `w-wing #0`.
- **Engine explanation:** "W-Wing: r4c4 and r5c2 both hold {2,3}, and 3 in r6c5–r6c2 is a conjugate pair linking them.
  They cannot both be 3, so one of them is 2: remove 2 from r5c6."
- **Beats:** Hook "Two twins and a bridge." → Where: r4c4 and r5c2 {2,3} → Pattern: conjugate pair on 3 in row 6
  (r6c5–r6c2) → Deduction: strike 2 in r5c6 → Result (payoff): "In row 5, 2 can only go in r5c2, so r5c2 = 2." → Takeaway.
- **Takeaway:** Twins {x,y} bridged by a strong link on x → one twin is y; their common peers lose y.
- **Common mistake:** Removing x instead of y.
- **Length / format:** Short 35 s; long-form 2 min.
- **In-app tie-in:** "W-Wing".

### E33 · Unique Rectangle Type 1 (uniqueness)
- **Level / lesson id:** 4 / `unique-rectangle-1`
- **Learning goal:** A deadly pattern (two rows, two columns, two boxes) cannot appear in a unique puzzle.
- **Board:** `unique-rectangle-1 #0`.
- **Engine explanation:** "Unique rectangle: r3c4, r3c6 and r8c6 can only be {3,9}. If r8c4 were also 3 or 9, the four
  corners could swap 3 and 9 and the puzzle would have two solutions, so remove {3,9} from r8c4."
- **Required line:** "Only valid when the puzzle has exactly one solution."
- **Beats:** Hook "This move only works because the puzzle has one solution." → Where: rectangle r3c4, r3c6, r8c4,
  r8c6 → Pattern: three corners {3,9} → Deduction: strike 3 and 9 in r8c4 (+ caveat) → Result (payoff): "r8c4 has only
  one candidate left, 2, so r8c4 = 2." → Takeaway.
- **Takeaway:** Three corners {a,b} in a two-box rectangle → the fourth corner can't be a or b (unique puzzles only).
- **Common mistake:** Using a rectangle that spans four boxes, or using it on a puzzle that might have several solutions.
- **Length / format:** Short 38 s (VIDEO_SCRIPTS A4); long-form 3 min covering E33–E36 together.
- **In-app tie-in:** "Unique Rectangle Type 1" (includes the uniqueness assumption card).

### E34 · Unique Rectangle Type 2 (uniqueness)
- **Level / lesson id:** 4 / `unique-rectangle-2`
- **Learning goal:** Two roof corners share one extra digit x; one of them must be x.
- **Board:** `unique-rectangle-2 #0`.
- **Engine explanation:** "Unique rectangle type 2: r5c5 and r7c5 are exactly {5,6} and r5c6 and r7c6 are {5,6,8}. To
  avoid two solutions one of r5c6 and r7c6 must be 8, so remove 8 from r4c6, which sees both."
- **Required line:** "Only valid when the puzzle has exactly one solution."
- **Beats:** Hook "The extra digit has to go somewhere." → Where: rectangle r5c5, r5c6, r7c5, r7c6 → Pattern: floor
  {5,6}, roof {5,6,8} → Deduction: strike 8 in r4c6 (+ caveat) → Result (payoff): "r4c6 has only one candidate left, 1,
  so r4c6 = 1." → Takeaway.
- **Takeaway:** Roof corners share an extra x → cells seeing both roof corners lose x (unique puzzles only).
- **Common mistake:** Removing a or b instead of x.
- **Length / format:** Short 38 s; long-form shared with E33. (Pencilmark's type 2 requires the roof corners to share a
  row or column.)
- **In-app tie-in:** "Unique Rectangle Type 2".

### E35 · Unique Rectangle Type 4 (uniqueness)
- **Level / lesson id:** 4 / `unique-rectangle-4`
- **Learning goal:** If one rectangle digit is locked to the roof corners in a unit, the other digit leaves them.
- **Board:** `unique-rectangle-4 #0`.
- **Engine explanation:** "Unique rectangle type 4: r6c1 and r6c3 are exactly {4,5}, and in row 7 5 can only go in r7c1
  and r7c3. One of them is 5, so neither can be 4 without creating two solutions: remove 4 from r7c1 and r7c3."
- **Required line:** "Only valid when the puzzle has exactly one solution."
- **Beats:** Hook "One digit is locked in. The other has to go." → Where: rectangle r6c1, r6c3, r7c1, r7c3 → Pattern:
  floor {4,5}; 5 locked to r7c1/r7c3 in row 7 → Deduction: strike 4 in r7c1 and r7c3 (+ caveat) → Result (payoff): "In
  row 7, 4 can only go in r7c6, so r7c6 = 4." → Takeaway.
- **Takeaway:** a locked to the roof in a unit → the roof corners lose b (unique puzzles only).
- **Common mistake:** Removing a, the locked digit, instead of b.
- **Length / format:** Short 38 s; long-form shared with E33.
- **In-app tie-in:** "Unique Rectangle Type 4".

### E36 · BUG+1 (uniqueness)
- **Level / lesson id:** 4 / `bug-plus-one`
- **Learning goal:** If every empty cell is bivalue except one, that cell takes the digit appearing three times in its units.
- **Board:** `bug-plus-one #0`.
- **Engine explanation:** "BUG+1: every empty cell has two candidates except r7c1, and 6 appears three times in its row,
  column and box. Without 6 there, the grid would be a deadly pattern with no unique solution, so r7c1 = 6."
- **Required line:** "Only valid when the puzzle has exactly one solution."
- **Beats:** Hook "Every cell has two candidates. Except one." → Where: the whole board (all bivalue) → Pattern: r7c1,
  digit 6 three times in its row, column and box → Deduction: place 6 (+ caveat) → Result (payoff): "In box 7, 2 can
  only go in r8c1, so r8c1 = 2." → Takeaway.
- **Takeaway:** All bivalue but one cell → that cell gets the digit that appears three times in its units.
- **Common mistake:** Using it when more than one cell has three candidates.
- **Length / format:** Short 35 s; long-form shared with E33.
- **In-app tie-in:** "BUG+1".

### E37 · X-Chain
- **Level / lesson id:** 4 / `x-chain`
- **Learning goal:** A longer alternating chain on one digit; cells seeing both ends lose the digit.
- **Board:** `x-chain #0`.
- **Engine explanation:** "X-Chain on 6: 6r1c5 = 6r7c5 – 6r9c6 = 6r9c1 – 6r3c1 = 6r3c7 ("=" means at least one is true,
  "–" means at most one is true). So r1c5 is 6 or r3c7 is 6; remove 6 from r1c7, since it conflicts with both ends."
- **Beats:** Hook "Follow the 6s around the board." → Where: r1c5 → Pattern: chain through r7c5, r9c6, r9c1, r3c1,
  r3c7 → Deduction: strike 6 in r1c7 → Result (payoff): "r1c7 has only one candidate left, 4, so r1c7 = 4." → Takeaway.
- **Takeaway:** Alternate strong and weak links on one digit; start and end strong; common peers of the ends lose it.
- **Common mistake:** Reading it as "both ends are true" — it only proves that at least one is.
- **Length / format:** Short 40–45 s; long-form 3 min (Eureka notation walkthrough).
- **In-app tie-in:** "X-Chain" (chains shown are usually 5+ links because shorter ones are found earlier as
  skyscraper/kite/turbot).

### E38 · XY-Chain
- **Level / lesson id:** 4 / `xy-chain`
- **Learning goal:** A chain of bivalue cells, each linked by a shared digit; cells seeing both ends lose the end digit.
- **Board:** `xy-chain #0`.
- **Engine explanation:** "XY-Chain: 8r3c3 = 9r3c3 – 9r5c3 = 4r5c3 – 4r5c9 = 7r5c9 – 7r8c9 = 8r8c9 ("=" means at least
  one is true, "–" means at most one is true). So r3c3 is 8 or r8c9 is 8; remove 8 from r3c9, since it conflicts with
  both ends."
- **Beats:** Hook "Four two-candidate cells, one chain." → Where: r3c3 → Pattern: r3c3 → r5c3 → r5c9 → r8c9 →
  Deduction: strike 8 in r3c9 → Result (payoff): "In box 3, 8 can only go in r1c8, so r1c8 = 8." → Takeaway.
- **Takeaway:** Hop between bivalue cells; if both ends offer the same digit, their common peers lose it.
- **Common mistake:** Including a cell with three candidates — every cell must be bivalue.
- **Length / format:** Short 40–45 s; long-form 2 min (XY-Wing as the shortest XY-Chain).
- **In-app tie-in:** "XY-Chain".

### E39 · Alternating Inference Chain
- **Level / lesson id:** 4 / `aic`
- **Learning goal:** Chains that mix bivalue cells and conjugate pairs across digits.
- **Board:** `aic #0`.
- **Engine explanation:** "Alternating inference chain: 4r5c6 = 2r5c6 – 2r5c8 = 9r5c8 – 9r5c5 = 9r6c5 ("=" means at
  least one is true, "–" means at most one is true). So r5c6 is 4 or r6c5 is 9; remove 4 from r6c5, since it conflicts
  with both ends."
- **Beats:** Hook "Mix cells and digits in one chain." → Where: r5c6 → Pattern: r5c6, r5c8, r5c5, r6c5 → Deduction:
  strike 4 in r6c5 → Result (payoff): "In row 6, 4 can only go in r6c9, so r6c9 = 4." → Takeaway.
- **Takeaway:** "Conflicts with both ends" can mean the same digit in a peer, or another digit inside an end cell.
- **Common mistake:** Using a weak link where a strong one is needed — check every "=".
- **Length / format:** Short 45 s; long-form 3 min.
- **In-app tie-in:** "Alternating Inference Chain".

### E40 · ALS-XZ
- **Level / lesson id:** 4 / `als-xz`
- **Learning goal:** Two almost locked sets with a restricted common digit X; a common digit Z leaves cells seeing all its copies.
- **Board:** `als-xz #0`.
- **Engine explanation:** "ALS-XZ: r7c1 {5,6} in row 7 and r7c8, r7c9 and r8c7 {2,4,5,6} in box 9 are almost locked sets
  that cannot both contain 5 (every 5 in one sees every 5 in the other), so one of them is locked without 5 and must
  contain 6. Remove 6 from r7c5, which sees all of those cells."
- **Beats:** Hook "Two sets, almost locked." → Where: row 7 and box 9 → Pattern: ALS A = r7c1, ALS B = r7c8, r7c9, r8c7;
  X = 5, Z = 6 → Deduction: strike 6 in r7c5 → Result: candidate removed (no payoff) → Takeaway.
- **Takeaway:** N cells with N+1 digits; if X can't be in both sets, Z must be in one — cells seeing every Z lose it.
- **Common mistake:** An X that is not restricted — every X in one set must see every X in the other.
- **Length / format:** Short 45 s; long-form 3–4 min.
- **In-app tie-in:** "ALS-XZ".

---

## Season 5 — Level 5 · Expert

### E41 · Sue de Coq
- **Level / lesson id:** 5 / `sue-de-coq`
- **Learning goal:** Digits at a box/line intersection split into a line part and a box part (two-sector disjoint subsets).
- **Board:** `sue-de-coq #0`.
- **Engine explanation:** "Sue de Coq: r8c4 and r8c6 (where box 8 meets row 8) hold {1,5,7,8,9}; together with r8c2
  {1,9} in the row and r7c5 and r9c4 {5,7,8} in the box, 5 cells hold exactly 5 digits. So {1,9} stay in row 8 and
  {5,7,8} stay in box 8: remove 5 and 8 from r7c6."
- **Beats:** Hook "Five cells, five digits, two directions." → Where: intersection r8c4, r8c6 → Pattern: + r8c2 (row) and
  r7c5, r9c4 (box) → Deduction: strike 5 and 8 in r7c6 → Result: candidates removed (no payoff) → Takeaway.
- **Takeaway:** Count cells and digits: equal counts lock line digits to the line and box digits to the box.
- **Common mistake:** Miscounting — the number of different digits must equal the number of cells.
- **Length / format:** Short 45 s; long-form 3–4 min.
- **In-app tie-in:** "Sue de Coq".

### E42 · Forcing Chain
- **Level / lesson id:** 5 / `forcing-chain`
- **Learning goal:** Follow every option with plain singles; keep only what all options agree on, or what a contradiction
  proves. How this differs from guessing (and the lesson's honest note that Pencilmark has no separate Nishio technique).
- **Board:** `forcing-chain #0`.
- **Engine explanation:** "Forcing chain (contradiction): if r5c9 were 1, singles would follow (r5c9 = 1 → r7c3 = 1),
  and then 1 would have no place left in box 9. So r5c9 cannot be 1."
- **Beats:** Hook "Last resort, still logic." → Where: r5c9 → Pattern: assume 1, singles follow (r7c3 = 1) →
  Deduction: 1 has no place in box 9 → contradiction → strike 1 in r5c9 → Result (payoff): "r5c9 has only one candidate
  left, 8, so r5c9 = 8." → Takeaway.
- **Takeaway:** A forcing chain never commits to a branch — it only keeps what is proven.
- **Common mistake:** Treating it as guessing; you never commit to a branch.
- **Length / format:** Short 40–45 s; long-form 3 min tying back to E09 (logic vs guessing).
- **In-app tie-in:** "Forcing Chain".

---

## Recommended publishing order

Principles: lead with the three rendered episodes (they are ready and cover beginner, medium and "advanced"); then
follow the curriculum so viewers can learn in order; add one "jump ahead" advanced episode every week because
pattern demos attract experienced solvers and comments. Cadence target: 3 episodes per week (see
`CONTENT_CALENDAR.md`). Every slot needs the owner's approval before posting.

| Slot | Episode | Why here |
|---|---|---|
| 1 | E05 Hidden Single (rendered) | Broadest audience, solvable hook |
| 2 | E14 Naked Pair (rendered) | Shows the "why" |
| 3 | E18 X-Wing (rendered) | Advanced curiosity; ties to the X-Wing hint captures |
| 4 | Series trailer: `progression-1080x1920.mp4` (rendered) | Sets up the five seasons |
| 5 | E01 The rules | Season 1 starts |
| 6 | E03 Scanning and cross-hatching | Reuses the rendered hidden-single segment |
| 7 | E04 Full House | |
| 8 | E20 Skyscraper (jump ahead) | Weekly advanced pick |
| 9 | E06 Pencil marks (candidates) | |
| 10 | E07 Naked Single | Pairs with E05 |
| 11 | E09 Logic vs guessing | Brand message |
| 12 | E24 XY-Wing (jump ahead) | |
| 13 | E02 Givens vs your entries, E08 Contradictions | Short foundation pair (two posts) |
| 14 | E10 Systematic scanning | Reuses the rendered grid loop |
| 15 | E11 Candidate management | |
| 16 | E22 Simple Colouring (jump ahead) | Visual standout |
| 17 | E12 Pointing, E13 Box/Line Reduction | Post back-to-back |
| 18 | E15 Hidden Pair | |
| 19 | E33 Unique Rectangle Type 1 (jump ahead) | Must carry the uniqueness line |
| 20+ | E16–E17, then Season 3 in order (skipping already-posted jump-aheads), then Season 4, then Season 5 | Continue 2 curriculum + 1 jump-ahead per week |

Long-form: one compilation per season, released when that season's Shorts are complete (Season 1 long-form ≈ 10–12 min).
Fish family (E18, E23, E29–E31), uniqueness family (E33–E36) and chains family (E19, E28, E37–E39) also work as themed
long-form videos.
