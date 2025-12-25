/**
 * Two-Factor Authentication Service
 * Frontend API client for 2FA operations
 */

import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface TwoFactorSetupResponse {
  success: boolean;
  data: {
    secret: string;
    qrCode: string;
    recoveryCodes: string[];
  };
  message: string;
}

export interface TwoFactorStatusResponse {
  success: boolean;
  data: {
    enabled: boolean;
    verifiedAt: string | null;
  };
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Setup 2FA - Generate secret and QR code
 */
export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/two-factor/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to setup 2FA' }));
    throw new Error(error.error || 'Failed to setup 2FA');
  }

  return response.json();
}

/**
 * Verify token and enable 2FA
 */
export async function verifyAndEnableTwoFactor(token: string): Promise<{ success: boolean; message: string }> {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/two-factor/verify-and-enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to enable 2FA' }));
    throw new Error(error.error || 'Failed to enable 2FA');
  }

  return response.json();
}

/**
 * Verify 2FA token during login
 */
export async function verifyTwoFactor(
  userId: string,
  agencyDatabase: string,
  token?: string,
  recoveryCode?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/two-factor/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      agencyDatabase,
      token,
      recoveryCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to verify 2FA' }));
    throw new Error(error.error || 'Failed to verify 2FA');
  }

  return response.json();
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(password: string): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/two-factor/disable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to disable 2FA' }));
    throw new Error(error.error || 'Failed to disable 2FA');
  }

  return response.json();
}

/**
 * Get 2FA status
 */
export async function getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${API_BASE}/api/two-factor/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Agency-Database': localStorage.getItem('agency_database') || '',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `Failed to get 2FA status (${response.status})` };
      }
      throw new Error(errorData.error || errorData.message || 'Failed to get 2FA status');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get 2FA status');
  }
}
