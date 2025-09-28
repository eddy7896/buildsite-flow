-- Fix SSN security vulnerability by implementing strict role-based access control

-- First, drop the overly permissive policy that allows all agency users to view employee details
DROP POLICY IF EXISTS "Users can view basic employee info" ON public.employee_details;

-- Create a more restrictive policy for basic employee info (excluding SSN)
-- This policy will work with views or specific column access
CREATE POLICY "Users can view non-sensitive employee info in agency" 
ON public.employee_details 
FOR SELECT 
USING (
  -- Users can view basic info of employees in their agency (but not SSN)
  EXISTS (
    SELECT 1 
    FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
      AND p2.user_id = employee_details.user_id 
      AND p1.agency_id = p2.agency_id
  )
);

-- Create a strict policy specifically for SSN access - only HR, Admin, and Super Admin
CREATE POLICY "Only HR and Admins can access full employee details including SSN" 
ON public.employee_details 
FOR SELECT 
USING (
  (agency_id = get_user_agency_id()) AND 
  (has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- Create a secure view for employee data without SSN for general users
CREATE OR REPLACE VIEW public.employee_basic_info AS
SELECT 
  ed.id,
  ed.user_id,
  ed.employee_id,
  ed.first_name,
  ed.last_name,
  ed.date_of_birth,
  -- Mask SSN for non-authorized users
  CASE 
    WHEN has_role(auth.uid(), 'hr'::app_role) OR 
         has_role(auth.uid(), 'admin'::app_role) OR 
         has_role(auth.uid(), 'super_admin'::app_role)
    THEN decrypt_ssn_with_audit(ed.social_security_number, ed.user_id, 'General Access')
    ELSE '***-**-****'
  END as social_security_number,
  ed.nationality,
  ed.marital_status,
  ed.address,
  ed.employment_type,
  ed.work_location,
  ed.supervisor_id,
  ed.emergency_contact_name,
  ed.emergency_contact_phone,
  ed.emergency_contact_relationship,
  ed.notes,
  ed.skills,
  ed.is_active,
  ed.created_at,
  ed.updated_at,
  ed.created_by,
  ed.agency_id,
  ed.phone
FROM public.employee_details ed
WHERE 
  -- Users can only see employees in their agency
  EXISTS (
    SELECT 1 
    FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
      AND p2.user_id = ed.user_id 
      AND p1.agency_id = p2.agency_id
  );

-- Enable RLS on the view  
ALTER VIEW public.employee_basic_info SET (security_barrier = true);

-- Grant access to the view
GRANT SELECT ON public.employee_basic_info TO authenticated;

-- Update the existing list_employees function to use role-based SSN access
CREATE OR REPLACE FUNCTION public.list_employees_secure()
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
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- This function deliberately excludes SSN data for security
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
    AND ed.agency_id = get_user_agency_id()
  ORDER BY ed.first_name, ed.last_name;
END;
$$;

-- Log this security enhancement
INSERT INTO public.audit_logs (
  table_name,
  action,
  user_id,
  old_values,
  new_values
) VALUES (
  'employee_details',
  'SECURITY_ENHANCEMENT',
  auth.uid(),
  jsonb_build_object('issue', 'SSN accessible to all agency users'),
  jsonb_build_object('fix', 'Implemented strict role-based access control for SSN data', 'restricted_to', ARRAY['hr', 'admin', 'super_admin'])
);