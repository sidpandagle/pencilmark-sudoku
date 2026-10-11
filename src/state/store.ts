import { useCallback, useRef, useSyncExternalStore } from 'react';

/** A tiny external store. Components subscribe to slices via `useStore(store, selector)`. */
export interface Store<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

const identity = <T,>(x: T) => x;

/**
 * Subscribe to a slice of a store. The component re-renders only when the selected value changes
 * (by `Object.is`, or a custom `isEqual`). Selectors may return derived objects when `isEqual` is given.
 */
export function useStore<T, S = T>(
  store: Store<T>,
  selector: (state: T) => S = identity as (s: T) => S,
  isEqual: (a: S, b: S) => boolean = Object.is,
): S {
  const cache = useRef<{ state: T; selector: unknown; value: S } | null>(null);
  const getSnapshot = () => {
    const state = store.get();
    const c = cache.current;
    if (c && c.state === state && c.selector === selector) return c.value;
    const value = selector(state);
    if (c && isEqual(c.value, value)) {
      cache.current = { state, selector, value: c.value };
      return c.value;
    }
    cache.current = { state, selector, value };
    return value;
  };
  const subscribe = useCallback((l: () => void) => store.subscribe(l), [store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  const ka = Object.keys(a) as (keyof T)[];
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => Object.is(a[k], b[k]));
}
