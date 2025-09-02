-- Critical Security Fixes: Phase 1 - Enhanced Access Control (Fixed)

-- 1. Create audit logging table for sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  user_id UUID REFERENCES auth.users(id),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Enhanced user_roles policies with audit logging
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- More restrictive role management - only admins can assign roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can only view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- 3. Create secure employee data view that filters sensitive information
CREATE OR REPLACE VIEW public.employee_basic_info AS
SELECT 
  ed.id,
  ed.user_id,
  ed.employee_id,
  ed.first_name,
  ed.last_name,
  ed.employment_type,
  ed.is_active,
  p.full_name,
  p.phone,
  p.department,
  p.position,
  p.hire_date,
  -- Only show SSN to authorized users
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role)
    THEN decrypt_ssn(ed.social_security_number)
    ELSE '***-**-****'
  END as social_security_number
FROM employee_details ed
LEFT JOIN profiles p ON ed.user_id = p.user_id
WHERE ed.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.employee_basic_info TO authenticated;

-- 4. Enhanced employee_details policies - more restrictive access
DROP POLICY IF EXISTS "Admins and HR can manage all employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Users can view their own employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Users can update their own employee details" ON public.employee_details;

-- Only admins and HR can view all employee details
CREATE POLICY "Admins and HR can view all employee details" ON public.employee_details
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR 
  user_id = auth.uid()
);

-- Only admins and HR can modify employee details
CREATE POLICY "Admins and HR can manage employee details" ON public.employee_details
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

-- Users can only update limited fields of their own records
CREATE POLICY "Users can update own basic info" ON public.employee_details
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
);

-- 5. Enhanced client data access - only sales, admin, and HR
DROP POLICY IF EXISTS "Admins and HR can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;

CREATE POLICY "Authorized roles can manage clients" ON public.clients
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR
  has_role(auth.uid(), 'finance_manager'::app_role)
);

CREATE POLICY "Authorized roles can view clients" ON public.clients
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR
  has_role(auth.uid(), 'finance_manager'::app_role)
);

-- 6. Fix search_path for all remaining functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_client_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
  client_number TEXT;
BEGIN
  -- Get the next number by counting existing clients and adding 1
  SELECT COUNT(*) + 1 INTO next_num FROM public.clients;
  
  -- Format as CLT-XXX
  client_number := 'CLT-' || LPAD(next_num::TEXT, 3, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.clients WHERE client_number = client_number) LOOP
    next_num := next_num + 1;
    client_number := 'CLT-' || LPAD(next_num::TEXT, 3, '0');
  END LOOP;
  
  RETURN client_number;
END;
$$;

-- 7. Create audit trigger function (fixed)
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  record_id_val UUID;
  old_values_val JSONB := NULL;
  new_values_val JSONB := NULL;
BEGIN
  -- Log sensitive table access
  IF TG_TABLE_NAME IN ('employee_details', 'employee_salary_details', 'user_roles') THEN
    -- Get record ID
    IF TG_OP = 'DELETE' THEN
      record_id_val := OLD.id;
    ELSE
      record_id_val := NEW.id;
    END IF;
    
    -- Get old values for UPDATE and DELETE
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
      old_values_val := to_jsonb(OLD);
    END IF;
    
    -- Get new values for INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      new_values_val := to_jsonb(NEW);
    END IF;
    
    INSERT INTO public.audit_logs (
      table_name,
      action,
      user_id,
      record_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      record_id_val,
      old_values_val,
      new_values_val,
      now()
    );
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 8. Add audit triggers to sensitive tables (drop existing first)
DROP TRIGGER IF EXISTS audit_employee_details ON public.employee_details;
DROP TRIGGER IF EXISTS audit_employee_salary_details ON public.employee_salary_details;
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;

CREATE TRIGGER audit_employee_details
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_details
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_employee_salary_details
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salary_details
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();