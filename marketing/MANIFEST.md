# Marketing asset manifest

> All files are local. Nothing has been published, uploaded or submitted.
> Generated and verified on 2026-10-11 with `npm run verify` (machine-readable report: `verification.json`).
> Every MP4 is H.264 High, yuv420p, 30 fps, CRF 20, BT.709, +faststart, with no audio track. Every PNG in
> `exports/` is 8-bit RGB (PNG colour type 2, so 24-bit with no alpha). This was checked with ffmpeg, a PNG header
> read and Pillow.

**Labels.** *Real capture* means a screenshot of the actual app UI: the web build in `dist/`, driven by
`scripts/capture-app.mjs`. *Animation* means a motion-graphic recreation drawn by our scenes from real engine data.
*Mixed* means real captures inside animated framing.

## 1. Videos (`renders/`)

| File | Purpose | Size | Duration | Format | Source | Type |
|---|---|---|---|---|---|---|
| `logo-reveal-1080x1080.mp4` | Brand sting (square). The grid draws in, then the pencil-mark dots, pencil, wordmark and tagline | 1080×1080 | 4.00 s | MP4 H.264, 89 KB | `src/scenes/logo-reveal.html` | Animation |
| `logo-reveal-1920x1080.mp4` | Brand sting (16:9 horizontal lockup), intro or outro for YouTube | 1920×1080 | 4.00 s | MP4, 119 KB | same | Animation |
| `grid-loop-1080x1920.mp4` | Seamless loop: a real easy puzzle filled in the solver's order (Full House / Hidden Single). The ticker names each technique | 1080×1920 | 8.00 s | MP4, 368 KB | `src/scenes/grid-loop.html` + `data/solve-loop.json` | Animation (real puzzle) |
| `grid-loop-1080x1920.webm` | Same loop for the web or landing page | 1080×1920 | 8.00 s | WebM VP9, 397 KB | encoded from the MP4 | Animation |
| `grid-loop-360w.gif` | Lightweight loop for README, issues or a community post | 360×640 | 8.00 s (15 fps) | GIF 64 colours, 737 KB | encoded from the MP4 | Animation |
| `explainer-hidden-single-1080x1920.mp4` | Technique Short: Hidden Single (cross-hatching in box 2, r1c5 = 5) | 1080×1920 | 31.10 s | MP4, 961 KB | `src/scenes/explainer.html?tech=hidden-single` + `data/explainers.json` | Animation (real position) |
| `explainer-naked-pair-1080x1920.mp4` | Technique Short: Naked Pair ({1,2} in row 5, five eliminations, then r5c3 = 3) | 1080×1920 | 31.00 s | MP4, 1326 KB | `explainer.html?tech=naked-pair` | Animation (real position) |
| `explainer-x-wing-1080x1920.mp4` | Technique Short: X-Wing on 1 (rows 2 and 9, columns 1 and 4, remove 1 from r3c4, then r3c4 = 7) | 1080×1920 | 35.00 s | MP4, 1441 KB | `explainer.html?tech=x-wing` | Animation (real position) |
| `feature-showcase-1080x1920.mp4` | Feature tour: home, play, notes, the hint ladder, learning map, lesson, dark mode, stats, end card | 1080×1920 | 25.00 s | MP4, 2083 KB | `src/scenes/showcase.html` + `captures/*.png` | **Mixed**: every screen is a real capture; the phone frame, captions and cuts are animated |
| `launch-teaser-1080x1920.mp4` | Launch teaser (vertical): hook, a real X-Wing, three real screens, end card | 1080×1920 | 12.00 s | MP4, 1028 KB | `src/scenes/teaser.html` | Mixed |
| `launch-teaser-1920x1080.mp4` | Launch teaser (horizontal), suitable as a Play promo-video draft or YouTube | 1920×1080 | 12.00 s | MP4, 1181 KB | same source, landscape layout | Mixed |
| `progression-1080x1920.mp4` | Beginner-to-expert path: levels 1 to 5 with lesson counts and technique names from the app curriculum | 1080×1920 | 15.00 s | MP4, 839 KB | `src/scenes/progression.html` + `data/curriculum.json` | Animation (real curriculum) |

Every explainer ends with the end card: mark, "Pencilmark", "Learn to see the logic.", "Offline · No ads ·
No account" and "Coming soon to Google Play". "Free" is deliberately left out until pricing is confirmed.

**Board provenance (explainers, teaser, thumbnails, covers):**

| Technique | Position | Engine explanation shown (shortened in captions, same logic) |
|---|---|---|
| Hidden Single | fixture `hidden-single` example #0 (the lesson's worked demo) | "In box 2, 5 can only go in r1c5, so r1c5 = 5." |
| Naked Pair | mined, from `practice:simple-coloring#2`, step 25 | "In row 5, r5c1 and r5c4 contain only the candidates {1,2} … Remove 1 from r5c3, r5c6 and r5c7 and 2 from r5c3 and r5c6." Payoff: "r5c3 has only one candidate left, 3." |
| X-Wing | mined, from `practice:unique-rectangle-4#5`, step 17 | "X-Wing on 1: in rows 2 and 9, 1 can only go in columns 1 and 4 … remove 1 from r3c4." Payoff: "r3c4 has only one candidate left, 7." |

`scripts/export-data.ts` checks every step with the engine's `validateStep` against the brute-force unique
solution. It also confirms the engine finds exactly that step at that position, meaning all easier techniques
are exhausted. Fixture examples #1-#3, which are the lessons' exercise and mastery positions, are not used, so
nothing in the app is spoiled.

## 2. Static exports (`exports/`)

| File | Purpose | Size | Source | Type |
|---|---|---|---|---|
| `play-screenshot-01-1080x1920.png` | Play screenshot 1, "Classic Sudoku, beautifully calm" (board mid-game with notes) | 1080×1920, 184 KB | `src/stills/store-screenshot.html?n=1` + `captures/play-notes.png` | Mixed (real UI) |
| `play-screenshot-02-1080x1920.png` | 2, "Hints that teach, not tell" (hint level 3 with the X-Wing overlay) | 1080×1920, 218 KB | `n=2` + `captures/hint-2-where.png` | Mixed |
| `play-screenshot-03-1080x1920.png` | 3, "From first steps to advanced techniques" (learning map) | 1080×1920, 230 KB | `n=3` + `captures/learn-map.png` | Mixed |
| `play-screenshot-04-1080x1920.png` | 4, "See exactly why each move works" (X-Wing lesson, elimination part) | 1080×1920, 267 KB | `n=4` + `captures/lesson-demo-3-effect.png` | Mixed |
| `play-screenshot-05-1080x1920.png` | 5, "Easy on the eyes, day or night" (dark board) | 1080×1920, 174 KB | `n=5` + `captures/play-dark.png` | Mixed |
| `play-screenshot-06-1080x1920.png` | 6, "Track your progress offline" (statistics; **demo data**, see §3) | 1080×1920, 165 KB | `n=6` + `captures/stats.png` | Mixed |
| `yt-thumbnail-x-wing-1280x720.png` | YouTube thumbnail template (X-Wing) | 1280×720, 77 KB | `src/stills/yt-thumbnail.html?tech=x-wing` | Animation (real position) |
| `yt-thumbnail-naked-pair-1280x720.png` | YouTube thumbnail (Naked Pair) | 1280×720, 94 KB | `?tech=naked-pair` | Animation |
| `yt-thumbnail-hidden-single-1280x720.png` | YouTube thumbnail (Hidden Single) | 1280×720, 71 KB | `?tech=hidden-single` | Animation |
| `shorts-cover-x-wing-1080x1920.png` | Shorts / Reels / TikTok cover (X-Wing) | 1080×1920, 98 KB | `src/stills/shorts-cover.html?tech=x-wing` | Animation |
| `shorts-cover-naked-pair-1080x1920.png` | Cover (Naked Pair) | 1080×1920, 121 KB | `?tech=naked-pair` | Animation |
| `shorts-cover-hidden-single-1080x1920.png` | Cover (Hidden Single) | 1080×1920, 91 KB | `?tech=hidden-single` | Animation |
| `x-header-1500x500.png` | X / Twitter profile header | 1500×500, 222 KB | `src/stills/social-header.html?w=1500&h=500` | Animation |
| `facebook-cover-1640x624.png` | Facebook page cover, high resolution (2× the 820×312 desktop display) | 1640×624, 272 KB | `social-header.html?w=1640&h=624` | Animation |
| `facebook-cover-851x315.png` | Facebook page cover at the commonly recommended upload size | 851×315, 109 KB | `social-header.html?w=851&h=315` | Animation |
| `background-{light,dark,brand}-1920x1080.png` | Promo backgrounds (slides, video backdrops, landing hero) | 1920×1080, 53 / 53 / 381 KB | `src/stills/background.html?theme=…` | Animation |
| `background-{light,dark,brand}-1080x1920.png` | Vertical promo backgrounds | 1080×1920, 52 / 53 / 342 KB | same | Animation |

**Platform sizes, checked 2026-10-11 by web search.** Most results were third-party guides, and the platforms'
own help pages were not reachable, so re-check before uploading.

- Google Play phone screenshots: JPEG or 24-bit PNG with no alpha, 320-3840 px per side, long side at most 2× the
  short side. 1080×1920 is recommended (from `docs/PLAY_STORE.md`, checked the same day).
- X header: 1500×500 (3:1). The profile photo covers the lower left, and about 60 px at the top and bottom can be
  cropped. Guides disagree on the size limit (2 MB or 5 MB).
- Facebook page cover: most guides say upload 851×315 (minimum 400×150). It displays at 820×312 on desktop and
  640×360 on mobile, so keep key content in the centre. The brief's 1640×624 is the 2× variant, and both are
  provided.
- YouTube thumbnail: 1280×720 (16:9), under 2 MB, JPG/PNG/GIF. Our files are about 70-95 KB.

## 3. Real app captures (`captures/`, inputs, 1170×2532 PNG)

Captured by `scripts/capture-app.mjs` from the exported web build (`npm run build:web`, served by
`e2e/serve.mjs`) in headless Chrome at a 390×844 viewport with deviceScaleFactor 3, light theme unless noted.

| Capture | What it shows |
|---|---|
| `home`, `learn-map`, `lesson-concept`, `lesson-demo-1-units` … `lesson-demo-4-result` | Fresh install. The lesson captures show the X-Wing lesson's worked demo (fixture example #0) |
| `play-start`, `play-entries`, `notes-1-manual`, `notes-1b-manual`, `notes-2-autofill`, `play-notes` | Real play: the mined X-Wing puzzle imported, the solver's 12 placements typed, notes auto-filled, then 11 notes removed by hand |
| `hint-0-nudge`, `hint-1-technique`, `hint-2-where`, `hint-3-explain` | The app's own hint ladder on that position. The script asserts the panel shows exactly the engine's X-Wing explanation |
| `play-dark`, `hint-dark-where` | Same position in dark theme |
| `completion-light`, `stats`, `achievements` | **Demo data.** Five real puzzles solved through the UI, with Playwright's fake clock spreading them over 7-10 Oct 2026 with realistic solve times (6-22 min). The streak (4), times and counts are therefore scripted. Label as "Demo data" if shown with numbers in copy |

`home.png` shows the date "Sunday, 11 October" (the capture date).

## 4. Data (`data/`, generated by `npm run data`)

| File | Content |
|---|---|
| `explainers.json` | The three explainer positions: grid, givens, candidates, solution, engine step, payoff single, cross-hatch proof and provenance |
| `technique-examples.json` | Example #0 of every technique the engine has fixtures for (33), with the engine explanation, for `EDU_SERIES.md` |
| `curriculum.json` | Levels, the 42 lessons and the technique catalog, from `src/learn/curriculum.ts` and the engine catalog |
| `solve-loop.json` | Puzzle, solution and placement order for the grid loop |
| `app-play.json`, `stats-games.json` | Scripts for the real-app captures (entries and removals, demo games) |

## 5. How to re-render

| Asset | Command (in `marketing/`) |
|---|---|
| Everything | `npm run render:all` (about 35-45 min) |
| One video | `node scripts/render-video.mjs <name-prefix>`, e.g. `explainer-x-wing`, `launch-teaser`, `logo-reveal` |
| One still | `node scripts/render-stills.mjs <name-prefix>`, e.g. `play-screenshot`, `facebook` |
| Captures | `npm run capture` (run `npm run build:web` at the root first) |
| Data | `npm run data` |
| Check | `npm run verify` |

Render cost on this laptop is about 0.35-0.5 s per 1080×1920 frame, so a 30 s explainer takes about 6-7 minutes.

## 6. Dependencies and licences

| Component | Version | Licence | Note |
|---|---|---|---|
| ffmpeg-static (npm wrapper) | 5.3.0 | GPL-3.0-or-later | marketing devDependency |
| FFmpeg binary bundled by ffmpeg-static | 6.1.1 "essentials" build by gyan.dev (Windows x64) | **GPLv3** (`--enable-gpl --enable-version3`, includes libx264, libvpx) | Used as a separate executable for encoding. Licence text: `node_modules/ffmpeg-static/ffmpeg.exe.LICENSE`. Source: github.com/FFmpeg/FFmpeg commit e38092ef93. The output videos are not GPL-encumbered. Do not redistribute the binary without its licence and a source offer |
| playwright-core | 1.64.0 | Apache-2.0 | drives the locally installed Chrome; no browser download |
| Google Chrome | 154 (host install) | Google Chrome ToS | headless rendering only |
| bun | 1.x (host) | MIT | runs `export-data.ts` |
| Fonts | Segoe UI (Windows system font) | Microsoft, bundled with Windows | Text is rendered into pixels. No font files are distributed |
| Brand art | `assets/source/brand/*.svg` geometry, re-drawn in `src/lib/pm.js` | original project art (see `docs/ASSETS.md`: "All art is original") | |
| Music / SFX | **none included** | n/a | Sources and licence checks are in `BRAND_CREATIVE.md` §5 |

## 7. Not produced (and why)

- **Audio.** No music or voice-over is in any render (by design, nothing was downloaded). Add audio in an editor
  after choosing licensed tracks.
- **True screen-recorded video of the app.** The showcase uses sequenced real screenshots, not a continuous screen
  recording. Playwright's `recordVideo` works here (its ffmpeg is installed), but it records VP8 at about 1 Mbit/s,
  which is too soft for 1080×1920. A device screen recording (Android `adb shell screenrecord`) is the better
  source for continuous footage later.
- **Explainers beyond the three techniques.** Storyboards are in `VIDEO_SCRIPTS.md` and `EDU_SERIES.md`, and
  `TEMPLATES.md` shows how to add one.
