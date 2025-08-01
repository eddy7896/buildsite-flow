import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Download, Calculator, Users, Calendar } from "lucide-react";

const Payroll = () => {
  // Mock data - replace with actual API calls
  const payrollSummary = {
    totalEmployees: 48,
    totalPayroll: 245000,
    averageSalary: 5104,
    pendingPayroll: 3
  };

  const payrollRecords = [
    {
      id: 1,
      employee: "John Doe",
      position: "Senior Developer",
      baseSalary: 6000,
      overtime: 450,
      deductions: 850,
      netPay: 5600,
      status: "processed",
      payPeriod: "January 2024"
    },
    {
      id: 2,
      employee: "Jane Smith",
      position: "Marketing Manager",
      baseSalary: 5500,
      overtime: 200,
      deductions: 780,
      netPay: 4920,
      status: "pending",
      payPeriod: "January 2024"
    },
    {
      id: 3,
      employee: "Mike Johnson",
      position: "Sales Representative",
      baseSalary: 4500,
      overtime: 300,
      deductions: 650,
      netPay: 4150,
      status: "processed",
      payPeriod: "January 2024"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Manage employee compensation and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Payroll
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{payrollSummary.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">${payrollSummary.totalPayroll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Average Salary</p>
                <p className="text-2xl font-bold">${payrollSummary.averageSalary.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{payrollSummary.pendingPayroll}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>Current pay period payroll information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrollRecords.map((record) => (
              <div key={record.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{record.employee}</h3>
                    <p className="text-sm text-muted-foreground">{record.position}</p>
                    <p className="text-xs text-muted-foreground">{record.payPeriod}</p>
                  </div>
                  <Badge variant={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Base Salary</p>
                    <p className="font-medium">${record.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Overtime</p>
                    <p className="font-medium text-green-600">+${record.overtime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deductions</p>
                    <p className="font-medium text-red-600">-${record.deductions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Pay</p>
                    <p className="font-bold text-lg">${record.netPay.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline">
                      <Download className="mr-1 h-3 w-3" />
                      Pay Slip
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payroll;