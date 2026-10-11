# Pencilmark Sudoku

Learn to see the logic. An offline-first classic Sudoku with progressive, explained hints.
Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · Expo Router · react-native-web.

No accounts, ads, analytics or network calls. All data stays on the device.

## Setup

```bash
npm install
```

Requires Node 22.13+ (React Native Testing Library 14). E2E tests use the locally installed Google Chrome.

## Run

```bash
npx expo start            # dev server (press a for Android, w for web)
npx expo start --web      # web only
npm run build:web         # static web export to dist/
node e2e/serve.mjs dist   # serve the export at http://127.0.0.1:4173
```

`expo-haptics`, `expo-keep-awake` and `expo-splash-screen` are native modules: use a development build
(`npx expo run:android`) or a store build rather than an outdated Expo Go.

## Test

```bash
npm run test:app          # app unit + component tests (game, storage, state, ui, app)
npm run test:engine       # engine tests
npx tsc --noEmit          # typecheck
npm run e2e               # web export + Playwright (Chrome) end-to-end tests and screenshots
npm run e2e:only          # Playwright only, reusing an existing dist/
```

Screenshots are written to `e2e/screenshots/` (390×844, 360×640, 844×390).

## Build (Android)

Local build (no cloud account needed). Full details and Windows pitfalls are in `docs/ANDROID.md`:

```powershell
. .\scripts\android-env.ps1                       # JDK 17, Android SDK, CMake >= 3.31, signing paths
npx expo prebuild --platform android --clean
cd android
.\gradlew assembleRelease -PreactNativeArchitectures=x86_64   # quick emulator test APK
.\gradlew bundleRelease                                       # Play upload AAB (all ABIs)
```

## Docs

- `docs/REQUIREMENTS.md` — requirements checklist with status and evidence
- `docs/REVIEW_LOG.md` — the seven adversarial review cycles: defects, fixes, verification
- `docs/DESIGN.md` — brand, colour tokens, type, layout
- `docs/ARCHITECTURE.md` — modules, state flow, persistence schema, keyboard shortcuts, Board overlay API
- `docs/ENGINE.md` — generator, solver, the 33 techniques, difficulty rules, validation evidence
- `docs/LEARNING.md` — learning mode: curriculum, pedagogy, progress and spaced review, guided solving, engine issues
- `docs/ASSETS.md` — asset manifest (icons, splash, badges, illustrations, store graphics, sounds)
- `docs/ANDROID.md` — toolchain, signing, local debug/release builds, Windows pitfalls
- `docs/PLAY_STORE.md` — store listing copy, graphics specs, Data safety, content rating, release checklist
- `docs/PRIVACY_POLICY.md` — draft privacy policy (must be hosted before publishing)
- `marketing/` — creative direction, video scripts, rendered videos, store screenshots, content calendar
