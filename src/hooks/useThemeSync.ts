import { useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useAppStore } from '@/stores/appStore';

/**
 * Hook to sync Zustand theme store with next-themes
 * This ensures both systems stay in sync
 */
export const useThemeSync = () => {
  const { theme: zustandTheme, setTheme: setZustandTheme } = useAppStore();
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();

  // Sync Zustand -> next-themes on mount and when Zustand theme changes
  useEffect(() => {
    if (zustandTheme && zustandTheme !== nextTheme) {
      setNextTheme(zustandTheme);
    }
  }, [zustandTheme, nextTheme, setNextTheme]);

  // Sync next-themes -> Zustand when next-themes theme changes
  useEffect(() => {
    if (nextTheme && nextTheme !== zustandTheme) {
      setZustandTheme(nextTheme as 'light' | 'dark' | 'system');
    }
  }, [nextTheme, zustandTheme, setZustandTheme]);

  return {
    theme: nextTheme || zustandTheme,
    resolvedTheme,
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      setZustandTheme(theme);
      setNextTheme(theme);
    },
  };
};

