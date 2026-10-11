# Adversarial Review Log

Seven review-and-fix cycles were run after the core implementation (engine, app, learning mode) was
working. Each cycle includes investigation, real changes, and verification. Test counts are from runs I
actually did. The final regression results are at the bottom.

Severity: **S1** critical (wrong logic shown, data loss, crash) · **S2** major (feature broken or misleading) ·
**S3** minor (polish, edge case).

---

## Cycle 1 — Requirements and product completeness

**Inspected:** every item in the master brief against the app (see `docs/REQUIREMENTS.md`).

| Defect | Sev | Root cause | Fix | Files |
|---|---|---|---|---|
| Wrong digits triggered the "error" haptic even with auto-check and the mistake counter off, so the vibration gave the answer away | S2 | Feedback compared the entry with the solution unconditionally | Pure `inputFeedbackKind`: signal an error only when the player opted in (auto-check or mistake counter) or the duplicate is visible | `src/game/feedbackKind.ts`, `src/app/play.tsx`, test `src/game/__tests__/feedbackKind.test.ts` |
| No sound effects (brief: "configurable animation and sound") | S3 | Not built | Original synthesized sounds (`scripts/make-sounds.py`) played via `expo-audio`, with a "Sound effects" setting (off by default). The plugin is configured with no microphone and no background service | `src/state/feedback.ts`, `assets/sounds/*`, `app.json`, settings |
| No error-free mode | S3 | Mistake limit options were 0/3/5 | Added the "Error-free" limit (1) | `src/game/settings.ts`, `src/app/settings.tsx` |
| No personal performance trends | S3 | Not built | `difficultyTrend` and a bar chart of the last 10 times per difficulty, with a screen-reader summary | `src/game/history.ts`, `src/app/stats.tsx`, test `trend.test.ts` |

**Before → after:** wrong entries vibrate "error" only when the board would also show it. Sound is now available.
**Remaining:** timed-challenge and tournament modes are not built (optional / medium priority; see REQUIREMENTS).

## Cycle 2 — Sudoku correctness

**Inspected:** generator, brute-force solver, logical solver, hints, import analysis. Script:
`scripts/review-cycle2.ts` (run with bun).

- **Malformed input:** 11 hostile values (wrong lengths, NaN, 10, −1, strings, null, undefined). `analyzePuzzle` returned `invalid` every time and never threw.
- **`parseGrid`:** rejects full-width digits, 80, 82 and 5000-character input, and letters. Accepts separators and newlines.
- **Puzzle status:** the empty grid is `multiple`; a hidden contradiction with no duplicate digits is `unsolvable`; a known 17-clue puzzle is `unique` and rated.
- **Generated puzzles:** 240 across all four difficulties. All unique, givens agree with the solution, and re-rating each one gave its label. Slowest `generatePuzzle` was 98.9 ms on desktop.
- **Daily puzzle:** the same date gives the same puzzle; different dates differ.
- **Hints:** 300 from random mid-game positions with random solution-consistent notes. Every step checked with `validateStep` against the solution: **0 invalid**, slowest 16.5 ms.
- **Hint order:** wrong entries are reported before steps, and notes that exclude the solution digit come before steps too.
- The engine's own stress run: 0 invalid steps in more than 300,000 (`docs/ENGINE.md`).

**Defects found:** none in the logic. **Regression coverage added:** `src/engine/__tests__/adversarial.test.ts` (23 tests).

## Cycle 3 — UI/UX and usability

**Inspected:** screenshots of every screen at 390×844, 360×640 and 844×390 (`e2e/screenshots/`).

| Defect | Sev | Fix |
|---|---|---|
| 360×640: the hint panel covered the bottom board row in Explain mode, possibly hiding the hinted cells | S2 | Hint panel got `maxHeight` and a scrolling body with a minimum text height. Actions are compact ("Lesson" and "Apply" side by side). The board shrinks first to keep a minimum controls height |
| Hint text collapsed to zero height on web | S2 | Scroll body uses `flexBasis: 'auto'` and `minHeight` |
| Landscape: hint actions spilled outside the panel | S3 | In landscape the cap is the full side-column height |
| Portrait: dead space above the board, controls floating | S3 | Board sits under the header; the controls area fills the rest and number keys grow up to 80dp |
| Home screen did not show progress | S3 | Stat chips (streak, solved, lessons) and a Learn card showing the next lesson and reviews due |

**Files:** `src/app/play.tsx`, `src/ui/game/HintPanel.tsx`, `src/ui/components/NumberPad.tsx`, `src/app/index.tsx`.
**Verified:** screenshots re-taken and inspected after each fix.

## Cycle 4 — Learning and explanation accuracy

**Inspected:** all 42 lessons, the 132 stored example positions, the mastery-position generator, and guided/mastery answer checking.

| Defect | Sev | Root cause | Fix |
|---|---|---|---|
| A beginner who found a *different* valid single was marked wrong | S2 | Answers had to equal the engine's single step exactly | `isSingleInstance` checks Full House / Naked / Hidden Single directly on the displayed candidates and accepts it. True-but-different eliminations get a kind "retry" instead of "wrong", and mastery doesn't count them as misses |
| Forcing-chain contradiction text joined propagation order with "→", implying causes that don't exist | S2 | Breadth-first order was used instead of the causal trail | Each branch records the placement that triggered the contradiction (`whyAt`). The explanation shows that causal trail only, and its cells are highlighted |
| Singles examples were almost-solved grids (Full House examples had 1 empty cell in the whole grid) | S3 | The mining score *added* empty cells / 10, preferring late positions | Score now prefers early positions. Re-mined with `--singles`: 55–60 empty cells |

**Files:** `src/learn/exercise.ts`, `src/learn/components/ExerciseView.tsx`, `src/engine/techniques/forcing.ts`,
`scripts/engine-mine-examples.ts`, `src/engine/fixtures/techniqueExamples.ts`.
**Tests:** new `src/learn/__tests__/exercise.test.ts`. Every stored example still re-validates against the solution.

## Cycle 5 — Offline operation and data integrity

**Inspected:** network usage, persistence (debounced writes, flush on background), corrupt-data recovery, undo restore.

- `grep` for `fetch`, XHR, WebSocket, URLs and `Linking.openURL` in `src/`: **no network code**. Fonts are system fonts.
- Release builds drop `android.permission.INTERNET` (`plugins/withOfflineRelease.js`). Debug builds keep it so they can reach Metro.
- Storage: versioned envelopes, migrations, validation, and a backup of anything unreadable. Corrupt JSON, future versions and invalid games all recover to safe defaults (covered by existing tests).

| Defect | Sev | Fix |
|---|---|---|
| Persisted undo snapshots were checked in isolation. A tampered or corrupted snapshot could overwrite givens when undone | S3 | On load, drop snapshots that disagree with the puzzle's givens (`src/state/persistence.ts`). Test: "drops persisted undo snapshots that would overwrite a given" |

**Remaining:** airplane-mode, cold-start and force-close checks on a real Android device are still to do (see Cycle 7).

## Cycle 6 — Accessibility, performance, security

| Defect | Sev | Fix |
|---|---|---|
| Light-theme contrast: hint colour 2.90:1 against the surface (UI graphics need 3:1); chain colours A/B 4.28 and 3.57 for candidate text; conflict 4.47 | S2 | Darkened to the closest passing shades: hint `#B27A18` (3.63), colorA `#2D79AD` (4.64), colorB `#B45A19` (4.68), conflict `#B4382A` (4.64). Dark and high-contrast palettes already passed |
| Settings switches showed up on web as unnamed, focusable duplicate controls | S2 | Inner Switch is labelled and `aria-hidden`; the labelled row stays the control |
| Number keys are 37px wide on a 390px phone (9 across) | S3 | They pass WCAG 2.5.8 AA (≥24px, ≥56px tall). New **Number pad: 3 × 3, larger keys** setting gives ≥44px both ways (about 115×56) |
| Importing a pathological puzzle (AI Escargot) takes ~0.9 s on desktop, likely seconds on a phone | S3 | Analysis already runs after a spinner paints. Recorded as a known limitation |

- **Security:** import input is capped (`maxLength` and a 2000-character parse cap), and parse errors become messages. `analyzePuzzle` never throws. No eval, no network, no secrets in the repo. The keystore lives outside the repo, and `.gitignore` covers keystores and native folders.
- **Tests:** new `e2e/a11y.spec.ts`. Every button and switch on home, play, settings and learn has an accessible name. Targets are ≥44px except board cells (WCAG essential exception) and the one-row pad (AA). Cells are labelled like "Row 1, column 1, 5, given".

## Cycle 7 — Android and release readiness

**Done**
- **Toolchain:** Temurin JDK 17, Android SDK (platform 36, build-tools 36, NDK 27.1, CMake 3.22.1 and 3.31.6), emulator with an API 35 x86_64 AVD (WHPX acceleration checked).
- **Signing:** upload keystore outside the repo, wired in by `plugins/withReleaseSigning.js`.
- **Release manifest:** no INTERNET permission in release builds; permissions are blocked by default.
- **Config:** `targetSdk` 36 (meets Play's requirement since 2026-08-31), package `com.pencilmark.sudoku`, versionCode 1.
- `expo prebuild` succeeds.

**Build blockers found and fixed**
1. **Gradle could not read node output** ("filename syntax is incorrect", "Unexpected JSON token '('"). Cause: the user's cmd.exe AutoRun script `~/.cmd_prompt.bat` began with a UTF-8 BOM, so `@echo off` failed and prompt text leaked into every `cmd /c` output. Fix: removed the BOM (backup at `~/.cmd_prompt.bat.bak-pencilmark`), and `scripts/android-env.ps1` puts the real `node.exe` first on PATH.
2. **"ninja: Filename longer than 260 characters"** (react-native-gesture-handler codegen object). Cause: CMake 3.22.1's bundled ninja 1.10 isn't long-path aware. Fix: installed CMake 3.31.6 (ninja 1.12.1), and `plugins/withLocalCmake.js` writes `cmake.dir` during prebuild from `PENCILMARK_CMAKE_DIR`, which `android-env.ps1` sets. Windows `LongPathsEnabled` was already 1.

**Not yet verified**
- The rebuild after both fixes was **stopped by the session's low-memory guard** (emulator, Gradle and C++ compilers at once on 32 GB). By the harness rule I did not restart it on my own.
- So there is **no verified APK/AAB yet**, and on-device checks (splash, adaptive icon, safe areas, back gesture, haptics, sound, offline cold start) are pending.
- Commands to finish are in `docs/ANDROID.md` (§ Build). Run without the emulator, then install the APK on the emulator.

---

## Final regression (2026-10-11, after all fixes)

- `npx jest`: **22 suites, 412 tests passed** (engine, game, storage, state, learning, UI, screens). Jest reported one worker that didn't exit cleanly (likely a pending timer in one test). It doesn't affect any result.
- `npm run e2e` (fresh web export + Playwright in Chrome): **12 passed**. Covers new game, import → keyboard solve → completion → stats, reload resume with notes and undo, theme persistence, learning lesson flow, guided solve, accessibility, and screenshots at three sizes.
- `npx tsc --noEmit`: **clean**.
- Engine adversarial script `bun scripts/review-cycle2.ts`: **all checks passed**.
- Android: see Cycle 7. The release build still needs a re-run after the memory-guard stop.
