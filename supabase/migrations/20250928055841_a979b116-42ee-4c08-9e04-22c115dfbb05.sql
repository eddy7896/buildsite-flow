-- Fix the security definer view warning by recreating the view without security_barrier
DROP VIEW IF EXISTS public.employee_basic_info;

-- Create a secure view for employee data without SSN for general users
-- This view will use RLS policies instead of security_barrier for better security
CREATE VIEW public.employee_basic_info AS
SELECT 
  ed.id,
  ed.user_id,
  ed.employee_id,
  ed.first_name,
  ed.last_name,
  ed.date_of_birth,
  -- Always mask SSN in this view - use dedicated functions for authorized access
  '***-**-****' as social_security_number,
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

-- Grant access to the view
GRANT SELECT ON public.employee_basic_info TO authenticated;

-- Create a dedicated function for HR/Admin to access SSN data securely
CREATE OR REPLACE FUNCTION public.get_employee_ssn_authorized(employee_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ssn_value TEXT;
BEGIN
  -- Only allow HR, Admin, and Super Admin to access SSN
  IF NOT (has_role(auth.uid(), 'hr'::app_role) OR 
          has_role(auth.uid(), 'admin'::app_role) OR 
          has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: Only HR and Admin roles can access SSN data';
  END IF;
  
  -- Additional check: user must be in same agency
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
      AND p2.user_id = employee_user_id 
      AND p1.agency_id = p2.agency_id
  ) THEN
    RAISE EXCEPTION 'Access denied: Employee not in your agency';
  END IF;
  
  -- Get decrypted SSN with audit logging
  SELECT decrypt_ssn_with_audit(social_security_number, employee_user_id, 'Authorized SSN Access') 
  INTO ssn_value
  FROM employee_details 
  WHERE user_id = employee_user_id;
  
  RETURN COALESCE(ssn_value, 'N/A');
END;
$$;