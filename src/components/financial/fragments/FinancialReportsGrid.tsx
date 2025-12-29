import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, FileText, Calculator, DollarSign, Calendar } from 'lucide-react';

interface FinancialReportsGridProps {
  reportGenerating: string | null;
  onGenerateReport: (reportType: string) => void;
}

const reportTypes = [
  {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity statement',
    icon: BookOpen,
    color: 'text-blue-600'
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss',
    description: 'Income and expenses statement',
    icon: TrendingUp,
    color: 'text-green-600'
  },
  {
    id: 'trial-balance',
    title: 'Trial Balance',
    description: 'List of all account balances',
    icon: FileText,
    color: 'text-purple-600'
  },
  {
    id: 'job-profitability',
    title: 'Job Profitability',
    description: 'Job cost analysis and margins',
    icon: Calculator,
    color: 'text-orange-600'
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    description: 'Cash receipts and payments',
    icon: DollarSign,
    color: 'text-indigo-600'
  },
  {
    id: 'monthly-summary',
    title: 'Monthly Summary',
    description: 'Monthly financial overview',
    icon: Calendar,
    color: 'text-pink-600'
  }
];

export function FinancialReportsGrid({ reportGenerating, onGenerateReport }: FinancialReportsGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
        <p className="text-muted-foreground">Generate and view comprehensive financial statements</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isGenerating = reportGenerating === report.id;
            
            return (
              <Card 
                key={report.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => onGenerateReport(report.id)}
              >
                <CardContent className="p-6 text-center">
                  <Icon className={`h-12 w-12 ${report.color} mx-auto mb-4`} />
                  <h3 className="font-semibold mb-2">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isGenerating ? 'Generating...' : report.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
