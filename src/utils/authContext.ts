/**
 * Centralized Auth Context Utilities
 * 
 * Single source of truth for authentication context helpers.
 * Provides cached access to agency database, system super admin status, and auth context.
 */

import type { AppRole } from './roleUtils';

// In-memory cache for auth context
let authContextCache: {
  agencyDatabase: string | null;
  agencyId: string | null;
  userRole: AppRole | null;
  isSystemSuperAdmin: boolean;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 1000; // 1 second cache to prevent excessive localStorage reads

/**
 * Get agency database from localStorage
 * Uses in-memory cache to avoid repeated localStorage reads
 */
export function getAgencyDatabase(): string | null {
  // Check cache first
  if (authContextCache && (Date.now() - authContextCache.timestamp) < CACHE_DURATION) {
    return authContextCache.agencyDatabase;
  }

  // Read from localStorage
  const agencyDatabase = typeof window !== 'undefined' 
    ? localStorage.getItem('agency_database') 
    : null;

  // Update cache
  if (!authContextCache) {
    authContextCache = {
      agencyDatabase: null,
      agencyId: null,
      userRole: null,
      isSystemSuperAdmin: false,
      timestamp: 0,
    };
  }
  authContextCache.agencyDatabase = agencyDatabase;
  authContextCache.timestamp = Date.now();

  return agencyDatabase;
}

/**
 * Get agency ID from localStorage
 * Uses in-memory cache to avoid repeated localStorage reads
 */
export function getAgencyId(): string | null {
  // Check cache first
  if (authContextCache && (Date.now() - authContextCache.timestamp) < CACHE_DURATION) {
    return authContextCache.agencyId;
  }

  // Read from localStorage
  const agencyId = typeof window !== 'undefined' 
    ? localStorage.getItem('agency_id') 
    : null;

  // Update cache
  if (!authContextCache) {
    authContextCache = {
      agencyDatabase: null,
      agencyId: null,
      userRole: null,
      isSystemSuperAdmin: false,
      timestamp: 0,
    };
  }
  authContextCache.agencyId = agencyId;
  authContextCache.timestamp = Date.now();

  return agencyId;
}

/**
 * Check if user is system-level super admin
 * System super admin = has super_admin role AND no agency database
 * 
 * @param userRole - User's role
 * @param agencyDatabase - Optional agency database (will be fetched if not provided)
 * @returns True if system super admin
 */
export function isSystemSuperAdmin(
  userRole: AppRole | null | undefined,
  agencyDatabase?: string | null
): boolean {
  if (!userRole || userRole !== 'super_admin') {
    return false;
  }

  // If agencyDatabase not provided, fetch it
  const agencyDb = agencyDatabase !== undefined 
    ? agencyDatabase 
    : getAgencyDatabase();

  // System super admin has super_admin role AND no agency database
  return !agencyDb;
}

/**
 * Get complete auth context in one call
 * Returns all auth-related values with caching
 */
export function getAuthContext(): {
  agencyDatabase: string | null;
  agencyId: string | null;
  userRole: AppRole | null;
  isSystemSuperAdmin: boolean;
} {
  const now = Date.now();
  
  // Check cache
  if (authContextCache && (now - authContextCache.timestamp) < CACHE_DURATION) {
    return {
      agencyDatabase: authContextCache.agencyDatabase,
      agencyId: authContextCache.agencyId,
      userRole: authContextCache.userRole,
      isSystemSuperAdmin: authContextCache.isSystemSuperAdmin,
    };
  }

  // Fetch all values
  const agencyDatabase = getAgencyDatabase();
  const agencyId = getAgencyId();
  const userRole = (typeof window !== 'undefined' 
    ? localStorage.getItem('user_role') 
    : null) as AppRole | null;
  
  const isSystemSuperAdminValue = isSystemSuperAdmin(userRole, agencyDatabase);

  // Update cache
  authContextCache = {
    agencyDatabase,
    agencyId,
    userRole,
    isSystemSuperAdmin: isSystemSuperAdminValue,
    timestamp: now,
  };

  return {
    agencyDatabase,
    agencyId,
    userRole,
    isSystemSuperAdmin: isSystemSuperAdminValue,
  };
}

/**
 * Invalidate auth context cache
 * Call this when auth state changes (login, logout, role change, etc.)
 */
export function invalidateAuthContextCache(): void {
  authContextCache = null;
}

/**
 * Set auth context cache (for testing or manual updates)
 */
export function setAuthContextCache(context: {
  agencyDatabase: string | null;
  agencyId: string | null;
  userRole: AppRole | null;
}): void {
  authContextCache = {
    ...context,
    isSystemSuperAdmin: isSystemSuperAdmin(context.userRole, context.agencyDatabase),
    timestamp: Date.now(),
  };
}

