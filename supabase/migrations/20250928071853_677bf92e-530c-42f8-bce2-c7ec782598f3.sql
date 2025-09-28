-- Fix the security definer view warning by removing security_barrier
-- The security_barrier property makes views behave like SECURITY DEFINER
-- Instead, we rely on RLS policies for security

DROP VIEW IF EXISTS public.employee_basic_info;

-- Recreate the view without security_barrier to eliminate the security definer warning
-- This view will use standard RLS policies instead of security_barrier for better security
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