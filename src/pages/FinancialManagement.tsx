import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calculator, FileText, BookOpen, TrendingUp, Briefcase, Clock, DollarSign, Target, Edit, Trash2, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { selectRecords, selectOne, rawQuery } from '@/services/api/postgresql-service';
import { useAuth } from '@/hooks/useAuth';
import JobFormDialog from '@/components/JobFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import ChartOfAccountFormDialog from '@/components/ChartOfAccountFormDialog';
import JournalEntryFormDialog from '@/components/JournalEntryFormDialog';

const FinancialManagement = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (profile?.agency_id) {
      fetchAllData();
    }
  }, [profile?.agency_id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobs(),
        fetchChartOfAccounts(),
        fetchJournalEntries(),
        fetchTransactions(),
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

  const fetchJobs = async () => {
    try {
      if (!profile?.agency_id) {
        setJobs([]);
        return;
      }
      const jobsData = await selectRecords('jobs', {
        where: { agency_id: profile.agency_id },
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
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      if (!profile?.agency_id) {
        setChartOfAccounts([]);
        return;
      }
      const accounts = await selectRecords('chart_of_accounts', {
        where: { agency_id: profile.agency_id },
        orderBy: 'account_code ASC',
      });
      setChartOfAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch chart of accounts',
        variant: 'destructive',
      });
      setChartOfAccounts([]);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      if (!profile?.agency_id) {
        setJournalEntries([]);
        return;
      }
      const entries = await selectRecords('journal_entries', {
        where: { agency_id: profile.agency_id },
        orderBy: 'entry_date DESC, created_at DESC',
      });
      setJournalEntries(entries || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch journal entries',
        variant: 'destructive',
      });
      setJournalEntries([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      if (!profile?.agency_id) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      // Fetch transactions from journal entries with lines - using parameterized query
      const query = `
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
      const txnData = await rawQuery(query, [profile.agency_id]);
      setTransactions(txnData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate account balances from journal entries
  const [accountBalances, setAccountBalances] = React.useState<Record<string, number>>({});

  // Fetch and calculate account balances
  React.useEffect(() => {
    const calculateAccountBalances = async () => {
      try {
        if (!profile?.agency_id || chartOfAccounts.length === 0) {
          setAccountBalances({});
          return;
        }
        // Use parameterized query with agency_id filter
        const query = `
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
          WHERE coa.agency_id = $1
          GROUP BY coa.id, coa.account_type
        `;
        const balancesData = await rawQuery(query, [profile.agency_id]);
        
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
      }
    };

    if (chartOfAccounts.length > 0 && profile?.agency_id) {
      calculateAccountBalances();
    }
  }, [chartOfAccounts, journalEntries, profile?.agency_id]);

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

  const handleJobSaved = () => {
    fetchJobs();
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

  const handleExportReport = () => {
    toast({
      title: 'Export Report',
      description: 'Report export functionality will be implemented soon',
    });
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

  const handleAccountSaved = () => {
    fetchChartOfAccounts();
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

  const handleEntrySaved = () => {
    fetchJournalEntries();
    fetchTransactions();
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

  const filteredAccounts = chartOfAccounts.filter(account => 
    (account.account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.account_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEntries = journalEntries.filter(entry => 
    (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => 
    (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading or error state if no agency
  if (!profile?.agency_id && !loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please ensure you are logged in and have an agency assigned.</p>
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
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
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
              
              {loading ? (
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
                    filteredAccounts.map((account) => (
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
                    ))
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
              
              {loading ? (
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
                    filteredEntries.map((entry) => (
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
          
          {loading ? (
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
                filteredJobs.map((job) => (
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
                        <Button variant="outline" size="sm">Add Costs</Button>
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
                      filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
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
    </div>
  );
};

export default FinancialManagement;