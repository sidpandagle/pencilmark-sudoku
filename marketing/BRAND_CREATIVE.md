# Pencilmark Sudoku: creative direction for video and social

> Status: local production material. Nothing here has been published, uploaded or scheduled. Anything
> externally visible needs the owner's explicit approval first.
> Written 2026-10-11. Source of truth for colours and type: `docs/DESIGN.md`. For the brand mark: `docs/ASSETS.md`.

## 1. The idea in one line

**"Learn to see the logic."** Pencilmark is the calm, honest Sudoku that shows *why* each move works.
Every piece of marketing should leave the viewer having actually learned something. A real deduction on a
real board is our best advert.

## 2. Tone

| We are | We are not |
|---|---|
| Calm, clear, patient: a good teacher with a paper puzzle book | Hyped, loud, "INSANE trick!!", clickbait |
| Precise: real cell names (r5c3), real technique names | Vague ("this one weird trick") |
| Respectful: offline, no ads, no account, your data stays on your phone | Pushy: countdowns, fake scarcity, "download now or miss out" |
| Encouraging: "you can learn this" | Gatekeeping or show-off ("only geniuses can see this") |

Voice rules: short sentences, present tense, second person ("Look at row 4"). Name the technique, show it
and then say what it means for you in one line. Captions are written so they work without sound.

## 3. Claims (strict)

Only claim what is true today:

- Works offline. No ads. No account, no tracking. Progress stays on the device.
- 42 lessons in 5 levels. Hints in levels (nudge, technique, where, explain, apply). Daily challenge. Notes and
  auto-notes. Stats, streaks, achievements. Light, dark and high-contrast themes.
- Availability: **"Coming soon to Google Play"** until the listing is live and the owner approves new wording.
- **Do not say "Free"** until the owner confirms pricing. It is one constant (`CLAIMS` in `src/lib/pm.js`), so
  adding it later is a one-line change and a re-render.
- Never show ratings, download counts, reviews, awards or "#1".
- Stats and achievements captures come from scripted demo play. If a stats screen appears in a post, add the label
  "Demo data" or leave the numbers out of the copy.

## 4. Visual rules for video

### 4.1 Colour (from DESIGN.md)

| Role | Light | Use in video |
|---|---|---|
| Paper background | `#F4F1EA` | default background of every scene |
| Surface (board) | `#FFFDF8` | board paper |
| Ink | `#1E2733` | headlines, given digits |
| Accent | `#2F5DA8` | player or placed digits, brand chip, single-digit focus |
| Hint gold / soft | `#B27A18` / `#FBEBC8` | the pattern: unit fills, rings, the X-Wing rectangle |
| Eliminate | `#C0392B` | removed candidates, **always with a strike line** (not colour alone) |
| Success | `#2E7D55` | the placement flash, "solved" states, completed step dots |
| Brand ink gradient | `#2D5193 → #1B2B47` | end cards, social headers. Paper `#F4F1EA` text, `#8DB2FF` details |

Dark scenes use the dark tokens from DESIGN.md (`#11151B` background, `#F2C062` hint, `#FF7F72` eliminate).
Never use pure white or pure black. Use one accent per frame plus hint gold for the logic, and nothing else.

### 4.2 Type

- System font stack (Segoe UI, Roboto, Helvetica Neue, Arial). This matches the app.
- Headlines weight 900, tight tracking (-0.02 to -0.035 em). Captions weight 600. Cell references are bold, in
  a soft pill (`.cellref`).
- **Sizes at 1080×1920:** title 96 px, caption 46-48 px (2-3 lines at most), step labels 30 px, board digits
  about 52 px and candidates about 29 px. At 1920×1080 scale by 0.75. Nothing smaller than 24 px on a 1080-wide
  canvas.
- Use tabular digits for anything numeric.

### 4.3 Safe areas (Shorts, Reels, TikTok)

The platform UI covers the top bar, the right-hand action rail and the bottom caption area.

| Canvas | Keep critical content inside |
|---|---|
| 1080×1920 (9:16) | x 60-940, y 220-1500. The explainer board sits at x 135-945, y 650-1460 |
| 1920×1080 (16:9) | 96 px margin. Keep the lower 15% free of key text on YouTube (player controls) |
| 1080×1080 (1:1) | 60 px margin |
| X header 1500×500 | centre 1000×300. Profile photo covers the lower left |
| Facebook cover 1640×624 / 851×315 | central 640×312 of the 820-wide display |

### 4.4 Layout grammar

1. **Hook (0-3 s):** the technique name and a one-line question or promise. The board starts drawing at once.
2. **Look:** shade the unit(s) in hintSoft.
3. **Pattern:** rings and lines in hint gold.
4. **Deduce:** strike the candidates in eliminate red. The caption says exactly which candidates go.
5. **Result:** place the digit (accent, with a short success flash), or show the single the elimination unlocks.
6. **Takeaway:** one line, starting with "Takeaway:".
7. **End card (3-4 s):** brand gradient, mark, wordmark, tagline, claims pill, "Coming soon to Google Play".

A four-step indicator (Look, Pattern, Deduce, Result) under the board keeps viewers oriented.

### 4.5 Pacing and motion

- 30 fps. Standard eases (`ease.out`, `ease.inOut`). A beat lasts 150-400 ms, a caption 2.5-4.5 s.
- Explainers: 25-35 s. Hooks: 10-15 s. Loops: 6-10 s and seamless (the first frame equals the last).
- Motion follows the logic: draw lines in the direction the reasoning travels (from the blocking digit across
  the box, along the base lines, then across the cover lines).
- No shake, zoom-punch, glitch, whip pans, confetti or emoji stickers. The only "celebration" is the success flash.
- Respect reduced motion in spirit. Nothing strobes, and no flash is faster than 200 ms.

### 4.6 Boards: truth before beauty

- Every board comes from `marketing/data/*.json`, which `scripts/export-data.ts` exports from the app engine.
  Each step is re-validated against the unique solution. Never hand-edit a digit.
- Captions are shortened engine explanations and must be logically identical to them.
- The videos avoid the positions the app uses for a lesson's guided exercise and mastery check (fixture examples
  #1-#3), so marketing never spoils them. Example #0 (the lesson's worked demo) or positions mined from other
  techniques' practice puzzles are used instead.
- Uniqueness techniques (Unique Rectangles, BUG+1) must show "Only valid when the puzzle has exactly one solution."

## 5. Music and sound

Nothing has been downloaded. Choose tracks later and record each licence in `MANIFEST.md`.

| Use | Mood | Tempo | Notes |
|---|---|---|---|
| Explainers and tutorials | warm lo-fi or soft piano, unobtrusive | 70-90 BPM | duck to about -24 LUFS under the voice-over |
| Showcases and teasers | light acoustic or soft synth pulse, optimistic | 90-110 BPM | cut on beats at section changes |
| Loops and satisfying clips | minimal ambient, or no music with pencil SFX only | n/a | loop-safe (no fade-in/out inside the loop) |

**Sources to evaluate (check the licence of every single track before use):**

- YouTube Audio Library: free for YouTube, and some tracks need attribution. Check the licence before using a
  track on other platforms.
- Pixabay Music: Pixabay Content License. Read the current terms, including the restrictions on standalone
  redistribution.
- Free Music Archive: licences vary per track (CC BY needs credit, while NC and ND variants may not fit
  promotional use).
- freesound.org: prefer CC0 for SFX such as pencil taps, paper slides and a soft "tick" for placements. CC BY
  needs credit.
- In-app platform libraries (TikTok, Instagram): only inside those apps, and only within their terms.

**SFX vocabulary:** a soft pencil tap for each candidate, a slightly brighter tap when a digit is placed, a paper
swish for transitions and a gentle two-note chime for "solved". Keep SFX about 6 dB under the music peak.
Avoid "whoosh" and "boom" stock effects.

**Audio export:** AAC-LC 192 kbps, 48 kHz stereo. Loudness about -14 LUFS integrated for social and -16 LUFS for
YouTube long-form, with true peak at or below -1 dBTP.

## 6. Do and don't

| Do | Don't |
|---|---|
| Show one real deduction, from start to result | Show a board with an invalid or "illustrative" move |
| Keep captions on screen and readable muted | Rely on voice-over alone |
| Use r#c# names *and* the row and column numbers around the board | Use cell names without labels on the board |
| Keep the board as the hero, with decoration away from it | Put stickers, emojis or arrows over digits |
| Mark eliminations with colour **and** a strike | Rely on colour alone (colour-blind viewers) |
| Say "Coming soon to Google Play" | Say "Free", "#1", "millions of players", or show fake reviews |
| Keep the end card short (3-4 s) and calm | Use countdowns, fake urgency or "link in bio" spam on every post |
| Label real app captures as real (the "Real app screens" tag) | Mix mock-ups into "real" footage |
| Credit music when the licence asks for it | Use a track without checking its licence |

## 7. Production pipeline (summary)

HTML/CSS/SVG scenes run on a deterministic timeline (`window.renderFrame(t)`). Headless Chrome captures each
frame at 30 fps and ffmpeg-static encodes the result: H.264 High, yuv420p, CRF 20, BT.709 and +faststart.
For setup see `README.md`, for each file see `MANIFEST.md`, and for re-rendering with new content see
`TEMPLATES.md`.
