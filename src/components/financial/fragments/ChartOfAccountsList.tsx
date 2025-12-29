import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { getAccountTypeColor } from './types';

interface ChartOfAccountsListProps {
  accounts: any[];
  accountBalances: Record<string, number>;
  loading: boolean;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  deleteLoading: boolean;
  onNewAccount: () => void;
  onEditAccount: (account: any) => void;
  onDeleteAccount: (account: any) => void;
  onPageChange: (page: number) => void;
}

export function ChartOfAccountsList({
  accounts,
  accountBalances,
  loading,
  pageSize,
  currentPage,
  totalPages,
  totalItems,
  deleteLoading,
  onNewAccount,
  onEditAccount,
  onDeleteAccount,
  onPageChange
}: ChartOfAccountsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Chart of Accounts</h3>
        <Button variant="outline" onClick={onNewAccount}>
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
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No accounts found</p>
                <p>Create your first account to get started with financial management.</p>
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => {
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
                        <Button variant="outline" size="sm" onClick={() => onEditAccount(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onDeleteAccount(account)}
                          disabled={deleteLoading}
                        >
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} accounts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">Page {currentPage} of {totalPages}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
