/**
 * Settings Validation Utilities
 * Validation functions for settings forms
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate password
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeMB: number): ValidationResult => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
};

/**
 * Validate email domain format
 */
export const validateEmailDomain = (domain: string): ValidationResult => {
  if (!domain) {
    return { valid: true }; // Optional field
  }
  // Basic domain validation (without @)
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format' };
  }
  return { valid: true };
};

/**
 * Validate color hex format
 */
export const validateColorHex = (color: string): ValidationResult => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(color)) {
    return { valid: false, error: 'Invalid color format. Use hex format (e.g., #3b82f6)' };
  }
  return { valid: true };
};

