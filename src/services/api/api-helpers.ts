/**
 * Shared API Helper Functions
 * Centralized utilities for API service files
 */

import { getAgencyDatabase } from '@/utils/authContext';

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem('auth_token') || localStorage.getItem('token');
}

/**
 * Get default headers for API requests
 * Includes authentication and agency context
 */
export function getApiHeaders(): Record<string, string> {
  const token = getAuthToken();
  const agencyDatabase = getAgencyDatabase();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (agencyDatabase) {
    headers['X-Agency-Database'] = agencyDatabase;
  }

  return headers;
}

