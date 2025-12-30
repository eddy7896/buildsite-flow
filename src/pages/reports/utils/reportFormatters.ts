/**
 * Report formatting utilities
 * Helper functions for formatting report data
 */

/**
 * Indian currency formatting
 */
export const formatIndianCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  })}`;
};

/**
 * Indian date formatting (DD/MM/YYYY)
 */
export const formatIndianDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Indian date-time formatting
 */
export const formatIndianDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format large numbers in Indian style (lakhs/crores)
 */
export const formatIndianNumber = (num: number, showCurrency: boolean = false): string => {
  const absNum = Math.abs(num);
  let formatted: string;
  
  if (absNum >= 10000000) { // Crores
    formatted = (num / 10000000).toFixed(2) + ' Cr';
  } else if (absNum >= 100000) { // Lakhs
    formatted = (num / 100000).toFixed(2) + ' L';
  } else if (absNum >= 1000) { // Thousands
    formatted = (num / 1000).toFixed(2) + ' K';
  } else {
    formatted = num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  return showCurrency ? `₹${formatted}` : formatted;
};

/**
 * Calculate percentage change
 */
export const calculateChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
};

/**
 * Format change percentage
 */
export const formatChange = (current: number, previous: number): string => {
  const { value, isPositive } = calculateChange(current, previous);
  const sign = isPositive ? '+' : '-';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Get report type icon component name
 */
export const getReportTypeIcon = (type: string): string => {
  switch (type) {
    case 'attendance': return 'Clock';
    case 'payroll': return 'DollarSign';
    case 'leave': return 'Calendar';
    case 'employee': return 'Users';
    case 'project': return 'Briefcase';
    case 'financial': return 'FileText';
    case 'gst': return 'Receipt';
    default: return 'BarChart3';
  }
};

/**
 * Get report type color
 */
export const getReportTypeColor = (type: string): string => {
  switch (type) {
    case 'attendance': return 'text-blue-600';
    case 'payroll': return 'text-green-600';
    case 'leave': return 'text-purple-600';
    case 'employee': return 'text-orange-600';
    case 'project': return 'text-indigo-600';
    case 'financial': return 'text-red-600';
    case 'gst': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'default';
    case 'in-progress': return 'secondary';
    case 'planning': return 'outline';
    default: return 'secondary';
  }
};

/**
 * Get margin color
 */
export const getMarginColor = (margin: number): string => {
  if (margin > 10) return 'text-green-600';
  if (margin < 0) return 'text-red-600';
  return 'text-yellow-600';
};

