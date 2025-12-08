import { format, parseISO } from 'date-fns';

export interface DateFormatConfig {
  format: string;
  timezone: string;
}

// Default format and timezone
const DEFAULT_CONFIG: DateFormatConfig = {
  format: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
};

/**
 * Format a date according to agency settings
 */
export function formatDate(
  date: Date | string | null | undefined,
  dateFormat?: string,
  timezone?: string
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const fmt = dateFormat || DEFAULT_CONFIG.format;

    // Convert format string to date-fns format
    const dateFnsFormat = convertDateFormat(fmt);

    // Format the date (timezone handling would require date-fns-tz, but we'll use local time for now)
    return format(dateObj, dateFnsFormat);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format a time according to agency settings
 */
export function formatTime(
  date: Date | string | null | undefined,
  timezone?: string
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

/**
 * Format a datetime according to agency settings
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  dateFormat?: string,
  timezone?: string
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const fmt = dateFormat || DEFAULT_CONFIG.format;

    const dateFnsFormat = convertDateFormat(fmt);

    return format(dateObj, `${dateFnsFormat} HH:mm`);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
}

/**
 * Convert custom date format string to date-fns format
 */
function convertDateFormat(formatStr: string): string {
  // Map common format patterns
  const formatMap: Record<string, string> = {
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'DD-MM-YYYY': 'dd-MM-yyyy',
    'MMM DD, YYYY': 'MMM dd, yyyy',
  };

  return formatMap[formatStr] || formatStr;
}

/**
 * Get current date
 */
export function getCurrentDate(timezone?: string): Date {
  return new Date();
}

/**
 * Check if a date is a working day
 */
export function isWorkingDay(
  date: Date | string,
  workingDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const dayName = format(dateObj, 'EEEE').toLowerCase();
  return workingDays.includes(dayName);
}

/**
 * Check if current time is within working hours
 */
export function isWorkingHours(
  time: Date | string,
  startTime: string = '09:00',
  endTime: string = '18:00',
  timezone?: string
): boolean {
  try {
    const timeObj = typeof time === 'string' ? parseISO(time) : time;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const currentHour = timeObj.getHours();
    const currentMin = timeObj.getMinutes();

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = currentHour * 60 + currentMin;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } catch (error) {
    console.error('Error checking working hours:', error);
    return false;
  }
}

