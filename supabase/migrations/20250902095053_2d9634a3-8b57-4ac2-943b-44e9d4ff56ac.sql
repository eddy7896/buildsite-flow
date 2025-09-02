-- Phase 5: Multi-tenant Data Isolation & Security
-- Update RLS policies to ensure proper agency-based data segregation

-- First, let's ensure get_user_agency_id function works correctly
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
$$;

-- Update clients table RLS policies for agency isolation
DROP POLICY IF EXISTS "Authorized roles can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authorized roles can view clients" ON public.clients;

CREATE POLICY "Users can manage clients in their agency"
ON public.clients
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- Update jobs table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins, HR, and Finance can manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update jobs assigned to them" ON public.jobs;

CREATE POLICY "Users can manage jobs in their agency"
ON public.jobs
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view jobs in their agency"
ON public.jobs
FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can update jobs assigned to them in their agency"
ON public.jobs
FOR UPDATE
USING (
  agency_id = get_user_agency_id() AND 
  assigned_to = auth.uid()
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  assigned_to = auth.uid()
);

-- Update invoices table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins, HR, and Finance can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;

CREATE POLICY "Users can manage invoices in their agency"
ON public.invoices
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view invoices in their agency"
ON public.invoices
FOR SELECT
USING (agency_id = get_user_agency_id());

-- Update quotations table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins, HR, and Finance can manage quotations" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON public.quotations;

CREATE POLICY "Users can manage quotations in their agency"
ON public.quotations
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view quotations in their agency"
ON public.quotations
FOR SELECT
USING (agency_id = get_user_agency_id());

-- Update leads table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins and HR can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view and update leads assigned to them" ON public.leads;

CREATE POLICY "Users can manage leads in their agency"
ON public.leads
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view leads in their agency"
ON public.leads
FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can update leads assigned to them in their agency"
ON public.leads
FOR UPDATE
USING (
  agency_id = get_user_agency_id() AND 
  assigned_to = auth.uid()
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  assigned_to = auth.uid()
);

-- Update CRM activities table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins and HR can manage all CRM activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Authenticated users can manage their own CRM activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Authenticated users can view CRM activities" ON public.crm_activities;

CREATE POLICY "Users can manage CRM activities in their agency"
ON public.crm_activities
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can manage their own CRM activities in their agency"
ON public.crm_activities
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (created_by = auth.uid() OR assigned_to = auth.uid())
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (created_by = auth.uid() OR assigned_to = auth.uid())
);

CREATE POLICY "Users can view CRM activities in their agency"
ON public.crm_activities
FOR SELECT
USING (agency_id = get_user_agency_id());

-- Update attendance table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins and HR can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can create their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;

CREATE POLICY "Admins and HR can manage all attendance in their agency"
ON public.attendance
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can create their own attendance in their agency"
ON public.attendance
FOR INSERT
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Users can update their own attendance in their agency"
ON public.attendance
FOR UPDATE
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Users can view their own attendance in their agency"
ON public.attendance
FOR SELECT
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

-- Update leave_requests table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins and HR can manage all leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can create their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update their own pending leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON public.leave_requests;

CREATE POLICY "Admins and HR can manage all leave requests in their agency"
ON public.leave_requests
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can create their own leave requests in their agency"
ON public.leave_requests
FOR INSERT
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Users can update their own pending leave requests in their agency"
ON public.leave_requests
FOR UPDATE
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid() AND 
  status = 'pending'
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Users can view their own leave requests in their agency"
ON public.leave_requests
FOR SELECT
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

-- Update reimbursement_requests table RLS policies for agency isolation
DROP POLICY IF EXISTS "Employees can create their own reimbursement requests" ON public.reimbursement_requests;
DROP POLICY IF EXISTS "Employees can update their own draft reimbursement requests" ON public.reimbursement_requests;
DROP POLICY IF EXISTS "Employees can view their own reimbursement requests" ON public.reimbursement_requests;
DROP POLICY IF EXISTS "Finance and admins can update reimbursement requests" ON public.reimbursement_requests;
DROP POLICY IF EXISTS "Finance and admins can view all reimbursement requests" ON public.reimbursement_requests;

CREATE POLICY "Employees can create their own reimbursement requests in their agency"
ON public.reimbursement_requests
FOR INSERT
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Employees can update their own draft reimbursement requests in their agency"
ON public.reimbursement_requests
FOR UPDATE
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid() AND 
  status = 'draft'
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Employees can view their own reimbursement requests in their agency"
ON public.reimbursement_requests
FOR SELECT
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

CREATE POLICY "Finance and admins can manage reimbursement requests in their agency"
ON public.reimbursement_requests
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- Update payroll table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins, HR, and Finance can manage all payroll" ON public.payroll;
DROP POLICY IF EXISTS "Users can view their own payroll" ON public.payroll;

CREATE POLICY "Admins, HR, and Finance can manage all payroll in their agency"
ON public.payroll
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view their own payroll in their agency"
ON public.payroll
FOR SELECT
USING (
  agency_id = get_user_agency_id() AND 
  employee_id = auth.uid()
);

-- Update journal_entries table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins and Finance can manage journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Authenticated users can view journal entries" ON public.journal_entries;

CREATE POLICY "Admins and Finance can manage journal entries in their agency"
ON public.journal_entries
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view journal entries in their agency"
ON public.journal_entries
FOR SELECT
USING (agency_id = get_user_agency_id());

-- Update employee_details table RLS policies for agency isolation
DROP POLICY IF EXISTS "Admins and HR can manage employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Admins and HR can view all employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.employee_details;

CREATE POLICY "Admins and HR can manage employee details in their agency"
ON public.employee_details
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view their own employee details in their agency"
ON public.employee_details
FOR SELECT
USING (
  agency_id = get_user_agency_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own basic info in their agency"
ON public.employee_details
FOR UPDATE
USING (
  agency_id = get_user_agency_id() AND 
  user_id = auth.uid()
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  user_id = auth.uid()
);

-- Ensure all other tables that don't need agency isolation keep their existing policies
-- but add agency filtering where appropriate for data that should be agency-specific

-- Add function to automatically set agency_id on insert for relevant tables
CREATE OR REPLACE FUNCTION public.set_agency_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set agency_id if it's not already set and the table has an agency_id column
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := get_user_agency_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers to automatically set agency_id on insert for relevant tables
CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.payroll
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_trigger
  BEFORE INSERT ON public.employee_details
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();