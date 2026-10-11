import type { KeyValueStorage } from './adapter';
import { saveNamespace, type Namespace } from './schema';

/**
 * Debounced writer: `schedule` coalesces rapid updates per namespace into one write after `delayMs`;
 * `flush` writes everything pending immediately (used when the app goes to background).
 * Values are produced lazily by the getter at write time, so the newest state is always written.
 */
export interface Persister {
  schedule(ns: Namespace, getValue: () => unknown): void;
  flush(): Promise<void>;
  pendingCount(): number;
}

export function createPersister(storage: KeyValueStorage, delayMs = 400): Persister {
  const pending = new Map<Namespace, () => unknown>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let chain: Promise<void> = Promise.resolve();

  const writeAll = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const jobs = [...pending.entries()];
    pending.clear();
    chain = chain.then(async () => {
      for (const [ns, get] of jobs) {
        try {
          await saveNamespace(storage, ns, get());
        } catch {
          // Storage full or unavailable: keep playing; the next save will retry.
        }
      }
    });
    return chain;
  };

  return {
    schedule(ns, getValue) {
      pending.set(ns, getValue);
      if (!timer) timer = setTimeout(writeAll, delayMs);
    },
    flush: () => writeAll(),
    pendingCount: () => pending.size,
  };
}
