/**
 * Expo config plugin: point Gradle at a specific CMake install via android/local.properties `cmake.dir`.
 *
 * Why: on Windows, CMake 3.22.1's bundled ninja (1.10) is not long-path aware, and React Native codegen
 * object paths for some libraries (e.g. react-native-gesture-handler) exceed 260 characters, failing with
 * "ninja: error: Stat(...): Filename longer than 260 characters". CMake >= 3.31 ships ninja 1.12, which is
 * long-path aware (Windows LongPathsEnabled must be 1).
 *
 * Opt-in and machine-specific: only writes when PENCILMARK_CMAKE_DIR is set at prebuild time
 * (scripts/android-env.ps1 sets it to the newest CMake in the SDK). Nothing machine-specific is committed.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withLocalCmake = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const dir = process.env.PENCILMARK_CMAKE_DIR;
      if (!dir || !fs.existsSync(dir)) return cfg;
      const file = path.join(cfg.modRequest.platformProjectRoot, 'local.properties');
      const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      const lines = existing.split(/\r?\n/).filter((l) => l && !l.startsWith('cmake.dir='));
      // local.properties is a Java properties file: escape backslashes and the drive colon.
      lines.push(`cmake.dir=${dir.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}`);
      fs.writeFileSync(file, `${lines.join('\n')}\n`);
      return cfg;
    },
  ]);

module.exports = withLocalCmake;
