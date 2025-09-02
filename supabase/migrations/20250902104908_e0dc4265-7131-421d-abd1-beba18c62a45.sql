-- Fix Security Definer View security issues
-- Convert table-valued functions from SECURITY DEFINER to SECURITY INVOKER
-- and ensure RLS policies handle the security

-- Drop and recreate get_employee_full_details as SECURITY INVOKER
DROP FUNCTION IF EXISTS public.get_employee_full_details(uuid);

CREATE OR REPLACE FUNCTION public.get_employee_full_details(target_user_id uuid)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  employee_id text, 
  first_name text, 
  last_name text, 
  employment_type text, 
  is_active boolean, 
  full_name text, 
  phone text, 
  department text, 
  emp_position text, 
  hire_date date, 
  social_security_number text
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  -- The function now relies on RLS policies instead of internal role checks
  -- RLS policies on employee_details and profiles tables will handle access control
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
$function$;

-- Drop and recreate list_employees as SECURITY INVOKER
DROP FUNCTION IF EXISTS public.list_employees();

CREATE OR REPLACE FUNCTION public.list_employees()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  employee_id text, 
  first_name text, 
  last_name text, 
  employment_type text, 
  is_active boolean, 
  full_name text, 
  phone text, 
  department text, 
  emp_position text, 
  hire_date date
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  -- The function now relies on RLS policies instead of internal role checks
  -- RLS policies on employee_details and profiles tables will handle access control
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
END;
$function$;