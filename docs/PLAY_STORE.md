# Google Play Store Preparation

> Status: **prepared, not submitted.** Nothing here is published. Submitting needs the owner's explicit approval.
> Requirements checked on 2026-10-11 against the Google Play pages listed at the bottom. Check them again before you submit.

## 1. Technical requirements (current as of 2026-10-11)

| Item | Requirement | Pencilmark |
|---|---|---|
| Target API | New apps and updates must target **Android 16 (API 36)** or higher, effective 2026-08-31 | Set by Expo SDK 57 (`targetSdkVersion` 36). Verify in `android/app/build.gradle` after prebuild |
| Format | Android App Bundle (AAB) | `gradlew bundleRelease` (see `docs/ANDROID.md`) |
| Signing | Play App Signing. You keep the upload key | Upload keystore stays outside the repo (see `docs/ANDROID.md`) |
| App id | Permanent once published | `com.pencilmark.sudoku` |
| Versioning | `versionCode` must increase on every upload | `app.json` → `expo.android.versionCode`. Semantic `version` for users |

### Versioning strategy
- `version` follows `MAJOR.MINOR.PATCH`. Users see it in the store and on the About screen.
- `versionCode` is an integer that increases by 1 for every Play upload, including internal testing builds.
- Use release notes template §6.

## 2. Store listing copy

**Title options** (30 characters max):
1. `Pencilmark Sudoku` (17) — recommended
2. `Pencilmark: Learn Sudoku` (24)
3. `Pencilmark Sudoku Offline` (25)

**Short description** (80 characters max):
- `Calm, offline Sudoku that teaches you real solving techniques, step by step.` (76) — recommended
- `Offline Sudoku with a full technique course — from first steps to X-Wings.` (74)

**Full description** (4000 characters max):

```
Pencilmark is a calm, classic Sudoku you can play anywhere, with no internet, account or ads. It also teaches you to solve.

PLAY
• Four honest difficulty levels. Each one is graded by the solving techniques the puzzle actually needs, not by how many numbers are missing
• Every puzzle has exactly one solution
• Notes (pencil marks), auto-fill notes, undo and redo
• Optional conflict highlighting, mistake checking and mistake counter
• A daily challenge that is the same for everyone and generated on your device
• Import your own puzzles from text
• Close the app at any time and continue exactly where you left off

LEARN
• A structured course from the rules to advanced techniques: singles, pairs, pointing, X-Wing, Swordfish, XY-Wing, coloring, chains and more
• Interactive lessons with highlighted cells and candidates that show why each deduction works
• Practice puzzles and mastery checks for every technique
• Hints in levels: a gentle nudge, the technique name, where to look, a full explanation, then the move

MASTER
• Statistics, best times and streaks
• Achievements for real milestones
• Practice by technique, with suggestions for areas to review

RESPECTFUL BY DESIGN
• Works fully offline
• No ads, no tracking, no account
• Your progress stays on your device
• Light and dark themes, a high-contrast option, colour-blind-friendly highlights and screen-reader labels
```

**Category:** Games → Puzzle. **Tags:** Sudoku, Logic, Brain, Offline, Educational.
**Keywords to work into copy:** offline sudoku, learn sudoku, sudoku techniques, sudoku hints, x-wing, no ads sudoku, daily sudoku.

## 3. Graphic assets (spec as of 2026-10-11)

| Asset | Spec | File |
|---|---|---|
| App icon | 512×512, 32-bit PNG with alpha, ≤1024 KB, no badges or ranking text | `store/play-icon-512.png` |
| Feature graphic | 1024×500, JPEG or 24-bit PNG (no alpha) | `store/feature-graphic.png` |
| Phone screenshots | 2–8 images, JPEG or 24-bit PNG (no alpha). Each side 320–3840 px, long side ≤ 2× short side. Recommended: at least 4 portrait images at 1080×1920 (9:16) | `store/screenshots/` |

**Screenshot plan** (portrait 1080×1920, each with a short caption band):
1. Board mid-game with notes. Caption: "Classic Sudoku, beautifully calm"
2. Hint sheet showing the X-Wing overlay. Caption: "Hints that teach, not tell"
3. Learning curriculum map. Caption: "From first steps to advanced techniques"
4. Lesson with highlighted elimination. Caption: "See exactly why each move works"
5. Dark mode board. Caption: "Easy on the eyes, day or night"
6. Stats and streaks. Caption: "Track your progress offline"

## 4. Privacy and Data safety

The app makes **no network requests**, includes **no analytics, ads or crash-reporting SDKs**, and creates **no accounts**. Settings, statistics and game progress are stored only on the device, in app-private storage.

**Data safety form (draft answers):**
- Does your app collect or share any of the required user data types? **No.**
- Is all user data encrypted in transit? **Not applicable** (no data is transmitted).
- Do you provide a way for users to request deletion? Data is local. Uninstalling, or clearing app storage, removes it. In-app "Reset statistics" is also available.

Before you submit, re-audit the merged manifest permissions and the dependency list (`npx expo-doctor`, `gradlew :app:dependencies`). A new SDK could change these answers.

**Privacy policy:** Play requires a privacy policy URL for every app. Draft text is in `docs/PRIVACY_POLICY.md`. It must be hosted at a public URL before you submit, which is an externally visible step that needs approval.

## 5. Content rating questionnaire (IARC) — expected answers

No violence, no sexual content, no profanity, no drugs, no gambling or simulated gambling, no user-generated content sharing, no user interaction or chat, no location sharing, no digital purchases. Expected rating: **Everyone / PEGI 3**.
Target audience: all ages, but **not designed primarily for children**. Choosing an under-13 target audience triggers Families policy requirements.

## 6. Release notes template

```
<en-US>
Version X.Y.Z
• New: …
• Improved: …
• Fixed: …
</en-US>
```

## 7. Release checklist

1. Run `npm test`, `npm run e2e`, `npm run typecheck`; all must pass.
2. Bump `version` and `versionCode` in `app.json`.
3. Run `npx expo prebuild --platform android --clean` then `cd android && .\gradlew bundleRelease`, with the signing env vars set.
4. Install a release APK built from the same commit on a device or emulator. Check offline cold start, gameplay, resume after force-close and both themes.
5. Inspect `android/app/build/outputs/bundle/release/app-release.aab` (size, `bundletool validate`).
6. Upload to an **internal testing** track first. That is an externally visible action and needs the owner's approval.
7. Fill in the listing, Data safety, content rating, target audience, privacy policy URL, ads declaration ("No ads") and app access ("No restrictions").
8. Roll out to production only with explicit approval.

Sources: https://developer.android.com/google/play/requirements/target-sdk, https://support.google.com/googleplay/android-developer/answer/9866151
