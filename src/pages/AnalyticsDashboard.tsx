/**
 * Analytics Dashboard Page
 * Advanced analytics and insights dashboard for reporting
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Building2,
  Users,
  Activity,
  Loader2,
  Download,
  Calendar,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AnalyticsMetrics {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  revenue_growth: number;
  expense_growth: number;
  profit_margin: number;
  inventory_value: number;
  inventory_turnover: number;
  procurement_spend: number;
  asset_value: number;
  active_projects: number;
  employee_count: number;
  top_performers: Array<{
    name: string;
    metric: string;
    value: number;
    change: number;
  }>;
  trends: Array<{
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [dateFrom, dateTo, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { ReportService } = await import('@/services/api/reports');
      const data = await ReportService.getAnalyticsDashboard({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        period: selectedPeriod,
      });
      setMetrics(data);
    } catch (error: any) {
      // Fallback to mock data if API fails
      setMetrics({
        total_revenue: 1250000,
        total_expenses: 850000,
        net_profit: 400000,
        revenue_growth: 15.5,
        expense_growth: 8.2,
        profit_margin: 32.0,
        inventory_value: 450000,
        inventory_turnover: 2.8,
        procurement_spend: 320000,
        asset_value: 2100000,
        active_projects: 12,
        employee_count: 45,
        top_performers: [
          { name: 'Sales Department', metric: 'Revenue', value: 450000, change: 18.5 },
          { name: 'Project Alpha', metric: 'Profit', value: 125000, change: 22.3 },
          { name: 'Inventory', metric: 'Turnover', value: 2.8, change: 12.0 },
        ],
        trends: [
          { period: 'Jan', revenue: 100000, expenses: 70000, profit: 30000 },
          { period: 'Feb', revenue: 110000, expenses: 72000, profit: 38000 },
          { period: 'Mar', revenue: 120000, expenses: 75000, profit: 45000 },
          { period: 'Apr', revenue: 130000, expenses: 78000, profit: 52000 },
          { period: 'May', revenue: 125000, expenses: 80000, profit: 45000 },
          { period: 'Jun', revenue: 140000, expenses: 85000, profit: 55000 },
        ],
      });
      toast({
        title: 'Warning',
        description: 'Using fallback data. API connection failed.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '0.0%';
    const numValue = typeof value === 'number' ? value : parseFloat(String(value || 0));
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Advanced analytics and business insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label className="text-xs">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {metrics && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {(metrics.revenue_growth ?? 0) >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  <span className={(metrics.revenue_growth ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatPercent(metrics.revenue_growth)}
                  </span>
                  <span className="ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.total_expenses)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {(metrics.expense_growth ?? 0) >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1 text-red-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1 text-green-500" />
                  )}
                  <span className={(metrics.expense_growth ?? 0) >= 0 ? 'text-red-500' : 'text-green-500'}>
                    {formatPercent(metrics.expense_growth)}
                  </span>
                  <span className="ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.net_profit)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(typeof metrics.profit_margin === 'number'
                    ? metrics.profit_margin
                    : parseFloat(String(metrics.profit_margin || 0))
                  ).toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.inventory_value)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(typeof metrics.inventory_turnover === 'number'
                    ? metrics.inventory_turnover
                    : parseFloat(String(metrics.inventory_turnover || 0))
                  ).toFixed(1)}x turnover
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Procurement Spend</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.procurement_spend)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.asset_value)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.active_projects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.employee_count}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="performers">Top Performers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                    <CardDescription>Revenue, expenses, and profit breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-medium">{formatCurrency(metrics.total_revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expenses</span>
                        <span className="font-medium">{formatCurrency(metrics.total_expenses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Net Profit</span>
                        <span className="font-bold">{formatCurrency(metrics.net_profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Profit Margin</span>
                        <span className="font-medium">
                          {(typeof metrics.profit_margin === 'number'
                            ? metrics.profit_margin
                            : parseFloat(String(metrics.profit_margin || 0))
                          ).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Metrics</CardTitle>
                    <CardDescription>Key operational indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Inventory Value</span>
                        <span className="font-medium">{formatCurrency(metrics.inventory_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Inventory Turnover</span>
                        <span className="font-medium">
                          {(typeof metrics.inventory_turnover === 'number'
                            ? metrics.inventory_turnover
                            : parseFloat(String(metrics.inventory_turnover || 0))
                          ).toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Procurement Spend</span>
                        <span className="font-medium">{formatCurrency(metrics.procurement_spend)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Asset Value</span>
                        <span className="font-medium">{formatCurrency(metrics.asset_value)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Trends</CardTitle>
                  <CardDescription>Revenue, expenses, and profit over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(metrics?.trends ?? []).map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{trend.period}</TableCell>
                          <TableCell className="text-right">{formatCurrency(trend.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(trend.expenses)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(trend.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Best performing departments and projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(metrics?.top_performers ?? []).map((performer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{performer.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{performer.metric}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {performer.metric === 'Turnover'
                              ? `${(typeof performer.value === 'number'
                                  ? performer.value
                                  : parseFloat(String(performer.value || 0))
                                ).toFixed(1)}x`
                              : formatCurrency(performer.value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={(performer.change ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatPercent(performer.change)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

