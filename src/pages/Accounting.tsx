import React, { useState } from 'react';
import { Plus, Search, Filter, Calculator, FileText, BookOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Accounting = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const accountingStats = {
    totalAssets: 5500000,
    totalLiabilities: 2100000,
    totalEquity: 3400000,
    monthlyRevenue: 850000,
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
    {
      id: '3',
      entryNumber: 'JE-2024-003',
      entryDate: '2024-01-24',
      description: 'Office Rent Payment',
      reference: 'RENT-JAN-2024',
      totalDebit: 25000,
      totalCredit: 25000,
      status: 'draft',
    },
  ];

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Accounting</h1>
          <p className="text-muted-foreground">Manage chart of accounts and journal entries</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Journal Entry
        </Button>
      </div>

      {/* Stats Cards */}
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
              <Calculator className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Liabilities</p>
                <p className="text-2xl font-bold">₹{accountingStats.totalLiabilities.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                <p className="text-2xl font-bold">₹{accountingStats.totalEquity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">₹{accountingStats.monthlyRevenue.toLocaleString()}</p>
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
            placeholder="Search accounts or journal entries..."
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

      {/* Accounting Content */}
      <Tabs defaultValue="chart-of-accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
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
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    {entry.status === 'draft' && (
                      <Button size="sm">Post Entry</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <p className="text-muted-foreground">Generate and view financial statements</p>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;