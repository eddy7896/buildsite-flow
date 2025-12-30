/**
 * Hook for managing favorite projects
 */

import { useState, useEffect, useCallback } from 'react';

export const useFavorites = () => {
  const [favoriteProjects, setFavoriteProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('projectManagement_favorites');
    if (saved) {
      try {
        setFavoriteProjects(new Set(JSON.parse(saved)));
      } catch (e) {
        console.warn('Failed to load favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (favoriteProjects.size > 0) {
      localStorage.setItem('projectManagement_favorites', JSON.stringify(Array.from(favoriteProjects)));
    }
  }, [favoriteProjects]);

  const toggleFavorite = useCallback((projectId: string) => {
    setFavoriteProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  return {
    favoriteProjects,
    toggleFavorite,
  };
};

