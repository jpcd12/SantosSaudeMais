import { DarkTheme, DefaultTheme, ThemeProvider as RouterThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return <ThemeProvider><ThemedTabLayout /></ThemeProvider>;
}

function ThemedTabLayout() {
  const { isDark, isReady, theme } = useAppTheme();
  const routerTheme = isDark ? DarkTheme : DefaultTheme;
  return (
    <RouterThemeProvider value={{
      ...routerTheme,
      colors: { ...routerTheme.colors, background: theme.background, card: theme.card, text: theme.text, border: theme.border },
    }}>
      <StatusBar style={isDark ? 'light' : 'dark'} animated />
      {isReady ? <><AnimatedSplashOverlay /><AppTabs /></> : null}
    </RouterThemeProvider>
  );
}
