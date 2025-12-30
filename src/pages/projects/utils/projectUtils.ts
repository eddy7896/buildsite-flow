/**
 * Project utility functions
 */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  project_code?: string | null;
  project_type?: string | null;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  end_date: string | null;
  deadline?: string | null;
  budget: number | null;
  actual_cost?: number | null;
  allocated_budget?: number | null;
  client_id: string | null;
  project_manager_id?: string | null;
  account_manager_id?: string | null;
  progress: number;
  assigned_team: any;
  departments?: string[];
  tags?: string[];
  categories?: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  agency_id: string;
  client?: {
    id: string;
    name: string;
    company_name: string | null;
  };
  project_manager?: {
    id: string;
    full_name: string;
  };
  account_manager?: {
    id: string;
    full_name: string;
  };
}

/**
 * Get status color variant
 */
export const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'completed': return 'default';
    case 'in-progress':
    case 'in_progress': return 'secondary';
    case 'planning': return 'outline';
    case 'on-hold':
    case 'on_hold': return 'destructive';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

/**
 * Get status label
 */
export const getStatusLabel = (status: string): string => {
  const normalizedStatus = status === 'in_progress' ? 'in-progress' : 
                          status === 'on_hold' ? 'on-hold' : status;
  switch (normalizedStatus) {
    case 'in-progress':
    case 'in_progress': return 'In Progress';
    case 'on-hold':
    case 'on_hold': return 'On Hold';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

/**
 * Format currency with compact notation
 */
export const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '₹0';
  
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toFixed(crores >= 100 ? 0 : 1)}Cr`;
  }
  
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(lakhs >= 100 ? 0 : 1)}L`;
  }
  
  if (amount >= 1000) {
    const thousands = amount / 1000;
    return `₹${thousands.toFixed(thousands >= 100 ? 0 : 1)}K`;
  }
  
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

/**
 * Calculate project statistics
 */
export const calculateProjectStats = (projects: Project[]) => {
  const total = projects.length;
  const active = projects.filter((p: Project) => {
    const status = p.status?.toLowerCase();
    return status === 'in-progress' || status === 'in_progress' || status === 'active';
  }).length;
  const completed = projects.filter((p: Project) => p.status?.toLowerCase() === 'completed').length;
  const onHold = projects.filter((p: Project) => {
    const status = p.status?.toLowerCase();
    return status === 'on-hold' || status === 'on_hold';
  }).length;
  
  const totalBudget = projects.reduce((sum: number, p: Project) => {
    const budget = typeof p.budget === 'number' ? p.budget : 
                  typeof p.budget === 'string' ? parseFloat(p.budget) || 0 : 0;
    return sum + budget;
  }, 0);
  
  return {
    total,
    active,
    completed,
    onHold,
    totalBudget,
  };
};

/**
 * Pipeline stages configuration
 */
export const PIPELINE_STAGES = [
  { name: 'Planning', status: 'planning', color: 'bg-blue-500', icon: '📋' },
  { name: 'In Progress', status: 'in-progress', color: 'bg-yellow-500', icon: '⚡' },
  { name: 'On Hold', status: 'on-hold', color: 'bg-orange-500', icon: '⏸️' },
  { name: 'Completed', status: 'completed', color: 'bg-green-500', icon: '✅' },
  { name: 'Cancelled', status: 'cancelled', color: 'bg-red-500', icon: '❌' },
];

/**
 * Get status border color for pipeline cards
 */
export const getStatusBorderColor = (status: string): string => {
  const normalizedStatus = status === 'in_progress' ? 'in-progress' : 
                          status === 'on_hold' ? 'on-hold' : status;
  switch (normalizedStatus) {
    case 'planning': return 'border-l-blue-500';
    case 'in-progress': return 'border-l-yellow-500';
    case 'on-hold': return 'border-l-orange-500';
    case 'completed': return 'border-l-green-500';
    case 'cancelled': return 'border-l-red-500';
    default: return 'border-l-gray-500';
  }
};

