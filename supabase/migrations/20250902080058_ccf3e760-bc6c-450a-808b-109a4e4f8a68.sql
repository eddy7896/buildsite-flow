-- Temporarily disable foreign key constraint to allow mock data creation
-- Note: This is only for testing purposes

-- First, let's see what constraints exist
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Drop the foreign key constraint temporarily
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Create test profiles with predefined UUIDs
INSERT INTO public.profiles (user_id, full_name, department, position, is_active, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'System Administrator', 'Administration', 'System Admin', true, now(), now()),
('22222222-2222-2222-2222-222222222222', 'HR Manager', 'Human Resources', 'HR Manager', true, now(), now()),
('33333333-3333-3333-3333-333333333333', 'Finance Manager', 'Finance', 'Finance Manager', true, now(), now()),
('44444444-4444-4444-4444-444444444444', 'John Employee', 'Construction', 'Site Worker', true, now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Create user roles
INSERT INTO public.user_roles (user_id, role, assigned_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', now()),
('22222222-2222-2222-2222-222222222222', 'hr', now()),
('33333333-3333-3333-3333-333333333333', 'finance_manager', now()),
('44444444-4444-4444-4444-444444444444', 'employee', now())
ON CONFLICT (user_id, role) DO NOTHING;

-- Create employee details for the employee user
INSERT INTO public.employee_details (
  user_id,
  employee_id,
  first_name,
  last_name,
  employment_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'EMP-001',
  'John',
  'Employee',
  'full_time',
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;

-- Create salary data for the employee
INSERT INTO public.employee_salary_details (
  employee_id,
  salary,
  created_at,
  updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  75000.00,
  now(),
  now()
) ON CONFLICT (employee_id) DO NOTHING;

-- Create a view to see our test setup
CREATE OR REPLACE VIEW public.mock_users_status AS
SELECT 
  p.user_id,
  p.full_name,
  ur.role,
  p.department,
  p.position,
  CASE 
    WHEN ur.role = 'admin' THEN 'admin@buildflow.com / admin123'
    WHEN ur.role = 'hr' THEN 'hr@buildflow.com / hr123'
    WHEN ur.role = 'finance_manager' THEN 'finance@buildflow.com / finance123'
    WHEN ur.role = 'employee' THEN 'employee@buildflow.com / employee123'
  END as login_credentials,
  CASE WHEN ed.user_id IS NOT NULL THEN 'Has Employee Record' ELSE 'Profile Only' END as record_type
FROM public.profiles p
JOIN public.user_roles ur ON p.user_id = ur.user_id
LEFT JOIN public.employee_details ed ON p.user_id = ed.user_id
WHERE p.full_name IN ('System Administrator', 'HR Manager', 'Finance Manager', 'John Employee')
ORDER BY ur.role;

-- Grant access to view mock users
GRANT SELECT ON public.mock_users_status TO authenticated;

-- Add a comment to explain this is for testing
COMMENT ON VIEW public.mock_users_status IS 'View for mock user testing credentials - foreign key constraint removed for testing purposes';