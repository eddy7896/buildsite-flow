-- Phase 2: Enhanced Role Structure and Granular Permissions (Final Fix)

-- First ensure the app_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM (
            'super_admin', 'ceo', 'cto', 'cfo', 'coo', 'admin', 'operations_manager',
            'department_head', 'team_lead', 'project_manager', 'hr', 'finance_manager', 
            'sales_manager', 'marketing_manager', 'quality_assurance', 'it_support', 
            'legal_counsel', 'business_analyst', 'customer_success', 'employee', 
            'contractor', 'intern'
        );
    END IF;
END$$;

-- 1. Create permissions system
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create role permissions mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- 3. Create department-specific role assignments
CREATE TABLE IF NOT EXISTS public.department_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, department_id, role)
);

-- 4. Create role change requests table
CREATE TABLE IF NOT EXISTS public.role_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  existing_role app_role,
  requested_role app_role NOT NULL,
  reason text,
  requested_by uuid NOT NULL,
  approved_by uuid,
  rejected_by uuid,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approval_reason text,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Create feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_enabled boolean DEFAULT false,
  required_roles app_role[],
  required_permissions text[],
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Insert core permissions
INSERT INTO public.permissions (name, description, category) VALUES
-- Financial permissions
('view_payroll', 'View payroll data', 'financial'),
('manage_payroll', 'Create and modify payroll', 'financial'),
('view_invoices', 'View invoices', 'financial'),
('manage_invoices', 'Create and modify invoices', 'financial'),
('view_payments', 'View payment records', 'financial'),
('manage_payments', 'Process payments', 'financial'),
('view_financial_reports', 'View financial reports', 'financial'),
('manage_budgets', 'Manage departmental budgets', 'financial'),

-- Employee management permissions
('view_employee_data', 'View employee information', 'hr'),
('manage_employee_data', 'Create and modify employee records', 'hr'),
('view_salary_data', 'View employee salary information', 'hr'),
('manage_salary_data', 'Modify employee salaries', 'hr'),
('approve_leave_requests', 'Approve leave requests', 'hr'),
('manage_departments', 'Create and modify departments', 'hr'),

-- Project management permissions
('view_projects', 'View project information', 'projects'),
('manage_projects', 'Create and modify projects', 'projects'),
('assign_tasks', 'Assign tasks to team members', 'projects'),
('view_time_tracking', 'View time tracking data', 'projects'),
('manage_clients', 'Manage client relationships', 'projects'),

-- System administration permissions
('manage_users', 'Create and manage user accounts', 'system'),
('manage_roles', 'Assign and modify user roles', 'system'),
('view_audit_logs', 'View system audit logs', 'system'),
('manage_system_settings', 'Modify system configuration', 'system'),
('view_analytics', 'View system analytics', 'system')
ON CONFLICT (name) DO NOTHING;

-- Create enhanced permission checking function
CREATE OR REPLACE FUNCTION public.has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_val text;
BEGIN
  -- Get user's primary role
  SELECT role::text INTO user_role_val
  FROM public.user_roles ur
  WHERE ur.user_id = user_id
  ORDER BY CASE ur.role
    WHEN 'super_admin' THEN 1
    WHEN 'ceo' THEN 2
    WHEN 'cfo' THEN 3
    ELSE 99
  END
  LIMIT 1;

  -- Check if role has the permission
  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.role::text = user_role_val
      AND p.name = permission_name
      AND rp.granted = true
      AND p.is_active = true
  );
END;
$$;

-- Create RLS policies for new tables
CREATE POLICY "Authenticated users can view active permissions"
ON public.permissions FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Super admins can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view role permissions"
ON public.role_permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create basic feature flags
INSERT INTO public.feature_flags (name, description, is_enabled, required_roles) VALUES
('advanced_analytics', 'Access to advanced analytics dashboard', true, ARRAY['super_admin', 'ceo', 'cfo']::app_role[]),
('financial_management', 'Access to financial management features', true, ARRAY['super_admin', 'cfo', 'finance_manager']::app_role[]),
('employee_management', 'Access to employee management features', true, ARRAY['super_admin', 'ceo', 'hr', 'admin']::app_role[]),
('system_administration', 'Access to system administration features', true, ARRAY['super_admin']::app_role[])
ON CONFLICT (name) DO NOTHING;