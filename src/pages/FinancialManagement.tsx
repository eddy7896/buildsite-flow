import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calculator, FileText, BookOpen, TrendingUp, Briefcase, Clock, DollarSign, Target, Edit, Trash2, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import JobFormDialog from '@/components/JobFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

const FinancialManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data for accounting and ledger
  const accountingStats = {
    totalAssets: 5500000,
    totalLiabilities: 2100000,
    totalEquity: 3400000,
    monthlyRevenue: 850000,
  };

  const ledgerSummary = {
    totalBalance: 125000,
    monthlyIncome: 45000,
    monthlyExpenses: 28000,
    netProfit: 17000
  };

  const jobStats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => job.status === 'in_progress').length,
    totalBudget: jobs.reduce((sum, job) => sum + (job.budget || 0), 0),
    actualCosts: jobs.reduce((sum, job) => sum + (job.actual_cost || 0), 0),
  };

  const chartOfAccounts = [
    {
      id: '1',
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'asset',
      balance: 250000,
      isActive: true,
    },
    {
      id: '2',
      accountCode: '1100',
      accountName: 'Accounts Receivable',
      accountType: 'asset',
      balance: 320000,
      isActive: true,
    },
    {
      id: '3',
      accountCode: '1200',
      accountName: 'Inventory',
      accountType: 'asset',
      balance: 180000,
      isActive: true,
    },
    {
      id: '4',
      accountCode: '2000',
      accountName: 'Accounts Payable',
      accountType: 'liability',
      balance: 150000,
      isActive: true,
    },
    {
      id: '5',
      accountCode: '4000',
      accountName: 'Revenue',
      accountType: 'revenue',
      balance: 850000,
      isActive: true,
    },
  ];

  const journalEntries = [
    {
      id: '1',
      entryNumber: 'JE-2024-001',
      entryDate: '2024-01-22',
      description: 'Sales Revenue - January',
      reference: 'INV-001-005',
      totalDebit: 85000,
      totalCredit: 85000,
      status: 'posted',
    },
    {
      id: '2',
      entryNumber: 'JE-2024-002',
      entryDate: '2024-01-23',
      description: 'Equipment Purchase',
      reference: 'PO-2024-012',
      totalDebit: 45000,
      totalCredit: 45000,
      status: 'posted',
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      date: "2024-01-25",
      description: "Invoice Payment - ABC Corporation",
      category: "Revenue",
      type: "credit",
      amount: 15000,
      balance: 125000,
      reference: "INV-001"
    },
    {
      id: "TXN-002",
      date: "2024-01-24",
      description: "Office Rent Payment",
      category: "Operating Expenses",
      type: "debit",
      amount: 3500,
      balance: 110000,
      reference: "RENT-JAN"
    },
  ];

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

  const handleJobDeleted = () => {
    fetchJobs();
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
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEntries = journalEntries.filter(entry => 
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Complete financial oversight: accounting, job costing, and general ledger</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
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
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Account
                </Button>
              </div>
              
              <div className="grid gap-4">
                {filteredAccounts.map((account) => (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{account.accountCode} - {account.accountName}</h4>
                            <Badge className={getAccountTypeColor(account.accountType)}>
                              {account.accountType}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{account.balance.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="journal-entries" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Journal Entries</h3>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </div>
              
              <div className="grid gap-4">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{entry.entryNumber}</CardTitle>
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
                          <p className="font-medium">{new Date(entry.entryDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reference</p>
                          <p className="font-medium">{entry.reference}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Debit</p>
                          <p className="font-semibold">₹{entry.totalDebit.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Credit</p>
                          <p className="font-semibold">₹{entry.totalCredit.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            <div className="text-center py-8">Loading jobs...</div>
          ) : (
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No jobs found. Create your first job to get started.
                </div>
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
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{transaction.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{transaction.id}</span>
                              <span>•</span>
                              <span>Ref: {transaction.reference}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category)}`}>
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: ₹{transaction.balance.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
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
                    {filteredTransactions.filter(t => t.type === 'credit').map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{transaction.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{transaction.id}</span>
                              <span>•</span>
                              <span>Ref: {transaction.reference}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category)}`}>
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            +₹{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: ₹{transaction.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
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
                    {filteredTransactions.filter(t => t.type === 'debit').map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{transaction.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{transaction.id}</span>
                              <span>•</span>
                              <span>Ref: {transaction.reference}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category)}`}>
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-red-600">
                            -₹{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: ₹{transaction.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
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
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Balance Sheet</h3>
                    <p className="text-sm text-muted-foreground">Assets, liabilities, and equity statement</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Profit & Loss</h3>
                    <p className="text-sm text-muted-foreground">Income and expenses statement</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Trial Balance</h3>
                    <p className="text-sm text-muted-foreground">List of all account balances</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Calculator className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Job Profitability</h3>
                    <p className="text-sm text-muted-foreground">Job cost analysis and margins</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Cash Flow</h3>
                    <p className="text-sm text-muted-foreground">Cash receipts and payments</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={handleJobDeleted}
        itemType="Job"
        itemName={jobToDelete?.title || ''}
        itemId={jobToDelete?.id || ''}
        tableName="jobs"
      />
    </div>
  );
};

export default FinancialManagement;