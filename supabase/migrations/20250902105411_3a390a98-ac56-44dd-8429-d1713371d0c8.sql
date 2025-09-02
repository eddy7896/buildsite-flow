-- Fix Security Definer View issues by removing problematic views
-- These views bypass RLS policies and expose data unsafely

-- Drop the employee_basic_info view as it bypasses RLS on employee_details
DROP VIEW IF EXISTS public.employee_basic_info;

-- Drop the mock_users_status view as it exposes sensitive login credentials
DROP VIEW IF EXISTS public.mock_users_status;

-- Note: Applications should query the underlying tables directly 
-- with proper RLS policies enforced instead of using these views