/**
 * Settings Helper Functions
 * Utility functions for settings operations
 */

/**
 * Parse working days from string or array
 */
export const parseWorkingDays = (workingDays: string | string[]): string[] => {
  if (Array.isArray(workingDays)) {
    return workingDays;
  }
  if (typeof workingDays === 'string') {
    try {
      return JSON.parse(workingDays);
    } catch {
      return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    }
  }
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get default agency settings
 */
export const getDefaultAgencySettings = () => ({
  agency_name: '',
  logo_url: '',
  domain: '',
  default_currency: 'IN',
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  timezone: 'Asia/Kolkata',
  date_format: 'DD/MM/YYYY',
  fiscal_year_start: '04-01',
  working_hours_start: '09:00',
  working_hours_end: '18:00',
  working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
});

/**
 * Get default notification settings
 */
export const getDefaultNotificationSettings = () => ({
  email_notifications: true,
  push_notifications: false,
  task_reminders: true,
  leave_notifications: true,
  payroll_notifications: true,
  project_updates: true,
  system_alerts: true,
  marketing_emails: false,
});

