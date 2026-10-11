/**
 * Expo config plugin: release signing for Pencilmark, without secrets in the repo.
 *
 * During `expo prebuild` it edits android/app/build.gradle so that the `release` build type is
 * signed with the upload key when signing values are available, and falls back to the debug key
 * (with a Gradle warning) when they are not. Nothing secret is written into the generated project.
 *
 * Values are looked up per key in this order:
 *   1. environment variable
 *   2. Gradle property (-PKEY=value or ~/.gradle/gradle.properties)
 *   3. a properties file whose path is given by PENCILMARK_UPLOAD_PROPERTIES (env var or Gradle property)
 *
 * Keys:
 *   PENCILMARK_UPLOAD_STORE_FILE      absolute path to the .jks keystore (use forward slashes)
 *   PENCILMARK_UPLOAD_STORE_PASSWORD
 *   PENCILMARK_UPLOAD_KEY_ALIAS
 *   PENCILMARK_UPLOAD_KEY_PASSWORD
 *
 * See docs/ANDROID.md.
 */
const { withAppBuildGradle, WarningAggregator } = require('expo/config-plugins');

const TAG = 'pencilmark-release-signing';
const BEGIN = `// @generated begin ${TAG}`;
const END = `// @generated end ${TAG}`;

const HELPERS = `${BEGIN} - managed by plugins/withReleaseSigning.js, do not edit
def pencilmarkUploadProps = new Properties()
def pencilmarkUploadPropsPath = System.getenv('PENCILMARK_UPLOAD_PROPERTIES') ?: project.findProperty('PENCILMARK_UPLOAD_PROPERTIES')
if (pencilmarkUploadPropsPath && new File(pencilmarkUploadPropsPath.toString()).isFile()) {
    new File(pencilmarkUploadPropsPath.toString()).withInputStream { pencilmarkUploadProps.load(it) }
}
def pencilmarkSigningValue = { String key ->
    def v = System.getenv(key) ?: project.findProperty(key) ?: pencilmarkUploadProps.getProperty(key)
    return v ? v.toString() : null
}
def pencilmarkStoreFile = pencilmarkSigningValue('PENCILMARK_UPLOAD_STORE_FILE')
def pencilmarkHasReleaseSigning = pencilmarkStoreFile != null &&
    new File(pencilmarkStoreFile).isFile() &&
    pencilmarkSigningValue('PENCILMARK_UPLOAD_STORE_PASSWORD') != null &&
    pencilmarkSigningValue('PENCILMARK_UPLOAD_KEY_ALIAS') != null &&
    pencilmarkSigningValue('PENCILMARK_UPLOAD_KEY_PASSWORD') != null
if (!pencilmarkHasReleaseSigning) {
    logger.warn('[pencilmark] Upload keystore not configured: release builds will be signed with the DEBUG key. See docs/ANDROID.md.')
}
${END}
`;

const SIGNING_CONFIG = `        ${BEGIN}
        if (pencilmarkHasReleaseSigning) {
            release {
                storeFile file(pencilmarkStoreFile)
                storePassword pencilmarkSigningValue('PENCILMARK_UPLOAD_STORE_PASSWORD')
                keyAlias pencilmarkSigningValue('PENCILMARK_UPLOAD_KEY_ALIAS')
                keyPassword pencilmarkSigningValue('PENCILMARK_UPLOAD_KEY_PASSWORD')
            }
        }
        ${END}
`;

const RELEASE_SIGNING_LINE =
  'signingConfig pencilmarkHasReleaseSigning ? signingConfigs.release : signingConfigs.debug';

function applyReleaseSigning(gradle) {
  if (gradle.includes(BEGIN)) return gradle; // already applied

  // 1. Helpers go right before the top-level `android {` block.
  const androidIdx = gradle.search(/^android\s*\{/m);
  if (androidIdx < 0) throw new Error('could not find top-level `android {` block');
  gradle = gradle.slice(0, androidIdx) + HELPERS + '\n' + gradle.slice(androidIdx);

  // 2. Conditional `release` signing config, appended inside `signingConfigs { ... }`
  //    right after the template's `debug { ... }` entry.
  const signingRe = /(signingConfigs\s*\{\s*\n\s*debug\s*\{[^}]*\}\s*\n)/;
  if (!signingRe.test(gradle)) throw new Error('could not find `signingConfigs { debug { ... } }`');
  gradle = gradle.replace(signingRe, `$1${SIGNING_CONFIG}`);

  // 3. In buildTypes.release, swap the debug signingConfig for the conditional one.
  const buildTypesIdx = gradle.search(/buildTypes\s*\{/);
  if (buildTypesIdx < 0) throw new Error('could not find `buildTypes {`');
  const releaseIdx = gradle.slice(buildTypesIdx).search(/\brelease\s*\{/);
  if (releaseIdx < 0) throw new Error('could not find `buildTypes { release {`');
  const start = buildTypesIdx + releaseIdx;
  const head = gradle.slice(0, start);
  let tail = gradle.slice(start);
  const lineRe = /signingConfig\s+signingConfigs\.debug/;
  if (!lineRe.test(tail)) throw new Error('could not find `signingConfig signingConfigs.debug` in release build type');
  tail = tail.replace(lineRe, `${RELEASE_SIGNING_LINE} // ${TAG}`);
  return head + tail;
}

const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      WarningAggregator.addWarningAndroid(TAG, 'app build.gradle is not Groovy; release signing not configured.');
      return cfg;
    }
    try {
      cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    } catch (e) {
      WarningAggregator.addWarningAndroid(TAG, `release signing not configured: ${e.message}`);
    }
    return cfg;
  });

module.exports = withReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
