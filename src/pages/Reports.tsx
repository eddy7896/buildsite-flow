import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Users, FileText, BarChart3, PieChart, Building } from "lucide-react";

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState("2024-01");
  const [selectedYear, setSelectedYear] = useState("2024");

  // Mock data - replace with actual API calls
  const monthlyData = {
    revenue: 45000,
    expenses: 28000,
    profit: 17000,
    employees: 48,
    activeProjects: 15,
    completedProjects: 3,
    newClients: 2,
    invoicesSent: 12,
    paymentsReceived: 8,
    attendanceRate: 95
  };

  const yearlyData = {
    revenue: 485000,
    expenses: 320000,
    profit: 165000,
    employeesHired: 12,
    projectsCompleted: 35,
    newClients: 18,
    totalInvoices: 156,
    totalPayments: 142,
    avgAttendance: 94
  };

  const monthlyTrends = [
    { month: "Jan", revenue: 42000, expenses: 28000, profit: 14000 },
    { month: "Feb", revenue: 38000, expenses: 25000, profit: 13000 },
    { month: "Mar", revenue: 45000, expenses: 30000, profit: 15000 },
    { month: "Apr", revenue: 52000, expenses: 32000, profit: 20000 },
    { month: "May", revenue: 48000, expenses: 29000, profit: 19000 },
    { month: "Jun", revenue: 55000, expenses: 35000, profit: 20000 },
    { month: "Jul", revenue: 58000, expenses: 38000, profit: 20000 },
    { month: "Aug", revenue: 51000, expenses: 33000, profit: 18000 },
    { month: "Sep", revenue: 47000, expenses: 31000, profit: 16000 },
    { month: "Oct", revenue: 53000, expenses: 34000, profit: 19000 },
    { month: "Nov", revenue: 49000, expenses: 32000, profit: 17000 },
    { month: "Dec", revenue: 47000, expenses: 33000, profit: 14000 },
  ];

  const departmentData = [
    { name: "Engineering", employees: 18, budget: 180000, utilization: 92 },
    { name: "Marketing", employees: 8, budget: 85000, utilization: 88 },
    { name: "Sales", employees: 12, budget: 120000, utilization: 95 },
    { name: "HR", employees: 4, budget: 45000, utilization: 85 },
    { name: "Finance", employees: 6, budget: 65000, utilization: 90 },
  ];

  const projectReports = [
    { name: "Website Redesign", status: "completed", budget: 50000, actual: 48000, margin: 4 },
    { name: "Mobile App", status: "in-progress", budget: 80000, actual: 35000, margin: 56 },
    { name: "CRM Integration", status: "completed", budget: 30000, actual: 32000, margin: -7 },
    { name: "E-commerce Platform", status: "planning", budget: 120000, actual: 0, margin: 100 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'planning': return 'outline';
      default: return 'secondary';
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin > 10) return 'text-green-600';
    if (margin < 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View comprehensive business reports and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            Create Custom Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Reports</TabsTrigger>
          <TabsTrigger value="departmental">Department Reports</TabsTrigger>
          <TabsTrigger value="projects">Project Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Monthly Performance Report</h2>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">January 2024</SelectItem>
                <SelectItem value="2024-02">February 2024</SelectItem>
                <SelectItem value="2024-03">March 2024</SelectItem>
                <SelectItem value="2024-04">April 2024</SelectItem>
                <SelectItem value="2024-05">May 2024</SelectItem>
                <SelectItem value="2024-06">June 2024</SelectItem>
                <SelectItem value="2024-07">July 2024</SelectItem>
                <SelectItem value="2024-08">August 2024</SelectItem>
                <SelectItem value="2024-09">September 2024</SelectItem>
                <SelectItem value="2024-10">October 2024</SelectItem>
                <SelectItem value="2024-11">November 2024</SelectItem>
                <SelectItem value="2024-12">December 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${monthlyData.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                    <p className="text-2xl font-bold text-red-600">${monthlyData.expenses.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">-5% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">${monthlyData.profit.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+25% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                    <p className="text-2xl font-bold text-purple-600">{monthlyData.attendanceRate}%</p>
                    <p className="text-xs text-muted-foreground">+2% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Summary</CardTitle>
                <CardDescription>Important business metrics for the selected month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Projects</span>
                    <span className="font-medium">{monthlyData.activeProjects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed Projects</span>
                    <span className="font-medium">{monthlyData.completedProjects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Clients</span>
                    <span className="font-medium">{monthlyData.newClients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Invoices Sent</span>
                    <span className="font-medium">{monthlyData.invoicesSent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payments Received</span>
                    <span className="font-medium">{monthlyData.paymentsReceived}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Revenue, expenses, and profit trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyTrends.slice(-6).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{trend.month}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">${(trend.revenue / 1000).toFixed(0)}k</span>
                        <span className="text-red-600">${(trend.expenses / 1000).toFixed(0)}k</span>
                        <span className="text-blue-600">${(trend.profit / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="yearly" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Annual Performance Report</h2>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Annual Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${yearlyData.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+18% from last year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Annual Expenses</p>
                    <p className="text-2xl font-bold text-red-600">${yearlyData.expenses.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+8% from last year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Annual Profit</p>
                    <p className="text-2xl font-bold text-blue-600">${yearlyData.profit.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+35% from last year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
                    <p className="text-2xl font-bold text-purple-600">{yearlyData.avgAttendance}%</p>
                    <p className="text-xs text-muted-foreground">+3% from last year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Annual Achievements</CardTitle>
                <CardDescription>Key accomplishments for the year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Employees Hired</span>
                    <span className="font-medium">{yearlyData.employeesHired}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projects Completed</span>
                    <span className="font-medium">{yearlyData.projectsCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Clients Acquired</span>
                    <span className="font-medium">{yearlyData.newClients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Invoices</span>
                    <span className="font-medium">{yearlyData.totalInvoices}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payments Processed</span>
                    <span className="font-medium">{yearlyData.totalPayments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>Revenue and profit by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{trend.month}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">${(trend.revenue / 1000).toFixed(0)}k</span>
                        <span className="text-blue-600">${(trend.profit / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="departmental" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Budget utilization and employee metrics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{dept.name}</h3>
                        <p className="text-sm text-muted-foreground">{dept.employees} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${dept.budget.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Budget</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{dept.utilization}%</p>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Financial Report</CardTitle>
              <CardDescription>Budget vs actual costs and profit margins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectReports.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium">${project.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actual Cost</p>
                          <p className="font-medium">${project.actual.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margin</p>
                          <p className={`font-medium ${getMarginColor(project.margin)}`}>
                            {project.margin > 0 ? '+' : ''}{project.margin}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;