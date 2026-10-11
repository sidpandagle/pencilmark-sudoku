# Requirements Checklist

Status key: ✅ done and verified · 🟡 partial · ❌ missing · ⏭ deferred, with a reason.
Statuses were set in review cycle 1 and updated through cycle 7. Evidence points to tests, screenshots or docs.

## Phase 1 — MVP
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1.1 | 9×9 grid, box boundaries, givens distinct from entries | ✅ | `src/ui/board`, Board tests, screenshots |
| 1.2 | Selection, row/col/box and same-digit highlighting | ✅ | Settings toggles, Board tests |
| 1.3 | Optional conflict highlighting | ✅ | Conflict marker that doesn't rely on colour alone, Board tests |
| 1.4 | Responsive portrait and landscape, touch-friendly | ✅ | Screenshots at 390×844, 360×640, 844×390; cycle 3 |
| 1.5 | Digits, erase, notes, undo/redo (restores notes) | ✅ | `src/game/__tests__/reducer.test.ts` |
| 1.6 | New game, pause/hide, restart with confirmation | ✅ | Play screen, pause overlay, ConfirmDialog |
| 1.7 | Settings and help screens | ✅ | `src/app/settings.tsx`, `help.tsx` |
| 1.8 | Four difficulties graded by technique, documented | ✅ | `docs/ENGINE.md`; cycle 2 re-rated 240 generated puzzles |
| 1.9 | Mistakes detected without deleting entries | ✅ | Reducer tests; optional auto-check |
| 1.10 | Completion screen with time, difficulty, stats, replay/next/home | ✅ | `CompletionView`, e2e completion test |
| 1.11 | Full persistence incl. notes, history, timer; resume after force-close | ✅ web / 🟡 Android | e2e reload test, storage tests; Android force-close check pending (cycle 7) |
| 1.12 | Stats: started, completed, rate, best time per difficulty, mistakes, streaks | ✅ | `stats.test.ts`, stats screen |
| 1.13 | Keyboard on web, touch on Android | ✅ / 🟡 | Keyboard e2e; Android touch pending a device run |

## Phase 2 — Engine
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 2.1 | Engine independent of UI | ✅ | `src/engine` imports no React/RN |
| 2.2 | Generate solved grid, carve, uniqueness check, seeds | ✅ | `generator.ts`, `fresh.ts`, bank and transforms; tests |
| 2.3 | Difficulty by techniques | ✅ | `difficulty.ts`, invariance test |
| 2.4 | Solver: solve, count to 2, no-solution, explain steps | ✅ | `bruteSolver.ts`, `solver/` |
| 2.5 | Structured steps (technique, cells, candidates, explanation, changes) | ✅ | `steps.ts` |
| 2.6 | Engine tests: valid/invalid/contradictory/unsolvable/multiple/malformed | ✅ | 240+ engine tests incl. `adversarial.test.ts` |

## Phase 3 — Learning
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 3.1 | Curriculum levels 1–5 with an extensible taxonomy | ✅ | 42 lessons, `catalog.ts`, `curriculum.ts` |
| 3.2 | Per technique: explanation, prerequisites, demo, guided example, practice, assessment, mistakes, review | ✅ (practice 🟡 for Hidden Quad) | `docs/LEARNING.md`. No Hidden Quad practice puzzle was found in about 41,000 mined puzzles; the lesson says so |
| 3.3 | Curriculum map with unlocks | ✅ | `src/app/learn/index.tsx`, screenshot |
| 3.4 | Completion vs mastery tracking, spaced review | ✅ | `progress.ts` (1/3/7/14/30 days), tests |
| 3.5 | Guided solving: step forward/back/replay, overlays | ✅ | `src/app/learn/solve.tsx`, e2e |
| 3.6 | Five hint levels | ✅ | Nudge → technique → where → explain → apply |
| 3.7 | Transparency when the solver cannot explain | ✅ | Hint "Beyond my explanations", solve-screen stuck message, import "beyond rated techniques" |

## Phase 4 — Advanced gameplay
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 4.1 | Daily challenge (local) | ✅ | `getDailyPuzzle`, determinism test |
| 4.2 | Mistake counter, auto-check (optional), error-free mode | ✅ | Settings; limit options 0/1/3/5 |
| 4.3 | Note auto-fill and cleanup | ✅ | Play menu, reducer tests |
| 4.4 | Accessible labels, screen reader | ✅ | `e2e/a11y.spec.ts`, cell labels |
| 4.5 | Themes, dark mode, colour-blind-friendly highlighting | ✅ | System/light/dark, high contrast, blue/orange chain colours, cues that don't rely on colour; WCAG contrast (cycle 6) |
| 4.6 | Configurable animation, haptics, sound | ✅ | Reduce motion, Haptics, Sound effects (off by default) |
| 4.7 | Local history | ✅ | History screen with Replay |
| 4.8 | Custom puzzle entry and text import | ✅ | Import screen (paste or tap), hardened parsing |
| 4.9 | Achievements, streaks, practice by technique, weak-area recommendations, performance trends | ✅ | Achievements, streaks, Learn "weak spots", stats trends |
| 4.10 | Timed challenge mode, no-timer relaxation mode | 🟡 | Relaxation: "Show timer" off. A timed challenge mode is not built (medium priority) |
| 4.11 | Custom difficulty preferences | ⏭ | Four technique-based levels cover this; deferred |
| 4.12 | Tournaments, puzzle packs, export, collections, share cards, cloud sync | ⏭ | Optional later features; deliberately not in the offline MVP |

## Phase 5 — Design and assets
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 5.1 | Design system documented | ✅ | `docs/DESIGN.md` |
| 5.2 | Icon, adaptive icon, splash, badges, illustrations, sounds | ✅ | `docs/ASSETS.md`, `assets/` |
| 5.3 | Store graphics, asset manifest | ✅ | `store/`, `docs/ASSETS.md`, marketing exports |

## Phase 6–7 — Quality and release
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 6.1 | Unit, component and E2E tests | ✅ | Jest (400+), Playwright (12) |
| 6.2 | Seven review cycles logged | ✅ | `docs/REVIEW_LOG.md` |
| 7.1 | Android release AAB built and verified | 🟡 | Toolchain, signing, prebuild and two build blockers fixed. The final build was stopped by the low-memory guard and needs a re-run (`docs/ANDROID.md`) |
| 7.2 | Play Store docs, privacy, Data safety | ✅ | `docs/PLAY_STORE.md`, `docs/PRIVACY_POLICY.md` |
| 7.3 | No publishing without approval | ✅ | Nothing has been published or uploaded |
