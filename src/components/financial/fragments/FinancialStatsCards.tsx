import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, DollarSign, Briefcase, Target } from 'lucide-react';
import { AccountingStats, JobStats, LedgerSummary } from './types';

interface FinancialStatsCardsProps {
  accountingStats: AccountingStats;
  jobStats: JobStats;
  ledgerSummary: LedgerSummary;
}

export function FinancialStatsCards({ accountingStats, jobStats, ledgerSummary }: FinancialStatsCardsProps) {
  return (
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
  );
}
