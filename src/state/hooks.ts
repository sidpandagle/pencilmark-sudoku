import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { GameState, Settings } from '../game';
import { useStore } from './store';
import { achievementsStore, appStore, gameStore, historyStore, settingsStore, statsStore } from './stores';

export const useSettings = () => useStore(settingsStore);
export const useSetting = <K extends keyof Settings>(key: K): Settings[K] => useStore(settingsStore, (s) => s[key]);
export const useStats = () => useStore(statsStore);
export const useHistory = () => useStore(historyStore);
export const useAchievements = () => useStore(achievementsStore);
export const useHydrated = () => useStore(appStore, (a) => a.hydrated);

/** Select a slice of the current game. Returns `fallback` when there is no game. */
export function useGame<S>(selector: (g: GameState) => S, fallback: S, isEqual?: (a: S, b: S) => boolean): S {
  return useStore(gameStore, (g) => (g ? selector(g) : fallback), isEqual);
}

export const useHasGame = () => useStore(gameStore, (g) => g !== null);

/** True when either the in-app "Reduce motion" setting or the OS setting is on. */
export function useReducedMotion(): boolean {
  const setting = useSetting('reduceMotion');
  const [os, setOs] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => alive && setOs(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setOs(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return setting || os;
}
