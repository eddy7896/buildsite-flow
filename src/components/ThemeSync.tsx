import { useEffect } from 'react';
import { useThemeSync } from '@/hooks/useThemeSync';

/**
 * Component to sync theme on app mount
 * This ensures the theme is properly initialized
 */
export const ThemeSync = () => {
  useThemeSync();
  return null;
};

