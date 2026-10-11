# Pencilmark Sudoku — Video Scripts

> Status: **planning document. Nothing here is published, scheduled or uploaded.** Every externally visible
> post needs the owner's explicit approval first (see `CONTENT_CALENDAR.md`).
> Written 2026-10-11. Brand: Pencilmark Sudoku, "Learn to see the logic."

Related files: `docs/DESIGN.md` (tokens), `docs/PLAY_STORE.md` (listing copy), `docs/LEARNING.md` (curriculum),
`docs/ENGINE.md` (techniques), `marketing/data/*.json` (engine-validated boards), `marketing/captures/*.png`
(real app screenshots), `marketing/MANIFEST.md` (rendered files and stills, written by the render pass),
`EDU_SERIES.md` (episode list), `CONTENT_CALENDAR.md` (when and where).

---

## 0. Ground rules for every video

### 0.1 Truth rules

| Allowed claims | Do not claim |
|---|---|
| Works offline; no ads; no account; no tracking; progress stays on your device | "Free" (pricing not confirmed — add only after the owner confirms) |
| 42 lessons in 5 levels | Store availability before launch, ratings, download counts, reviews, "#1", awards |
| Hints in levels: nudge → technique → where → explain → apply | Techniques Pencilmark does not implement (3D Medusa, empty rectangle as a named move, UR types 3/5/6, death blossom, Franken fish) |
| Daily challenge (same for everyone, generated on the device) | That the daily is "new content from a server" |
| Notes, auto-fill notes, undo/redo | AI, cloud sync, multiplayer, leaderboards |
| Statistics, streaks, achievements | Real user numbers (stats captures use scripted demo data — label "Demo data") |
| Light, dark and high-contrast themes | |
| Techniques in the engine catalog (33, from Full House to Forcing Chain) | |

- **Boards:** every Sudoku deduction shown or spoken must come from a real engine position, cited either as
  `technique-id #index` (fixture example from `technique-examples.json`) or, for positions mined from another
  technique's practice puzzle, as `technique (mined: practice:<source>#<n> step <k>)` (see `explainers.json` →
  `source` / `minedFrom`). The explanation on screen must say the same thing as the engine text. Never invent or
  hand-edit a position.
- **No lesson spoilers:** fixture examples #1–#3 are the app lesson's guided exercise ("Your turn") and mastery check.
  Marketing therefore uses only example #0 (the lesson's own worked demo) or positions mined from *other* techniques'
  practice puzzles. The app mines extra mastery positions only from the technique's own practice list, so mined
  marketing positions never appear in that technique's lesson. Current explainers: `hidden-single #0` (fixture),
  `naked-pair (mined: practice:simple-coloring#2 step 25)`, `x-wing (mined: practice:unique-rectangle-4#5 step 17)`.
- **Uniqueness techniques** (Unique Rectangle 1/2/4, BUG+1) always carry the on-screen line
  "Only valid when the puzzle has exactly one solution."
- **CTA wording before launch:** "Coming soon to Google Play". Post-launch variants are marked **TODO (post-launch)**
  and must not be used until the listing is live and the owner approves.

### 0.2 Brand and motion (from BRAND_CREATIVE.md / DESIGN.md)

| Item | Value |
|---|---|
| Background | paper `#F4F1EA` (dark variant `#11151B` only for dark-mode clips) |
| Text / givens | ink `#1E2733`; player digits accent `#2F5DA8` |
| Pattern cells | hint gold `#B27A18` ring + hintSoft `#FBEBC8` fill |
| Eliminations | eliminate `#C0392B` **with a strike** (never colour alone) |
| Placements | success `#2E7D55` filled disc |
| Colouring | colorA `#2D79AD` (blue) / colorB `#B45A19` (orange) |
| End card | ink gradient `#2D5193 → #1B2B47`, paper-coloured text: mark + "Pencilmark" + "Learn to see the logic." + pill "Offline · No ads · No account" + "Coming soon to Google Play" (as rendered in the explainers, ~4 s) |
| Type | Segoe UI / system font; headlines weight 900; captions weight 600–700 |
| Motion | calm, ease-out beats of 150–400 ms; no shake, zoom-punch, glitch or flashy transitions |
| Captions | always on screen (most viewers watch muted); max ~2 lines, ~42 characters per line |

### 0.3 Safe areas

| Ratio | Canvas | Keep text and board inside |
|---|---|---|
| 9:16 | 1080×1920 | x 60–940, y 220–1500 (Shorts/Reels/TikTok UI covers the right edge and bottom) |
| 16:9 | 1920×1080 | 96 px margin on all sides (5%); lower third free of critical text for YouTube controls |
| 1:1 | 1080×1080 | 60 px margin |

### 0.4 Export presets (referenced as E-V, E-H, E-S, E-G)

| Preset | Resolution | Settings |
|---|---|---|
| **E-V** vertical | 1080×1920, 9:16 | H.264 High, yuv420p, CRF 20, 30 fps, +faststart, BT.709; audio AAC 192 kbps 48 kHz when music is added |
| **E-H** landscape | 1920×1080, 16:9 | same as E-V |
| **E-S** square | 1080×1080, 1:1 | same as E-V |
| **E-G** GIF / WebM loop | 360 px wide GIF; WebM (VP9) at source size | for landing page and README; no audio |

Reference command for later muxing (do not run during the render pass):

```
ffmpeg -i master.mov -i music.wav -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 -r 30 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 -shortest out-1080x1920.mp4
```

### 0.5 Music and SFX presets (referenced as MU-*)

Nothing is downloaded now. When music is added later, log every track (title, artist, source URL, licence,
required credit) in a credits file next to the render.

| Preset | Mood | BPM | Use |
|---|---|---|---|
| **MU-CALM** | soft piano / felt piano / warm lo-fi, no vocals | 70–90 | tutorials, satisfying solves |
| **MU-FOCUS** | minimal marimba, plucks, light pads | 90–110 | hooks, tips, mistakes |
| **MU-LIFT** | warm acoustic or light electronic, gentle build | 100–120 | launch reels, showcase, download promos |
| **SFX** | pencil tick (placement), soft eraser swish (strike), quiet paper tap (highlight), soft two-note chime (completion) | — | all; keep SFX ~6 dB under VO |

Sources to check later: YouTube Audio Library (check the attribution column per track), Pixabay Music
(check the current Pixabay content licence), Free Music Archive (licence varies per track; CC BY needs a credit
line, avoid NC tracks for promotional use, avoid ND if editing), freesound.org with the CC0 filter for
pencil/tap/chime SFX. Platform libraries (TikTok/Instagram) — use only their commercial-use library for a
business/brand account. Mix: VO at about −14 LUFS integrated, music ducked about 18–20 dB under VO.

### 0.6 Scene templates in `marketing/src/scenes`

| Template | What it does | Notes |
|---|---|---|
| `explainer.html?tech=<id>` | hook → unit highlight → pattern → strike eliminations → placement/payoff → takeaway → end card | Currently reads `explainers.json` (hidden-single, naked-pair, x-wing). For other techniques, add the technique to `explainers.json` via `scripts/export-data.ts` and add a per-technique caption script in `explainer.html` |
| `grid-loop.html` | real puzzle solved in real logical order (`solve-loop.json`) | |
| `teaser.html` | launch teaser beats | |
| `progression.html` | levels 1 → 5 with technique names (`curriculum.json`) | |
| `showcase.html` | real app captures in a phone frame with captions | |
| `logo-reveal.html` | logo + wordmark + tagline sting | `?` layout square or horizontal |

Some of these templates are being written by the render pass in parallel; MANIFEST.md is the source of truth for
which exist and what was rendered.

### 0.7 Captures available (`marketing/captures/`, 1170×2532 real app UI)

| File | Shows | Board |
|---|---|---|
| `home.png` | home: New game, Daily challenge (dated Sunday 11 October), Learn ("42 lessons…"), stats/history/achievements | — |
| `learn-map.png` | curriculum map, "0 of 42 lessons", Level 1 list | — |
| `lesson-concept.png` | X-Wing lesson concept card | — |
| `lesson-demo-1-units.png` … `lesson-demo-4-result.png` | X-Wing lesson "See it in a puzzle": Where → Pattern → Deduce → Result | `x-wing #0` |
| `play-start.png`, `play-entries.png` | imported puzzle, then entries (givens ink, entries blue) | puzzle of `x-wing (mined: practice:unique-rectangle-4#5 step 17)` |
| `notes-1-manual.png`, `notes-1b-manual.png`, `notes-2-autofill.png`, `play-notes.png` | manual notes, auto-fill notes, cleaned notes | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` |
| `hint-0-nudge.png` → `hint-3-explain.png` | hint ladder: nudge, technique, where, explanation + Apply | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` |
| `play-dark.png`, `hint-dark-where.png` | dark theme board and hint | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` |
| `completion-light.png`, `stats.png`, `achievements.png` | completion, stats, achievements | **scripted demo data** — caption "Demo data" |

Stills already exported to `marketing/exports/` (see MANIFEST.md):

| File | Use |
|---|---|
| `play-screenshot-01-1080x1920.png` … `play-screenshot-06-1080x1920.png` | Play listing screenshots (PLAY_STORE.md plan) |
| `yt-thumbnail-hidden-single-1280x720.png`, `yt-thumbnail-naked-pair-1280x720.png`, `yt-thumbnail-x-wing-1280x720.png` | YouTube thumbnails (long-form / Shorts where custom thumbnails are allowed) |
| `shorts-cover-hidden-single-1080x1920.png`, `shorts-cover-naked-pair-1080x1920.png`, `shorts-cover-x-wing-1080x1920.png` | Reels / TikTok cover frames for T1–T3 |
| `x-header-1500x500.png`, `facebook-cover-1640x624.png`, `facebook-cover-851x315.png` | profile headers, if the owner uses X or Facebook |
| `background-{light,dark,brand}-{1920x1080,1080x1920}.png` | backgrounds for edits, end cards, captions |

New captures to add to `scripts/capture-app.mjs` are named in each concept (prefix `cap:`). Never capture a lesson's
"Your turn" or mastery boards (fixture #1–#3) for marketing.

---

## 1. Summary of all concepts

Status: **Rendered** = file produced by the render pass (see MANIFEST.md). **Storyboard only** = script ready, not rendered.

| ID | Concept | Category | Status | Duration | Ratio | Master file / template |
|---|---|---|---|---|---|---|
| H1 | "Can you spot it?" (Hidden Single) | 1 Hook | Storyboard only (trim of rendered explainer) | 12 s | 9:16 | from `explainer-hidden-single-1080x1920.mp4` |
| H2 | "Two cells, two digits" (Naked Pair) | 1 Hook | Storyboard only (trim of rendered explainer) | 12 s | 9:16 | from `explainer-naked-pair-1080x1920.mp4` |
| H3 | "Four cells, one digit" (X-Wing) | 1 Hook | Storyboard only (trim of rendered explainer) | 14 s | 9:16 | from `explainer-x-wing-1080x1920.mp4` |
| H4 | "No ads. No account. No internet." | 1 Hook | Storyboard only | 10 s | 9:16 | `showcase.html` |
| H5 | "Ask for a nudge, not the answer" | 1 Hook | Storyboard only | 13 s | 9:16 | `showcase.html` |
| S1 | Feature showcase | 2 Showcase | **Rendered: yes — see MANIFEST.md** | ~25 s | 9:16 | `feature-showcase-1080x1920.mp4` |
| S2 | Five levels progression | 2 Showcase | **Rendered: yes — see MANIFEST.md** | ~15 s | 9:16 | `progression-1080x1920.mp4` |
| S3 | Easy on the eyes (themes) | 2 Showcase | Storyboard only | 20 s | 9:16 | `showcase.html` |
| T1 | Hidden Single tutorial | 3 Tutorial | **Rendered: yes — see MANIFEST.md** (short cut); 50 s extended cut storyboard only | 31 s / 50 s | 9:16 | `explainer-hidden-single-1080x1920.mp4` |
| T2 | Naked Pair tutorial | 3 Tutorial | **Rendered: yes — see MANIFEST.md** (short cut); extended cut storyboard only | 31 s / 50 s | 9:16 | `explainer-naked-pair-1080x1920.mp4` |
| T3 | X-Wing tutorial | 3 Tutorial | **Rendered: yes — see MANIFEST.md** (short cut); extended cut storyboard only | 35 s / 55 s | 9:16 | `explainer-x-wing-1080x1920.mp4` |
| T4 | X-Wing: lesson to real game | 3 Tutorial | Storyboard only | 50 s | 9:16 | captures |
| TT1 | Pick a digit, pick a box | 4 Tip | Storyboard only | 20 s | 9:16 | `explainer.html?tech=hidden-single` |
| TT2 | Auto-notes, then keep them honest | 4 Tip | Storyboard only | 22 s | 9:16 | captures |
| TT3 | Pointing vs claiming | 4 Tip | Storyboard only | 30 s | 9:16 | `explainer.html` (new techs) |
| TT4 | Stop at the nudge | 4 Tip | Storyboard only | 18 s | 9:16 | captures |
| M1 | Don't erase the pattern | 5 Mistake | Storyboard only | 25 s | 9:16 | `explainer.html?tech=x-wing` |
| M2 | Hidden vs naked single | 5 Mistake | Storyboard only | 30 s | 9:16 | `explainer.html` |
| M3 | Guessing is not solving | 5 Mistake | Storyboard only | 28 s | 9:16 | captures + `cap:` |
| M4 | Pointing: wrong direction | 5 Mistake | Storyboard only | 22 s | 9:16 | `explainer.html?tech=pointing` |
| M5 | Stale notes | 5 Mistake | Storyboard only | 22 s | 9:16 | captures |
| F1 | One Technique series format | 6 Series | Storyboard only (template; 3 episodes rendered as T1–T3) | 30–45 s | 9:16 | `explainer.html?tech=<id>` |
| A1 | Skyscraper | 7 Advanced | Storyboard only | 35 s | 9:16 | `explainer.html?tech=skyscraper` |
| A2 | XY-Wing | 7 Advanced | Storyboard only | 32 s | 9:16 | `explainer.html?tech=xy-wing` |
| A3 | Simple Colouring | 7 Advanced | Storyboard only | 35 s | 9:16 | `explainer.html?tech=simple-coloring` |
| A4 | Unique Rectangle Type 1 | 7 Advanced | Storyboard only | 38 s | 9:16 | `explainer.html?tech=unique-rectangle-1` |
| SS1 | Grid loop solve | 8 Satisfying | **Rendered: yes — see MANIFEST.md** | ~8 s loop | 9:16 (+ WebM, GIF) | `grid-loop-1080x1920.mp4` |
| SS2 | Step-by-step solve, sped up | 8 Satisfying | Storyboard only | 30 s | 9:16 | `cap:` guided solve |
| SS3 | The last cell | 8 Satisfying | Storyboard only | 10 s | 9:16 | captures |
| D1 | Today's daily is ready | 9 Daily | Storyboard only | 12 s | 9:16 | `cap:` daily |
| D2 | Yesterday's daily: one key move | 9 Daily | Storyboard only | 30 s | 9:16 | `cap:` guided solve |
| D3 | Weekday difficulty ladder | 9 Daily | Storyboard only | 15 s | 9:16 | `showcase.html` |
| L1 | Launch teaser | 10 Launch | **Rendered: yes — see MANIFEST.md** | ~12 s | 9:16 and 16:9 | `launch-teaser-1080x1920.mp4`, `launch-teaser-1920x1080.mp4` |
| L2 | Logo reveal sting | 10 Launch | **Rendered: yes — see MANIFEST.md** | ~4 s | 1:1 and 16:9 | `logo-reveal-1080x1080.mp4`, `logo-reveal-1920x1080.mp4` |
| L3 | Launch-day announcement reel | 10 Launch | Storyboard only | 25 s | 9:16 | edit of L2 + S1 + SS1 |
| P1 | "Coming soon to Google Play" | 11 Download | Storyboard only | 15 s | 9:16 | edit of rendered parts |
| P2 | Play listing promo video | 11 Download | Storyboard only | 30 s | 16:9 | edit of rendered parts + captures |
| P3 | Post-launch download promo | 11 Download | Storyboard only — **TODO (post-launch)** | 15 s | 9:16 | edit of P1 |

---

## 2. Category 1 — Hooks (10–15 s)

Purpose of the hook pack: test which opening holds viewers best. All five share the end card and CTA.
Rendered hooks H1–H3 are trims of the rendered explainers (first beats + end card); no new render is required,
only an edit. H4–H5 need a `showcase.html` pass.

### H1 — "Can you spot it?" (Hidden Single)

| Field | Value |
|---|---|
| Objective | Stop the scroll with a solvable puzzle moment; earn a rewatch |
| Audience | Casual Sudoku players who know the rules |
| Opening hook (0–2 s) | Board appears, box 2 glows: "Box 2 needs a 5. Only one cell can take it. Can you spot it?" |
| Board | `hidden-single #0` (explainers.json, fixture — the lesson's worked demo): "In box 2, 5 can only go in r1c5, so r1c5 = 5." |
| Status | Storyboard only — trim of `explainer-hidden-single-1080x1920.mp4` (Rendered: yes — see MANIFEST.md) |
| Screen recordings | none |
| Animation | `explainer.html?tech=hidden-single` (already rendered; edit only) |
| Music / SFX | MU-FOCUS 95–105 BPM; paper tap on box highlight, pencil tick on placement |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 12 s |
| CTA | "Pencilmark Sudoku — Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.0–2.5 | Board, box 2 highlighted gold | "Box 2 needs a 5. Only one cell can take it. Can you spot it?" | "Box 2 needs a 5. Only one cell can take it." |
| 2.5–5.0 | Hold (viewer's turn), subtle 3-2-1 dots | "Pause and look." | — |
| 5.0–8.0 | 5s at r9c4, r2c7 and r6c6 sweep in (`crossHatch`); r1c4, r3c4, r2c5, r2c6 and r3c6 strike | "The 5s in column 4, row 2 and column 6 rule out five of the six empty cells." | "The fives around the box rule out five of its six empty cells." |
| 8.0–10.0 | r1c5 fills 5 (green disc) | "In box 2, 5 can only go in r1c5." | "So the five goes here." |
| 10.0–12.0 | End card (ink gradient) | "Learn to see the logic. Coming soon to Google Play" | "Pencilmark. Coming soon to Google Play." |

VO script: "Box 2 needs a 5. Only one cell can take it. … The fives around the box rule out five of its six empty cells.
So the five goes here. Pencilmark. Coming soon to Google Play."

### H2 — "Two cells, two digits" (Naked Pair)

| Field | Value |
|---|---|
| Objective | Show that Pencilmark explains *why*, not just *what* |
| Audience | Players stuck at medium puzzles |
| Opening hook | "Two cells, two digits, and a guaranteed elimination." over row 5 |
| Board | `naked-pair (mined: practice:simple-coloring#2 step 25)`: "In row 5, r5c1 and r5c4 contain only the candidates {1,2}, a naked pair, so those digits must go in these cells. Remove 1 from r5c3, r5c6 and r5c7 and 2 from r5c3 and r5c6." Payoff `naked-single`: "r5c3 has only one candidate left, 3, so r5c3 = 3." |
| Status | Storyboard only — trim of `explainer-naked-pair-1080x1920.mp4` (Rendered: yes — see MANIFEST.md) |
| Screen recordings | none |
| Animation | `explainer.html?tech=naked-pair` (edit only) |
| Music / SFX | MU-FOCUS; eraser swish on the strike |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 12 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.0–2.0 | Row 5 highlighted | "Two cells, two digits, and a guaranteed elimination." | "Two cells. Two digits. A guaranteed elimination." |
| 2.0–5.0 | r5c1 and r5c4 ringed gold, candidates 1 and 2 | "r5c1 and r5c4 can only be 1 or 2." | "These two cells can only be one or two." |
| 5.0–8.0 | 1 struck in r5c3, r5c6, r5c7; 2 struck in r5c3, r5c6 | "So no other cell in row 5 can be 1 or 2." | "So the ones and twos leave the rest of the row." |
| 8.0–10.0 | Payoff: r5c3 (was {1,2,3}) = 3 | "r5c3 has only one candidate left: 3." | "And r5c3 is left with just a three." |
| 10.0–12.0 | End card | "Coming soon to Google Play" | "Pencilmark." |

### H3 — "Four cells, one digit" (X-Wing)

| Field | Value |
|---|---|
| Objective | Curiosity hook for players who have heard of X-Wing but never used it |
| Audience | Intermediate players |
| Opening hook | "An X-Wing: four cells, one digit, one safe elimination." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)`: "X-Wing on 1: in rows 2 and 9, 1 can only go in columns 1 and 4. One 1 per base line fills each of those columns, so remove 1 from r3c4." Payoff `naked-single`: "r3c4 has only one candidate left, 7, so r3c4 = 7." |
| Status | Storyboard only — trim of `explainer-x-wing-1080x1920.mp4` (Rendered: yes — see MANIFEST.md) |
| Screen recordings | none |
| Animation | `explainer.html?tech=x-wing` (edit only) |
| Music / SFX | MU-FOCUS; paper tap per corner (4 taps), swish on strike |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 14 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.0–2.0 | Board, all 1 candidates glow | "An X-Wing: four cells, one digit, one safe elimination." | "Four cells. One digit. One safe elimination." |
| 2.0–6.0 | Rows 2 and 9 outlined; r2c1, r2c4, r9c1, r9c4 ringed | "In rows 2 and 9, 1 can only go in columns 1 and 4." | "In these two rows, one fits only columns one and four." |
| 6.0–9.0 | Columns 1 and 4 outlined; 1 in r3c4 struck | "So remove 1 from r3c4." | "So the one leaves r3c4." |
| 9.0–11.5 | r3c4 (was {1,7}) = 7 | "r3c4 has only one candidate left: 7." | "Which leaves a seven." |
| 11.5–14.0 | End card | "Learn to see the logic. Coming soon to Google Play" | "Pencilmark." |

### H4 — "No ads. No account. No internet."

| Field | Value |
|---|---|
| Objective | Values-led hook for players tired of ad-heavy puzzle apps |
| Audience | General puzzle players, privacy-minded users |
| Opening hook | Hard cut to calm board; three words stack: "No ads." "No account." "No internet." |
| Board | Real capture `play-entries.png` (no deduction shown or spoken) |
| Status | Storyboard only |
| Screen recordings | `play-start.png`, `play-entries.png`, `home.png`; `cap:airplane-mode` optional — a real-device screen recording with airplane mode on (owner records on a phone; not a web capture) |
| Animation | `showcase.html` (phone frame + caption band) |
| Music / SFX | MU-CALM 75–85 BPM; one soft tap per word |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 10 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.0–1.5 | `play-entries.png` in phone frame | "No ads." | "No ads." |
| 1.5–3.0 | same, slight 3% push-in | "No account." | "No account." |
| 3.0–4.5 | same (or airplane-mode clip) | "No internet needed." | "No internet." |
| 4.5–7.5 | `home.png` | "Just calm Sudoku that teaches you to solve." | "Just calm Sudoku that teaches you to solve." |
| 7.5–10.0 | End card | "Pencilmark Sudoku. Coming soon to Google Play" | "Pencilmark. Coming soon to Google Play." |

### H5 — "Ask for a nudge, not the answer"

| Field | Value |
|---|---|
| Objective | Show the levelled hint system in under 15 s |
| Audience | Players who quit when stuck or hate hints that just fill the cell |
| Opening hook | "Stuck? Don't ask for the answer." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` in the real app (hint panel text is the engine's) |
| Status | Storyboard only |
| Screen recordings | `hint-0-nudge.png`, `hint-1-technique.png`, `hint-2-where.png`, `hint-3-explain.png` |
| Animation | `showcase.html`, cross-fade 250 ms between hint levels, highlight the 4-dash progress bar |
| Music / SFX | MU-FOCUS; soft tick per level |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 13 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.0–2.0 | `hint-0-nudge.png` | "Stuck? Don't ask for the answer." | "Stuck? Don't ask for the answer." |
| 2.0–4.5 | same, zoom to panel | "1. A gentle nudge" | "Ask for a nudge." |
| 4.5–6.5 | `hint-1-technique.png` | "2. The technique" | "Then the technique." |
| 6.5–8.5 | `hint-2-where.png` | "3. Where to look" | "Then where to look." |
| 8.5–11.0 | `hint-3-explain.png` | "4. Why it works — then apply" | "Then why it works." |
| 11.0–13.0 | End card | "Hints that teach, not tell. Coming soon to Google Play" | "Pencilmark." |

---

## 3. Category 2 — Showcases (20–30 s)

### S1 — Feature showcase — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| File | `marketing/renders/feature-showcase-1080x1920.mp4` |
| Objective | One video that answers "what is this app?" |
| Audience | Everyone; pinned video on profiles; landing page hero |
| Opening hook | `home.png` with caption "Calm Sudoku that teaches you to solve." |
| Boards | real captures only; the X-Wing hint frame shows `x-wing (mined: practice:unique-rectangle-4#5 step 17)` engine text |
| Screen recordings | `home.png`, `play-notes.png`, `hint-3-explain.png`, `learn-map.png`, `lesson-demo-3-effect.png`, `play-dark.png`, `stats.png` (Demo data) |
| Animation | `showcase.html` |
| Music / SFX | MU-LIFT 100–115 BPM (added later); no SFX needed |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | ~25 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

Intended storyboard (MANIFEST.md is the record of what was actually rendered; if they differ, MANIFEST wins and this
table should be updated):

| Time | Visual | On-screen text | VO (optional, for a VO version) |
|---|---|---|---|
| 0–3 | `home.png` | "Calm Sudoku that teaches you to solve." | "Meet Pencilmark." |
| 3–7 | `play-notes.png` | "Classic Sudoku, beautifully calm" | "Classic Sudoku with notes and auto-notes." |
| 7–11 | `hint-3-explain.png` | "Hints that teach, not tell" | "Hints that explain the logic." |
| 11–15 | `learn-map.png` → `lesson-demo-3-effect.png` | "42 lessons in 5 levels" | "Forty-two lessons, from first steps to chains." |
| 15–18 | `play-dark.png` | "Easy on the eyes, day or night" | "Light, dark and high contrast." |
| 18–21 | `stats.png` | "Track your progress offline" + small "Demo data" | "Stats and streaks that stay on your phone." |
| 21–25 | End card | "No ads · No account · Works offline. Coming soon to Google Play" | "Pencilmark. Coming soon to Google Play." |

### S2 — Five levels progression — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| File | `marketing/renders/progression-1080x1920.mp4` |
| Objective | Show the depth of the curriculum; series trailer for EDU_SERIES |
| Audience | Learners; players who think they have "outgrown" Sudoku |
| Opening hook | "From your first Sudoku to forcing chains." |
| Content | `curriculum.json` level titles and technique names only (no deductions) |
| Screen recordings | none (optional end frame `learn-map.png`) |
| Animation | `progression.html` |
| Music / SFX | MU-LIFT, gentle build across five beats; soft tick per level |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | ~15 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text |
|---|---|---|
| 0–2 | Title | "From your first Sudoku to forcing chains." |
| 2–4 | Level 1 card | "Level 1 · First steps — Full House, Hidden Single, Naked Single" |
| 4–6 | Level 2 card | "Level 2 · Beginner — Pointing, Box/Line Reduction, Pairs, Triples" |
| 6–8 | Level 3 card | "Level 3 · Intermediate — X-Wing, Skyscraper, XY-Wing, Swordfish…" |
| 8–10 | Level 4 card | "Level 4 · Advanced — Finned fish, Unique Rectangles, X-Chain, AIC, ALS-XZ" |
| 10–12 | Level 5 card | "Level 5 · Expert — Sue de Coq, Forcing Chain" |
| 12–15 | End card | "42 lessons. 5 levels. Coming soon to Google Play" |

### S3 — Easy on the eyes (themes)

| Field | Value |
|---|---|
| Objective | Show comfort and accessibility: light, dark, high contrast |
| Audience | Night-time players, low-vision and colour-blind players |
| Opening hook | Light board wipes to dark: "Same puzzle. Your eyes, your choice." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` position in the app (no deduction spoken; the hint frame shows engine text) |
| Status | Storyboard only |
| Screen recordings | `play-notes.png`, `play-dark.png`, `hint-dark-where.png`; **`cap:play-high-contrast`** (add to `capture-app.mjs`: same flow as `play-dark`, choose the high-contrast option in Settings, click `cell-29`, shot `play-high-contrast`); **`cap:settings-appearance`** (Settings screen showing the theme options) |
| Animation | `showcase.html`, 300 ms horizontal wipe between themes |
| Music / SFX | MU-CALM 70–80 BPM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 20 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | `play-notes.png` → wipe → `play-dark.png` | "Same puzzle. Your eyes, your choice." | "Same puzzle. Your choice of theme." |
| 3–7 | `play-dark.png` | "Dark theme for late nights" | "Dark for late nights." |
| 7–11 | `cap:play-high-contrast` | "High contrast for clarity" | "High contrast when you need it." |
| 11–15 | `hint-dark-where.png` | "Hints never rely on colour alone: rings, strikes and shapes" | "Hint highlights use shapes as well as colour." |
| 15–20 | End card | "Easy on the eyes, day or night. Coming soon to Google Play" | "Pencilmark." |

---

## 4. Category 3 — Tutorials (30–60 s)

The rendered explainers are the short cuts (Hidden Single 31 s, Naked Pair 31 s, X-Wing 35 s; each ends with a ~4 s
end card). Each also has an **extended cut** (45–60 s) storyboard for
YouTube Shorts / long-form inserts, which adds the "why" card and an in-app tie-in. Captions in the short cuts are
generated from the engine data by `explainer.html`; the text below matches those captions.

### T1 — Hidden Single — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| File | `marketing/renders/explainer-hidden-single-1080x1920.mp4` (short cut) |
| Objective | Teach cross-hatching and the hidden single in one real position |
| Audience | New and casual players |
| Opening hook | "Box 2 needs a 5. Only one cell can take it. Can you spot it?" |
| Board | `hidden-single #0` (explainers.json, fixture; the same position as the app lesson's worked demo, so it supports rather than spoils the lesson). Step: "In box 2, 5 can only go in r1c5, so r1c5 = 5." Payoff: "In box 2, 8 can only go in r2c5, so r2c5 = 8." |
| Screen recordings | extended cut: **`cap:lesson-hidden-single`** (add to `capture-app.mjs`: `page.goto(BASE + '/learn/hidden-single')`, shots of concept card and demo parts 1–4, same pattern as the X-Wing lesson block) |
| Animation | `explainer.html?tech=hidden-single` |
| Music / SFX | MU-CALM 80–90 BPM; pencil tick per strike and placement |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | short 31 s incl. ~4 s end card (see MANIFEST); extended 50 s |
| CTA | "Learn the full lesson in Pencilmark — coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
Timings below are approximate (the scene computes the cross-hatch beats from `crossHatch`); MANIFEST.md / the render is
the record.

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.7–4.3 | Box 2 highlighted | "Box 2 needs a 5. Only one cell can take it. Can you spot it?" | "Box two needs a five. Only one cell can take it. Can you spot it?" |
| 4.3–8.0 | Six empty cells of box 2 pulse (r1c4, r1c5, r2c5, r2c6, r3c4, r3c6) | "6 empty cells in box 2 could still hold the 5." | "Six empty cells could still hold it." |
| ~8–11 | 5 at r9c4, line sweeps column 4; r1c4, r3c4 struck | "The 5 in column 4 rules out r1c4 and r3c4." | "The five in column four rules out these two." |
| ~11–14 | 5 at r2c7, sweep row 2; r2c5, r2c6 struck | "The 5 in row 2 rules out r2c5 and r2c6." | "The five in row two rules out these two." |
| ~14–16.5 | 5 at r6c6, sweep column 6; r3c6 struck | "The 5 in column 6 rules out r3c6." | "And the five in column six rules out this one." |
| ~16.5–20 | r1c5 = 5, green disc | "In box 2, 5 can only go in r1c5, so r1c5 = 5." | "Only r1c5 is left. That's a hidden single." |
| ~20–23 | Takeaway card | "Takeaway: pick a digit and a box. Cross out every cell it can't use. One left? Place it." | "Pick a digit and a box. Cross out. One left? Place it." |
| ~23–27 | End card | mark, "Pencilmark", "Learn to see the logic.", pill "Offline · No ads · No account", "Coming soon to Google Play" | — |

Extended cut additions (after the takeaway, before the end card, +25 s):

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| +0–6 | Board, r1c5 shows candidates 2, 3, 4, 5, 6, 8 (from `explainers.json` candidates) | "r1c5 still had six candidates. It's not about the cell — it's about the digit." | "Notice r1c5 still had six candidates. A hidden single is about the digit having one home." |
| +6–12 | Payoff: box 2 again, r2c5 = 8 | "Next: in box 2, 8 can only go in r2c5." | "And one placement unlocks the next: eight can only go in r2c5." |
| +12–20 | `cap:lesson-hidden-single` frames | "Lesson: Hidden Single · Level 1" | "Pencilmark's Hidden Single lesson walks you through it, then lets you try." |
| +20–25 | End card | "Coming soon to Google Play" | "Pencilmark. Coming soon." |

### T2 — Naked Pair — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| File | `marketing/renders/explainer-naked-pair-1080x1920.mp4` |
| Objective | Teach the naked pair and the "eliminate elsewhere in the unit" rule |
| Audience | Players moving from easy to medium |
| Opening hook | "Two cells, two digits, and a guaranteed elimination." |
| Board | `naked-pair (mined: practice:simple-coloring#2 step 25)`: "In row 5, r5c1 and r5c4 contain only the candidates {1,2}, a naked pair, so those digits must go in these cells. Remove 1 from r5c3, r5c6 and r5c7 and 2 from r5c3 and r5c6." Payoff `naked-single`: "r5c3 has only one candidate left, 3, so r5c3 = 3." |
| Screen recordings | extended cut: **`cap:lesson-naked-pair`** (same pattern, `/learn/naked-pair`) |
| Animation | `explainer.html?tech=naked-pair` |
| Music / SFX | MU-CALM; swish on strike, tick on placement |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | short 31 s incl. ~4 s end card; extended 50 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.7–4.4 | Board fades in | "Two cells, two digits, and a guaranteed elimination." | "Two cells, two digits, and a guaranteed elimination." |
| 4.4–8.2 | Row 5 highlighted | "Look at row 5." | "Look at row five." |
| 8.2–12.6 | r5c1, r5c4 ringed gold with 1 and 2 | "r5c1 and r5c4 can only be 1 or 2: a naked pair." | "These two cells can only be one or two. That's a naked pair." |
| 12.6–16.8 | Rest of row 5 tinted | "Those two cells must take the 1 and the 2, so no other cell in row 5 can be 1 or 2." | "Between them they take the one and the two, so no other cell in the row can." |
| 16.8–20.5 | 1 struck in r5c3, r5c6, r5c7; 2 struck in r5c3, r5c6 | "Remove 1 from r5c3, r5c6 and r5c7, and 2 from r5c3 and r5c6." | "Clear the ones and twos from the other cells." |
| 20.5–24.5 | r5c3 (was {1,2,3}) = 3 | "r5c3 has only one candidate left, 3, so r5c3 = 3." | "And r5c3 is left with just a three." |
| 24.5–27.2 | Takeaway | "Takeaway: two cells with the same two candidates? Clear those digits from the rest of the unit." | "Same two candidates in two cells? Clear them from the rest of the unit." |
| 27.2–31 | End card | mark, "Pencilmark", "Learn to see the logic.", pill "Offline · No ads · No account", "Coming soon to Google Play" | — |

Extended cut: add a 10 s "Watch out" beat — "Both cells must have *only* those two candidates" (LEARNING.md mistake)
— and a 10 s `cap:lesson-naked-pair` tie-in.

### T3 — X-Wing — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| File | `marketing/renders/explainer-x-wing-1080x1920.mp4` |
| Objective | Make the first "advanced" technique feel learnable |
| Audience | Intermediate players |
| Opening hook | "An X-Wing: four cells, one digit, one safe elimination." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)`: "X-Wing on 1: in rows 2 and 9, 1 can only go in columns 1 and 4. One 1 per base line fills each of those columns, so remove 1 from r3c4." Payoff `naked-single`: "r3c4 has only one candidate left, 7, so r3c4 = 7." |
| Screen recordings | extended cut: `lesson-concept.png`, `lesson-demo-1-units.png` … `lesson-demo-4-result.png` (these show `x-wing #0`, a different position — label it "Another X-Wing from the lesson") |
| Animation | `explainer.html?tech=x-wing` |
| Music / SFX | MU-CALM 80–90 BPM; four paper taps for corners |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | short 35 s incl. ~4 s end card; extended 55 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0.7–4.4 | Board | "An X-Wing: four cells, one digit, one safe elimination." | "An X-Wing: four cells, one digit, one safe elimination." |
| 4.4–8.0 | All 1 candidates emphasised | "Focus on the 1s." | "Focus on the ones." |
| 8.0–12.5 | Rows 2 and 9; corners r2c1, r2c4, r9c1, r9c4 ringed | "In rows 2 and 9, 1 can only go in columns 1 and 4." | "In rows two and nine, one can only go in columns one and four." |
| 12.5–15.0 | Diagonal r2c1 + r9c4 lights | "Each row needs one 1. If r2c1 is 1, then r9c4 is 1…" | "If r2c1 is one, r9c4 must be one…" |
| 15.0–17.6 | Other diagonal r2c4 + r9c1 | "…otherwise r2c4 and r9c1 are." | "…otherwise it's the other diagonal." |
| 17.6–21.6 | Columns 1 and 4 outlined | "Either way, columns 1 and 4 each get their 1 from these two rows." | "Either way, columns one and four get their ones from these rows." |
| 21.6–25.0 | 1 in r3c4 struck | "So remove 1 from r3c4." | "So one can't go in r3c4." |
| 25.0–28.6 | r3c4 (was {1,7}) = 7 | "r3c4 has only one candidate left: 7." | "Leaving just one candidate: seven." |
| 28.6–31.2 | Takeaway | "Takeaway: one digit, two lines, the same two spots? Clear it from the crossing lines." | "One digit, two lines, the same two spots? Clear it from the crossing lines." |
| 31.2–35 | End card | mark, "Pencilmark", "Learn to see the logic.", pill "Offline · No ads · No account", "Coming soon to Google Play" | — |

### T4 — X-Wing: from lesson to real game

| Field | Value |
|---|---|
| Objective | Show the learn → play loop: the lesson teaches it, the hint finds it in your own game |
| Audience | Players evaluating whether the app is "more than another Sudoku" |
| Opening hook | "Learn it in a lesson. Spot it in your own game." |
| Boards | Lesson part: `x-wing #0` ("X-Wing on 2: in columns 3 and 6, 2 can only go in rows 3 and 5. One 2 per base line fills each of those rows, so remove 2 from r3c5."). Game part: `x-wing (mined: practice:unique-rectangle-4#5 step 17)` (engine text in T3; the hint captures show exactly this position) |
| Status | Storyboard only |
| Screen recordings | `lesson-concept.png`, `lesson-demo-1-units.png`, `lesson-demo-2-pattern.png`, `lesson-demo-3-effect.png`, `lesson-demo-4-result.png`, `hint-0-nudge.png`, `hint-2-where.png`, `hint-3-explain.png`; optional **`cap:hint-apply`** (click Apply after `hint-3-explain`, shot `hint-4-applied`) |
| Animation | `showcase.html` phone frame; 250 ms cross-fades; caption band at y 1300–1500 |
| Music / SFX | MU-CALM 80–90 BPM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 50 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | `lesson-concept.png` | "Learn it in a lesson. Spot it in your own game." | "Learn it in a lesson, then spot it in your own game." |
| 3–9 | `lesson-demo-1-units.png` | "1. Where: columns 3 and 6" | "The lesson starts with where to look." |
| 9–15 | `lesson-demo-2-pattern.png` | "2. Pattern: 2 fits only rows 3 and 5 in both columns" | "Then the pattern." |
| 15–21 | `lesson-demo-3-effect.png` | "3. Deduce: remove 2 from r3c5" | "Then what it removes." |
| 21–25 | `lesson-demo-4-result.png` | "4. Result" | "And the result." |
| 25–31 | `hint-0-nudge.png` | "Later, in a real game: a gentle nudge" | "Later, in your own game, a hint starts with a nudge." |
| 31–37 | `hint-2-where.png` | "Where to look" | "Then where to look." |
| 37–45 | `hint-3-explain.png` | "X-Wing on 1 … remove 1 from r3c4" | "And the full explanation, with a link back to the lesson." |
| 45–50 | End card | "Learn to see the logic. Coming soon to Google Play" | "Pencilmark." |

---

## 5. Category 4 — Tips & tricks

### TT1 — Pick a digit, pick a box

| Field | Value |
|---|---|
| Objective | Quick actionable tip; builds habit of box-first scanning |
| Audience | Beginners |
| Opening hook | "The fastest Sudoku habit: one digit, one box." |
| Board | `hidden-single #0`: "In box 2, 5 can only go in r1c5, so r1c5 = 5." (Use the explainer's cross-hatch beat: the 5s at r9c4, r2c7 and r6c6 rule out r1c4, r3c4, r2c5, r2c6 and r3c6. The engine searches boxes first, then rows, then columns.) |
| Status | Storyboard only (re-edit of the rendered `explainer-hidden-single-1080x1920.mp4`; no new render needed) |
| Screen recordings | none |
| Animation | trim of `explainer.html?tech=hidden-single` output with new captions |
| Music / SFX | MU-FOCUS; tick per strike |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 20 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–2 | Board | "The fastest Sudoku habit: one digit, one box." | "The fastest habit in Sudoku: one digit, one box." |
| 2–6 | Box 2 highlighted, digit 5 chosen | "Pick a digit. Pick a box." | "Pick a digit and a box." |
| 6–12 | Cross-hatch lines from the 5s in column 4, row 2 and column 6 strike five cells | "Cross out every cell the 5 can't use." | "Cross out every cell it can't use." |
| 12–16 | r1c5 = 5 | "In box 2, 5 can only go in r1c5." | "One left? Place it." |
| 16–20 | End card | "Tip: boxes first, then rows, then columns." | "Pencilmark. Coming soon." |

### TT2 — Auto-notes, then keep them honest

| Field | Value |
|---|---|
| Objective | Show notes and auto-fill notes; teach "notes are a record of eliminations" |
| Audience | Players who avoid pencil marks because they are tedious |
| Opening hook | "Pencil marks are tedious. Until they aren't." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` puzzle in the app (no deduction claimed) |
| Status | Storyboard only |
| Screen recordings | `notes-1-manual.png`, `notes-1b-manual.png`, `notes-2-autofill.png`, `play-notes.png` |
| Animation | `showcase.html`; 200 ms fade between captures, circle the edited cell |
| Music / SFX | MU-FOCUS; pencil tick per note |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 22 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | `notes-1-manual.png` | "Pencil marks are tedious. Until they aren't." | "Pencil marks are tedious…" |
| 3–7 | `notes-1b-manual.png` | "Add notes by hand…" | "Add them by hand…" |
| 7–12 | `notes-2-autofill.png` | "…or fill every cell's candidates in one tap." | "…or fill them all in one tap." |
| 12–18 | `play-notes.png` | "Then keep them honest: after each placement, clear that digit from every cell that sees it." | "Then keep them honest: after each placement, clear that digit from its row, column and box." |
| 18–22 | End card | "Coming soon to Google Play" | "Pencilmark." |

### TT3 — Pointing vs claiming

| Field | Value |
|---|---|
| Objective | Clear up the two intersection moves (where the source is, where the digit is removed) |
| Audience | Beginner → medium players |
| Opening hook | "Two moves people mix up all the time." |
| Boards | `pointing #0`: "In box 1, 3 can only be in row 3 (r3c1 and r3c2), a pointing pair. So 3 can be removed from the rest of row 3: r3c9." Payoff: "r3c9 has only one candidate left, 9, so r3c9 = 9." `box-line-reduction #0`: "In row 3, 3 can only be in box 2 (r3c4 and r3c6). So 3 can be removed from the rest of box 2: r1c4." Payoff: "r1c4 has only one candidate left, 7, so r1c4 = 7." |
| Status | Storyboard only |
| Screen recordings | none |
| Animation | `explainer.html?tech=pointing` and `?tech=box-line-reduction` (add both to `explainers.json` and add caption scripts); split-screen not needed — play sequentially |
| Music / SFX | MU-FOCUS; swish on each strike |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 30 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–2 | Title | "Pointing vs claiming: two moves people mix up." | "Two moves people mix up all the time." |
| 2–7 | `pointing #0`: box 1, 3s at r3c1 and r3c2 ringed | "Pointing: in box 1, 3 can only be in row 3." | "Pointing starts in a box: here the threes in box one sit only in row three." |
| 7–11 | 3 struck in r3c9 | "So 3 leaves the rest of row 3: r3c9." | "So three leaves the rest of that row." |
| 11–13 | r3c9 = 9 | "r3c9 has only one candidate left: 9." | — |
| 13–18 | `box-line-reduction #0`: row 3, 3s at r3c4 and r3c6 | "Claiming: in row 3, 3 can only be in box 2." | "Claiming starts in a line: in row three, three fits only inside box two." |
| 18–22 | 3 struck in r1c4 | "So 3 leaves the rest of box 2: r1c4." | "So three leaves the rest of that box." |
| 22–24 | r1c4 = 7 | "r1c4 has only one candidate left: 7." | — |
| 24–27 | Summary card | "Box → line: pointing. Line → box: claiming." | "Box to line is pointing. Line to box is claiming." |
| 27–30 | End card | "Coming soon to Google Play" | "Pencilmark." |

### TT4 — Stop at the nudge

| Field | Value |
|---|---|
| Objective | Teach how to use hints to learn (stop at the earliest level that unblocks you) |
| Audience | Learners |
| Opening hook | "The best hint is the smallest one." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` in the app |
| Status | Storyboard only |
| Screen recordings | `hint-0-nudge.png`, `hint-1-technique.png` |
| Animation | `showcase.html` |
| Music / SFX | MU-CALM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 18 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | `hint-0-nudge.png` | "The best hint is the smallest one." | "The best hint is the smallest one." |
| 3–9 | zoom on nudge text: "Look for one digit that fits only two cells in each of two rows (or columns), lined up." | "Read the nudge. Close it. Look again." | "Read the nudge, close it, and look again." |
| 9–14 | `hint-1-technique.png` | "Still stuck? Reveal just the technique name." | "Still stuck? Reveal just the technique." |
| 14–18 | End card | "Hints that teach, not tell." | "Pencilmark." |

---

## 6. Category 5 — Common beginner mistakes ("Watch out")

Based on the "Watch out" cards in `src/learn/content/level*.ts` (LEARNING.md pedagogy step 4).

### M1 — Don't erase the pattern

| Field | Value |
|---|---|
| Objective | Fix the most common elimination error: removing candidates from the pattern cells themselves |
| Audience | Players learning X-Wing / pairs |
| Opening hook | Red strike lands on a pattern corner, then a big "No." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)`: the four corners r2c1, r2c4, r9c1, r9c4 keep their 1; only r3c4 loses 1 ("…so remove 1 from r3c4.") |
| In-app proof | The lesson feedback for this exact error reads "…is part of the pattern itself, so it stays" (LEARNING.md, answer checking) |
| Status | Storyboard only |
| Screen recordings | optional **`cap:lesson-x-wing-wrong-pick`** (in the X-Wing "Your turn" card, tap a pattern candidate and capture the feedback line). That card shows fixture example #1 (the lesson exercise), so crop to the feedback text only and never show its board |
| Animation | `explainer.html?tech=x-wing` with an extra "wrong" beat (strike shown greyed and then undone; label "wrong" in text, not only colour) |
| Music / SFX | MU-FOCUS; soft "undo" tick |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 25 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–2 | Corner r2c4's 1 gets a dashed strike, then a "Wrong" label | "Mistake: erasing the pattern itself." | "The most common X-Wing mistake." |
| 2–5 | Strike undone | "The four corners keep their 1." | "The four corners keep their ones." |
| 5–11 | Rows 2 and 9, columns 1 and 4 | "In rows 2 and 9, 1 can only go in columns 1 and 4." | "The pattern says one lives on these corners." |
| 11–16 | Real elimination: 1 in r3c4 struck | "Only cells in columns 1 and 4, outside rows 2 and 9, lose the 1: r3c4." | "Only the other cells in the crossing columns lose it — here, r3c4." |
| 16–21 | (optional) `cap:lesson-x-wing-wrong-pick` | "The lesson tells you why: it's part of the pattern, so it stays." | "Pencilmark's lessons explain wrong picks instead of just saying 'wrong'." |
| 21–25 | End card | "Coming soon to Google Play" | "Pencilmark." |

### M2 — Hidden single vs naked single

| Field | Value |
|---|---|
| Objective | Separate "digit with one home" from "cell with one candidate" |
| Audience | Beginners |
| Opening hook | "This cell has six candidates. It's still a single." |
| Boards | `hidden-single #0`: r1c5 still shows candidates 2, 3, 4, 5, 6, 8 (explainers.json), yet "In box 2, 5 can only go in r1c5, so r1c5 = 5." `naked-single #0`: "Every digit except 3 already appears in the row, column or box of r1c8, so r1c8 = 3." |
| Status | Storyboard only |
| Screen recordings | none |
| Animation | `explainer.html?tech=hidden-single` (rendered board) + `?tech=naked-single` (add `naked-single #0` to `explainers.json`); candidate view on |
| Music / SFX | MU-FOCUS |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 30 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | r1c5 with notes 2 3 4 5 6 8 | "This cell has six candidates. It's still a single." | "This cell has six candidates. It's still a single." |
| 3–10 | Box 2: 5 appears only in r1c5's notes | "Hidden single: the digit 5 has only one home in box 2." | "A hidden single is about the digit: five has only one home in box two." |
| 10–13 | r1c5 = 5 | "In box 2, 5 can only go in r1c5." | — |
| 13–21 | `naked-single #0`: r1c8 with its row, column and box | "Naked single: r1c8 sees every digit except 3." | "A naked single is about the cell: r1c8 sees every digit except three." |
| 21–24 | r1c8 = 3 | "So r1c8 = 3." | — |
| 24–27 | Two-column card | "Hidden = one digit, one cell. Naked = one cell, one digit." | "Hidden: one digit, one cell. Naked: one cell, one digit." |
| 27–30 | End card | "Coming soon to Google Play" | "Pencilmark." |

### M3 — Guessing is not solving

| Field | Value |
|---|---|
| Objective | Position Pencilmark as logic-first; every move has a reason |
| Audience | Players who "try a number and see" |
| Opening hook | "If you can't explain the move, it's a guess." |
| Boards | No deduction needed for the main message (concept). Optional contrast beat for long-form: `forcing-chain #0`: "Forcing chain (contradiction): if r5c9 were 1, singles would follow (r5c9 = 1 → r7c3 = 1), and then 1 would have no place left in box 9. So r5c9 cannot be 1." — with the lesson's point: "you never commit to a branch" |
| Status | Storyboard only |
| Screen recordings | **`cap:lesson-logic-vs-guessing`** (add: `page.goto(BASE + '/learn/logic-vs-guessing')`, shot each concept card) ; `hint-3-explain.png` |
| Animation | `showcase.html` |
| Music / SFX | MU-CALM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 28 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Text on paper | "If you can't explain the move, it's a guess." | "If you can't explain the move, it's a guess." |
| 3–10 | `cap:lesson-logic-vs-guessing` card 1 | "Every move should have a reason you can explain." | "In good Sudoku, every move has a reason." |
| 10–17 | `hint-3-explain.png` | "Every Pencilmark hint comes with its reason." | "Every hint in Pencilmark says why." |
| 17–24 | Text card | "Every puzzle has exactly one solution — so logic always gets you there." | "Every puzzle has exactly one solution." |
| 24–28 | End card | "Learn to see the logic." | "Pencilmark." |

Note: the "every puzzle has exactly one solution" line is supported by `docs/PLAY_STORE.md` ("Every puzzle has exactly one
solution"). Do not claim that every puzzle needs only basic logic.

### M4 — Pointing in the wrong direction

| Field | Value |
|---|---|
| Objective | Fix the "removed from the box instead of the line" error |
| Audience | Beginner → medium |
| Opening hook | "Right pattern. Wrong cells erased." |
| Board | `pointing #0` (see TT3) |
| Status | Storyboard only |
| Screen recordings | none |
| Animation | `explainer.html?tech=pointing` (after adding to explainers.json), with a greyed "wrong" strike inside box 1, undone, then the real strike at r3c9 |
| Music / SFX | MU-FOCUS |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 22 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Box 1, 3s in r3c1/r3c2 ringed | "Right pattern. Wrong cells erased." | "Right pattern, wrong cells erased." |
| 3–8 | Greyed strike on a 3 elsewhere in box 1, labelled "Wrong" | "Mistake: removing the 3 from the rest of the box." | "Don't clear the rest of the box." |
| 8–15 | Row 3 highlighted; real strike r3c9 | "In box 1, 3 can only be in row 3 — so 3 leaves the rest of row 3: r3c9." | "The box points along the row, so the row loses the three." |
| 15–18 | r3c9 = 9 | "r3c9 has only one candidate left: 9." | — |
| 18–22 | End card | "Coming soon to Google Play" | "Pencilmark." |

### M5 — Stale notes

| Field | Value |
|---|---|
| Objective | Teach note clean-up after every placement |
| Audience | Players who use notes but get "stuck" on wrong notes |
| Opening hook | "Your notes are lying to you." |
| Board | `x-wing (mined: practice:unique-rectangle-4#5 step 17)` puzzle in the app (no new deduction claimed) |
| Status | Storyboard only |
| Screen recordings | `notes-2-autofill.png`, `play-notes.png`; **`cap:lesson-candidate-management`** (add: `/learn/candidate-management`, shot the "clean up notes after a placement" exercise) |
| Animation | `showcase.html` |
| Music / SFX | MU-FOCUS |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 22 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | `notes-2-autofill.png` | "Your notes are lying to you." | "Your notes might be lying to you." |
| 3–10 | `cap:lesson-candidate-management` | "After every placement, remove that digit from every cell that sees it." | "After every placement, clear that digit from its row, column and box." |
| 10–16 | `play-notes.png` | "Clean notes make the next move visible." | "Clean notes make the next move visible." |
| 16–22 | End card | "Lesson: Candidate management · Level 2. Coming soon to Google Play" | "Pencilmark." |

---

## 7. Category 6 — One-technique-per-video series format (F1)

The recurring "One Technique" series. Episode list, boards and explanations: `EDU_SERIES.md` (42 episodes).
T1–T3 are the first three rendered episodes.

| Field | Value |
|---|---|
| Objective | Steady weekly educational content that builds search presence and trust |
| Audience | Learners at every level; each episode is tagged with its level |
| Opening hook | Technique-specific line (see EDU_SERIES), always posed as a question or a promise in ≤ 8 words |
| Status | Storyboard only (template); T1–T3 rendered |
| Screen recordings | optional `cap:lesson-<id>` for the tie-in beat (pattern: `page.goto(BASE + '/learn/<id>')`, shot concept card + demo parts 1–4) |
| Animation | `explainer.html?tech=<id>` after adding `<id>` to `explainers.json` via `scripts/export-data.ts` and writing that technique's caption script (template beats below) |
| Music / SFX | MU-CALM for one bed across the whole series (series identity) |
| Ratio / resolution | 9:16, 1080×1920 (Short); 16:9 compilation per season for long-form |
| Duration | 30–45 s |
| CTA | "Lesson: <title> · Level <n> in Pencilmark — coming soon to Google Play" |
| Export | E-V (Short), E-H (compilation) |

Fixed beat template:

| Beat | Time (of 40 s) | Visual | On-screen text |
|---|---|---|---|
| Series bug | always | small "One Technique · Level n" tag top-left (inside safe area) | — |
| Hook | 0–3 | board fades in, unit or digit teased | technique hook |
| Where to look | 3–9 | unit(s) highlighted (engine `units`) | "Look at …" |
| Pattern | 9–17 | pattern cells ringed gold (engine `patternCells`) | the pattern sentence from the engine explanation |
| Deduction | 17–24 | eliminations struck red / placement green (engine effects) | the conclusion sentence, as worded by the engine |
| Result | 24–30 | payoff step if the export has one; otherwise show the cleaned candidates | payoff explanation (engine) |
| Takeaway | 30–35 | takeaway card | one line (EDU_SERIES) |
| End card | 35–40 | ink gradient, logo, lesson name | CTA |

Rules: the full engine explanation must appear on screen at least once (can be split across the pattern and deduction
beats, with wording unchanged). Uniqueness episodes add the "Only valid when the puzzle has exactly one solution."
line during the deduction beat.

---

## 8. Category 7 — Advanced pattern demos

All four need the technique added to `explainers.json` (export-data.ts) and a caption script in `explainer.html`.
Chains/links must be drawn from the engine step's `links` and candidate roles, never hand-drawn.

### A1 — Skyscraper

| Field | Value |
|---|---|
| Objective | Show a single-digit chain pattern in a friendly shape |
| Audience | Intermediate / advanced |
| Opening hook | "Two towers, one digit, one cell that can't be 1." |
| Board | `skyscraper #0`: "Skyscraper on 1: row 5 and row 9 each have 1 in only two cells, and r5c4 and r9c4 line up in column 4 (only one of them can be 1), so at least one of r5c1 and r9c3 is 1 (chain 1r5c1 = 1r5c4 – 1r9c4 = 1r9c3). Remove 1 from r6c3, which sees both." Payoff: "In column 3, 1 can only go in r9c3, so r9c3 = 1." |
| Status | Storyboard only |
| Screen recordings | optional `cap:lesson-skyscraper` |
| Animation | `explainer.html?tech=skyscraper`; strong links as solid lines, weak link dashed (with "=" and "–" labels, not colour alone) |
| Music / SFX | MU-CALM 80–90 BPM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 35 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Board, 1 candidates emphasised | "Two towers, one digit, one cell that can't be 1." | "Two towers, one digit." |
| 3–9 | Rows 5 and 9; r5c1, r5c4, r9c3, r9c4 ringed | "Row 5 and row 9 each have 1 in only two cells." | "Rows five and nine each have only two places for one." |
| 9–15 | Column 4 joins r5c4–r9c4 (dashed) | "r5c4 and r9c4 line up in column 4: only one of them can be 1." | "Two of those line up in column four — they can't both be one." |
| 15–21 | Tops r5c1, r9c3 glow | "So at least one of r5c1 and r9c3 is 1." | "So one of the tower tops must be one." |
| 21–26 | r6c3 sees both; 1 struck | "Remove 1 from r6c3, which sees both." | "Any cell that sees both tops loses the one." |
| 26–30 | r9c3 = 1 | "In column 3, 1 can only go in r9c3." | "And column three now has one place for it." |
| 30–35 | End card | "Lesson: Skyscraper · Level 3. Coming soon to Google Play" | "Pencilmark." |

### A2 — XY-Wing

| Field | Value |
|---|---|
| Objective | Demonstrate "whatever the pivot is, the result holds" reasoning |
| Audience | Intermediate / advanced |
| Opening hook | "Three cells. Two cases. Same answer." |
| Board | `xy-wing #0`: "XY-Wing: pivot r7c3 {6,7} sees r7c8 {5,6} and r8c1 {5,7}. Whether the pivot is 6 or 7, one of the pincers must be 5, so remove 5 from r8c8." Payoff: "In box 9, 5 can only go in r7c8, so r7c8 = 5." |
| Status | Storyboard only |
| Screen recordings | optional `cap:lesson-xy-wing` |
| Animation | `explainer.html?tech=xy-wing`; two "case" panels as a quick A/B toggle on the same board |
| Music / SFX | MU-CALM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 32 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Board | "Three cells. Two cases. Same answer." | "Three cells, two cases, same answer." |
| 3–8 | Pivot r7c3 {6,7} ringed | "Pivot r7c3 can only be 6 or 7." | "The pivot is six or seven." |
| 8–13 | Pincers r7c8 {5,6} and r8c1 {5,7} | "It sees r7c8 {5,6} and r8c1 {5,7}." | "It sees two pincers." |
| 13–18 | Case 6: r7c8 → 5 | "If the pivot is 6, r7c8 is 5." | "If it's six, this pincer is five." |
| 18–22 | Case 7: r8c1 → 5 | "If the pivot is 7, r8c1 is 5." | "If it's seven, the other one is." |
| 22–26 | r8c8 sees both pincers; 5 struck | "Either way, one pincer is 5: remove 5 from r8c8." | "Either way a pincer is five, so r8c8 can't be." |
| 26–29 | r7c8 = 5 | "In box 9, 5 can only go in r7c8." | — |
| 29–32 | End card | "Lesson: XY-Wing · Level 3" | "Pencilmark." |

### A3 — Simple Colouring

| Field | Value |
|---|---|
| Objective | Visually striking two-colour demo (colour-blind-safe blue/orange) |
| Audience | Intermediate / advanced |
| Opening hook | "Colour the 4s. One colour is the truth." |
| Board | `simple-coloring #0`: "Simple colouring on 4: colour the chain of conjugate pairs alternately; one colour holds all the 4s. r3c9 sees both a blue and an orange cell, so remove 4 from it." Pattern cells r2c5, r3c4, r8c5, r8c9. No payoff in the export (show the cleaned candidate). |
| Data note | `technique-examples.json` does not include the colour roles. Extend `export-data.ts` to export the step's `color-a` / `color-b` candidate roles and `links`, and render colours from those. Do not hand-assign colours |
| Status | Storyboard only |
| Screen recordings | optional `cap:lesson-simple-coloring` |
| Animation | `explainer.html?tech=simple-coloring`; colours also get a shape cue (filled vs hollow dot) |
| Music / SFX | MU-CALM; soft tap per coloured cell |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 35 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Board, 4s emphasised | "Colour the 4s. One colour is the truth." | "Colour the fours. One colour is the truth." |
| 3–10 | Conjugate-pair links appear one by one (from engine links) | "Follow the 4s that have only two places in a unit." | "Follow the units where four has only two places." |
| 10–18 | Cells alternate blue / orange (engine roles) | "Colour them alternately. One colour holds all the 4s." | "Colour them alternately. Exactly one colour holds all the fours." |
| 18–25 | r3c9 highlighted, lines to the blue and orange cells it sees | "r3c9 sees both a blue and an orange cell…" | "This cell sees both colours…" |
| 25–30 | 4 struck in r3c9 | "…so remove 4 from it." | "…so whichever colour is true, it can't be four." |
| 30–35 | End card | "Lesson: Simple Colouring · Level 3" | "Pencilmark." |

### A4 — Unique Rectangle Type 1 (uniqueness)

| Field | Value |
|---|---|
| Objective | Explain the uniqueness idea honestly, with its condition |
| Audience | Advanced players |
| Opening hook | "This move only works because the puzzle has one solution." |
| Board | `unique-rectangle-1 #0`: "Unique rectangle: r3c4, r3c6 and r8c6 can only be {3,9}. If r8c4 were also 3 or 9, the four corners could swap 3 and 9 and the puzzle would have two solutions, so remove {3,9} from r8c4." Payoff: "r8c4 has only one candidate left, 2, so r8c4 = 2." |
| Required line | "Only valid when the puzzle has exactly one solution." on screen during the deduction (Pencilmark runs uniqueness techniques only when the current grid has a unique solution — ENGINE.md) |
| Status | Storyboard only |
| Screen recordings | optional `cap:lesson-unique-rectangle-1` |
| Animation | `explainer.html?tech=unique-rectangle-1`; rectangle outline, "swap" animation of 3/9 shown as a hypothetical (dashed, labelled "If…") |
| Music / SFX | MU-CALM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 38 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Board | "This move only works because the puzzle has one solution." | "This move only works because the puzzle has one solution." |
| 3–9 | Corners r3c4, r3c6, r8c6 ringed, each {3,9} | "r3c4, r3c6 and r8c6 can only be {3,9}." | "Three corners of a rectangle can only be three or nine." |
| 9–17 | Hypothetical: r8c4 as 3/9, dashed swap arrows | "If r8c4 were also 3 or 9, the corners could swap 3 and 9…" | "If the fourth corner were three or nine too, you could swap them…" |
| 17–22 | "Two solutions" stamp (text) | "…and the puzzle would have two solutions." | "…and the puzzle would have two solutions." |
| 22–27 | 3 and 9 struck in r8c4; caveat line | "So remove {3,9} from r8c4. Only valid when the puzzle has exactly one solution." | "So r8c4 can't be three or nine — valid only for puzzles with exactly one solution." |
| 27–32 | r8c4 = 2 | "r8c4 has only one candidate left: 2." | "Leaving two." |
| 32–38 | End card | "Lesson: Unique Rectangle Type 1 · Level 4" | "Pencilmark." |

---

## 9. Category 8 — Satisfying solve clips

### SS1 — Grid loop solve — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| Files | `marketing/renders/grid-loop-1080x1920.mp4`, `grid-loop-1080x1920.webm`, `grid-loop-360w.gif` |
| Objective | Loopable ambient clip; background for captions; landing page hero loop |
| Audience | Everyone (no narration needed) |
| Opening hook | Digits begin filling immediately; no title card (loop-friendly) |
| Board | `solve-loop.json`: a real easy puzzle (`5.2...697..4...1...63..7254..974..283...5...14.7.819...48219.36..5...412.31..48.9`) solved in the engine's logical order — 39 steps: 21 Full House, 18 Hidden Single |
| Screen recordings | none |
| Animation | `grid-loop.html` |
| Music / SFX | none in master (loop); for Shorts add MU-CALM 70–80 BPM + soft pencil ticks synced to placements |
| Ratio / resolution | 9:16, 1080×1920; GIF 360 px wide |
| Duration | ~8 s seamless loop |
| CTA | overlay variant only: "Learn to see the logic. Coming soon to Google Play" (last 2 s) |
| Export | E-V; E-G for WebM/GIF |

Suggested captions when posted as a Short (post copy, not burned in): "39 moves. No guessing. Every digit has a reason."
(39 steps and "no guessing" are true for this solve path: only Full House and Hidden Single steps.)

### SS2 — Step-by-step solve, sped up

| Field | Value |
|---|---|
| Objective | Show "Explore a puzzle" / "Solve step by step": every move explained |
| Audience | Learners; long-form viewers |
| Opening hook | "Watch a whole puzzle solved — every move explained." |
| Board | the `solve-loop.json` puzzle in the app's guided solver (same engine path as SS1) |
| Status | Storyboard only |
| Screen recordings | **`cap:guided-solve`** — add to `capture-app.mjs`: `page.goto(BASE + '/learn/solve?puzzle=<81 digits of solve-loop puzzle>')`, then click Next repeatedly and shoot one frame per step (`guided-solve-001.png` …); assemble as a sequence at 3 frames per step. Exact test ids for Next must be checked in `src/app/learn/solve.tsx` before scripting |
| Animation | image sequence; optional `showcase.html` phone frame |
| Music / SFX | MU-CALM 70–80 BPM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 30 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | First step frame | "Watch a whole puzzle solved — every move explained." | — |
| 3–26 | Fast step sequence; caption shows the current technique name from each frame | "Full House · Hidden Single · …" (as captured) | — |
| 26–30 | End card | "Explore any puzzle, one explained step at a time." | — |

### SS3 — The last cell

| Field | Value |
|---|---|
| Objective | Micro-moment of completion; loopable |
| Audience | Everyone |
| Opening hook | One empty cell; pencil tick; completion |
| Board | stats-profile game (demo data) — `completion-light.png` |
| Status | Storyboard only |
| Screen recordings | `completion-light.png`; better: **`cap:completion-video`** — Playwright `recordVideo` for the last entry of a `stats-games.json` puzzle (390×844, DPR 3), trimmed to 3 s |
| Animation | none (screen recording) or `showcase.html` frame |
| Music / SFX | soft completion chime (CC0) |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 10 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

---

## 10. Category 9 — Daily challenge promos

Rules for every daily post:
- The daily is generated **on the device** from the date and is the **same for everyone**.
- **Never show tomorrow's (or any future) puzzle.** Never show *today's* solution on the same day; solution walk-throughs
  use **yesterday's** daily only.
- `home.png` is dated "Sunday, 11 October". For any other posting day, recapture the home screen on that date
  (`cap:home-dated`, using Playwright's clock as the stats profile already does) or crop the date out.
- Difficulty by weekday (from ENGINE.md: Mon/Tue easy, Wed/Thu medium, Fri/Sat hard, Sun expert) — confirm the app
  shows this to players before using it in copy (D3).

### D1 — Today's daily is ready

| Field | Value |
|---|---|
| Objective | Recurring habit post; brings players back daily (post-launch mainly) |
| Audience | Existing and prospective players |
| Opening hook | "Today's daily is the same for everyone. Ready?" |
| Board | today's daily start position only (`cap:daily-start` — tap the Daily challenge card, shot the empty board) |
| Status | Storyboard only |
| Screen recordings | `cap:home-dated`, `cap:daily-start` (both captured on the posting day) |
| Animation | `showcase.html` |
| Music / SFX | MU-FOCUS |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 12 s |
| CTA | pre-launch: "Coming soon to Google Play"; post-launch: **TODO (post-launch)** "Open today's daily in Pencilmark" |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | `cap:home-dated` | "Today's daily is the same for everyone." | "Today's daily is the same for everyone." |
| 3–8 | `cap:daily-start` | "Generated on your phone. No internet needed." | "Made on your phone. No internet needed." |
| 8–12 | End card | "Solve it, then come back tomorrow for the key move." | "See you tomorrow." |

### D2 — Yesterday's daily: one key move

| Field | Value |
|---|---|
| Objective | Educational follow-up; rewards people who played |
| Audience | Daily players |
| Opening hook | "Stuck on yesterday's daily? Here's the move most people miss." |
| Board | yesterday's daily, the hardest step on its logical path, taken from the guided solver (`cap:guided-solve` with `?source=…` or the daily puzzle string). The on-screen explanation must be copied verbatim from the captured step |
| Status | Storyboard only (produced per day; each needs owner approval) |
| Screen recordings | `cap:guided-solve` frames for that step (pattern frame + deduction frame) |
| Animation | `showcase.html`, or `explainer.html` if the step is exported via `export-data.ts` |
| Music / SFX | MU-CALM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 30 s |
| CTA | "Today's daily is waiting." (post-launch) / "Coming soon to Google Play" (pre-launch: use a past date's daily only as a demo) |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–3 | Board at that step | "Stuck on yesterday's daily? Here's the key move." | "Stuck on yesterday's daily?" |
| 3–12 | Pattern frame | technique name + pattern sentence (verbatim) | read the pattern sentence |
| 12–22 | Deduction frame | conclusion sentence (verbatim) | read the conclusion |
| 22–26 | Result | "The rest falls with singles." only if true for that path | — |
| 26–30 | End card | CTA | — |

### D3 — Weekday difficulty ladder

| Field | Value |
|---|---|
| Objective | Set expectations; invite people to join on an easy day |
| Audience | New players |
| Opening hook | "Monday is gentle. Sunday is not." |
| Board | none |
| Status | Storyboard only — verify in-app wording first |
| Screen recordings | none (optional `cap:home-dated` for a Monday) |
| Animation | `progression.html` style cards (7 day chips) |
| Music / SFX | MU-FOCUS |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 15 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V |

On-screen text sequence: "Monday is gentle. Sunday is not." → "Mon–Tue: Easy" → "Wed–Thu: Medium" → "Fri–Sat: Hard"
→ "Sun: Expert" → "Same daily for everyone, made on your phone."

---

## 11. Category 10 — Launch reels

### L1 — Launch teaser — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| Files | `marketing/renders/launch-teaser-1080x1920.mp4`, `marketing/renders/launch-teaser-1920x1080.mp4` |
| Objective | Pre-launch awareness; pinned post in the week before launch |
| Audience | Puzzle players on Shorts/Reels/TikTok; YouTube channel trailer (16:9) |
| Opening hook | Board drawing in with a pencil tick; "Sudoku that teaches you to see." |
| Boards | rendered by `teaser.html` from exported data (see MANIFEST for which board) |
| Screen recordings | per MANIFEST |
| Animation | `teaser.html` |
| Music / SFX | MU-LIFT 100–120 BPM (added later) |
| Ratio / resolution | 9:16 1080×1920 and 16:9 1920×1080 |
| Duration | ~12 s |
| CTA | "Coming soon to Google Play" |
| Export | E-V, E-H |

Intended beats (MANIFEST is the record): 0–3 s hook line; 3–7 s pattern highlight + strike on a real board;
7–9 s "No ads · No account · Works offline"; 9–12 s logo + "Learn to see the logic." + "Coming soon to Google Play".

### L2 — Logo reveal sting — Rendered: yes — see MANIFEST.md

| Field | Value |
|---|---|
| Files | `marketing/renders/logo-reveal-1080x1080.mp4`, `marketing/renders/logo-reveal-1920x1080.mp4` |
| Objective | Brand sting for openers/closers, long-form intros, profile video |
| Audience | All |
| Opening hook | tile pops, grid lines draw, candidate dots, pencil, wordmark, i-dot drops, tagline (per `logo-reveal.html`) |
| Animation | `logo-reveal.html` (square and horizontal layouts) |
| Music / SFX | single soft pencil tick + short chime (≤ 1 s) |
| Ratio / resolution | 1:1 1080×1080; 16:9 1920×1080 |
| Duration | ~4 s |
| CTA | none (sting) |
| Export | E-S, E-H |

Use: first 4 s of YouTube long-form; final 2–3 s of square posts; not at the start of Shorts (hooks must come first).

### L3 — Launch-day announcement reel

| Field | Value |
|---|---|
| Objective | Announce availability on launch day |
| Audience | Followers from pre-launch; communities where allowed |
| Opening hook | "It's here." over the logo tile |
| Boards | from rendered parts only (S1, SS1, T3 excerpt `x-wing (mined: practice:unique-rectangle-4#5 step 17)`) |
| Status | Storyboard only; **post-launch wording — use only after the listing is live and the owner approves** |
| Screen recordings | per S1 |
| Animation | edit of L2 + SS1 + S1 + T3 (no new render required) |
| Music / SFX | MU-LIFT 110–120 BPM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 25 s |
| CTA | **TODO (post-launch):** "Now on Google Play" (+ official Google Play badge per Google's badge guidelines) |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–2 | L2 sting (square, centred) | "It's here." | "It's here." |
| 2–6 | SS1 loop | "Calm, offline Sudoku" | "Calm, offline Sudoku…" |
| 6–12 | T3 excerpt 8.0–12.5 s + 21.6–25.0 s | "that teaches real techniques" | "…that teaches real techniques." |
| 12–20 | S1 excerpt (hint + learn map) | "42 lessons · hints in levels · daily challenge" | "Forty-two lessons, hints in levels, and a daily challenge." |
| 20–25 | End card | "No ads · No account · Works offline. TODO (post-launch): Now on Google Play" | "Pencilmark Sudoku." |

---

## 12. Category 11 — Download-focused promos

### P1 — "Coming soon to Google Play" (pre-launch)

| Field | Value |
|---|---|
| Objective | Single clear message: what it is and that it is coming |
| Audience | Cold audiences |
| Opening hook | "Finally: a Sudoku app with no ads." |
| Boards | rendered parts only (H3 trim of `x-wing (mined: practice:unique-rectangle-4#5 step 17)`) |
| Status | Storyboard only (edit of rendered files) |
| Screen recordings | `home.png`, `hint-3-explain.png` |
| Animation | edit; end card from `showcase.html` |
| Music / SFX | MU-LIFT 100–110 BPM |
| Ratio / resolution | 9:16, 1080×1920 |
| Duration | 15 s |
| CTA | "Coming soon to Google Play" (no store badge before launch) |
| Export | E-V |

| Time | Visual | On-screen text | VO |
|---|---|---|---|
| 0–2 | `home.png` | "A Sudoku app with no ads." | "A Sudoku app with no ads." |
| 2–5 | H3 strike beat (`x-wing (mined: practice:unique-rectangle-4#5 step 17)`) | "That teaches you real techniques." | "That teaches real techniques." |
| 5–9 | `hint-3-explain.png` | "Hints that explain why." | "Hints that explain why." |
| 9–12 | text card | "Works offline · No account · Progress stays on your phone" | "Offline, no account." |
| 12–15 | End card | "Pencilmark Sudoku. Coming soon to Google Play" | "Coming soon to Google Play." |

Note: once the owner confirms pricing, "Free" may be added to the 9–12 s card (e.g. "Free · No ads · …"). Until then, do not.

### P2 — Play listing promo video (16:9)

| Field | Value |
|---|---|
| Objective | Promo video for the Google Play listing (added as a YouTube URL) |
| Audience | Store visitors deciding whether to install |
| Opening hook | gameplay in the first 2 s (no logo-first intro) |
| Boards | rendered parts (`x-wing (mined: practice:unique-rectangle-4#5 step 17)`, `naked-pair (mined: practice:simple-coloring#2 step 25)`), captures |
| Status | Storyboard only; needs a YouTube upload (public or unlisted) by the owner — check Play's current promo video requirements (e.g. ads/monetisation off, no age restriction) before submitting |
| Screen recordings | `play-notes.png`, `hint-3-explain.png`, `learn-map.png`, `lesson-demo-3-effect.png`, `play-dark.png`, `stats.png` (Demo data) |
| Animation | `showcase.html` in 16:9 (phone frame left, caption right), `logo-reveal-1920x1080.mp4` at the end |
| Music / SFX | MU-LIFT 100–115 BPM; no VO required (captions carry it) |
| Ratio / resolution | 16:9, 1920×1080 |
| Duration | 30 s |
| CTA | none needed on Play itself; end card: "Learn to see the logic." |
| Export | E-H |

| Time | Visual | On-screen text |
|---|---|---|
| 0–4 | `play-notes.png` in frame | "Classic Sudoku, beautifully calm" |
| 4–9 | `explainer-x-wing` excerpt (re-laid out 16:9 or pillarboxed) | "See exactly why each move works" |
| 9–14 | `hint-3-explain.png` | "Hints that teach, not tell" |
| 14–19 | `learn-map.png` → `lesson-demo-3-effect.png` | "From first steps to advanced techniques — 42 lessons" |
| 19–23 | `play-dark.png` | "Easy on the eyes, day or night" |
| 23–26 | `stats.png` (Demo data) | "Track your progress offline" |
| 26–30 | `logo-reveal-1920x1080.mp4` tail | "No ads · No account · Works offline" |

Captions match the screenshot plan in `docs/PLAY_STORE.md` so the listing feels consistent.

### P3 — Post-launch download promo — TODO (post-launch)

| Field | Value |
|---|---|
| Objective | Drive installs after launch |
| Status | Storyboard only. **Do not use before the listing is live and the owner approves the wording** |
| Changes from P1 | End card: "Get it on Google Play" with the official badge (follow Google Play badge guidelines; badge artwork downloaded only at that time, by the owner). Add "Free" only if pricing confirmed. No ratings or download numbers unless real and approved |
| Ratio / resolution | 9:16, 1080×1920 (+ 1:1 variant for feeds) |
| Duration | 15 s |
| Export | E-V, E-S |

---

## 13. New captures to add to `scripts/capture-app.mjs` (summary)

Not run now. Each needs the test ids checked against the app source first.

| Capture | Used by | How |
|---|---|---|
| `cap:lesson-<id>` (hidden-single, naked-pair, skyscraper, xy-wing, simple-coloring, unique-rectangle-1, …) | T1, T2, A1–A4, F1 | `page.goto(BASE + '/learn/<id>')`, same steps as the X-Wing lesson block |
| `cap:lesson-logic-vs-guessing` | M3 | `/learn/logic-vs-guessing`, shot each concept card |
| `cap:lesson-candidate-management` | M5 | `/learn/candidate-management`, shot the clean-up exercise |
| `cap:lesson-x-wing-wrong-pick` | M1 | X-Wing "Your turn" card, tap a pattern candidate, shot feedback |
| `cap:play-high-contrast`, `cap:settings-appearance` | S3 | Settings → high-contrast option, back to play, `cell-29` |
| `cap:hint-apply` | T4 | click Apply after `hint-3-explain` |
| `cap:guided-solve` | SS2, D2 | `/learn/solve?puzzle=<81 digits>`, one shot per Next |
| `cap:home-dated`, `cap:daily-start` | D1–D3 | Playwright clock on the posting date; tap Daily challenge |
| `cap:completion-video` | SS3 | `recordVideo` during the last entry of a stats game |
