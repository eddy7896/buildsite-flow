import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Download, Calculator, Users, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

interface PayrollRecord {
  id: string;
  employee: string;
  position: string;
  baseSalary: number;
  overtime: number;
  deductions: number;
  netPay: number;
  status: string;
  payPeriod: string;
  employee_id?: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalPayroll: number;
  averageSalary: number;
  pendingPayroll: number;
}

const Payroll = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    totalEmployees: 0,
    totalPayroll: 0,
    averageSalary: 0,
    pendingPayroll: 0
  });
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      
      // Get current pay period (most recent)
      const { data: payPeriods, error: periodsError } = await db
        .from('payroll_periods')
        .select('*')
        .order('end_date', { ascending: false })
        .limit(1);

      if (periodsError) throw periodsError;

      const currentPeriod = payPeriods?.[0];
      const periodId = currentPeriod?.id;

      // Fetch payroll records for current period
      let payrollData: any[] = [];
      if (periodId) {
        const { data: payroll, error: payrollError } = await db
          .from('payroll')
          .select('*')
          .eq('payroll_period_id', periodId)
          .order('created_at', { ascending: false });

        if (payrollError) throw payrollError;
        payrollData = payroll || [];
      }

      // Fetch employee details and profiles for names
      const employeeIds = payrollData.map(p => p.employee_id).filter(Boolean);
      let employees: any[] = [];
      let profiles: any[] = [];

      if (employeeIds.length > 0) {
        const { data: employeesData, error: employeesError } = await db
          .from('employee_details')
          .select('user_id, first_name, last_name, emp_position')
          .in('user_id', employeeIds);

        if (employeesError) throw employeesError;
        employees = employeesData || [];

        const userIds = employees.map(e => e.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await db
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);

          if (profilesError) throw profilesError;
          profiles = profilesData || [];
        }
      }

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));
      const employeeMap = new Map(employees.map((e: any) => [e.user_id, e]));

      // Transform payroll data
      const transformedRecords: PayrollRecord[] = payrollData.map((record: any) => {
        const employee = employeeMap.get(record.employee_id);
        const fullName = profileMap.get(record.employee_id) || 
          (employee ? `${employee.first_name} ${employee.last_name}`.trim() : 'Unknown Employee');
        const position = employee?.emp_position || 'N/A';

        const baseSalary = Number(record.base_salary || record.gross_salary || 0);
        const overtime = Number(record.overtime_pay || 0);
        const deductions = Number(record.total_deductions || 0);
        const netPay = Number(record.net_pay || baseSalary + overtime - deductions);

        const periodName = currentPeriod 
          ? `${new Date(currentPeriod.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          : 'Current Period';

        return {
          id: record.id,
          employee: fullName,
          position,
          baseSalary,
          overtime,
          deductions,
          netPay,
          status: record.status || 'pending',
          payPeriod: periodName,
          employee_id: record.employee_id
        };
      });

      setPayrollRecords(transformedRecords);

      // Calculate summary
      const totalPayroll = transformedRecords.reduce((sum, r) => sum + r.netPay, 0);
      const averageSalary = transformedRecords.length > 0 
        ? totalPayroll / transformedRecords.length 
        : 0;
      const pendingPayroll = transformedRecords.filter(r => r.status === 'pending').length;

      // Get total active employees
      const { data: activeEmployees, error: employeesCountError } = await db
        .from('employee_details')
        .select('id')
        .eq('is_active', true);

      if (employeesCountError) throw employeesCountError;

      setPayrollSummary({
        totalEmployees: activeEmployees?.length || 0,
        totalPayroll,
        averageSalary: Math.round(averageSalary),
        pendingPayroll
      });

    } catch (error: any) {
      console.error('Error fetching payroll data:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading payroll data...</span>
        </div>
      </div>
    );
  }


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
                <p className="text-2xl font-bold">₹{payrollSummary.totalPayroll.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">₹{payrollSummary.averageSalary.toLocaleString()}</p>
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
            {payrollRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payroll records found for the current period.</p>
              </div>
            ) : (
              payrollRecords.map((record) => (
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
                    <p className="font-medium">₹{record.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Overtime</p>
                    <p className="font-medium text-green-600">+₹{record.overtime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deductions</p>
                    <p className="font-medium text-red-600">-₹{record.deductions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Pay</p>
                    <p className="font-bold text-lg">₹{record.netPay.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline">
                      <Download className="mr-1 h-3 w-3" />
                      Pay Slip
                    </Button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payroll;