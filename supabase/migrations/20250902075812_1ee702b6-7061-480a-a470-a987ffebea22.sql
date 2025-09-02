-- Create mock user accounts for testing different roles

-- Insert mock users into auth.users (this simulates user registration)
-- Note: In production, these would be created through the signup process

-- First, let's create a function to safely insert test users
CREATE OR REPLACE FUNCTION public.create_test_user(
  user_email TEXT,
  user_password TEXT,
  user_role app_role,
  full_name TEXT,
  department TEXT DEFAULT NULL,
  position TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if user already exists in profiles (our way to check)
  SELECT user_id INTO existing_user_id 
  FROM public.profiles 
  WHERE full_name = full_name 
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    RETURN existing_user_id;
  END IF;
  
  -- Generate a UUID for the user (simulating auth.users ID)
  new_user_id := gen_random_uuid();
  
  -- Create profile
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    department, 
    position,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    full_name,
    department,
    position,
    true,
    now(),
    now()
  );
  
  -- Assign role
  INSERT INTO public.user_roles (
    user_id,
    role,
    assigned_at
  ) VALUES (
    new_user_id,
    user_role,
    now()
  );
  
  -- Create employee details if it's an employee role
  IF user_role = 'employee' THEN
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
      new_user_id,
      'EMP-' || LPAD((SELECT COUNT(*) + 1 FROM employee_details)::TEXT, 3, '0'),
      split_part(full_name, ' ', 1),
      COALESCE(split_part(full_name, ' ', 2), ''),
      'full_time',
      true,
      now(),
      now()
    );
  END IF;
  
  RETURN new_user_id;
END;
$$;

-- Create the test users
DO $$
DECLARE
  admin_id UUID;
  hr_id UUID;
  finance_id UUID;
  employee_id UUID;
BEGIN
  -- Create Admin user
  admin_id := public.create_test_user(
    'admin@buildflow.com',
    'admin123',
    'admin'::app_role,
    'System Administrator',
    'Administration',
    'System Admin'
  );
  
  -- Create HR user
  hr_id := public.create_test_user(
    'hr@buildflow.com',
    'hr123', 
    'hr'::app_role,
    'HR Manager',
    'Human Resources',
    'HR Manager'
  );
  
  -- Create Finance user
  finance_id := public.create_test_user(
    'finance@buildflow.com',
    'finance123',
    'finance_manager'::app_role,
    'Finance Manager',
    'Finance',
    'Finance Manager'
  );
  
  -- Create Employee user  
  employee_id := public.create_test_user(
    'employee@buildflow.com',
    'employee123',
    'employee'::app_role,
    'John Employee',
    'Construction',
    'Site Worker'
  );
  
  -- Add some sample employee salary for finance testing
  INSERT INTO public.employee_salary_details (
    employee_id,
    salary,
    created_at,
    updated_at
  ) VALUES (
    employee_id,
    75000.00,
    now(),
    now()
  );
  
  RAISE NOTICE 'Created test users: Admin(%), HR(%), Finance(%), Employee(%)', admin_id, hr_id, finance_id, employee_id;
END;
$$;

-- Create a view to see our test users
CREATE OR REPLACE VIEW public.test_users_overview AS
SELECT 
  p.user_id,
  p.full_name,
  ur.role,
  p.department,
  p.position,
  CASE 
    WHEN ur.role = 'admin' THEN 'admin@buildflow.com'
    WHEN ur.role = 'hr' THEN 'hr@buildflow.com' 
    WHEN ur.role = 'finance_manager' THEN 'finance@buildflow.com'
    WHEN ur.role = 'employee' THEN 'employee@buildflow.com'
  END as mock_email,
  CASE 
    WHEN ur.role = 'admin' THEN 'admin123'
    WHEN ur.role = 'hr' THEN 'hr123'
    WHEN ur.role = 'finance_manager' THEN 'finance123' 
    WHEN ur.role = 'employee' THEN 'employee123'
  END as mock_password
FROM public.profiles p
JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.full_name IN ('System Administrator', 'HR Manager', 'Finance Manager', 'John Employee');

-- Grant access to view test users
GRANT SELECT ON public.test_users_overview TO authenticated;