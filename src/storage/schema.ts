import { migrateLearningV1 } from '../learn/progress';
import type { KeyValueStorage } from './adapter';
import {
  sanitizeAchievements,
  sanitizeGame,
  sanitizeHistory,
  sanitizeLearning,
  sanitizeSettings,
  sanitizeStats,
  sanitizeUndo,
} from './validate';

/**
 * Persistence schema.
 *
 * Every namespace is stored under `pencilmark:<name>` as a JSON envelope `{ v, savedAt, data }`.
 * `v` is the namespace's schema version. On load, data from older versions is upgraded step by step
 * through `MIGRATIONS`, then validated. Anything unreadable (bad JSON, unknown future version, failed
 * validation) is copied verbatim to `pencilmark:backup:<name>` and replaced with safe defaults.
 */
export const KEY_PREFIX = 'pencilmark:';
export const BACKUP_PREFIX = 'pencilmark:backup:';

export type Namespace = 'settings' | 'stats' | 'history' | 'achievements' | 'game' | 'gameUndo' | 'learning';

export const SCHEMA_VERSION: Record<Namespace, number> = {
  settings: 1,
  stats: 1,
  history: 1,
  achievements: 1,
  game: 1,
  gameUndo: 1,
  learning: 2,
};

/** Version 0 = a bare JSON value with no envelope (pre-release builds). */
type Migration = (data: unknown) => unknown;
export const MIGRATIONS: Partial<Record<Namespace, Record<number, Migration>>> = {
  // 0 -> 1: older builds stored settings with a `darkMode: boolean` flag instead of `theme`.
  settings: {
    0: (d) => {
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        const o = { ...(d as Record<string, unknown>) };
        if (typeof o.darkMode === 'boolean' && o.theme === undefined) o.theme = o.darkMode ? 'dark' : 'light';
        delete o.darkMode;
        return o;
      }
      return d;
    },
  },
  // 1 -> 2: the reserved free-form learning object becomes the structured LearningState (see src/learn/progress.ts).
  learning: {
    1: migrateLearningV1,
  },
};

type Sanitizer = (raw: unknown) => unknown;
const SANITIZERS: Record<Namespace, Sanitizer> = {
  settings: sanitizeSettings,
  stats: sanitizeStats,
  history: sanitizeHistory,
  achievements: sanitizeAchievements,
  game: sanitizeGame,
  gameUndo: sanitizeUndo,
  learning: sanitizeLearning,
};

export const storageKey = (ns: Namespace) => `${KEY_PREFIX}${ns}`;

export type LoadStatus = 'ok' | 'missing' | 'migrated' | 'recovered';
export interface LoadResult<T> {
  value: T;
  status: LoadStatus;
}

function isEnvelope(x: unknown): x is { v: number; data: unknown } {
  return !!x && typeof x === 'object' && !Array.isArray(x) && Number.isInteger((x as { v?: unknown }).v) && 'data' in (x as object);
}

async function backup(storage: KeyValueStorage, ns: Namespace, raw: string) {
  try {
    await storage.setItem(`${BACKUP_PREFIX}${ns}`, raw.slice(0, 1_000_000));
  } catch {
    // best effort
  }
}

/**
 * Load and validate one namespace. Never throws. For `game`/`gameUndo` the sanitizer may return null,
 * meaning "no usable value"; other namespaces always fall back to defaults.
 */
export async function loadNamespace<T>(storage: KeyValueStorage, ns: Namespace): Promise<LoadResult<T>> {
  const sanitize = SANITIZERS[ns];
  let raw: string | null = null;
  try {
    raw = await storage.getItem(storageKey(ns));
  } catch {
    return { value: sanitize(undefined) as T, status: 'missing' };
  }
  if (raw === null) return { value: sanitize(undefined) as T, status: 'missing' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await backup(storage, ns, raw);
    return { value: sanitize(undefined) as T, status: 'recovered' };
  }

  let version = 0;
  let data: unknown = parsed;
  if (isEnvelope(parsed)) {
    version = parsed.v;
    data = parsed.data;
  }
  const target = SCHEMA_VERSION[ns];
  if (version > target || version < 0) {
    await backup(storage, ns, raw);
    return { value: sanitize(undefined) as T, status: 'recovered' };
  }
  const migrated = version < target;
  try {
    while (version < target) {
      const step = MIGRATIONS[ns]?.[version];
      if (step) data = step(data);
      version++;
    }
  } catch {
    await backup(storage, ns, raw);
    return { value: sanitize(undefined) as T, status: 'recovered' };
  }

  const value = sanitize(data);
  // Strict namespaces (game) return null when the payload is unusable: keep a backup.
  if (value === null && data !== null) {
    await backup(storage, ns, raw);
    return { value: value as T, status: 'recovered' };
  }
  return { value: value as T, status: migrated ? 'migrated' : 'ok' };
}

export async function saveNamespace(storage: KeyValueStorage, ns: Namespace, data: unknown): Promise<void> {
  if (data === null || data === undefined) {
    await storage.removeItem(storageKey(ns));
    return;
  }
  await storage.setItem(storageKey(ns), JSON.stringify({ v: SCHEMA_VERSION[ns], savedAt: Date.now(), data }));
}
