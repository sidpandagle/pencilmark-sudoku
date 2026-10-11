# Pencilmark — App Architecture

Offline-first Expo (SDK 57) app. No accounts, analytics, ads or network calls. Everything lives on the device.

## Modules

| Path | Kind | Responsibility |
|---|---|---|
| `src/engine/` | pure TS | Solver, generator, classifier, hints, grid helpers. Owned by the engine work; the app imports only from `src/engine` (index). |
| `src/game/` | pure TS, no React | `GameState`, the game reducer (all player actions, undo/redo), stats, history, achievements, settings types, date helpers, safe hint wrapper (`requestHint`, `revealTarget`), import-analysis copy. |
| `src/storage/` | TS | Key-value adapter (AsyncStorage → localStorage on web), versioned envelopes, migrations, runtime validation, corruption backup, debounced persister. |
| `src/state/` | React glue | Tiny external stores (`createStore` + `useStore` on `useSyncExternalStore`), actions (start game, dispatch, one-time completion bookkeeping), hydration and persistence binding, hooks, haptics. |
| `src/ui/` | React components | Theme tokens (light/dark/high-contrast), `Board` + `Cell` + overlay, `NumberPad`, `Toolbar`, icons (inline SVG), primitives (`Button`, `Card`, `ToggleRow`, `Segmented`), `Sheet`/`ConfirmDialog`, game widgets (`Timer`, `HintPanel`, `CompletionView`, `DifficultyPicker`, keyboard hook). |
| `src/learn/` | pure TS + learning components | Curriculum content (5 levels, 42 lessons), lesson positions, answer checking, progress/spaced review model, practice selection, guided-solve sessions; React pieces in `src/learn/components/`. See `docs/LEARNING.md`. |
| `src/app/` | Expo Router routes only | `_layout`, `index` (home), `play`, `stats`, `settings`, `help`, `import`, `history`, `achievements`, `learn/index` (curriculum map), `learn/[lessonId]` (lesson player), `learn/solve` (guided solving), `+not-found`. |

## State flow

```
UI event ─► dispatchGame(action) ─► gameReducer(state, action, {autoRemoveNotes, countMistakes, now})
                │                                   │
                │                                   └─ new GameState (immutable) ─► gameStore.set()
                │                                                                       │
                └─ if status became 'completed' and !recorded:                          ├─► components re-render via useStore(selector)
                     finalizeCompletion(): stats (recordCompletion, idempotent by id),  │    (Board, Timer, NumberPad subscribe to slices)
                     history (addHistory), achievements (evaluate), markRecorded        └─► persister.schedule('game' / 'gameUndo')
```

- Stores: `settingsStore`, `statsStore`, `historyStore`, `achievementsStore`, `gameStore`, `learningStore`, `appStore` (hydrated flag).
- Components select slices with `useStore(store, selector, isEqual)`. The play screen selects board-relevant fields with
  shallow equality; only `<Timer>` selects `elapsedMs`, so the once-per-second tick never re-renders the 81 cells.
  `Cell` is memoised on primitive props, so a move re-renders only the cells whose state changed.
- The reducer is pure. Settings that affect behaviour (auto-remove notes, mistake counting) and the clock (`now`) are passed per dispatch.
- Undo: every mutating action pushes one compact snapshot (`{v: 81 digits, n: 81×2 base-36 note masks, s: selected}`) onto
  `past` (cap 500, 200 persisted). Undo/redo restore values **and** notes. Placing a digit and removing it from peer notes is one entry.
  Applying a hint, auto-fill, clear notes, fix entries/notes and reveal are each one entry.
- Mistakes: a placement that differs from the solution increments `errors` always (for no-mistake stats) and `mistakes`
  only when the mistake counter is on. Entries are never auto-deleted.
- Completion: all cells equal the solution. Stats are recorded exactly once: guarded by `game.recorded` and by the
  stats' `recordedIds` list, which survives reloads.
- Timer: ticks every second only while the play screen is focused, the app is active and the game is `playing`.
  Backgrounding (AppState) pauses the game (board hidden on return) and flushes storage.

## Persistence schema

Every namespace is a key `pencilmark:<ns>` holding `{"v": <version>, "savedAt": <ms>, "data": ...}`.

| Namespace | v | Data |
|---|---|---|
| `settings` | 1 | `Settings` (theme, highContrast, highlight toggles, autoCheck, mistakeCounter, mistakeLimit 0/3/5, showTimer, autoRemoveNotes, reduceMotion, haptics, keepAwake) |
| `stats` | 1 | `buckets` per difficulty + `custom` (started, completed, totalTimeMs, bestTimeMs, noMistakeWins), `completedDays`, `dailyCompleted`, `longestStreak`, `totalHints`, `startedIds`, `recordedIds` |
| `history` | 1 | `HistoryEntry[]`, newest first, max 200 (puzzle/solution strings, difficulty, source, times, result, mistakes, hints) |
| `achievements` | 1 | `{ [id]: unlockedAtMs }` |
| `game` | 1 | Current `GameState` without undo history |
| `gameUndo` | 1 | `{ id, past, future }` (applied only when `id` matches the game) |
| `learning` | 2 | `LearningState`: per-lesson progress (completion, mastery, attempts, scores, review schedule) and per-technique hint timestamps. v1 (free-form, reserved) → v2 migration in `MIGRATIONS.learning[1]`; validated by `sanitizeLearning` (src/learn/progress.ts). |

Load path (`loadNamespace`): read → JSON.parse → unwrap envelope (no envelope = version 0) → run `MIGRATIONS[ns][v]` up to the
current version → sanitize. Unreadable JSON, a future version, a failing migration or a game that fails structural validation
is copied verbatim to `pencilmark:backup:<ns>` and replaced by defaults (`null` for the game). Sanitizers repair field by
field where safe (settings, stats, history entries), and are strict for the game (givens must match the solution, the
solution must be a valid complete grid, masks in range). Nothing throws.

Saving: store changes schedule a debounced write (400 ms). The undo key is rewritten only when `past`/`future` change, not on
timer ticks. `AppState` background/inactive and web `pagehide`/`beforeunload` flush immediately.

## Board API (for reuse, e.g. learning mode)

`import { Board, overlayFromStep, boardSizeFor } from 'src/ui/board'`

- `values`, `givens`, `notes` or `candidates` (engine masks shown instead of notes), `selected`, `highlightDigit`,
  `solution` + `highlights.autoCheck`, `highlights.{peers,sameDigit,conflicts}`, `readOnly`, `size`, `onCellPress`.
- `overlay: BoardOverlay` — `patternCells` (amber background), `supportCells` (light tint), `units` (dashed amber outline),
  `candidates` by role (pattern ring, eliminate red + strike, place green, color-a blue disc, color-b orange disc, fin square),
  `links` (SVG arrows between candidate positions; strong solid, weak dashed), `flaggedCells`, `focusCells`.
- `overlayFromStep(step, 'where' | 'full')` builds an overlay from an engine `Step`.
- `onCandidatePress(cell, digit)` turns on candidate-tap mode: every shown candidate of an empty cell is its own press
  target (`cand-<cell>-<digit>`). The slots are small and hidden from screen readers, so pair it with an accessible
  alternative (learning mode opens large digit chips after a cell press).

## Keyboard shortcuts (web)

| Key | Action |
|---|---|
| 1–9 | Enter digit (or note in notes mode); with no selection, highlight that digit |
| Shift + 1–9 | Toggle note |
| N | Notes mode on/off |
| Arrows, W/A/S/D | Move selection (wraps) |
| Backspace, Delete, 0 | Erase |
| Ctrl/Cmd + Z | Undo |
| Ctrl + Y, Ctrl/Cmd + Shift + Z | Redo |
| H | Open/close hint |
| P, Escape | Pause/resume (Escape closes an open hint first) |

Android back on the play screen returns home; the game is autosaved and the clock stops while the screen is not focused.

## Accessibility

- Cells: role button, label like "Row 3, column 4, 5, given" / "Row 3, column 4, empty, notes 1, 4, 7", plus "conflict",
  "incorrect", "highlighted by hint"; `accessibilityState.selected`.
- Conflicts use an underline and wrong entries a corner flag in addition to colour; selection has a thick border.
- Touch targets ≥ 48 dp. UI text scales with the OS (capped at 1.6×); board digits scale with the board only.
- Reduce motion: in-app setting or OS setting disables transitions.

## Tests

- Unit: `src/game/__tests__` (reducer, stats, history, achievements, dates), `src/storage/__tests__` (validation,
  migration, corruption recovery, persister), `src/state/__tests__` (single-count bookkeeping, hydrate round-trip).
- Component: `src/ui/__tests__` (Board labels/overlay/readOnly, NumberPad, keyboard mapping), `src/app/__tests__` (Play flow).
- E2E (Playwright, local Chrome): `e2e/app.spec.ts`, screenshots in `e2e/screenshots/` from `e2e/screenshots.spec.ts`.
