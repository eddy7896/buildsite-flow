-- Add comprehensive role system with hierarchy
-- First, drop the existing enum and recreate with all roles
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM (
  -- Executive Level
  'super_admin',           -- Agency owner/founder
  'ceo',                   -- Chief Executive Officer
  'cto',                   -- Chief Technology Officer
  'cfo',                   -- Chief Financial Officer
  'coo',                   -- Chief Operations Officer
  
  -- Management Level  
  'admin',                 -- General administrator
  'operations_manager',    -- Operations oversight
  'department_head',       -- Department leadership
  'team_lead',            -- Team/project leadership
  'project_manager',       -- Project management
  
  -- Specialized Roles
  'hr',                   -- Human Resources
  'finance_manager',      -- Financial management
  'sales_manager',        -- Sales and business development
  'marketing_manager',    -- Marketing and communications
  'quality_assurance',    -- QA and compliance
  'it_support',          -- IT and technical support
  'legal_counsel',       -- Legal and compliance
  'business_analyst',    -- Analysis and reporting
  'customer_success',    -- Client relationship management
  
  -- General Staff
  'employee',            -- General employee
  'contractor',          -- Temporary/contract worker
  'intern'               -- Internship/trainee
);

-- Recreate the has_role function with the new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Recreate the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'ceo' THEN 2
      WHEN 'cto' THEN 3
      WHEN 'cfo' THEN 4
      WHEN 'coo' THEN 5
      WHEN 'admin' THEN 6
      WHEN 'operations_manager' THEN 7
      WHEN 'department_head' THEN 8
      WHEN 'team_lead' THEN 9
      WHEN 'project_manager' THEN 10
      WHEN 'hr' THEN 11
      WHEN 'finance_manager' THEN 12
      WHEN 'sales_manager' THEN 13
      WHEN 'marketing_manager' THEN 14
      WHEN 'quality_assurance' THEN 15
      WHEN 'it_support' THEN 16
      WHEN 'legal_counsel' THEN 17
      WHEN 'business_analyst' THEN 18
      WHEN 'customer_success' THEN 19
      WHEN 'employee' THEN 20
      WHEN 'contractor' THEN 21
      WHEN 'intern' THEN 22
      ELSE 99
    END
  LIMIT 1
$function$;

-- Create role hierarchy function to check if user has role or higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
    AND CASE ur.role
      WHEN 'super_admin' THEN 1
      WHEN 'ceo' THEN 2
      WHEN 'cto' THEN 3
      WHEN 'cfo' THEN 4
      WHEN 'coo' THEN 5
      WHEN 'admin' THEN 6
      WHEN 'operations_manager' THEN 7
      WHEN 'department_head' THEN 8
      WHEN 'team_lead' THEN 9
      WHEN 'project_manager' THEN 10
      WHEN 'hr' THEN 11
      WHEN 'finance_manager' THEN 12
      WHEN 'sales_manager' THEN 13
      WHEN 'marketing_manager' THEN 14
      WHEN 'quality_assurance' THEN 15
      WHEN 'it_support' THEN 16
      WHEN 'legal_counsel' THEN 17
      WHEN 'business_analyst' THEN 18
      WHEN 'customer_success' THEN 19
      WHEN 'employee' THEN 20
      WHEN 'contractor' THEN 21
      WHEN 'intern' THEN 22
      ELSE 99
    END <= CASE _min_role
      WHEN 'super_admin' THEN 1
      WHEN 'ceo' THEN 2
      WHEN 'cto' THEN 3
      WHEN 'cfo' THEN 4
      WHEN 'coo' THEN 5
      WHEN 'admin' THEN 6
      WHEN 'operations_manager' THEN 7
      WHEN 'department_head' THEN 8
      WHEN 'team_lead' THEN 9
      WHEN 'project_manager' THEN 10
      WHEN 'hr' THEN 11
      WHEN 'finance_manager' THEN 12
      WHEN 'sales_manager' THEN 13
      WHEN 'marketing_manager' THEN 14
      WHEN 'quality_assurance' THEN 15
      WHEN 'it_support' THEN 16
      WHEN 'legal_counsel' THEN 17
      WHEN 'business_analyst' THEN 18
      WHEN 'customer_success' THEN 19
      WHEN 'employee' THEN 20
      WHEN 'contractor' THEN 21
      WHEN 'intern' THEN 22
      ELSE 99
    END
  )
$function$;

-- Add department field to profiles table for department-based role management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.profiles(id);

-- Add role metadata table for additional role information
CREATE TABLE IF NOT EXISTS public.role_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  department_restricted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert role metadata
INSERT INTO public.role_metadata (role, display_name, description, permissions, department_restricted) VALUES
('super_admin', 'Super Admin', 'Agency owner with full system access', '["*"]', false),
('ceo', 'Chief Executive Officer', 'Executive leadership and strategic oversight', '["view_all", "manage_executives", "view_reports"]', false),
('cto', 'Chief Technology Officer', 'Technology strategy and IT oversight', '["manage_tech", "view_projects", "manage_it"]', false),
('cfo', 'Chief Financial Officer', 'Financial strategy and oversight', '["manage_finance", "view_reports", "manage_budgets"]', false),
('coo', 'Chief Operations Officer', 'Operations strategy and management', '["manage_operations", "view_reports", "manage_departments"]', false),
('admin', 'Administrator', 'System administration and user management', '["manage_users", "view_reports", "manage_settings"]', false),
('operations_manager', 'Operations Manager', 'Day-to-day operations management', '["manage_operations", "view_team", "manage_processes"]', true),
('department_head', 'Department Head', 'Department leadership and management', '["manage_department", "view_team", "assign_tasks"]', true),
('team_lead', 'Team Lead', 'Team leadership and project coordination', '["manage_team", "create_projects", "assign_members"]', true),
('project_manager', 'Project Manager', 'Project planning and execution', '["manage_projects", "view_team", "track_progress"]', true),
('hr', 'Human Resources', 'Employee lifecycle and HR processes', '["manage_hr", "view_employees", "manage_leave"]', false),
('finance_manager', 'Finance Manager', 'Financial operations and reporting', '["manage_finance", "view_reports", "process_payments"]', false),
('sales_manager', 'Sales Manager', 'Sales operations and client management', '["manage_sales", "view_clients", "manage_leads"]', true),
('marketing_manager', 'Marketing Manager', 'Marketing campaigns and communications', '["manage_marketing", "view_analytics", "manage_content"]', true),
('quality_assurance', 'Quality Assurance', 'Quality control and compliance', '["manage_quality", "view_projects", "audit_processes"]', true),
('it_support', 'IT Support', 'Technical support and system maintenance', '["manage_it", "view_tickets", "system_admin"]', false),
('legal_counsel', 'Legal Counsel', 'Legal advice and compliance oversight', '["manage_legal", "view_contracts", "compliance_review"]', false),
('business_analyst', 'Business Analyst', 'Data analysis and business intelligence', '["view_analytics", "generate_reports", "analyze_data"]', true),
('customer_success', 'Customer Success', 'Client relationship and success management', '["manage_clients", "view_projects", "track_satisfaction"]', true),
('employee', 'Employee', 'General employee with standard access', '["view_own", "update_profile", "submit_requests"]', true),
('contractor', 'Contractor', 'Temporary contractor with limited access', '["view_assigned", "update_profile", "submit_timesheets"]', true),
('intern', 'Intern', 'Intern with supervised access', '["view_assigned", "update_profile", "submit_reports"]', true)
ON CONFLICT (role) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  department_restricted = EXCLUDED.department_restricted,
  updated_at = now();