import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

const Ledger = () => {
  // Mock data - replace with actual API calls
  const ledgerSummary = {
    totalBalance: 125000,
    monthlyIncome: 45000,
    monthlyExpenses: 28000,
    netProfit: 17000
  };

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
    {
      id: "TXN-003",
      date: "2024-01-23",
      description: "Software License Renewal",
      category: "Operating Expenses",
      type: "debit",
      amount: 1200,
      balance: 113500,
      reference: "RCP-002"
    },
    {
      id: "TXN-004",
      date: "2024-01-22",
      description: "Client Payment - XYZ Ltd",
      category: "Revenue",
      type: "credit",
      amount: 8500,
      balance: 114700,
      reference: "INV-002"
    },
    {
      id: "TXN-005",
      date: "2024-01-20",
      description: "Employee Salaries",
      category: "Payroll",
      type: "debit",
      amount: 25000,
      balance: 106200,
      reference: "PAY-JAN"
    },
  ];

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
              <Input placeholder="Search transactions..." className="pl-10" />
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
                {transactions.map((transaction) => (
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
                {transactions.filter(t => t.type === 'credit').map((transaction) => (
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
                        {new Date(transaction.date).toLocaleDateString()}
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
                {transactions.filter(t => t.type === 'debit').map((transaction) => (
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
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
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
                    <p className="text-3xl font-bold text-green-600">₹23,500</p>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Expenses</h3>
                    <p className="text-3xl font-bold text-red-600">₹29,700</p>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Net Income</h3>
                    <p className="text-3xl font-bold text-blue-600">₹17,000</p>
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