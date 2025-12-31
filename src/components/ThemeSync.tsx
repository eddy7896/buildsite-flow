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
 * 
 * The useThemeSync hook handles syncing between Zustand and next-themes.
 * The appStore defaults to 'system' theme, and Zustand persist will load saved preferences.
 * When theme is 'system', next-themes automatically respects OS preference via enableSystem.
 */
export const ThemeSync = () => {
  useThemeSync();
  return null;
};

