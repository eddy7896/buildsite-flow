/**
 * Project Details utility functions
 */

export const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | null, currency: string = 'USD'): string => {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Calculate budget variance percentage
 */
export const calculateBudgetVariance = (budget: number | null, actualCost: number | null): number => {
  if (!budget || !actualCost) return 0;
  return ((actualCost - budget) / budget) * 100;
};

/**
 * Calculate task completion rate
 */
export const calculateTaskCompletionRate = (tasks: any[]): number => {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  return (completedTasks / tasks.length) * 100;
};

