/**
 * Agency Page Access Utilities
 * Functions to check and manage agency page access based on assignments
 */

import { getApiBaseUrl } from '@/config/api';
import type { AgencyPageAssignment } from '@/types/pageCatalog';

let cachedPages: AgencyPageAssignment[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased from 5)

// Request deduplication: track in-flight requests
let inFlightRequest: Promise<AgencyPageAssignment[]> | null = null;

/**
 * Get all pages assigned to the current agency
 * Uses sessionStorage for persistence and request deduplication
 */
export async function getAgencyAccessiblePages(): Promise<AgencyPageAssignment[]> {
  const now = Date.now();
  
  // Check memory cache first
  if (cachedPages && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPages;
  }

  // Check sessionStorage for persistence across page reloads
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('agency_accessible_pages');
      const storedTimestamp = sessionStorage.getItem('agency_accessible_pages_timestamp');
      
      if (stored && storedTimestamp) {
        const storedTime = parseInt(storedTimestamp, 10);
        if (now - storedTime < CACHE_DURATION) {
          const parsed = JSON.parse(stored);
          cachedPages = parsed;
          cacheTimestamp = storedTime;
          return parsed;
        }
      }
    } catch (error) {
      // Ignore sessionStorage errors
    }
  }

  // Check if there's already an in-flight request
  if (inFlightRequest) {
    return inFlightRequest;
  }

  // Create new request
  inFlightRequest = (async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      if (!token) {
        return [];
      }

      const response = await fetch(`${getApiBaseUrl()}/api/system/page-catalog/agencies/me/pages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch agency pages, using empty list');
        return [];
      }

      const data = await response.json();

      if (data.success && data.data) {
        cachedPages = data.data;
        cacheTimestamp = now;
        
        // Store in sessionStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('agency_accessible_pages', JSON.stringify(data.data));
            sessionStorage.setItem('agency_accessible_pages_timestamp', now.toString());
          } catch (error) {
            // Ignore sessionStorage errors
          }
        }
        
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching agency pages:', error);
      return [];
    } finally {
      // Clear in-flight request
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}

/**
 * Check if agency has access to a specific page path
 */
export async function hasPageAccess(path: string): Promise<boolean> {
  const pages = await getAgencyAccessiblePages();
  
  // Normalize path (remove trailing slashes, handle parameterized routes)
  const normalizedPath = path.replace(/\/$/, '');
  
  return pages.some(page => {
    const pagePath = page.path.replace(/\/$/, '');
    
    // Exact match
    if (pagePath === normalizedPath) {
      return true;
    }
    
    // Parameterized route match (e.g., /projects/:id matches /projects/123)
    const pagePattern = pagePath.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pagePattern}$`);
    return regex.test(normalizedPath);
  });
}

/**
 * Clear the page access cache (call after page assignments change)
 * Clears both memory cache and sessionStorage
 */
export function clearPageAccessCache() {
  cachedPages = null;
  cacheTimestamp = 0;
  inFlightRequest = null;
  
  // Clear sessionStorage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('agency_accessible_pages');
      sessionStorage.removeItem('agency_accessible_pages_timestamp');
    } catch (error) {
      // Ignore sessionStorage errors
    }
  }
}

/**
 * Get all accessible page paths for the agency
 */
export async function getAccessiblePagePaths(): Promise<string[]> {
  const pages = await getAgencyAccessiblePages();
  return pages.map(page => page.path);
}

