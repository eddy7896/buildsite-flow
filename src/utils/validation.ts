/**
 * Frontend Validation Utilities
 * 
 * Client-side format validation helpers.
 * Existence checks should be delegated to backend API endpoints.
 */

import { getApiBaseUrl } from '@/config/api';
import { getAgencyDatabase } from './authContext';

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validate employee ID format
 */
export function validateEmployeeIdFormat(employeeId: string): { valid: boolean; error?: string } {
  if (!employeeId || !employeeId.trim()) {
    return { valid: false, error: 'Employee ID is required' };
  }

  // Employee ID should be alphanumeric, may contain hyphens or underscores
  const employeeIdRegex = /^[A-Za-z0-9_-]+$/;
  if (!employeeIdRegex.test(employeeId.trim())) {
    return { valid: false, error: 'Employee ID can only contain letters, numbers, hyphens, and underscores' };
  }

  if (employeeId.trim().length < 3) {
    return { valid: false, error: 'Employee ID must be at least 3 characters' };
  }

  if (employeeId.trim().length > 50) {
    return { valid: false, error: 'Employee ID must be less than 50 characters' };
  }

  return { valid: true };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string): { valid: boolean; error?: string } {
  if (!date || !date.trim()) {
    return { valid: false, error: 'Date is required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date.trim())) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  return { valid: true };
}

/**
 * Check if email exists via backend API
 * This should be called when you need to verify email uniqueness
 */
export async function checkEmailExistsAPI(email: string, excludeUserId?: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const agencyDatabase = getAgencyDatabase();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = new URL(`${getApiBaseUrl()}/api/validation/email-exists`);
    url.searchParams.set('email', email);
    if (excludeUserId) {
      url.searchParams.set('excludeUserId', excludeUserId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(agencyDatabase && { 'X-Agency-Database': agencyDatabase }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check email existence');
    }

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // On error, return false to allow operation (fail open)
    return false;
  }
}

/**
 * Check if employee ID exists via backend API
 */
export async function checkEmployeeIdExistsAPI(employeeId: string, excludeUserId?: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const agencyDatabase = getAgencyDatabase();

    if (!token || !agencyDatabase) {
      throw new Error('Not authenticated or missing agency context');
    }

    const url = new URL(`${getApiBaseUrl()}/api/validation/employee-id-exists`);
    url.searchParams.set('employeeId', employeeId);
    if (excludeUserId) {
      url.searchParams.set('excludeUserId', excludeUserId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Agency-Database': agencyDatabase,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check employee ID existence');
    }

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error checking employee ID existence:', error);
    return false;
  }
}

/**
 * Check if holiday exists on date via backend API
 */
export async function checkHolidayExistsAPI(date: string, agencyId: string, excludeHolidayId?: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const agencyDatabase = getAgencyDatabase();

    if (!token || !agencyDatabase) {
      throw new Error('Not authenticated or missing agency context');
    }

    const response = await fetch(`${getApiBaseUrl()}/api/validation/holiday-exists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Agency-Database': agencyDatabase,
      },
      body: JSON.stringify({ date, agencyId, excludeHolidayId }),
    });

    if (!response.ok) {
      throw new Error('Failed to check holiday existence');
    }

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error checking holiday existence:', error);
    return false;
  }
}

