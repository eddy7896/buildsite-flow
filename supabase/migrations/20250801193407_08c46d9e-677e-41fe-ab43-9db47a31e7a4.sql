-- Create leave_types table for categorizing different types of leave
CREATE TABLE public.leave_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  max_days_per_year integer DEFAULT 30,
  is_paid boolean DEFAULT true,
  requires_approval boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create attendance table for daily attendance tracking
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  break_start_time timestamp with time zone,
  break_end_time timestamp with time zone,
  total_hours numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
  notes text,
  location text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create payroll_periods table for managing pay periods
CREATE TABLE public.payroll_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  pay_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payroll table for individual employee payroll records
CREATE TABLE public.payroll (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  base_salary numeric NOT NULL DEFAULT 0,
  overtime_pay numeric DEFAULT 0,
  bonuses numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  gross_pay numeric NOT NULL DEFAULT 0,
  tax_deductions numeric DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  hours_worked numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, payroll_period_id)
);

-- Create reports table for storing generated reports
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  report_type text NOT NULL CHECK (report_type IN ('attendance', 'payroll', 'leave', 'employee', 'project', 'financial')),
  parameters jsonb DEFAULT '{}'::jsonb,
  file_path text,
  file_name text,
  file_size integer,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_types
CREATE POLICY "Everyone can view leave types" 
ON public.leave_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and HR can manage leave types" 
ON public.leave_types 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Users can create their own leave requests" 
ON public.leave_requests 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update their own pending leave requests" 
ON public.leave_requests 
FOR UPDATE 
USING (employee_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins and HR can manage all leave requests" 
ON public.leave_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Users can create their own attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update their own attendance" 
ON public.attendance 
FOR UPDATE 
USING (employee_id = auth.uid());

CREATE POLICY "Admins and HR can manage all attendance" 
ON public.attendance 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- RLS Policies for payroll_periods
CREATE POLICY "Authenticated users can view payroll periods" 
ON public.payroll_periods 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins, HR, and Finance can manage payroll periods" 
ON public.payroll_periods 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for payroll
CREATE POLICY "Users can view their own payroll" 
ON public.payroll 
FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Admins, HR, and Finance can manage all payroll" 
ON public.payroll 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for reports
CREATE POLICY "Users can view public reports" 
ON public.reports 
FOR SELECT 
USING (is_public = true OR generated_by = auth.uid());

CREATE POLICY "Admins, HR, and Finance can manage reports" 
ON public.reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- Create triggers for updated_at columns
CREATE TRIGGER update_leave_types_updated_at
BEFORE UPDATE ON public.leave_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at
BEFORE UPDATE ON public.payroll_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);

CREATE INDEX idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX idx_payroll_period_id ON public.payroll(payroll_period_id);

CREATE INDEX idx_reports_type ON public.reports(report_type);
CREATE INDEX idx_reports_generated_by ON public.reports(generated_by);

-- Insert default leave types
INSERT INTO public.leave_types (name, description, max_days_per_year, is_paid, requires_approval) VALUES
('Annual Leave', 'Yearly vacation leave', 25, true, true),
('Sick Leave', 'Medical leave for illness', 10, true, false),
('Personal Leave', 'Personal time off', 5, false, true),
('Maternity Leave', 'Maternity leave for new mothers', 90, true, true),
('Paternity Leave', 'Paternity leave for new fathers', 14, true, true),
('Emergency Leave', 'Unexpected emergency situations', 3, true, false);