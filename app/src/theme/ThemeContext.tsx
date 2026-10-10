import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, ThemeColors } from './tokens';
import { useSurvivalStore } from '../store/survivalStore';

export type ThemeMode = 'System' | 'Light' | 'Dark';

const THEME_STORAGE_KEY = 'safesphere_theme_mode';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isPitchBlack: boolean;
  activeThemeName: 'dark' | 'light' | 'pitchBlack';
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const osColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('System');
  const [isLoaded, setIsLoaded] = useState(false);

  // Survival Mode Pitch Black override
  const isPitchBlack = useSurvivalStore((state) => state.isPitchBlack);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (stored === 'Light' || stored === 'Dark' || stored === 'System') {
          if (isMounted) setThemeModeState(stored as ThemeMode);
        }
      } catch {
        // Fall back to default
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage error ignored
    }
  };

  const isDark = useMemo(() => {
    if (themeMode === 'Dark') return true;
    if (themeMode === 'Light') return false;
    return osColorScheme !== 'light';
  }, [themeMode, osColorScheme]);

  const activeColors = useMemo<ThemeColors>(() => {
    if (isPitchBlack) {
      return {
        ...darkColors,
        bg: '#000000',
        surface: '#000000',
      };
    }
    return isDark ? darkColors : lightColors;
  }, [isPitchBlack, isDark]);

  const activeThemeName = useMemo<'dark' | 'light' | 'pitchBlack'>(() => {
    if (isPitchBlack) return 'pitchBlack';
    return isDark ? 'dark' : 'light';
  }, [isPitchBlack, isDark]);

  const value = useMemo(
    () => ({
      colors: activeColors,
      isDark,
      themeMode,
      setThemeMode,
      isPitchBlack,
      activeThemeName,
      isLoaded,
    }),
    [activeColors, isDark, themeMode, isPitchBlack, activeThemeName, isLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback outside provider (e.g. tests or isolated renders)
    return {
      colors: darkColors,
      isDark: true,
      themeMode: 'Dark',
      setThemeMode: async () => {},
      isPitchBlack: false,
      activeThemeName: 'dark',
      isLoaded: true,
    };
  }
  return context;
}
