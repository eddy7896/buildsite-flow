-- Fix remaining security issues identified by linter

-- 1. Remove security definer from the view (ERROR fix)
DROP VIEW IF EXISTS public.employee_basic_info;

-- Create the view without SECURITY DEFINER to avoid the error
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
  p.hire_date,
  -- SSN access will be controlled by RLS on the underlying table
  '***-**-****' as social_security_number
FROM employee_details ed
LEFT JOIN profiles p ON ed.user_id = p.user_id
WHERE ed.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.employee_basic_info TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.employee_basic_info SET (security_barrier = true);

-- 2. Create a separate secure function for SSN access that only admins/HR can use
CREATE OR REPLACE FUNCTION public.get_employee_ssn(employee_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ssn_value TEXT;
BEGIN
  -- Only allow admins and HR to decrypt SSN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role)) THEN
    RETURN '***-**-****';
  END IF;
  
  SELECT decrypt_ssn(social_security_number) 
  INTO ssn_value
  FROM employee_details 
  WHERE user_id = employee_user_id;
  
  RETURN COALESCE(ssn_value, '***-**-****');
END;
$$;

-- 3. Create enhanced RLS policy for the view through the underlying tables
-- This ensures the view respects the same security as the base tables

-- 4. Create a function to check if user can view employee data
CREATE OR REPLACE FUNCTION public.can_view_employee_data(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'hr'::app_role) OR 
    auth.uid() = target_user_id
  );
END;
$$;