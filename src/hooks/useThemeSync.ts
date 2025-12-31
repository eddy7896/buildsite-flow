import { useEffect, useRef } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useAppStore } from '@/stores/appStore';

/**
 * Hook to sync Zustand theme store with next-themes
 * This ensures both systems stay in sync without circular updates or blinking
 */
export const useThemeSync = () => {
  const { theme: zustandTheme, setTheme: setZustandTheme } = useAppStore();
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const isSyncingRef = useRef(false);
  const mountedRef = useRef(false);

  // Mark as mounted after first render
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Sync Zustand -> next-themes on mount and when Zustand theme changes
  // Only sync if we're not already in the middle of a sync operation and component is mounted
  useEffect(() => {
    if (!mountedRef.current || isSyncingRef.current) return;
    
    if (zustandTheme && zustandTheme !== nextTheme) {
      isSyncingRef.current = true;
      setNextTheme(zustandTheme);
      // Reset sync flag after update propagates
      requestAnimationFrame(() => {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 10);
      });
    }
  }, [zustandTheme, nextTheme, setNextTheme]);

  // Sync next-themes -> Zustand when next-themes theme changes
  // Only sync if we're not already in the middle of a sync operation and component is mounted
  useEffect(() => {
    if (!mountedRef.current || isSyncingRef.current) return;
    
    if (nextTheme && nextTheme !== zustandTheme) {
      isSyncingRef.current = true;
      setZustandTheme(nextTheme as 'light' | 'dark' | 'system');
      // Reset sync flag after update propagates
      requestAnimationFrame(() => {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 10);
      });
    }
  }, [nextTheme, zustandTheme, setZustandTheme]);

  return {
    theme: nextTheme || zustandTheme,
    resolvedTheme,
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      // Set both directly without triggering sync loops
      isSyncingRef.current = true;
      setZustandTheme(theme);
      setNextTheme(theme);
      // Reset sync flag after both updates complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 10);
      });
    },
  };
};

