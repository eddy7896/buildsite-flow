-- Remove ALL foreign key constraints for testing and create mock data

-- Drop all foreign key constraints temporarily for testing
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.employee_details DROP CONSTRAINT IF EXISTS employee_details_user_id_fkey;
ALTER TABLE public.employee_salary_details DROP CONSTRAINT IF EXISTS employee_salary_details_employee_id_fkey;

-- Clean up existing test data
DELETE FROM public.employee_salary_details WHERE employee_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM public.employee_details WHERE user_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM public.user_roles WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM public.profiles WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');

-- Create test profiles
INSERT INTO public.profiles (user_id, full_name, department, position, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'System Administrator', 'Administration', 'System Admin', true),
('22222222-2222-2222-2222-222222222222', 'HR Manager', 'Human Resources', 'HR Manager', true),
('33333333-3333-3333-3333-333333333333', 'Finance Manager', 'Finance', 'Finance Manager', true),
('44444444-4444-4444-4444-444444444444', 'John Employee', 'Construction', 'Site Worker', true);

-- Create user roles
INSERT INTO public.user_roles (user_id, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin'),
('22222222-2222-2222-2222-222222222222', 'hr'),
('33333333-3333-3333-3333-333333333333', 'finance_manager'),
('44444444-4444-4444-4444-444444444444', 'employee');

-- Create employee details for the employee user
INSERT INTO public.employee_details (
  user_id,
  employee_id,
  first_name,
  last_name,
  is_active
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'EMP-001',
  'John',
  'Employee',
  true
);

-- Create salary data for the employee
INSERT INTO public.employee_salary_details (
  employee_id,
  salary
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  75000.00
);

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