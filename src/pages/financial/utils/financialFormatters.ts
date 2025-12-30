/**
 * Financial formatting utilities
 * Helper functions for formatting financial data for display
 */

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | string, currency: string = 'INR'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency === 'INR' ? 'INR' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Format currency with symbol only (no currency code)
 */
export const formatCurrencySymbol = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format number with locale
 */
export const formatNumber = (num: number | string): string => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  return numValue.toLocaleString('en-IN');
};

/**
 * Get account type color class
 */
export const getAccountTypeColor = (type: string): string => {
  switch (type) {
    case 'asset': return 'bg-green-100 text-green-800';
    case 'liability': return 'bg-red-100 text-red-800';
    case 'equity': return 'bg-blue-100 text-blue-800';
    case 'revenue': return 'bg-purple-100 text-purple-800';
    case 'expense': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-800';
    case 'posted': return 'bg-green-100 text-green-800';
    case 'reversed': return 'bg-red-100 text-red-800';
    case 'planning': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-orange-100 text-orange-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get transaction color class
 */
export const getTransactionColor = (type: string): string => {
  return type === 'credit' ? 'text-green-600' : 'text-red-600';
};

/**
 * Get category color class
 */
export const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'revenue': return 'bg-green-100 text-green-800';
    case 'operating expenses': return 'bg-red-100 text-red-800';
    case 'payroll': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

