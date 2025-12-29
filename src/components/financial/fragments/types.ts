export interface AccountingStats {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  monthlyRevenue: number;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalBudget: number;
  actualCosts: number;
}

export interface LedgerSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
}

export interface PaginationState {
  accounts: number;
  entries: number;
  transactions: number;
  jobs: number;
}

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

export const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'revenue': return 'bg-green-100 text-green-800';
    case 'operating expenses': return 'bg-red-100 text-red-800';
    case 'payroll': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
