import { useEffect, useRef, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useAppStore } from '@/stores/appStore';

/**
 * Hook to sync Zustand theme store with next-themes
 * This ensures both systems stay in sync without circular updates or blinking
 * Also provides helper functions for theme toggling
 */
export const useThemeSync = () => {
  const { theme: zustandTheme, setTheme: setZustandTheme } = useAppStore();
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme, systemTheme } = useNextTheme();
  const isSyncingRef = useRef(false);
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted after first render
  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
  }, []);

  // Sync Zustand -> next-themes on mount and when Zustand theme changes
  // Only sync if we're not already in the middle of a sync operation and component is mounted
  useEffect(() => {
    if (!mountedRef.current || isSyncingRef.current) return;
    
    if (zustandTheme && zustandTheme !== nextTheme) {
      isSyncingRef.current = true;
      setNextTheme(zustandTheme);
      // Reset sync flag after update propagates
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
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
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }
  }, [nextTheme, zustandTheme, setZustandTheme]);

  // Helper function to get the current effective theme (resolved from system if needed)
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      return resolvedTheme;
    }
    // If resolvedTheme is undefined, check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default fallback
  };

  // Helper function to toggle theme
  const toggleTheme = () => {
    const currentTheme = nextTheme || zustandTheme || 'system';
    const effectiveTheme = getEffectiveTheme();
    
    // Determine the new theme
    let newTheme: 'light' | 'dark';
    if (currentTheme === 'system') {
      // If current theme is 'system', toggle to opposite of current system preference
      newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    } else {
      // Toggle between light and dark
      newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    }
    
    // Set the syncing flag to prevent sync loops - use longer timeout to prevent interference
    isSyncingRef.current = true;
    
    // Immediately update the DOM to ensure instant visual feedback
    if (typeof window !== 'undefined') {
      const htmlElement = document.documentElement;
      if (newTheme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
    
    // Set next-themes first (this manages persistence and will also update the DOM)
    setNextTheme(newTheme);
    
    // Then update Zustand (for our app state)
    setZustandTheme(newTheme);
    
    // Reset sync flag after a longer delay to ensure all updates complete
    // This prevents the sync effects from interfering with the manual toggle
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 150);
  };

  return {
    theme: nextTheme || zustandTheme || 'system',
    resolvedTheme: resolvedTheme || getEffectiveTheme(),
    systemTheme,
    mounted,
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      // Set both directly without triggering sync loops
      isSyncingRef.current = true;
      // Set next-themes first (this will update the DOM)
      setNextTheme(theme);
      // Then update Zustand
      setZustandTheme(theme);
      // Reset sync flag after updates complete
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    },
    toggleTheme,
    getEffectiveTheme,
  };
};

