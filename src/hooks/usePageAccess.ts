/**
 * usePageAccess Hook
 * 
 * React hook wrapping hasPageAccess with component-level caching
 * Prevents duplicate API calls for the same route
 */

import { useState, useEffect, useRef } from 'react';
import { hasPageAccess } from '@/utils/agencyPageAccess';

interface UsePageAccessResult {
  hasAccess: boolean | null;
  loading: boolean;
  error: Error | null;
}

// Component-level cache: route -> result
const routeCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to check page access with caching
 * 
 * @param routePath - Route path to check access for
 * @returns Object with hasAccess (boolean | null), loading (boolean), and error (Error | null)
 */
export function usePageAccess(routePath: string): UsePageAccessResult {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Check cache first
    const cached = routeCache.get(routePath);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setHasAccess(cached.result);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    hasPageAccess(routePath)
      .then((result) => {
        // Check if request was aborted
        if (signal.aborted) {
          return;
        }

        // Cache the result
        routeCache.set(routePath, {
          result,
          timestamp: Date.now(),
        });

        setHasAccess(result);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        // Check if request was aborted
        if (signal.aborted) {
          return;
        }

        // On error, default to allowing access (fail open)
        console.warn('Error checking page access, defaulting to allow:', err);
        setHasAccess(true);
        setLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    // Cleanup: abort request if component unmounts or route changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [routePath]);

  return { hasAccess, loading, error };
}

/**
 * Clear page access cache for a specific route or all routes
 * Useful when page assignments change
 */
export function clearPageAccessCache(routePath?: string): void {
  if (routePath) {
    routeCache.delete(routePath);
  } else {
    routeCache.clear();
  }
}

