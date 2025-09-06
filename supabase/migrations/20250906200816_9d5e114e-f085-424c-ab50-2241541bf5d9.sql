-- Phase 1: Immediate Security Fixes for Role-Based Access Control (Corrected)

-- 1. Update payroll RLS policies to restrict admin access and require finance roles
DROP POLICY IF EXISTS "Super admins and finance managers can manage all payroll" ON public.payroll;
DROP POLICY IF EXISTS "HR can view payroll summaries only" ON public.payroll;
DROP POLICY IF EXISTS "Users can view their own payroll only" ON public.payroll;

-- Create more restrictive payroll policies
CREATE POLICY "Finance roles can manage all payroll"
ON public.payroll
FOR ALL
USING (
  (agency_id = get_user_agency_id()) AND 
  (has_role(auth.uid(), 'super_admin'::app_role) OR 
   has_role(auth.uid(), 'cfo'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role))
)
WITH CHECK (
  (agency_id = get_user_agency_id()) AND 
  (has_role(auth.uid(), 'super_admin'::app_role) OR 
   has_role(auth.uid(), 'cfo'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role))
);

CREATE POLICY "Users can view their own payroll only"
ON public.payroll
FOR SELECT
USING (
  (agency_id = get_user_agency_id()) AND 
  (employee_id = auth.uid())
);

-- 2. Update employee salary details to remove admin access
DROP POLICY IF EXISTS "Finance managers can manage salary data with audit" ON public.employee_salary_details;
DROP POLICY IF EXISTS "Super admins and CFO can manage all salary data" ON public.employee_salary_details;

CREATE POLICY "Finance roles only can manage salary data"
ON public.employee_salary_details
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'cfo'::app_role) OR 
  has_role(auth.uid(), 'finance_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'cfo'::app_role) OR 
  has_role(auth.uid(), 'finance_manager'::app_role)
);

-- 3. Update invoices policy to remove admin access to financial operations
DROP POLICY IF EXISTS "Users can manage invoices in their agency" ON public.invoices;

CREATE POLICY "Finance roles can manage invoices in their agency"
ON public.invoices
FOR ALL
USING (
  (agency_id = get_user_agency_id()) AND 
  (has_role(auth.uid(), 'super_admin'::app_role) OR 
   has_role(auth.uid(), 'cfo'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role))
)
WITH CHECK (
  (agency_id = get_user_agency_id()) AND 
  (has_role(auth.uid(), 'super_admin'::app_role) OR 
   has_role(auth.uid(), 'cfo'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role))
);

-- 4. Add department-based access control for employee data
CREATE OR REPLACE FUNCTION public.can_access_employee_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_role app_role;
  current_user_dept text;
  target_user_dept text;
BEGIN
  -- Get current user's role and department
  SELECT ur.role INTO current_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY CASE ur.role
    WHEN 'super_admin' THEN 1
    WHEN 'ceo' THEN 2
    WHEN 'cfo' THEN 3
    WHEN 'hr' THEN 4
    ELSE 99
  END
  LIMIT 1;

  -- Super admins, CEOs, CFOs, and HR can access all employee data
  IF current_user_role IN ('super_admin', 'ceo', 'cfo', 'hr') THEN
    RETURN true;
  END IF;

  -- Department heads can only access employees in their department
  IF current_user_role = 'department_head' THEN
    SELECT p1.department INTO current_user_dept
    FROM public.profiles p1
    WHERE p1.user_id = auth.uid();
    
    SELECT p2.department INTO target_user_dept
    FROM public.profiles p2
    WHERE p2.user_id = target_user_id;
    
    RETURN current_user_dept = target_user_dept;
  END IF;

  -- Users can only access their own data
  RETURN auth.uid() = target_user_id;
END;
$$;

-- 5. Update user roles policy to prevent unauthorized role changes
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Only authorized roles can manage user roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'ceo'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'ceo'::app_role)
);

-- 6. Create audit logging trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log access to sensitive financial data
  IF TG_TABLE_NAME IN ('payroll', 'employee_salary_details', 'invoices') THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      user_id,
      record_id,
      old_values,
      new_values
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS sensitive_access_audit ON public.payroll;
CREATE TRIGGER sensitive_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

DROP TRIGGER IF EXISTS sensitive_access_audit ON public.employee_salary_details;
CREATE TRIGGER sensitive_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salary_details
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();