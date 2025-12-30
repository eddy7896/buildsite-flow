/**
 * Hook for financial report generation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logWarn } from '@/utils/consoleLogger';

export const useFinancialReports = (
  chartOfAccounts: any[],
  accountBalances: Record<string, number>,
  jobs: any[],
  ledgerSummary: any,
  accountingStats: any,
  agencyId: string | null,
  userId: string | undefined
) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reportGenerating, setReportGenerating] = useState<string | null>(null);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [reportViewData, setReportViewData] = useState<{ title: string; data: any } | null>(null);

  const handleGenerateReport = async (reportType: string) => {
    setReportGenerating(reportType);
    try {
      let reportData: any = {};
      let reportTitle = '';

      switch (reportType) {
        case 'balance-sheet':
          reportTitle = 'Balance Sheet';
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

      try {
        const { ReportService } = await import('@/services/api/reports');
        
        const validReportType: 'attendance' | 'payroll' | 'leave' | 'employee' | 'project' | 'financial' | 'gst' | 'custom' = 'financial';
        
        const reportDataWithType = {
          ...reportData,
          _reportType: reportType,
          _generatedAt: new Date().toISOString(),
          _agencyId: agencyId,
        };
        
        const response = await ReportService.createReport({
          name: reportTitle,
          description: `Generated ${reportType} report from Financial Management`,
          report_type: validReportType,
          parameters: reportDataWithType,
          generated_by: userId,
          is_public: false,
          agency_id: agencyId || undefined,
        }, { showLoading: true, showErrorToast: true });
        
        if (response.success) {
          toast({
            title: 'Report Generated',
            description: `${reportTitle} has been saved. Redirecting to Reports page...`,
          });
          
          setTimeout(() => {
            navigate('/reports');
          }, 1500);
        } else {
          throw new Error(response.error || 'Failed to save report');
        }
      } catch (error: any) {
        logWarn('Could not save report to database:', error);
        
        setReportViewData({ title: reportTitle, data: reportData });
        setReportViewOpen(true);

        toast({
          title: 'Report Generated',
          description: `${reportTitle} has been generated. View it below or navigate to Reports page.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setReportGenerating(null);
    }
  };

  return {
    reportGenerating,
    reportViewOpen,
    reportViewData,
    setReportViewOpen,
    handleGenerateReport,
  };
};

