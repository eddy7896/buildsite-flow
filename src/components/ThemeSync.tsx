import { useEffect } from 'react';
import { useThemeSync } from '@/hooks/useThemeSync';

/**
 * Component to sync theme on app mount
 * This ensures the theme is properly initialized and respects system preferences
 * 
 * Behavior:
 * - On first visit (no saved preference): Defaults to "system" which respects OS preference
 * - If user has light mode OS: Website shows light mode
 * - If user has dark mode OS: Website shows dark mode
 * - User can manually override by clicking theme toggle
 * - Manual preference is saved and persists across sessions
 * - If user has 'system' selected, theme updates automatically when OS preference changes
 * 
 * The useThemeSync hook handles syncing between Zustand and next-themes.
 * The appStore defaults to 'system' theme, and Zustand persist will load saved preferences.
 * When theme is 'system', next-themes automatically respects OS preference via enableSystem.
 */
export const ThemeSync = () => {
  const { theme } = useThemeSync();

  // Listen for system theme changes and update if user has 'system' selected
  // Note: next-themes handles this automatically, but we keep this for edge cases
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // next-themes will handle this automatically, but we can force a re-evaluation
      // by briefly toggling the theme (this is a workaround if next-themes doesn't pick it up)
      if (theme === 'system') {
        // Force next-themes to re-evaluate by setting theme to system again
        // This should trigger next-themes to update the DOM
        const htmlElement = document.documentElement;
        const shouldBeDark = mediaQuery.matches;
        htmlElement.classList.toggle('dark', shouldBeDark);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  return null;
};

