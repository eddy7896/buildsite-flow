import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  FileText,
  Download,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DateRange } from "react-day-picker";

interface DashboardMetrics {
  totalRevenue: number;
  totalEmployees: number;
  activeProjects: number;
  pendingReimbursements: number;
  revenueGrowth: number;
  employeeGrowth: number;
  projectsGrowth: number;
  reimbursementGrowth: number;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  expenses?: number;
  projects?: number;
  employees?: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [expenseData, setExpenseData] = useState<ChartData[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<ChartData[]>([]);
  const [leaveData, setLeaveData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch key metrics
      const [
        { data: invoices },
        { data: employees },
        { data: projects },
        { data: reimbursements }
      ] = await Promise.all([
        supabase.from('invoices').select('total_amount, created_at'),
        supabase.from('profiles').select('id, created_at'),
        supabase.from('jobs').select('id, status, created_at'),
        supabase.from('reimbursement_requests').select('amount, status, created_at')
      ]);

      // Calculate metrics
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const totalEmployees = employees?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
      const pendingReimbursements = reimbursements?.filter(r => r.status === 'submitted').length || 0;

      // Calculate growth (simplified - comparing with previous period)
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const previousRevenue = invoices?.filter(inv => 
        new Date(inv.created_at) < previousMonth
      ).reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 1;
      
      const revenueGrowth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;

      setMetrics({
        totalRevenue,
        totalEmployees,
        activeProjects,
        pendingReimbursements,
        revenueGrowth,
        employeeGrowth: 5.2, // Mock data
        projectsGrowth: 12.1, // Mock data
        reimbursementGrowth: -8.3 // Mock data
      });

      // Generate chart data
      generateChartData(invoices, reimbursements, projects);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (invoices: any[], reimbursements: any[], projects: any[]) => {
    // Revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthlyInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
      }) || [];
      
      const revenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      monthlyRevenue.push({
        name: monthName,
        revenue,
        value: revenue
      });
    }
    setRevenueData(monthlyRevenue);

    // Expense data (mock - reimbursements by month)
    const monthlyExpenses = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthlyReimbursements = reimbursements?.filter(reimb => {
        const reimbDate = new Date(reimb.created_at);
        return reimbDate.getMonth() === date.getMonth() && reimbDate.getFullYear() === date.getFullYear();
      }) || [];
      
      const expenses = monthlyReimbursements.reduce((sum, reimb) => sum + (reimb.amount || 0), 0);
      
      monthlyExpenses.push({
        name: monthName,
        expenses,
        value: expenses
      });
    }
    setExpenseData(monthlyExpenses);

    // Project status distribution
    const statusCounts = projects?.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const projectData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: Number(count)
    }));
    setProjectStatusData(projectData);

    // Leave requests data (mock)
    setLeaveData([
      { name: 'Approved', value: 45 },
      { name: 'Pending', value: 12 },
      { name: 'Rejected', value: 3 }
    ]);
  };

  const exportReport = async (type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { 
          reportType: type, 
          dateRange,
          format: 'pdf'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${type} report exported successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into your agency's performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics?.revenueGrowth && metrics.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics?.revenueGrowth || 0).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEmployees}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {metrics?.employeeGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeProjects}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {metrics?.projectsGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingReimbursements}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              {Math.abs(metrics?.reimbursementGrowth || 0).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="revenue">Revenue & Expenses</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="workforce">Workforce</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={() => exportReport('dashboard')}>
            <Download className="h-4 w-4 mr-2" />
            Export Dashboard
          </Button>
        </div>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Trend</CardTitle>
                <CardDescription>Monthly expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Expenses']} />
                    <Bar dataKey="expenses" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>Current status of all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Leave request status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workforce Analytics</CardTitle>
              <CardDescription>Employee metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Workforce analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Center</CardTitle>
              <CardDescription>Generate and download detailed reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button 
                  variant="outline" 
                  className="h-24 flex-col space-y-2"
                  onClick={() => exportReport('financial')}
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Financial Report</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex-col space-y-2"
                  onClick={() => exportReport('projects')}
                >
                  <Clock className="h-6 w-6" />
                  <span>Project Report</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex-col space-y-2"
                  onClick={() => exportReport('workforce')}
                >
                  <Users className="h-6 w-6" />
                  <span>Workforce Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}