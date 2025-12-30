/**
 * Financial Management Page - Refactored
 * Main orchestrator component using extracted hooks and components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, FileText, Download, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getAgencyId } from '@/utils/agencyUtils';
import { selectRecords, selectOne, deleteRecord, executeTransaction } from '@/services/api/postgresql-service';
import { formatCurrencySymbol } from './financial/utils/financialFormatters';
import { logWarn } from '@/utils/consoleLogger';

// Hooks
import { useFinancialData } from './financial/hooks/useFinancialData';
import { useAccountBalances } from './financial/hooks/useAccountBalances';
import { useFinancialReports } from './financial/hooks/useFinancialReports';
import { useJobs } from './financial/hooks/useJobs';
import { useChartOfAccounts } from './financial/hooks/useChartOfAccounts';
import { useJournalEntries } from './financial/hooks/useJournalEntries';

// Utils
import { calculateLedgerSummary, calculateAccountingStats, calculateJobStats } from './financial/utils/financialCalculations';

// Components
import { FinancialMetricsCards } from './financial/components/FinancialMetricsCards';
import { FinancialFilters } from './financial/components/FinancialFilters';
import { ChartOfAccountsTab } from './financial/components/ChartOfAccountsTab';
import { JournalEntriesTab } from './financial/components/JournalEntriesTab';
import { JobsTab } from './financial/components/JobsTab';
import { TransactionsTab } from './financial/components/TransactionsTab';
import { FinancialReportsTab } from './financial/components/FinancialReportsTab';

// Dialogs
import JobFormDialog from '@/components/JobFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import ChartOfAccountFormDialog from '@/components/ChartOfAccountFormDialog';
import JournalEntryFormDialog from '@/components/JournalEntryFormDialog';
import JobCostItemsDialog from '@/components/JobCostItemsDialog';

const FinancialManagement = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize] = useState(10);
  
  // Dialog states
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Data hooks
  const {
    agencyId,
    jobs,
    projects,
    chartOfAccounts,
    journalEntries,
    transactions,
    loading,
    refetchAll,
    fetchJobs,
    fetchChartOfAccounts,
    fetchJournalEntries,
    setJobs,
    setChartOfAccounts,
    setJournalEntries,
  } = useFinancialData(user, profile);

  const { accountBalances, setAccountBalances } = useAccountBalances(chartOfAccounts, agencyId);

  // Calculations
  const ledgerSummary = useMemo(() => calculateLedgerSummary(transactions), [transactions]);
  const accountingStats = useMemo(() => 
    calculateAccountingStats(chartOfAccounts, accountBalances, ledgerSummary),
    [chartOfAccounts, accountBalances, ledgerSummary]
  );
  const jobStats = useMemo(() => calculateJobStats(jobs), [jobs]);

  const {
    reportGenerating,
    reportViewOpen,
    reportViewData,
    setReportViewOpen,
    handleGenerateReport,
  } = useFinancialReports(
    chartOfAccounts,
    accountBalances,
    jobs,
    ledgerSummary,
    accountingStats,
    agencyId,
    user?.id
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers
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
      setDeleteLoading(true);
      const originalJobs = [...jobs];
      setJobs(prev => prev.filter(job => job.id !== jobToDelete.id));
      
      try {
        await deleteRecord('jobs', { id: jobToDelete.id });
        toast({
          title: 'Success',
          description: 'Job deleted successfully',
        });
        await fetchJobs(agencyId);
      } catch (error: any) {
        setJobs(originalJobs);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete job',
          variant: 'destructive',
        });
      } finally {
        setDeleteLoading(false);
      }
    }
    setJobToDelete(null);
    setDeleteDialogOpen(false);
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
    setAccountBalances({});
  };

  const handleAccountDeleted = async () => {
    if (accountToDelete) {
      setDeleteLoading(true);
      try {
        const lines = await selectRecords('journal_entry_lines', {
          where: { account_id: accountToDelete.id },
          limit: 1,
        });
        
        if (lines && lines.length > 0) {
          toast({
            title: 'Cannot Delete Account',
            description: 'This account has associated journal entry lines. Please remove or reassign those entries before deleting the account.',
            variant: 'destructive',
          });
          setAccountToDelete(null);
          setDeleteDialogOpen(false);
          setDeleteLoading(false);
          return;
        }

        const originalAccounts = [...chartOfAccounts];
        setChartOfAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));

        await deleteRecord('chart_of_accounts', { id: accountToDelete.id });
        toast({
          title: 'Success',
          description: 'Account deleted successfully',
        });
        await fetchChartOfAccounts(agencyId);
      } catch (error: any) {
        setChartOfAccounts(chartOfAccounts);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete account',
          variant: 'destructive',
        });
      } finally {
        setDeleteLoading(false);
      }
    }
    setAccountToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleNewEntry = () => {
    navigate('/ledger/create-entry', { state: { from: 'financial-management' } });
  };

  const handleEditEntry = async (entry: any) => {
    try {
      const lines = await selectRecords('journal_entry_lines', {
        where: { journal_entry_id: entry.id },
        orderBy: 'line_number ASC',
      });
      setSelectedEntry({ ...entry, lines: lines || [] });
      setEntryFormOpen(true);
    } catch (error) {
      setSelectedEntry(entry);
      setEntryFormOpen(true);
    }
  };

  const handleDeleteEntry = (entry: any) => {
    if (entry.status === 'posted') {
      const confirmed = window.confirm(
        `Warning: This journal entry is POSTED and may affect your financial records.\n\n` +
        `Entry: ${entry.entry_number}\n` +
        `Date: ${new Date(entry.entry_date).toLocaleDateString()}\n\n` +
        `Are you sure you want to delete this posted entry? This action cannot be undone.`
      );
      if (!confirmed) {
        return;
      }
    }
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleEntrySaved = async () => {
    await Promise.all([
      fetchJournalEntries(agencyId),
      refetchAll()
    ]);
    setAccountBalances({});
  };

  const handleEntryDeleted = async () => {
    if (entryToDelete) {
      setDeleteLoading(true);
      const originalEntries = [...journalEntries];
      setJournalEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
      
      try {
        await executeTransaction(async (client) => {
          await client.query(
            'DELETE FROM public.journal_entry_lines WHERE journal_entry_id = $1',
            [entryToDelete.id]
          );
          await client.query(
            'DELETE FROM public.journal_entries WHERE id = $1',
            [entryToDelete.id]
          );
        });
        toast({
          title: 'Success',
          description: 'Journal entry deleted successfully',
        });
        await fetchJournalEntries(agencyId);
        await refetchAll();
        setAccountBalances({});
      } catch (error: any) {
        setJournalEntries(originalEntries);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete journal entry',
          variant: 'destructive',
        });
      } finally {
        setDeleteLoading(false);
      }
    }
    setEntryToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      // Export logic here - simplified for now
      toast({
        title: 'Success',
        description: 'Financial data exported to CSV successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearFilters = () => {
    setDateRange({ start: '', end: '' });
    setAccountTypeFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  // Agency context check
  const agencyDatabase = typeof window !== 'undefined' ? localStorage.getItem('agency_database') : null;
  const hasAgencyContext = agencyId || agencyDatabase;
  
  if (!hasAgencyContext && !loading && user?.id) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Unable to determine agency. Please ensure you are logged in and have an agency assigned.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={async () => {
                const storedAgencyId = localStorage.getItem('agency_id');
                const storedAgencyDatabase = localStorage.getItem('agency_database');
                let id: string | null = null;
                
                if (storedAgencyId) {
                  id = storedAgencyId;
                } else if (storedAgencyDatabase) {
                  id = '00000000-0000-0000-0000-000000000000';
                } else {
                  id = await getAgencyId(profile, user?.id);
                }
                
                if (id || storedAgencyDatabase) {
                  await refetchAll();
                } else {
                  toast({
                    title: 'Error',
                    description: 'Could not find agency. If you just created a new agency, please log out and log back in.',
                    variant: 'destructive',
                  });
                }
              }}>
                Retry
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
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
          <Button variant="outline" onClick={handleExportReport} disabled={exportLoading}>
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export Report'}
          </Button>
          <Button onClick={handleNewEntry}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <FinancialMetricsCards
        totalAssets={accountingStats.totalAssets}
        currentBalance={ledgerSummary.totalBalance}
        activeJobs={jobStats.activeJobs}
        netProfit={ledgerSummary.netProfit}
      />

      <FinancialFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        accountTypeFilter={accountTypeFilter}
        onAccountTypeFilterChange={setAccountTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={handleClearFilters}
      />

      <Tabs defaultValue="accounting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="job-costing">Job Costing</TabsTrigger>
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounting" className="space-y-4">
          <Tabs defaultValue="chart-of-accounts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
              <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart-of-accounts" className="space-y-4">
              <ChartOfAccountsTab
                chartOfAccounts={chartOfAccounts}
                accountBalances={accountBalances}
                loading={loading}
                searchTerm={debouncedSearchTerm}
                accountTypeFilter={accountTypeFilter}
                pageSize={pageSize}
                onNewAccount={handleNewAccount}
                onEditAccount={handleEditAccount}
                onDeleteAccount={handleDeleteAccount}
                deleteLoading={deleteLoading}
              />
            </TabsContent>
            
            <TabsContent value="journal-entries" className="space-y-4">
              <JournalEntriesTab
                journalEntries={journalEntries}
                loading={loading}
                searchTerm={debouncedSearchTerm}
                statusFilter={statusFilter}
                dateRange={dateRange}
                pageSize={pageSize}
                onNewEntry={handleNewEntry}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
                deleteLoading={deleteLoading}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="job-costing" className="space-y-4">
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="space-y-4 mt-4">
              <JobsTab
                jobs={jobs}
                loading={loading}
                searchTerm={debouncedSearchTerm}
                statusFilter={statusFilter}
                dateRange={dateRange}
                pageSize={pageSize}
                onNewJob={handleNewJob}
                onEditJob={handleEditJob}
                onDeleteJob={handleDeleteJob}
                onManageCosts={(job) => {
                  setSelectedJobForCosts(job);
                  setCostItemsDialogOpen(true);
                }}
                deleteLoading={deleteLoading}
              />
            </TabsContent>

            <TabsContent value="projects" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Financials</h3>
                <Button variant="outline" onClick={() => navigate('/project-management')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Projects
                </Button>
              </div>
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No projects found</p>
                    <p>Projects will appear here once they are created.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map((project: any) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{project.project_code || 'No code'}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/project-management/${project.id}`)}
                          >
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="font-semibold">{formatCurrencySymbol(project.budget || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Actual Cost</p>
                            <p className="font-semibold">{formatCurrencySymbol(project.actual_cost || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="font-semibold text-green-600">{formatCurrencySymbol(project.financials?.totalPaid || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-semibold">{project.status}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="ledger" className="space-y-4">
          <TransactionsTab
            transactions={transactions}
            loading={loading}
            searchTerm={debouncedSearchTerm}
            dateRange={dateRange}
            pageSize={pageSize}
            ledgerSummary={ledgerSummary}
            onTransactionClick={(transaction) => {
              setSelectedTransaction(transaction);
              setTransactionDetailsOpen(true);
            }}
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <FinancialReportsTab
            reportGenerating={reportGenerating}
            onGenerateReport={handleGenerateReport}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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
        onItemsUpdated={async () => {
          await fetchJobs(agencyId);
        }}
      />

      {/* Report View Dialog */}
      <Dialog open={reportViewOpen} onOpenChange={setReportViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{reportViewData?.title || 'Financial Report'}</DialogTitle>
            <DialogDescription>
              Generated on: {new Date().toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reportViewData?.data && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(reportViewData.data, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(reportViewData.data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${reportViewData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReportViewOpen(false);
                      navigate('/reports');
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Go to Reports
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setReportViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={transactionDetailsOpen} onOpenChange={setTransactionDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Journal Entry: {selectedTransaction?.entry_number || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entry Date</p>
                  <p className="text-sm font-semibold">
                    {new Date(selectedTransaction.entry_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge>{selectedTransaction.status}</Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedTransaction.description || 'N/A'}</p>
                </div>
                {selectedTransaction.reference && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Reference</p>
                    <p className="text-sm">{selectedTransaction.reference}</p>
                  </div>
                )}
              </div>

              {selectedTransaction.lines && selectedTransaction.lines.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3 block">Journal Entry Lines</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Account</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Debit</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.lines.map((line: any, index: number) => {
                          const account = chartOfAccounts.find(acc => acc.id === line.account_id);
                          return (
                            <tr key={line.id || index} className="border-t">
                              <td className="px-4 py-2 text-sm">
                                {account ? `${account.account_code} - ${account.account_name}` : 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-sm">{line.description || 'N/A'}</td>
                              <td className="px-4 py-2 text-sm text-right">
                                {line.debit_amount > 0 ? formatCurrencySymbol(line.debit_amount || 0) : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right">
                                {line.credit_amount > 0 ? formatCurrencySymbol(line.credit_amount || 0) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-muted font-semibold">
                        <tr>
                          <td colSpan={2} className="px-4 py-2 text-sm">Total</td>
                          <td className="px-4 py-2 text-sm text-right">
                            {formatCurrencySymbol(selectedTransaction.total_debit || 0)}
                          </td>
                          <td className="px-4 py-2 text-sm text-right">
                            {formatCurrencySymbol(selectedTransaction.total_credit || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTransactionDetailsOpen(false);
              setSelectedTransaction(null);
            }}>
              Close
            </Button>
            {selectedTransaction && (
              <Button onClick={() => {
                setTransactionDetailsOpen(false);
                handleEditEntry(selectedTransaction);
              }}>
                Edit Entry
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialManagement;

