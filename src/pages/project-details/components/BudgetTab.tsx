/**
 * Budget Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Project } from '@/services/api/project-service';
import { formatDate, formatCurrency } from '../utils/projectDetailsUtils';

interface BudgetTabProps {
  project: Project;
  revenue: number;
  invoices: any[];
  onNavigate: (path: string) => void;
}

export const BudgetTab = ({ project, revenue, invoices, onNavigate }: BudgetTabProps) => {
  const budgetUtilization = project.budget && project.actual_cost
    ? Math.min((project.actual_cost / project.budget) * 100, 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(project.budget, project.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allocated Budget</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(project.allocated_budget, project.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual Cost</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(project.actual_cost, project.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(revenue, project.currency)}</p>
            </div>
            {project.cost_center && (
              <div>
                <p className="text-sm text-muted-foreground">Cost Center</p>
                <p className="mt-1">{project.cost_center}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {project.budget && project.actual_cost ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Budget Utilization</span>
                    <span>{budgetUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetUtilization} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Budget</p>
                  <p className={`text-2xl font-bold mt-1 ${(project.budget - project.actual_cost) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(project.budget - project.actual_cost, project.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <div className="flex items-center gap-2 mt-1">
                    {revenue - (project.actual_cost || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <p className={`text-2xl font-bold ${(revenue - (project.actual_cost || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(revenue - (project.actual_cost || 0), project.currency)}
                    </p>
                  </div>
                  {project.budget > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(((revenue - (project.actual_cost || 0)) / project.budget) * 100).toFixed(1)}% margin
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Budget information not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Related Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.status === 'paid' ? 'default' :
                        invoice.status === 'overdue' ? 'destructive' :
                        'secondary'
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total_amount, project.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(`/invoices?client_id=${project.client_id}`)}
              >
                View All Invoices <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

