# Pencilmark — Asset manifest

All art is original and drawn as SVG in `assets/source/`. PNGs are generated from it. Do not edit PNGs by hand.

## Regenerate

```powershell
node scripts/export-assets.mjs     # takes ~5 seconds
```

- Renderer: `@resvg/resvg-js` (devDependency, prebuilt binary, no system install).
- Text (wordmark, feature graphic) uses system fonts: Segoe UI on Windows, then Roboto / Helvetica Neue / Arial. The committed PNGs were exported on Windows 11 with Segoe UI. On another OS, text PNGs can differ slightly.
- The wordmark "i" is a dotless i (U+0131). Its dot is `<rect id="idot">`, the accent pencil-mark square. The script measures the glyph in the installed font and moves the square over it. You only edit colour, size and text in the SVG.
- Opaque outputs (`icon.png`, adaptive background, feature graphic) are written as 24-bit RGB PNGs with no alpha channel.

## Style rules

- Brand ink blue is a diagonal gradient from `#2D5193` to `#1B2B47`. Grid lines are paper `#F4F1EA`, candidate dots are `#8DB2FF`, the pencil is `#F2C062`.
- The brand mark sits in a 600×600 local box (grid frame 28, inner lines 16). Every brand file uses the same geometry, only scaled.
- UI icons (badges, achievements) use a 24×24 viewBox with 2 px round strokes, matching DESIGN.md.
- Achievements use `stroke="currentColor"`, and the root `color` defaults to ink `#1E2733`. Override `color` to theme them, for example `#E8ECF1` in dark mode.
- Illustrations use a 240×180 viewBox with 3 px round strokes. Line colour is `currentColor`, accents are fixed palette colours, and no text is baked in.
- Difficulty is never shown by colour alone. Each level has its own shape and candidate-dot count.

## Manifest

### App / Expo (referenced from `app.json`)

| File | Purpose | Size | Format | Source |
|---|---|---|---|---|
| `assets/icon.png` | App icon (Expo `icon`, legacy launchers) | 1024×1024 | PNG RGB, opaque, square corners | `assets/source/brand/icon.svg` |
| `assets/android-icon-foreground.png` | Adaptive icon foreground. Mark sits inside the 66/108 safe circle | 1024×1024 | PNG RGBA, transparent | `assets/source/brand/android-icon-foreground.svg` |
| `assets/android-icon-background.png` | Adaptive icon background (ink-blue gradient) | 1024×1024 (same as foreground, as Expo requires) | PNG RGB | `assets/source/brand/android-icon-background.svg` |
| `assets/android-icon-monochrome.png` | Android 13+ themed icon (alpha only) | 1024×1024 | PNG RGBA, white on transparent | `assets/source/brand/android-icon-monochrome.svg` |
| `assets/splash-icon.png` | Splash image (`expo-splash-screen`, `imageWidth` 200). Mark fits the Android 12+ 2/3 circle mask | 1024×1024 | PNG RGBA, transparent | `assets/source/brand/splash-icon.svg` |
| `assets/favicon.png` | Web favicon | 48×48 | PNG RGBA | `assets/source/brand/mark.svg` |

Splash backgrounds come from `app.json`, not the image: light `#F4F1EA`, dark `#11151B`.

### Brand

| File | Purpose | Size | Format | Source |
|---|---|---|---|---|
| `assets/brand/mark-512.png` | Brand mark (rounded square) for in-app use and docs | 512×512 | PNG RGBA | `assets/source/brand/mark.svg` |
| `assets/brand/wordmark.png` | Wordmark "Pencilmark", for light backgrounds | ~959×162 (trimmed) | PNG RGBA | `assets/source/brand/wordmark.svg` |
| `assets/brand/wordmark-dark.png` | Wordmark for dark backgrounds (ink `#E8ECF1`, dot `#8DB2FF`) | ~959×162 (trimmed) | PNG RGBA | `assets/source/brand/wordmark.svg`, recoloured by the script |

### Difficulty badges (24 dp, exported at 4x)

| File | Shape / cue | Colour | Size | Source |
|---|---|---|---|---|
| `assets/badges/difficulty-easy.png` | Circle, 1 dot | success `#2E7D55` | 96×96 | `assets/source/badges/difficulty-easy.svg` |
| `assets/badges/difficulty-medium.png` | Diamond, 2 dots | accent `#2F5DA8` | 96×96 | `assets/source/badges/difficulty-medium.svg` |
| `assets/badges/difficulty-hard.png` | Hexagon, 3 dots | colorB `#D2691E` | 96×96 | `assets/source/badges/difficulty-hard.svg` |
| `assets/badges/difficulty-expert.png` | Solid star, 4 dots | ink `#1E2733` | 96×96 | `assets/source/badges/difficulty-expert.svg` |

### Achievement icons (24 dp line icons, exported at 4x, ink colour)

| File | Achievement | Motif | Source |
|---|---|---|---|
| `assets/achievements/first-win.png` | First win | Trophy | `assets/source/achievements/first-win.svg` |
| `assets/achievements/streak-3.png` | 3-day streak | Flame + 1 tally | `.../streak-3.svg` |
| `assets/achievements/streak-7.png` | 7-day streak | Flame + 2 tallies | `.../streak-7.svg` |
| `assets/achievements/streak-30.png` | 30-day streak | Flame + 3 tallies | `.../streak-30.svg` |
| `assets/achievements/no-mistake.png` | Solve with no mistakes | Shield + check | `.../no-mistake.svg` |
| `assets/achievements/no-hint.png` | Solve with no hints | Bulb with slash | `.../no-hint.svg` |
| `assets/achievements/speed.png` | Fast solve | Stopwatch | `.../speed.svg` |
| `assets/achievements/all-difficulties.png` | Solve every difficulty | The 4 difficulty shapes | `.../all-difficulties.svg` |
| `assets/achievements/technique-master.png` | Learn every technique | Mortarboard | `.../technique-master.svg` |
| `assets/achievements/daily.png` | Daily puzzle | Calendar + check | `.../daily.svg` |

All are 96×96 PNG RGBA. For themed rendering in the app, prefer the SVG sources through react-native-svg with `color` set to the theme ink.

### Illustrations (240×180 viewBox, exported at 2x)

| File | Use | Size | Source |
|---|---|---|---|
| `assets/illustrations/empty-state.png` | Empty lists (no history, no saved game) | 480×360 | `assets/source/illustrations/empty-state.svg` |
| `assets/illustrations/completion.png` | Puzzle solved screen | 480×360 | `assets/source/illustrations/completion.svg` |
| `assets/illustrations/learning.png` | Learning mode intro | 480×360 | `assets/source/illustrations/learning.svg` |

### Google Play listing (`store/`, not bundled in the app)

| File | Purpose | Size | Format | Play requirement | Source |
|---|---|---|---|---|---|
| `store/play-icon-512.png` | Store listing icon | 512×512 | 32-bit PNG, opaque content | 512×512, 32-bit PNG, ≤1024 KB | `assets/source/brand/icon.svg` |
| `store/feature-graphic-1024x500.png` | Feature graphic | 1024×500 | 24-bit PNG, no alpha | 1024×500, JPEG or 24-bit PNG, no alpha | `assets/source/store/feature-graphic.svg` |

Play requirements were checked against the Play Console help page "Add preview assets to showcase your app" (support.google.com/googleplay/android-developer/answer/9866151) on 2026-10-11.
Screenshots are not generated here. They need the running app: at least 2, JPEG or 24-bit PNG, sides 320–3840 px, and the long side no more than 2× the short side.

## Sounds

Original, synthesized by `scripts/make-sounds.py` (no third-party audio, no licence obligations). Format: WAV,
22.05 kHz, mono, 16-bit PCM. They play only when Settings → Sound effects is on (off by default), mixed with
other apps' audio.

| File | Purpose | Duration | Size |
|---|---|---|---|
| `assets/sounds/tap.wav` | Cell selection, note toggle | 0.06 s | ~3 KB |
| `assets/sounds/place.wav` | Digit placed | 0.12 s | ~5 KB |
| `assets/sounds/erase.wav` | Erase | 0.14 s | ~6 KB |
| `assets/sounds/error.wav` | Visible mistake/conflict (only when the player opted in) | 0.22 s | ~10 KB |
| `assets/sounds/complete.wav` | Puzzle solved (C–E–G chime) | 1.1 s | ~50 KB |

Regenerate: `python scripts/make-sounds.py`.
