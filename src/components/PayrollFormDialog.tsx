import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { insertRecord, updateRecord, selectRecords } from '@/services/api/postgresql-service';
import { useAuth } from '@/hooks/useAuth';

interface Payroll {
  id?: string;
  employee_id: string;
  payroll_period_id: string;
  base_salary: number;
  overtime_pay?: number;
  bonuses?: number;
  deductions?: number;
  gross_pay: number;
  tax_deductions?: number;
  net_pay: number;
  hours_worked?: number;
  overtime_hours?: number;
  status: 'draft' | 'approved' | 'paid';
  notes?: string | null;
}

interface PayrollFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payroll?: Payroll | null;
  onPayrollSaved: () => void;
  payrollPeriodId?: string;
}

const PayrollFormDialog: React.FC<PayrollFormDialogProps> = ({ 
  isOpen, 
  onClose, 
  payroll, 
  onPayrollSaved,
  payrollPeriodId 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<any[]>([]);
  const [formData, setFormData] = useState<Payroll>({
    employee_id: payroll?.employee_id || '',
    payroll_period_id: payroll?.payroll_period_id || payrollPeriodId || '',
    base_salary: payroll?.base_salary || 0,
    overtime_pay: payroll?.overtime_pay || 0,
    bonuses: payroll?.bonuses || 0,
    deductions: payroll?.deductions || 0,
    gross_pay: payroll?.gross_pay || 0,
    tax_deductions: payroll?.tax_deductions || 0,
    net_pay: payroll?.net_pay || 0,
    hours_worked: payroll?.hours_worked || 0,
    overtime_hours: payroll?.overtime_hours || 0,
    status: payroll?.status || 'draft',
    notes: payroll?.notes || '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchPayrollPeriods();
      if (payroll) {
        setFormData({
          employee_id: payroll.employee_id,
          payroll_period_id: payroll.payroll_period_id,
          base_salary: payroll.base_salary,
          overtime_pay: payroll.overtime_pay || 0,
          bonuses: payroll.bonuses || 0,
          deductions: payroll.deductions || 0,
          gross_pay: payroll.gross_pay,
          tax_deductions: payroll.tax_deductions || 0,
          net_pay: payroll.net_pay,
          hours_worked: payroll.hours_worked || 0,
          overtime_hours: payroll.overtime_hours || 0,
          status: payroll.status,
          notes: payroll.notes || '',
        });
      } else {
        setFormData({
          employee_id: '',
          payroll_period_id: payrollPeriodId || '',
          base_salary: 0,
          overtime_pay: 0,
          bonuses: 0,
          deductions: 0,
          gross_pay: 0,
          tax_deductions: 0,
          net_pay: 0,
          hours_worked: 0,
          overtime_hours: 0,
          status: 'draft',
          notes: '',
        });
      }
    }
  }, [isOpen, payroll, payrollPeriodId]);

  const fetchEmployees = async () => {
    try {
      // Fetch active employees with their profiles
      const employeesData = await selectRecords('employee_details', {
        where: { is_active: true },
        orderBy: 'first_name ASC, last_name ASC',
      });
      
      // Fetch profiles for names
      const userIds = employeesData.map((e: any) => e.user_id).filter(Boolean);
      let profiles: any[] = [];
      if (userIds.length > 0) {
        // Use filters with IN operator
        const { rawQuery } = await import('@/services/api/postgresql-service');
        const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
        profiles = await rawQuery(
          `SELECT * FROM public.profiles WHERE user_id IN (${placeholders})`,
          userIds
        ) || [];
      }
      
      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));
      
      // Combine employee details with profile names
      const employeesWithNames = employeesData.map((emp: any) => ({
        ...emp,
        display_name: profileMap.get(emp.user_id) || `${emp.first_name} ${emp.last_name}`.trim() || 'Unknown',
      }));
      
      setEmployees(employeesWithNames);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrollPeriods = async () => {
    try {
      const periods = await selectRecords('payroll_periods', {
        orderBy: 'start_date DESC',
      });
      setPayrollPeriods(periods || []);
    } catch (error) {
      console.error('Error fetching payroll periods:', error);
    }
  };

  const calculateTotals = () => {
    const baseSalary = parseFloat(String(formData.base_salary || 0));
    const overtimePay = parseFloat(String(formData.overtime_pay || 0));
    const bonuses = parseFloat(String(formData.bonuses || 0));
    const deductions = parseFloat(String(formData.deductions || 0));
    const taxDeductions = parseFloat(String(formData.tax_deductions || 0));
    
    const grossPay = baseSalary + overtimePay + bonuses;
    const netPay = grossPay - deductions - taxDeductions;
    
    return { grossPay, netPay };
  };

  const handleFieldChange = (field: keyof Payroll, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const { grossPay, netPay } = calculateTotals();
      return {
        ...updated,
        gross_pay: grossPay,
        net_pay: netPay,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { grossPay, netPay } = calculateTotals();
      
      const cleanedData: any = {
        employee_id: formData.employee_id,
        payroll_period_id: formData.payroll_period_id,
        base_salary: parseFloat(String(formData.base_salary || 0)),
        overtime_pay: parseFloat(String(formData.overtime_pay || 0)) || 0,
        bonuses: parseFloat(String(formData.bonuses || 0)) || 0,
        deductions: parseFloat(String(formData.deductions || 0)) || 0,
        gross_pay: grossPay,
        tax_deductions: parseFloat(String(formData.tax_deductions || 0)) || 0,
        net_pay: netPay,
        hours_worked: parseFloat(String(formData.hours_worked || 0)) || 0,
        overtime_hours: parseFloat(String(formData.overtime_hours || 0)) || 0,
        status: formData.status,
        notes: formData.notes?.trim() || null,
      };

      if (payroll?.id) {
        await updateRecord('payroll', cleanedData, { id: payroll.id }, user?.id);
        toast({
          title: 'Success',
          description: 'Payroll record updated successfully',
        });
      } else {
        await insertRecord('payroll', cleanedData, user?.id);
        toast({
          title: 'Success',
          description: 'Payroll record created successfully',
        });
      }

      onPayrollSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving payroll:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payroll record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const { grossPay, netPay } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payroll?.id ? 'Edit Payroll Record' : 'Create New Payroll Record'}</DialogTitle>
          <DialogDescription>
            {payroll?.id ? 'Update payroll record details below.' : 'Fill in the details to create a new payroll record.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee *</Label>
              <Select 
                value={formData.employee_id} 
                onValueChange={(value) => handleFieldChange('employee_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.display_name} ({emp.employee_id || emp.user_id.substring(0, 8)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll_period_id">Payroll Period *</Label>
              <Select 
                value={formData.payroll_period_id} 
                onValueChange={(value) => handleFieldChange('payroll_period_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payroll period" />
                </SelectTrigger>
                <SelectContent>
                  {payrollPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_salary">Base Salary (₹) *</Label>
              <Input
                id="base_salary"
                type="number"
                step="0.01"
                value={formData.base_salary}
                onChange={(e) => handleFieldChange('base_salary', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => handleFieldChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtime_pay">Overtime Pay (₹)</Label>
              <Input
                id="overtime_pay"
                type="number"
                step="0.01"
                value={formData.overtime_pay || 0}
                onChange={(e) => handleFieldChange('overtime_pay', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonuses">Bonuses (₹)</Label>
              <Input
                id="bonuses"
                type="number"
                step="0.01"
                value={formData.bonuses || 0}
                onChange={(e) => handleFieldChange('bonuses', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions (₹)</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                value={formData.deductions || 0}
                onChange={(e) => handleFieldChange('deductions', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_deductions">Tax Deductions (₹)</Label>
              <Input
                id="tax_deductions"
                type="number"
                step="0.01"
                value={formData.tax_deductions || 0}
                onChange={(e) => handleFieldChange('tax_deductions', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours_worked">Hours Worked</Label>
              <Input
                id="hours_worked"
                type="number"
                step="0.1"
                value={formData.hours_worked || 0}
                onChange={(e) => handleFieldChange('hours_worked', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime_hours">Overtime Hours</Label>
              <Input
                id="overtime_hours"
                type="number"
                step="0.1"
                value={formData.overtime_hours || 0}
                onChange={(e) => handleFieldChange('overtime_hours', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-muted-foreground">Gross Pay</Label>
              <p className="text-2xl font-bold">₹{grossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Net Pay</Label>
              <p className="text-2xl font-bold text-green-600">₹{netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about this payroll record"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : payroll?.id ? 'Update Payroll' : 'Create Payroll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollFormDialog;

