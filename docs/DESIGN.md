# Pencilmark — Design System

**App name:** Pencilmark Sudoku (short: Pencilmark)
**Tagline:** Learn to see the logic.
**Package id:** `com.pencilmark.sudoku`

## Direction and rationale

Pencilmark looks like a calm, well-made paper puzzle book: warm paper, deep ink, and one accent colour.
The board is always the most important thing on screen. Decoration sits only on home, learning and
completion screens and never touches the grid. The name points at the notes (pencil marks) that
real solving and teaching rely on, so the learning mode fits the brand.

- **Calm for long sessions:** low-saturation backgrounds, no pure white or black, soft shadows.
- **Readable first:** given digits are heavy ink, player digits are accent blue, notes are small and grey.
- **Meaning never relies on colour alone:** conflicts also get a strike or underline marker, and selection
  also gets a thicker border. Hint roles have shape cues as well (ring for pattern, slash for elimination).
- **Restrained motion:** about 120–200 ms ease-out transitions, all disabled when "Reduce motion" is on.

## Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F4F1EA` | `#11151B` | app background (paper) |
| `surface` | `#FFFDF8` | `#1A2029` | cards, board background |
| `surfaceAlt` | `#ECE7DC` | `#232B36` | secondary buttons, chips |
| `ink` | `#1E2733` | `#E8ECF1` | primary text, given digits |
| `inkMuted` | `#5E6B7A` | `#9AA6B4` | secondary text, notes |
| `line` | `#C9C2B4` | `#38424F` | thin cell lines |
| `lineStrong` | `#2E3946` | `#AEB9C6` | box borders and outer border |
| `accent` | `#2F5DA8` | `#8DB2FF` | player digits, primary buttons |
| `accentSoft` | `#DCE6F6` | `#25385A` | selected cell |
| `peer` | `#ECEEF1` | `#1F2733` | same row/col/box highlight |
| `sameDigit` | `#C8D7F1` | `#30466E` | cells with the same digit as the selection |
| `conflict` | `#B4382A` | `#FF8A7A` | conflicting digit text |
| `conflictSoft` | `#F8DED9` | `#4A2622` | conflict cell background |
| `hint` | `#B27A18` | `#F2C062` | hint/pattern ring |
| `hintSoft` | `#FBEBC8` | `#4A3A17` | hint pattern cell background |
| `eliminate` | `#C0392B` | `#FF7F72` | eliminated candidates (with strike) |
| `success` | `#2E7D55` | `#6FD39F` | placements, completion |
| `colorA` | `#2D79AD` | `#7CC4F5` | chain colour A (blue) |
| `colorB` | `#B45A19` | `#F5A66B` | chain colour B (orange) — blue/orange pair is colour-blind safe |

Light-theme hint, conflict and chain colours were darkened in review cycle 6 to meet WCAG (≥3:1 for UI graphics, ≥4.5:1 for candidate text on the surface).

There is also a **high-contrast** palette option that uses stronger lines and darker accent shades.

## Typography

- System font family. Digits use `fontVariant: ['tabular-nums']`.
- Given digit: weight 600, about 58% of cell size. Player digit: weight 500, accent colour.
- Notes: a 3×3 mini grid, about 24% of cell size, `inkMuted`.
- Type scale: 12 / 14 / 16 / 20 / 24 / 32 / 40.

## Layout

- Spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Corner radii: 6 for cells and chips, 12 for buttons, 16 for cards, 20 for sheets.
- Board: square, `min(screenWidth - 24, available height * 0.62, 560)`. Thin lines 1 px, box lines 2.5 px.
- Touch targets: at least 48×48 dp. The number pad is a row of 9 keys, each at least 48 dp tall.
- Button hierarchy: primary (filled accent), secondary (surfaceAlt), tertiary (text/icon only).

## Icon style

Icons are 24 px with 2 px rounded strokes, line style, drawn inline with react-native-svg. There is no icon
font dependency.

## Brand mark

A rounded square in ink blue containing a 3×3 grid. The centre cell has a pencil-tip diagonal, and three
tiny candidate dots sit in one corner cell. The wordmark is "Pencilmark", set in a heavy-weight system font
with the "i" dot drawn as a small pencil-mark square in the accent colour.
