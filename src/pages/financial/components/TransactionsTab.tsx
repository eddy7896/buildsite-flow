/**
 * Transactions Tab Component
 * Displays financial transactions from journal entries
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getTransactionColor, getCategoryColor } from '../utils/financialFormatters';
import { formatCurrencySymbol } from '../utils/financialFormatters';
import { selectRecords, selectOne } from '@/services/api/postgresql-service';
import { logError } from '@/utils/consoleLogger';

interface TransactionsTabProps {
  transactions: any[];
  loading: boolean;
  searchTerm: string;
  dateRange: { start: string; end: string };
  pageSize: number;
  ledgerSummary: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netProfit: number;
  };
  onTransactionClick: (transaction: any) => void;
}

const getTransactionIcon = (type: string) => {
  return type === 'credit' ? (
    <ArrowUpRight className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowDownRight className="h-4 w-4 text-red-600" />
  );
};

export const TransactionsTab = ({
  transactions,
  loading,
  searchTerm,
  dateRange,
  pageSize,
  ledgerSummary,
  onTransactionClick,
}: TransactionsTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateRange = (!dateRange.start || new Date(transaction.date) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(transaction.date) <= new Date(dateRange.end));
      return matchesSearch && matchesDateRange;
    });
  }, [transactions, searchTerm, dateRange]);

  const displayedTransactions = useMemo(() => {
    if (activeSubTab === 'credits') {
      return filteredTransactions.filter(t => t.type === 'credit');
    } else if (activeSubTab === 'debits') {
      return filteredTransactions.filter(t => t.type === 'debit');
    }
    return filteredTransactions;
  }, [filteredTransactions, activeSubTab]);

  const paginatedTransactions = useMemo(() => {
    return displayedTransactions.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [displayedTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(displayedTransactions.length / pageSize);

  const handleTransactionClick = async (transaction: any) => {
    try {
      const entry = await selectOne('journal_entries', { entry_number: transaction.entry_number });
      if (entry) {
        const lines = await selectRecords('journal_entry_lines', {
          where: { journal_entry_id: entry.id },
          orderBy: 'line_number ASC',
        });
        onTransactionClick({ ...entry, lines: lines || [] });
      }
    } catch (error) {
      logError('Error fetching transaction details:', error);
    }
  };

  return (
    <Tabs defaultValue="all" className="w-full" value={activeSubTab} onValueChange={setActiveSubTab}>
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
                    onClick={() => handleTransactionClick(transaction)}
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
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrencySymbol(transaction.amount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, displayedTransactions.length)} of {displayedTransactions.length} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">Page {currentPage} of {totalPages}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
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
              {displayedTransactions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No credit transactions found</p>
                    <p>Credit transactions will appear here once journal entries are posted.</p>
                  </CardContent>
                </Card>
              ) : (
                paginatedTransactions.map((transaction) => (
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
                        +{formatCurrencySymbol(transaction.amount || 0)}
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
              {displayedTransactions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <ArrowDownRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No debit transactions found</p>
                    <p>Debit transactions will appear here once journal entries are posted.</p>
                  </CardContent>
                </Card>
              ) : (
                paginatedTransactions.map((transaction) => (
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
                        -{formatCurrencySymbol(transaction.amount || 0)}
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
                <p className="text-3xl font-bold text-green-600">{formatCurrencySymbol(ledgerSummary.monthlyIncome)}</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Expenses</h3>
                <p className="text-3xl font-bold text-red-600">{formatCurrencySymbol(ledgerSummary.monthlyExpenses)}</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Net Income</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrencySymbol(ledgerSummary.netProfit)}</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

