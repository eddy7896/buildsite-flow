-- Add new role values to existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cto';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cfo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_head';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'quality_assurance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'it_support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'legal_counsel';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business_analyst';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_success';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contractor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intern';

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

-- Enable RLS on role_metadata
ALTER TABLE public.role_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for role_metadata
CREATE POLICY "Everyone can view role metadata" 
ON public.role_metadata 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

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