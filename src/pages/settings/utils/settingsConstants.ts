/**
 * Settings Constants
 * Shared constants for settings pages
 */

// Available timezones
export const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

// Date format options
export const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 31, 2024)' },
];

// Fiscal year start options
export const FISCAL_YEAR_OPTIONS = [
  { value: '01-01', label: 'January 1' },
  { value: '04-01', label: 'April 1 (India)' },
  { value: '07-01', label: 'July 1 (Australia)' },
  { value: '10-01', label: 'October 1' },
];

// Working days
export const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

// Preset color themes
export const COLOR_PRESETS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#1e40af' },
  { name: 'Green', primary: '#22c55e', secondary: '#15803d' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#6d28d9' },
  { name: 'Orange', primary: '#f97316', secondary: '#c2410c' },
  { name: 'Red', primary: '#ef4444', secondary: '#b91c1c' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#0f766e' },
  { name: 'Pink', primary: '#ec4899', secondary: '#be185d' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#4338ca' },
];

