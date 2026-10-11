# Pencilmark Sudoku: marketing production

Local, reproducible pipeline for the launch videos, Play Store screenshots and social images.
**Nothing in this folder is published, uploaded or scheduled.** Posting anything needs the owner's explicit
approval. This folder is its own small Node project, so the app's dependencies stay untouched.

| Doc | What it is |
|---|---|
| `BRAND_CREATIVE.md` | Tone, claims, colour and type for video, safe areas, pacing, music guidance, do and don't |
| `MANIFEST.md` | Every asset: purpose, size, duration, source, how to re-render, real capture or animation, licences |
| `VIDEO_SCRIPTS.md` | All video concepts with storyboards (rendered ones are marked) |
| `EDU_SERIES.md` | Educational series, rules to expert, aligned with the app's 42 lessons |
| `CONTENT_CALENDAR.md` | 6-week launch calendar across channels |
| `TEMPLATES.md` | How to make new variants of the scenes, thumbnails and covers |

## Requirements

- Windows 10/11 (renders were made on Windows 11). Fonts are system fonts (Segoe UI), so another OS falls back
  to Roboto/Helvetica and text can shift slightly.
- Node 24, **bun** 1.x (runs the TypeScript engine directly for `npm run data`) and Google **Chrome** installed
  (used headless through Playwright's `channel: 'chrome'`, so no browser download is needed).
- The repo root must have `node_modules` installed (`npm install` at the root), because `npm run data` imports
  `src/engine` and `src/learn`, and `npm run capture` serves `dist/`.

## Setup (about 2 minutes)

```powershell
cd marketing
npm install
```

The `ffmpeg-static` install script downloads a prebuilt ffmpeg binary (about 80 MB) into
`node_modules/ffmpeg-static/`. If your npm blocks install scripts, approve it with
`npm install-scripts approve ffmpeg-static` and run `npm rebuild ffmpeg-static`, or run
`node node_modules/ffmpeg-static/install.js`.

## Re-render everything

```powershell
# repo root, only if dist/ is missing or the app changed (about 1-2 minutes)
npm run build:web

cd marketing
npm run render:all
```

`render:all` runs these steps in order. Total time is about 35-45 minutes on a laptop, almost all of it video
frame capture.

| Step | Command | Output | Time |
|---|---|---|---|
| 1. Export engine data | `npm run data` | `data/*.json` (every step re-validated against the unique solution) | ~1 min |
| 2. Capture the real app | `npm run capture` | `captures/*.png` (1170×2532, real UI of the web build) | ~5 min |
| 3. Render videos | `npm run render:videos` | `renders/*.mp4` (+ `.webm`, `.gif` for the loop) | ~30-35 min |
| 4. Render stills | `npm run render:stills` | `exports/*.png` (24-bit RGB, no alpha) | ~1 min |
| 5. Verify | `npm run verify` | console report + `verification.json` | seconds |

Render a single item: `node scripts/render-video.mjs explainer-x-wing` or `node scripts/render-stills.mjs yt-thumbnail`
(both match by name prefix; names are listed in `scripts/specs.mjs`).

Preview: run `npm run serve`, then open `http://127.0.0.1:4180/src/scenes/explainer.html?tech=x-wing&play`
(`&t=12` freezes a frame). Frame grabs without a browser window:
`node scripts/preview.mjs explainer.html 1080 1920 <out-dir> 5,12,20 tech=x-wing`.

## How it works

```
src/engine (app) --bun--> scripts/export-data.ts --> data/*.json (validated positions, curriculum, solve order)
dist/ (app web build) --> scripts/capture-app.mjs --> captures/*.png (real UI)
src/scenes/*.html + src/lib/pm.js --(Chrome, renderFrame(t) per frame @30 fps)--> PNG frames --pipe--> ffmpeg --> renders/*.mp4
src/stills/*.html --> Chrome screenshot --> ffmpeg rgb24 --> exports/*.png
```

- Scenes are deterministic. `window.renderFrame(t)` is a pure function of time, so every render is identical
  and every frame can be edited as source.
- Frames are piped straight into ffmpeg, so no frame folders are left on disk. One headless Chrome runs at a
  time, and jobs run one after another to keep memory low.
- Encoding: H.264 High, `yuv420p`, CRF 20, preset slow, `-tune animation`, BT.709 tags and `+faststart`. The loop
  also gets VP9 WebM and a 360-px GIF.

## Dependencies (marketing only)

| Package | Why | Licence |
|---|---|---|
| `ffmpeg-static` 5.3.0 | Bundled ffmpeg binary for encoding and probing, with no global install. The npm wrapper is GPL-3.0-or-later. The bundled Windows binary is the gyan.dev "essentials" build of FFmpeg 6.1.1, configured with `--enable-gpl --enable-version3`, so it is **GPLv3**. See `node_modules/ffmpeg-static/ffmpeg.exe.LICENSE` and `.README` | GPL-3.0 |
| `playwright-core` 1.64.0 | Drives the installed Chrome headlessly for frame capture, stills and app captures. No browser download | Apache-2.0 |

Licence note: ffmpeg runs as a separate tool. Its GPL licence covers the binary and does not extend to the videos
it produces or to the app. Do not redistribute the binary without its licence and source offer. Host tools that
are not installed by this package: Node, bun, Chrome. The app's own `@playwright/test` is not used here.

## Folder map

| Path | Content |
|---|---|
| `scripts/` | `export-data.ts`, `capture-app.mjs`, `render-video.mjs`, `render-stills.mjs`, `verify.mjs`, `preview.mjs`, `serve.mjs`, `specs.mjs` (list of deliverables), `lib.mjs` (server, ffmpeg path, probe) |
| `src/lib/pm.js` | Shared motion library: tokens, easing, SVG board, brand mark, wordmark, end card, captions |
| `src/scenes/` | Video scenes (editable source) |
| `src/stills/` | Static compositions (editable source) |
| `data/` | Engine-exported JSON (generated; do not edit by hand) |
| `captures/` | Real app screenshots (generated) |
| `renders/` | Final videos |
| `exports/` | Final static images |
