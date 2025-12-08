import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  reference: string;
}

interface LedgerSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
}

const Ledger = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netProfit: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      
      // Fetch journal entries with their lines
      const { data: entries, error: entriesError } = await db
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(100);

      if (entriesError) {
        console.error('Error fetching journal entries:', entriesError);
        throw entriesError;
      }

      // Fetch journal entry lines to get account details
      const entryIds = entries?.map((e: any) => e.id) || [];
      let lines: any[] = [];
      
      if (entryIds.length > 0) {
        const { data: linesData, error: linesError } = await db
          .from('journal_entry_lines')
          .select('*')
          .in('journal_entry_id', entryIds);

        if (linesError) {
          console.error('Error fetching journal entry lines:', linesError);
          throw linesError;
        }
        lines = linesData || [];
      }

      // Fetch chart of accounts for category mapping
      const { data: accounts, error: accountsError } = await db
        .from('chart_of_accounts')
        .select('id, account_name, account_type');

      if (accountsError) {
        console.error('Error fetching chart of accounts:', accountsError);
        throw accountsError;
      }

      const accountMap = new Map((accounts || []).map((acc: any) => [acc.id, acc]));

      // Transform journal entries to transactions
      const transformedTransactions: Transaction[] = [];
      let runningBalance = 0;

      (entries || []).forEach((entry: any) => {
        if (!entry || !entry.id) return;
        
        const entryLines = lines.filter((l: any) => l && l.journal_entry_id === entry.id);
        
        entryLines.forEach((line: any) => {
          if (!line || !line.id) return;
          
          const account = line.account_id ? accountMap.get(line.account_id) : null;
          const isCredit = (line.credit_amount || 0) > 0;
          const amount = isCredit ? (line.credit_amount || 0) : (line.debit_amount || 0);
          
          if (amount > 0) {
            runningBalance += isCredit ? amount : -amount;
            
            // Determine category from account type
            let category = 'Other';
            if (account?.account_type) {
              const accountType = String(account.account_type).toLowerCase();
              if (accountType.includes('revenue') || accountType.includes('income')) {
                category = 'Revenue';
              } else if (accountType.includes('expense')) {
                category = 'Operating Expenses';
              } else if (accountType.includes('payroll') || accountType.includes('salary')) {
                category = 'Payroll';
              }
            }

            const entryDate = entry.entry_date || entry.created_at || new Date().toISOString();
            const description = line.description || entry.description || 'Transaction';
            const reference = entry.reference || entry.entry_number || `JE-${String(entry.id).substring(0, 8)}`;

            transformedTransactions.push({
              id: String(line.id),
              date: entryDate,
              description: description,
              category,
              type: isCredit ? 'credit' : 'debit',
              amount,
              balance: runningBalance,
              reference: reference
            });
          }
        });
      });

      // Sort by date descending
      transformedTransactions.sort((a, b) => {
        try {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        } catch {
          return 0;
        }
      });

      setTransactions(transformedTransactions);

      // Calculate summary for current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyTransactions = transformedTransactions.filter(t => {
        try {
          const tDate = new Date(t.date);
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        } catch {
          return false;
        }
      });

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setLedgerSummary({
        totalBalance: runningBalance || 0,
        monthlyIncome: monthlyIncome || 0,
        monthlyExpenses: monthlyExpenses || 0,
        netProfit: (monthlyIncome || 0) - (monthlyExpenses || 0)
      });

    } catch (error: any) {
      console.error('Error fetching ledger data:', error);
      toast({
        title: "Error",
        description: "Failed to load ledger data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (transaction.description || '').toLowerCase().includes(searchLower) ||
      (transaction.reference || '').toLowerCase().includes(searchLower) ||
      (transaction.category || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading ledger data...</span>
        </div>
      </div>
    );
  }


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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-muted-foreground">Track all financial transactions and account balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Ledger
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">₹{ledgerSummary.totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">₹{ledgerSummary.monthlyIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{ledgerSummary.monthlyExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-purple-600">₹{ledgerSummary.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
                    </p>
                  </div>
                ) : (
                  filteredTransactions
                    .filter(transaction => transaction != null)
                    .map((transaction) => (
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
                            {(() => {
                              try {
                                return new Date(transaction.date).toLocaleDateString();
                              } catch {
                                return 'Invalid Date';
                              }
                            })()}
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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No credit transactions found.</p>
                  </div>
                ) : (
                  filteredTransactions
                    .filter(t => t != null && t.type === 'credit')
                    .map((transaction) => (
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
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              try {
                                return new Date(transaction.date).toLocaleDateString();
                              } catch {
                                return 'Invalid Date';
                              }
                            })()}
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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No debit transactions found.</p>
                  </div>
                ) : (
                  filteredTransactions
                    .filter(t => t != null && t.type === 'debit')
                    .map((transaction) => (
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
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              try {
                                return new Date(transaction.date).toLocaleDateString();
                              } catch {
                                return 'Invalid Date';
                              }
                            })()}
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
          <div className="grid gap-6">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Ledger;