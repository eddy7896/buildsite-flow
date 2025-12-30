/**
 * Financial calculation utilities
 * Helper functions for financial calculations and balance computations
 */

export interface AccountBalance {
  account_id: string;
  account_type: string;
  total_debits: number;
  total_credits: number;
}

/**
 * Calculate account balance based on account type
 * For asset and expense: balance = debits - credits
 * For liability, equity, revenue: balance = credits - debits
 */
export const calculateAccountBalance = (
  accountType: string,
  totalDebits: number,
  totalCredits: number
): number => {
  if (accountType === 'asset' || accountType === 'expense') {
    return parseFloat(String(totalDebits || 0)) - parseFloat(String(totalCredits || 0));
  } else {
    return parseFloat(String(totalCredits || 0)) - parseFloat(String(totalDebits || 0));
  }
};

/**
 * Calculate balances for all accounts
 */
export const calculateAccountBalances = (balancesData: AccountBalance[]): Record<string, number> => {
  const balances: Record<string, number> = {};
  
  balancesData.forEach((row) => {
    const { account_id, account_type, total_debits, total_credits } = row;
    balances[account_id] = calculateAccountBalance(account_type, total_debits, total_credits);
  });
  
  return balances;
};

/**
 * Calculate ledger summary from transactions
 */
export const calculateLedgerSummary = (transactions: any[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTxns = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTxns
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + (parseFloat(t.amount || 0)), 0);
  
  const monthlyExpenses = monthlyTxns
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + (parseFloat(t.amount || 0)), 0);

  const totalBalance = transactions.reduce((sum, t) => {
    return sum + (t.type === 'credit' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0));
  }, 0);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    netProfit: monthlyIncome - monthlyExpenses
  };
};

/**
 * Calculate accounting stats from accounts and balances
 */
export const calculateAccountingStats = (
  chartOfAccounts: any[],
  accountBalances: Record<string, number>,
  ledgerSummary: ReturnType<typeof calculateLedgerSummary>
) => {
  const assets = chartOfAccounts
    .filter(acc => acc.account_type === 'asset')
    .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
  
  const liabilities = chartOfAccounts
    .filter(acc => acc.account_type === 'liability')
    .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
  
  const equity = chartOfAccounts
    .filter(acc => acc.account_type === 'equity')
    .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
  
  const revenue = ledgerSummary.monthlyIncome;

  return {
    totalAssets: assets,
    totalLiabilities: liabilities,
    totalEquity: equity,
    monthlyRevenue: revenue,
  };
};

/**
 * Calculate job stats
 */
export const calculateJobStats = (jobs: any[]) => {
  return {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => job.status === 'in_progress').length,
    totalBudget: jobs.reduce((sum, job) => sum + (parseFloat(job.budget || 0)), 0),
    actualCosts: jobs.reduce((sum, job) => sum + (parseFloat(job.actual_cost || 0)), 0),
  };
};

