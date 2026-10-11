# Reusable templates: captions, thumbnails, covers, scenes

Every template is an HTML file driven by URL parameters and by the engine data in `data/`. To make a new
variant, change a parameter or a data entry and re-render. Never edit a PNG or MP4 by hand.

Preview any template in a browser: run `npm run serve` (in `marketing/`), then open
`http://127.0.0.1:4180/src/...` with the parameters below. Add `&t=12.5` to a scene to freeze it at 12.5 s, or
`&play` to watch it in real time.

## 1. Video scene templates (`src/scenes/`)

| Template | Parameters | Content source | Notes |
|---|---|---|---|
| `explainer.html` | `w`, `h`, `tech=hidden-single \| naked-pair \| x-wing` | `data/explainers.json` | Captions are built from the engine step (cell names, digits, units), so new data gives correct captions automatically |
| `grid-loop.html` | `w`, `h` | `data/solve-loop.json` | Seamless 8 s loop: a real puzzle filled in the solver's order |
| `progression.html` | `w`, `h` | `data/curriculum.json` | Levels, lesson counts and technique names come from the app curriculum |
| `showcase.html` | `w`, `h` | `captures/*.png` | Edit the `SLIDES` and `captions` arrays to re-cut |
| `teaser.html` | `w`, `h` (portrait or landscape layout chosen automatically) | `data/explainers.json` (X-Wing), `captures/` | |
| `logo-reveal.html` | `w`, `h` | brand geometry in `src/lib/pm.js` (`markSVG`) | Stacked lockup for square, horizontal for wide |

### Add another technique explainer (e.g. Pointing)

1. In `scripts/export-data.ts`, add an entry to `explainers`, using `pick('pointing', score)` for a fixture
   example or `pickFrom(mine('pointing'), score)` for a mined, spoiler-free position. Then run `npm run data`.
   The script re-validates the step against the unique solution and fails loudly if anything is off.
2. In `src/scenes/explainer.html`, add a `tech === 'pointing'` branch that sets `S = { dur, caps, phase, end, draw }`.
   Copy the naked-pair branch, which already uses the shared helpers `cand`, `strike`, `placeAt`, `dimOutside`
   and `B.shadeUnit` / `B.ring` / `B.path`. Build caption text from the step data, never by typing cell names.
3. Add a job to `scripts/specs.mjs` (`VIDEO_SPECS`) and run `node scripts/render-video.mjs explainer-pointing`.
4. Check frames with `node scripts/preview.mjs explainer.html 1080 1920 <outdir> 5,12,20 tech=pointing`.

### Caption rules (all scenes)

- Write captions as data-driven template strings, for example `` `Remove ${d} from ${names(cells)}.` ``.
- At most 3 lines at 46-48 px on 1080-wide canvases. `text-wrap: balance` is on.
- Cell names (`r5c3`) automatically get the `.cellref` pill, and `= 5` stays on one line.
- Start the takeaway caption with `<b>Takeaway:</b>`.

## 2. Static templates (`src/stills/`)

| Template | Size | Parameters | Example |
|---|---|---|---|
| `store-screenshot.html` | 1080×1920 | `n=1..6` (plan in the file: capture, title, subtitle, theme) | `?w=1080&h=1920&n=2` |
| `yt-thumbnail.html` | 1280×720 | `tech`, `title`, `sub`, `kick` | `?w=1280&h=720&tech=x-wing&title=X-Wing&sub=Explained%20on%20a%20real%20puzzle` |
| `shorts-cover.html` | 1080×1920 | `tech`, `title`, `sub` | `?w=1080&h=1920&tech=naked-pair&sub=Two%20cells,%20two%20digits` |
| `social-header.html` | any (X 1500×500, Facebook 1640×624 / 851×315) | `w`, `h` | `?w=1500&h=500` |
| `background.html` | any | `theme=light \| dark \| brand` | `?w=1920&h=1080&theme=brand` |

To add a new still, add a line to `STILL_NAMES` in `scripts/specs.mjs` with `name`, `page`, `w`, `h` and `q`
(the query string). Then run `node scripts/render-stills.mjs <name-prefix>`. Output is a 24-bit RGB PNG
(no alpha) in `exports/`.

### Thumbnail copy patterns

| Pattern | Title (≤ 3 words) | Subtitle (≤ 5 words) |
|---|---|---|
| One technique | `X-Wing` | `Explained on a real puzzle` |
| Question | `Where's the 5?` | `A Hidden Single in box 2` |
| Mistake | `Don't erase this` | `Pattern cells keep their digit` |
| Level | `Level 3 starts here` | `Your first fish` |

Rules: keep the board visible (it carries the brand), use one accent colour for the kicker chip, and make no
claims beyond BRAND_CREATIVE.md §3.

## 3. Post caption templates (copy, for later use after approval)

**Technique Short (YouTube Shorts / Reels / TikTok)**

```
{Technique} in {N} seconds: {one-line takeaway}.
Real puzzle, real logic, no guessing.
Pencilmark Sudoku: offline, no ads, no account. Coming soon to Google Play.
#sudoku #sudokutips #{techniquehashtag} #logicpuzzle #learnsudoku
```

**Feature post**

```
{Feature headline}. {One sentence on how it works in the app.}
Pencilmark teaches 42 lessons, from the rules to forcing chains, all offline.
Coming soon to Google Play.
```

**Community answer (r/sudoku etc.; value first, disclose, no link unless the rules allow it)**

```
{Answer the question with the deduction, using r#c# names.}
(Disclosure: I'm building a Sudoku app that teaches techniques, which is why I had this example handy.)
```

## 4. Re-render checklist

1. `npm run data` (only if the engine or curriculum changed): this re-validates all positions.
2. `npm run capture` (only if the app UI changed): run `npm run build:web` at the repo root first.
3. `node scripts/render-video.mjs <prefix>` and/or `node scripts/render-stills.mjs <prefix>`.
4. `npm run verify`: checks sizes, durations, codecs and that no PNG has an alpha channel.
5. Look at 2-3 frames of every changed video, using `scripts/preview.mjs` or ffmpeg frame grabs, and update
   `MANIFEST.md`.
