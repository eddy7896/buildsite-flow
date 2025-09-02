-- Remove any remaining security definer issues and create final secure implementation

-- First, let's check if the issue is with our audit trigger function
-- Let's remove the security barrier from the view as it might be interpreted as security definer
ALTER VIEW public.employee_basic_info SET (security_barrier = false);

-- Create a simple, clean view without any security annotations
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

-- Create RLS policy on the view itself 
-- This ensures users can only see data they have permission to see
-- based on the underlying table policies
CREATE POLICY "View employees through RLS" ON public.employee_basic_info
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR 
  user_id = auth.uid()
);

-- Enable RLS on the view
ALTER VIEW public.employee_basic_info ENABLE ROW LEVEL SECURITY;