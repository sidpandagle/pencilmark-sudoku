import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hydrate } from '../state/persistence';
import { useHydrated, useReducedMotion } from '../state/hooks';
import { ThemeProvider, useTheme } from '../ui/ThemeContext';

// Keep the native splash up until persisted state is loaded (called at module scope, per the docs).
SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStack() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.colors.bg;
      document.documentElement.style.colorScheme = theme.dark ? 'dark' : 'light';
    }
  }, [theme]);
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: reduced ? 'none' : 'default',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const hydrated = useHydrated();

  useEffect(() => {
    hydrate().catch(() => {
      // hydrate never throws by design; this is a last-resort guard.
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        SplashScreen.hide();
      } catch {
        // not available (e.g. tests)
      }
    }
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
