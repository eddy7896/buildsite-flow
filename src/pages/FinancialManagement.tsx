import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calculator, FileText, BookOpen, TrendingUp, Briefcase, Clock, DollarSign, Target, Edit, Trash2, Download, Calendar, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { selectRecords, selectOne, rawQuery } from '@/services/api/postgresql-service';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getAgencyId } from '@/utils/agencyUtils';
import JobFormDialog from '@/components/JobFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import ChartOfAccountFormDialog from '@/components/ChartOfAccountFormDialog';
import JournalEntryFormDialog from '@/components/JournalEntryFormDialog';
import JobCostItemsDialog from '@/components/JobCostItemsDialog';

const FinancialManagement = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [entryToDelete, setEntryToDelete] = useState<any>(null);
  const [costItemsDialogOpen, setCostItemsDialogOpen] = useState(false);
  const [selectedJobForCosts, setSelectedJobForCosts] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionDetailsOpen, setTransactionDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState({ accounts: 1, entries: 1, transactions: 1, jobs: 1 });
  const [pageSize] = useState(10);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  useEffect(() => {
    const initializeAgency = async () => {
      const id = await getAgencyId(profile, user?.id);
      setAgencyId(id);
      if (id) {
        fetchAllData(id);
      }
    };

    if (user?.id) {
      initializeAgency();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.agency_id]); // Depend on user.id and profile.agency_id

  const fetchAllData = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    
    if (!effectiveAgencyId) {
      console.warn('No agency_id available, cannot fetch data');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data in parallel but with individual loading states
      await Promise.all([
        fetchJobs(effectiveAgencyId),
        fetchChartOfAccounts(effectiveAgencyId),
        fetchJournalEntries(effectiveAgencyId),
        fetchTransactions(effectiveAgencyId),
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setJobsLoading(true);
    try {
      if (!effectiveAgencyId) {
        setJobs([]);
        return;
      }
      const jobsData = await selectRecords('jobs', {
        where: { agency_id: effectiveAgencyId },
        orderBy: 'created_at DESC',
      });
      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchChartOfAccounts = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setAccountsLoading(true);
    try {
      if (!effectiveAgencyId) {
        // If no agency_id available, try fetching global accounts
        const accounts = await selectRecords('chart_of_accounts', {
          where: { is_active: true },
          orderBy: 'account_code ASC',
        });
        setChartOfAccounts(accounts || []);
        return;
      }
      let accounts: any[] = [];
      try {
        accounts = await selectRecords('chart_of_accounts', {
          where: { agency_id: effectiveAgencyId },
          orderBy: 'account_code ASC',
        });
      } catch (err: any) {
        // Fallback if agency_id column does not exist in current schema
        if (err?.code === '42703' || String(err?.message || '').includes('agency_id')) {
          console.warn('chart_of_accounts has no agency_id column, falling back to global accounts');
          accounts = await selectRecords('chart_of_accounts', {
            where: { is_active: true },
            orderBy: 'account_code ASC',
          });
        } else {
          throw err;
        }
      }
      setChartOfAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch chart of accounts',
        variant: 'destructive',
      });
      setChartOfAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchJournalEntries = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setEntriesLoading(true);
    try {
      let entries: any[] = [];
      if (effectiveAgencyId) {
        try {
          entries = await selectRecords('journal_entries', {
            where: { agency_id: effectiveAgencyId },
            orderBy: 'entry_date DESC, created_at DESC',
          });
        } catch (err: any) {
          // Fallback if agency_id column does not exist in current schema
          if (err?.code === '42703' || String(err?.message || '').includes('agency_id')) {
            console.warn('journal_entries has no agency_id column, falling back to all entries');
            entries = await selectRecords('journal_entries', {
              orderBy: 'entry_date DESC, created_at DESC',
            });
          } else {
            throw err;
          }
        }
      } else {
        // If no agency_id available, fetch all entries
        entries = await selectRecords('journal_entries', {
          orderBy: 'entry_date DESC, created_at DESC',
        });
      }
      setJournalEntries(entries || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch journal entries',
        variant: 'destructive',
      });
      setJournalEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  const fetchTransactions = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setTransactionsLoading(true);
    try {
      let query: string;
      let params: any[] = [];
      
      // Try to use agency_id if available, with fallback if column doesn't exist
      if (effectiveAgencyId) {
        query = `
          SELECT 
            jel.id,
            je.entry_date as date,
            COALESCE(jel.description, je.description) as description,
            COALESCE(coa.account_type, 'Other') as category,
            CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
            COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
            je.reference,
            je.entry_number,
            coa.account_name,
            coa.account_code
          FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.journal_entry_id = je.id
          LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
          WHERE je.status = 'posted' AND je.agency_id = $1
          ORDER BY je.entry_date DESC, jel.line_number ASC
          LIMIT 100
        `;
        params = [effectiveAgencyId];
      } else {
        query = `
          SELECT 
            jel.id,
            je.entry_date as date,
            COALESCE(jel.description, je.description) as description,
            COALESCE(coa.account_type, 'Other') as category,
            CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
            COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
            je.reference,
            je.entry_number,
            coa.account_name,
            coa.account_code
          FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.journal_entry_id = je.id
          LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
          WHERE je.status = 'posted'
          ORDER BY je.entry_date DESC, jel.line_number ASC
          LIMIT 100
        `;
      }
      
      let txnData: any[] = [];
      try {
        txnData = await rawQuery(query, params);
      } catch (err: any) {
        // Fallback if agency_id column does not exist in current schema
        if (err?.code === '42703' || String(err?.message || '').includes('agency_id')) {
          console.warn('journal_entries has no agency_id column, falling back to all transactions');
          query = `
            SELECT 
              jel.id,
              je.entry_date as date,
              COALESCE(jel.description, je.description) as description,
              COALESCE(coa.account_type, 'Other') as category,
              CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
              COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
              je.reference,
              je.entry_number,
              coa.account_name,
              coa.account_code
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
            WHERE je.status = 'posted'
            ORDER BY je.entry_date DESC, jel.line_number ASC
            LIMIT 100
          `;
          txnData = await rawQuery(query, []);
        } else {
          throw err;
        }
      }
      setTransactions(txnData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Calculate account balances from journal entries
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [balancesLoading, setBalancesLoading] = useState(false);

  // Fetch and calculate account balances - using useMemo and useEffect with proper dependencies
  useEffect(() => {
    const calculateAccountBalances = async () => {
      // Prevent running if already loading or no data
      const effectiveAgencyId = agencyId;
      if (balancesLoading || !effectiveAgencyId || chartOfAccounts.length === 0) {
        if (chartOfAccounts.length === 0) {
          setAccountBalances({});
        }
        return;
      }

      setBalancesLoading(true);
      try {
        // Use parameterized query - filter by journal_entries.agency_id only
        // chart_of_accounts may not have agency_id column, so we filter through journal_entries
        let query = `
          SELECT 
            coa.id as account_id,
            coa.account_type,
            COALESCE(SUM(jel.debit_amount), 0) as total_debits,
            COALESCE(SUM(jel.credit_amount), 0) as total_credits
          FROM chart_of_accounts coa
          LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
          LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id 
            AND je.status = 'posted' 
            AND je.agency_id = $1
          GROUP BY coa.id, coa.account_type
        `;
        
        let balancesData: any[] = [];
        try {
          balancesData = await rawQuery(query, [effectiveAgencyId]);
        } catch (err: any) {
          // Fallback if agency_id column does not exist in current schema
          if (err?.code === '42703' || String(err?.message || '').includes('agency_id')) {
            console.warn('journal_entries has no agency_id column, falling back to all entries for balance calculation');
            query = `
              SELECT 
                coa.id as account_id,
                coa.account_type,
                COALESCE(SUM(jel.debit_amount), 0) as total_debits,
                COALESCE(SUM(jel.credit_amount), 0) as total_credits
              FROM chart_of_accounts coa
              LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
              LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id 
                AND je.status = 'posted'
              GROUP BY coa.id, coa.account_type
            `;
            balancesData = await rawQuery(query, []);
          } else {
            throw err;
          }
        }
        
        const balances: Record<string, number> = {};
        balancesData.forEach((row: any) => {
          const { account_id, account_type, total_debits, total_credits } = row;
          // For asset and expense: balance = debits - credits
          // For liability, equity, revenue: balance = credits - debits
          if (account_type === 'asset' || account_type === 'expense') {
            balances[account_id] = parseFloat(total_debits || 0) - parseFloat(total_credits || 0);
          } else {
            balances[account_id] = parseFloat(total_credits || 0) - parseFloat(total_debits || 0);
          }
        });
        
        setAccountBalances(balances);
      } catch (error) {
        console.error('Error calculating account balances:', error);
        setAccountBalances({});
      } finally {
        setBalancesLoading(false);
      }
    };

    // Only calculate if we have accounts and agency_id
    if (chartOfAccounts.length > 0 && agencyId) {
      calculateAccountBalances();
    } else if (chartOfAccounts.length === 0) {
      setAccountBalances({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartOfAccounts.length, agencyId]); // Only depend on length and agencyId to prevent infinite loops

  // Calculate ledger summary first (needed by accountingStats)
  const ledgerSummary = React.useMemo(() => {
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
  }, [transactions]);

  // Calculate stats from real data (after ledgerSummary is defined)
  const accountingStats = React.useMemo(() => {
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
  }, [chartOfAccounts, accountBalances, ledgerSummary]);

  const jobStats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => job.status === 'in_progress').length,
    totalBudget: jobs.reduce((sum, job) => sum + (parseFloat(job.budget || 0)), 0),
    actualCosts: jobs.reduce((sum, job) => sum + (parseFloat(job.actual_cost || 0)), 0),
  };

  const handleNewJob = () => {
    setSelectedJob(null);
    setJobFormOpen(true);
  };

  const handleEditJob = (job: any) => {
    setSelectedJob(job);
    setJobFormOpen(true);
  };

  const handleDeleteJob = (job: any) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleJobSaved = async () => {
    await fetchJobs(agencyId);
  };

  const handleJobDeleted = async () => {
    if (jobToDelete) {
      try {
        const { deleteRecord } = await import('@/services/api/postgresql-service');
        await deleteRecord('jobs', { id: jobToDelete.id });
        toast({
          title: 'Success',
          description: 'Job deleted successfully',
        });
        fetchJobs();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete job',
          variant: 'destructive',
        });
      }
    }
    setJobToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleExportReport = async () => {
    try {
      // Export current view data to CSV
      const exportData = {
        accounts: filteredAccounts,
        entries: filteredEntries,
        transactions: filteredTransactions,
        jobs: filteredJobs,
      };

      // Create CSV content
      const csvRows: string[] = [];
      
      // Accounts
      csvRows.push('Chart of Accounts');
      csvRows.push('Account Code,Account Name,Type,Balance,Status');
      filteredAccounts.forEach(acc => {
        const balance = accountBalances[acc.id] || 0;
        csvRows.push(`"${acc.account_code}","${acc.account_name}","${acc.account_type}",${balance},"${acc.is_active ? 'Active' : 'Inactive'}"`);
      });
      csvRows.push('');

      // Journal Entries
      csvRows.push('Journal Entries');
      csvRows.push('Entry Number,Date,Description,Reference,Status,Total Debit,Total Credit');
      filteredEntries.forEach(entry => {
        csvRows.push(`"${entry.entry_number}","${entry.entry_date}","${entry.description}","${entry.reference || ''}","${entry.status}",${entry.total_debit || 0},${entry.total_credit || 0}`);
      });
      csvRows.push('');

      // Transactions
      csvRows.push('Transactions');
      csvRows.push('Date,Description,Type,Amount,Category,Reference');
      filteredTransactions.forEach(txn => {
        csvRows.push(`"${txn.date}","${txn.description}","${txn.type}",${txn.amount},"${txn.category || 'Other'}","${txn.reference || ''}"`);
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Financial data exported to CSV successfully',
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    try {
      let reportData: any = {};
      let reportTitle = '';

      switch (reportType) {
        case 'balance-sheet':
          reportTitle = 'Balance Sheet';
          // Calculate assets, liabilities, equity
          const assets = chartOfAccounts
            .filter(acc => acc.account_type === 'asset')
            .map(acc => ({
              account: `${acc.account_code} - ${acc.account_name}`,
              balance: accountBalances[acc.id] || 0
            }));
          const liabilities = chartOfAccounts
            .filter(acc => acc.account_type === 'liability')
            .map(acc => ({
              account: `${acc.account_code} - ${acc.account_name}`,
              balance: accountBalances[acc.id] || 0
            }));
          const equity = chartOfAccounts
            .filter(acc => acc.account_type === 'equity')
            .map(acc => ({
              account: `${acc.account_code} - ${acc.account_name}`,
              balance: accountBalances[acc.id] || 0
            }));
          
          reportData = {
            assets,
            liabilities,
            equity,
            totalAssets: accountingStats.totalAssets,
            totalLiabilities: accountingStats.totalLiabilities,
            totalEquity: accountingStats.totalEquity,
          };
          break;

        case 'profit-loss':
          reportTitle = 'Profit & Loss Statement';
          const revenue = chartOfAccounts
            .filter(acc => acc.account_type === 'revenue')
            .map(acc => ({
              account: `${acc.account_code} - ${acc.account_name}`,
              balance: accountBalances[acc.id] || 0
            }));
          const expenses = chartOfAccounts
            .filter(acc => acc.account_type === 'expense')
            .map(acc => ({
              account: `${acc.account_code} - ${acc.account_name}`,
              balance: accountBalances[acc.id] || 0
            }));
          
          reportData = {
            revenue,
            expenses,
            totalRevenue: revenue.reduce((sum, r) => sum + r.balance, 0),
            totalExpenses: expenses.reduce((sum, e) => sum + e.balance, 0),
            netIncome: revenue.reduce((sum, r) => sum + r.balance, 0) - expenses.reduce((sum, e) => sum + e.balance, 0),
          };
          break;

        case 'trial-balance':
          reportTitle = 'Trial Balance';
          reportData = chartOfAccounts.map(acc => ({
            account_code: acc.account_code,
            account_name: acc.account_name,
            account_type: acc.account_type,
            balance: accountBalances[acc.id] || 0,
          }));
          break;

        case 'job-profitability':
          reportTitle = 'Job Profitability Report';
          reportData = jobs.map(job => ({
            job_number: job.job_number,
            title: job.title,
            budget: parseFloat(job.budget || 0),
            actual_cost: parseFloat(job.actual_cost || 0),
            profit: parseFloat(job.budget || 0) - parseFloat(job.actual_cost || 0),
            profit_margin: job.profit_margin || 0,
            status: job.status,
          }));
          break;

        case 'cash-flow':
          reportTitle = 'Cash Flow Statement';
          const cashAccounts = chartOfAccounts.filter(acc => 
            acc.account_type === 'asset' && 
            (acc.account_name.toLowerCase().includes('cash') || acc.account_name.toLowerCase().includes('bank'))
          );
          reportData = {
            cashAccounts: cashAccounts.map(acc => ({
              account: `${acc.account_code} - ${acc.account_name}`,
              balance: accountBalances[acc.id] || 0
            })),
            totalCash: cashAccounts.reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0),
          };
          break;

        case 'monthly-summary':
          reportTitle = 'Monthly Summary';
          reportData = {
            monthlyIncome: ledgerSummary.monthlyIncome,
            monthlyExpenses: ledgerSummary.monthlyExpenses,
            netProfit: ledgerSummary.netProfit,
            totalBalance: ledgerSummary.totalBalance,
          };
          break;

        default:
          return;
      }

      // Save report to database and navigate to reports page
      try {
        const { ReportService } = await import('@/services/api/reports');
        const response = await ReportService.createReport({
          name: reportTitle,
          description: `Generated ${reportType} report from Financial Management`,
          report_type: reportType as any,
          parameters: reportData,
          generated_by: user?.id,
          is_public: false,
        }, { showLoading: true, showErrorToast: true });
        
        if (response.success) {
          toast({
            title: 'Report Generated',
            description: `${reportTitle} has been saved. Redirecting to Reports page...`,
          });
          
          // Navigate to reports page after a short delay
          setTimeout(() => {
            navigate('/reports');
          }, 1500);
        } else {
          throw new Error(response.error || 'Failed to save report');
        }
      } catch (error: any) {
        // If reports table doesn't exist or save fails, show in dialog
        console.warn('Could not save report to database:', error);
        
        // Display report in a dialog or new window
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          reportWindow.document.write(`
            <html>
              <head>
                <title>${reportTitle}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; }
                  .total { font-weight: bold; }
                </style>
              </head>
              <body>
                <h1>${reportTitle}</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <pre>${JSON.stringify(reportData, null, 2)}</pre>
              </body>
            </html>
          `);
          reportWindow.document.close();
        }

        toast({
          title: 'Report Generated',
          description: `${reportTitle} has been generated`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const handleNewAccount = () => {
    setSelectedAccount(null);
    setAccountFormOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setAccountFormOpen(true);
  };

  const handleDeleteAccount = (account: any) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleAccountSaved = async () => {
    await fetchChartOfAccounts(agencyId);
    // Reset account balances to trigger recalculation
    setAccountBalances({});
  };

  const handleAccountDeleted = async () => {
    if (accountToDelete) {
      try {
        const { deleteRecord } = await import('@/services/api/postgresql-service');
        await deleteRecord('chart_of_accounts', { id: accountToDelete.id });
        toast({
          title: 'Success',
          description: 'Account deleted successfully',
        });
        fetchChartOfAccounts();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete account',
          variant: 'destructive',
        });
      }
    }
    setAccountToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleNewEntry = async () => {
    setSelectedEntry(null);
    setEntryFormOpen(true);
  };

  const handleEditEntry = async (entry: any) => {
    try {
      // Fetch entry with lines
      const { selectRecords } = await import('@/services/api/postgresql-service');
      const lines = await selectRecords('journal_entry_lines', {
        where: { journal_entry_id: entry.id },
        orderBy: 'line_number ASC',
      });
      setSelectedEntry({ ...entry, lines: lines || [] });
      setEntryFormOpen(true);
    } catch (error) {
      console.error('Error fetching entry lines:', error);
      setSelectedEntry(entry);
      setEntryFormOpen(true);
    }
  };

  const handleDeleteEntry = (entry: any) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleEntrySaved = async () => {
    await Promise.all([
      fetchJournalEntries(agencyId),
      fetchTransactions(agencyId)
    ]);
    // Reset account balances to trigger recalculation
    setAccountBalances({});
  };

  const handleEntryDeleted = async () => {
    if (entryToDelete) {
      try {
        const { executeTransaction } = await import('@/services/api/postgresql-service');
        await executeTransaction(async (client) => {
          // Delete lines first
          await client.query(
            'DELETE FROM public.journal_entry_lines WHERE journal_entry_id = $1',
            [entryToDelete.id]
          );
          // Delete entry
          await client.query(
            'DELETE FROM public.journal_entries WHERE id = $1',
            [entryToDelete.id]
          );
        });
        toast({
          title: 'Success',
          description: 'Journal entry deleted successfully',
        });
        fetchJournalEntries();
        fetchTransactions();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete journal entry',
          variant: 'destructive',
        });
      }
    }
    setEntryToDelete(null);
    setDeleteDialogOpen(false);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'bg-green-100 text-green-800';
      case 'liability': return 'bg-red-100 text-red-800';
      case 'equity': return 'bg-blue-100 text-blue-800';
      case 'revenue': return 'bg-purple-100 text-purple-800';
      case 'expense': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
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

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'revenue': return 'bg-green-100 text-green-800';
      case 'operating expenses': return 'bg-red-100 text-red-800';
      case 'payroll': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAccounts = chartOfAccounts.filter(account => {
    const matchesSearch = (account.account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.account_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = accountTypeFilter === 'all' || account.account_type === accountTypeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage.accounts - 1) * pageSize,
    currentPage.accounts * pageSize
  );
  const totalPagesAccounts = Math.ceil(filteredAccounts.length / pageSize);

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesDateRange = (!dateRange.start || new Date(entry.entry_date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(entry.entry_date) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const paginatedEntries = filteredEntries.slice(
    (currentPage.entries - 1) * pageSize,
    currentPage.entries * pageSize
  );
  const totalPagesEntries = Math.ceil(filteredEntries.length / pageSize);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedJobs = filteredJobs.slice(
    (currentPage.jobs - 1) * pageSize,
    currentPage.jobs * pageSize
  );
  const totalPagesJobs = Math.ceil(filteredJobs.length / pageSize);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange = (!dateRange.start || new Date(transaction.date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(transaction.date) <= new Date(dateRange.end));
    return matchesSearch && matchesDateRange;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage.transactions - 1) * pageSize,
    currentPage.transactions * pageSize
  );
  const totalPagesTransactions = Math.ceil(filteredTransactions.length / pageSize);

  // Show loading or error state if no agency
  if (!agencyId && !loading && user?.id) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Unable to determine agency. Please ensure you are logged in and have an agency assigned.</p>
            <Button onClick={async () => {
              const id = await getAgencyId();
              if (id) {
                setAgencyId(id);
                fetchAllData(id);
              } else {
                toast({
                  title: 'Error',
                  description: 'Could not find agency. Please contact your administrator.',
                  variant: 'destructive',
                });
              }
            }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Complete financial oversight: accounting, job costing, and general ledger</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ledger')}>
            <BookOpen className="h-4 w-4 mr-2" />
            View Ledger
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleNewEntry}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Unified Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">₹{accountingStats.totalAssets.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">₹{ledgerSummary.totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{jobStats.activeJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">₹{ledgerSummary.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all financial data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Date Range (Start)</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ start: e.target.value, end: prev.end }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date Range (End)</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ start: prev.start, end: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="reversed">Reversed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setAccountTypeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Financial Management Tabs */}
      <Tabs defaultValue="accounting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="job-costing">Job Costing</TabsTrigger>
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>
        
        {/* Accounting Tab */}
        <TabsContent value="accounting" className="space-y-4">
          <Tabs defaultValue="chart-of-accounts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
              <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart-of-accounts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Chart of Accounts</h3>
                <Button variant="outline" onClick={handleNewAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Account
                </Button>
              </div>
              
              {loading || accountsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading accounts...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredAccounts.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No accounts found</p>
                        <p>Create your first account to get started with financial management.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    paginatedAccounts.map((account) => {
                      const balance = accountBalances[account.id] || 0;
                      const balanceColor = balance >= 0 ? 'text-green-600' : 'text-red-600';
                      return (
                        <Card key={account.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold">{account.account_code} - {account.account_name}</h4>
                                  <Badge className={getAccountTypeColor(account.account_type)}>
                                    {account.account_type}
                                  </Badge>
                                </div>
                                {account.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{account.description}</p>
                                )}
                                <div className="mt-2">
                                  <p className={`text-sm font-semibold ${balanceColor}`}>
                                    Balance: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right mr-4">
                                  <p className="text-sm text-muted-foreground">
                                    {account.is_active ? 'Active' : 'Inactive'}
                                  </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleEditAccount(account)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteAccount(account)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="journal-entries" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Journal Entries</h3>
                <Button variant="outline" onClick={handleNewEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </div>
              
              {loading || entriesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading journal entries...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEntries.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No journal entries found</p>
                        <p>Create your first journal entry to record financial transactions.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    paginatedEntries.map((entry) => (
                      <Card key={entry.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{entry.entry_number}</CardTitle>
                              <p className="text-sm text-muted-foreground">{entry.description}</p>
                            </div>
                            <Badge className={getStatusColor(entry.status)}>
                              {entry.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Entry Date</p>
                              <p className="font-medium">{new Date(entry.entry_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Reference</p>
                              <p className="font-medium">{entry.reference || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Debit</p>
                              <p className="font-semibold">₹{parseFloat(entry.total_debit || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Credit</p>
                              <p className="font-semibold">₹{parseFloat(entry.total_credit || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteEntry(entry)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
              {totalPagesAccounts > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage.accounts - 1) * pageSize + 1} to {Math.min(currentPage.accounts * pageSize, filteredAccounts.length)} of {filteredAccounts.length} accounts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => ({ ...prev, accounts: Math.max(1, prev.accounts - 1) }))}
                      disabled={currentPage.accounts === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">Page {currentPage.accounts} of {totalPagesAccounts}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => ({ ...prev, accounts: Math.min(totalPagesAccounts, prev.accounts + 1) }))}
                      disabled={currentPage.accounts === totalPagesAccounts}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Job Costing Tab */}
        <TabsContent value="job-costing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Job Cost Management</h3>
            <Button onClick={handleNewJob}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
          
          {loading || jobsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading jobs...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No jobs found</p>
                    <p>Create your first job to start tracking project costs and profitability.</p>
                  </CardContent>
                </Card>
              ) : (
                paginatedJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {job.job_number} • {job.client_id || 'No client assigned'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Budget</p>
                          <p className="font-semibold">₹{(job.budget || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Actual Cost</p>
                          <p className="font-semibold">₹{(job.actual_cost || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hours (Est/Act)</p>
                          <p className="font-semibold">{job.estimated_hours || 0}/{job.actual_hours || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profit Margin</p>
                          <p className="font-semibold">{job.profit_margin || 0}%</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedJobForCosts(job);
                          setCostItemsDialogOpen(true);
                        }}>
                          <Calculator className="h-4 w-4 mr-1" />
                          Manage Costs
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteJob(job)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
          {totalPagesJobs > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage.jobs - 1) * pageSize + 1} to {Math.min(currentPage.jobs * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => ({ ...prev, jobs: Math.max(1, prev.jobs - 1) }))}
                  disabled={currentPage.jobs === 1}
                >
                  Previous
                </Button>
                <div className="text-sm">Page {currentPage.jobs} of {totalPagesJobs}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => ({ ...prev, jobs: Math.min(totalPagesJobs, prev.jobs + 1) }))}
                  disabled={currentPage.jobs === totalPagesJobs}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* General Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="debits">Debits</TabsTrigger>
              <TabsTrigger value="summary">Account Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Complete record of all financial transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No transactions found</p>
                          <p>Transactions will appear here once journal entries are posted.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      paginatedTransactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={async () => {
                          try {
                            // Fetch full journal entry details
                            const { selectOne, selectRecords } = await import('@/services/api/postgresql-service');
                            const entry = await selectOne('journal_entries', { entry_number: transaction.entry_number });
                            if (entry) {
                              const lines = await selectRecords('journal_entry_lines', {
                                where: { journal_entry_id: entry.id },
                                orderBy: 'line_number ASC',
                              });
                              setSelectedTransaction({ ...entry, lines: lines || [] });
                              setTransactionDetailsOpen(true);
                            }
                          } catch (error) {
                            console.error('Error fetching transaction details:', error);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{transaction.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{transaction.entry_number || transaction.id}</span>
                              {transaction.reference && (
                                <>
                                  <span>•</span>
                                  <span>Ref: {transaction.reference}</span>
                                </>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category || 'Other')}`}>
                              {transaction.category || 'Other'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                  {totalPagesTransactions > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage.transactions - 1) * pageSize + 1} to {Math.min(currentPage.transactions * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => ({ ...prev, transactions: Math.max(1, prev.transactions - 1) }))}
                          disabled={currentPage.transactions === 1}
                        >
                          Previous
                        </Button>
                        <div className="text-sm">Page {currentPage.transactions} of {totalPagesTransactions}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => ({ ...prev, transactions: Math.min(totalPagesTransactions, prev.transactions + 1) }))}
                          disabled={currentPage.transactions === totalPagesTransactions}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="credits" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Credit Transactions</CardTitle>
                  <CardDescription>Income and credit entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTransactions.filter(t => t.type === 'credit').length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                          <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No credit transactions found</p>
                          <p>Credit transactions will appear here once journal entries are posted.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredTransactions.filter(t => t.type === 'credit').map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{transaction.description || 'No description'}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{transaction.entry_number || transaction.id}</span>
                                {transaction.reference && (
                                  <>
                                    <span>•</span>
                                    <span>Ref: {transaction.reference}</span>
                                  </>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category || 'Other')}`}>
                                {transaction.category || 'Other'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">
                              +₹{parseFloat(transaction.amount || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="debits" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Debit Transactions</CardTitle>
                  <CardDescription>Expenses and debit entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTransactions.filter(t => t.type === 'debit').length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                          <ArrowDownRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No debit transactions found</p>
                          <p>Debit transactions will appear here once journal entries are posted.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredTransactions.filter(t => t.type === 'debit').map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{transaction.description || 'No description'}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{transaction.entry_number || transaction.id}</span>
                                {transaction.reference && (
                                  <>
                                    <span>•</span>
                                    <span>Ref: {transaction.reference}</span>
                                  </>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category || 'Other')}`}>
                                {transaction.category || 'Other'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-red-600">
                              -₹{parseFloat(transaction.amount || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="summary" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                  <CardDescription>Overview of account balances and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">Revenue</h3>
                      <p className="text-3xl font-bold text-green-600">₹{ledgerSummary.monthlyIncome.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">Expenses</h3>
                      <p className="text-3xl font-bold text-red-600">₹{ledgerSummary.monthlyExpenses.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">Net Income</h3>
                      <p className="text-3xl font-bold text-blue-600">₹{ledgerSummary.netProfit.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Financial Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <p className="text-muted-foreground">Generate and view comprehensive financial statements</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateReport('balance-sheet')}
                >
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Balance Sheet</h3>
                    <p className="text-sm text-muted-foreground">Assets, liabilities, and equity statement</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateReport('profit-loss')}
                >
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Profit & Loss</h3>
                    <p className="text-sm text-muted-foreground">Income and expenses statement</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateReport('trial-balance')}
                >
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Trial Balance</h3>
                    <p className="text-sm text-muted-foreground">List of all account balances</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateReport('job-profitability')}
                >
                  <CardContent className="p-6 text-center">
                    <Calculator className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Job Profitability</h3>
                    <p className="text-sm text-muted-foreground">Job cost analysis and margins</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateReport('cash-flow')}
                >
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Cash Flow</h3>
                    <p className="text-sm text-muted-foreground">Cash receipts and payments</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateReport('monthly-summary')}
                >
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-pink-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Monthly Summary</h3>
                    <p className="text-sm text-muted-foreground">Monthly financial overview</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <JobFormDialog
        isOpen={jobFormOpen}
        onClose={() => setJobFormOpen(false)}
        job={selectedJob}
        onJobSaved={handleJobSaved}
      />

      <ChartOfAccountFormDialog
        isOpen={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
        account={selectedAccount}
        onAccountSaved={handleAccountSaved}
      />

      <JournalEntryFormDialog
        isOpen={entryFormOpen}
        onClose={() => setEntryFormOpen(false)}
        entry={selectedEntry}
        onEntrySaved={handleEntrySaved}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setJobToDelete(null);
          setAccountToDelete(null);
          setEntryToDelete(null);
        }}
        onDeleted={async () => {
          if (jobToDelete) {
            await handleJobDeleted();
          } else if (accountToDelete) {
            await handleAccountDeleted();
          } else if (entryToDelete) {
            await handleEntryDeleted();
          }
        }}
        itemType={jobToDelete ? "Job" : accountToDelete ? "Account" : "Journal Entry"}
        itemName={jobToDelete?.title || accountToDelete?.account_name || entryToDelete?.entry_number || ''}
        itemId={jobToDelete?.id || accountToDelete?.id || entryToDelete?.id || ''}
        tableName={jobToDelete ? "jobs" : accountToDelete ? "chart_of_accounts" : "journal_entries"}
      />

      <JobCostItemsDialog
        isOpen={costItemsDialogOpen}
        onClose={() => {
          setCostItemsDialogOpen(false);
          setSelectedJobForCosts(null);
        }}
        jobId={selectedJobForCosts?.id || ''}
        jobTitle={selectedJobForCosts?.title}
        onItemsUpdated={() => {
          fetchJobs();
        }}
      />
    </div>
  );
};

export default FinancialManagement;