import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSetting } from '../state/hooks';
import { makeTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(makeTheme(false, false));

/** Resolves the theme from settings (system/light/dark + high contrast) and the OS colour scheme. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useSetting('theme');
  const highContrast = useSetting('highContrast');
  const system = useColorScheme();
  const dark = pref === 'dark' || (pref === 'system' && system === 'dark');
  const theme = useMemo(() => makeTheme(dark, highContrast), [dark, highContrast]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;
