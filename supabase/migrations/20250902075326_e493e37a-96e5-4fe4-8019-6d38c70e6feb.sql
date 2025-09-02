-- Final security implementation - fixed syntax error

-- 1. Keep the view simple without any security annotations
DROP VIEW IF EXISTS public.employee_basic_info;

CREATE VIEW public.employee_basic_info AS
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
  p.hire_date
FROM employee_details ed
LEFT JOIN profiles p ON ed.user_id = p.user_id
WHERE ed.is_active = true;

-- Grant access to authenticated users
GRANT SELECT ON public.employee_basic_info TO authenticated;

-- 2. Create a secure function for accessing SSN data specifically for authorized users
CREATE OR REPLACE FUNCTION public.get_employee_full_details(target_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  employment_type TEXT,
  is_active BOOLEAN,
  full_name TEXT,
  phone TEXT,
  department TEXT,
  emp_position TEXT,
  hire_date DATE,
  social_security_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user has permission to view this employee data
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'hr'::app_role) OR 
    auth.uid() = target_user_id
  ) THEN
    -- Return empty result if no permission
    RETURN;
  END IF;
  
  RETURN QUERY
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
    p.position as emp_position,
    p.hire_date,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role)
      THEN decrypt_ssn(ed.social_security_number)
      ELSE '***-**-****'
    END as social_security_number
  FROM employee_details ed
  LEFT JOIN profiles p ON ed.user_id = p.user_id
  WHERE ed.user_id = target_user_id
    AND ed.is_active = true;
END;
$$;

-- 3. Create a function for listing employees without sensitive data
CREATE OR REPLACE FUNCTION public.list_employees()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  employment_type TEXT,
  is_active BOOLEAN,
  full_name TEXT,
  phone TEXT,
  department TEXT,
  emp_position TEXT,
  hire_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user has permission to view employee data
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'hr'::app_role)
  ) THEN
    -- Regular employees can only see their own data
    RETURN QUERY
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
      p.position as emp_position,
      p.hire_date
    FROM employee_details ed
    LEFT JOIN profiles p ON ed.user_id = p.user_id
    WHERE ed.user_id = auth.uid()
      AND ed.is_active = true;
  ELSE
    -- Admins and HR can see all employees
    RETURN QUERY
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
      p.position as emp_position,
      p.hire_date
    FROM employee_details ed
    LEFT JOIN profiles p ON ed.user_id = p.user_id
    WHERE ed.is_active = true
    ORDER BY ed.first_name, ed.last_name;
  END IF;
END;
$$;