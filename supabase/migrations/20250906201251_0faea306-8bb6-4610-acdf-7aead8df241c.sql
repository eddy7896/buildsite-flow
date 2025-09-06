-- Phase 2: Enhanced Role Structure and Granular Permissions

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
  current_role app_role,
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

-- Create role permission mappings
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'super_admin'::app_role, id FROM public.permissions; -- Super admin gets all permissions

-- CFO permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'cfo'::app_role, id FROM public.permissions 
WHERE category IN ('financial', 'hr', 'projects', 'system');

-- Finance Manager permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'finance_manager'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_payroll', 'manage_payroll', 'view_invoices', 'manage_invoices',
  'view_payments', 'manage_payments', 'view_financial_reports', 'manage_budgets',
  'view_employee_data', 'view_projects', 'view_analytics'
);

-- HR permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'hr'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_employee_data', 'manage_employee_data', 'approve_leave_requests',
  'manage_departments', 'view_projects'
);

-- Admin permissions (reduced from previous)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_employee_data', 'manage_employee_data', 'manage_departments',
  'view_projects', 'manage_projects', 'manage_clients', 'manage_users',
  'view_analytics'
);

-- Department Head permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'department_head'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_employee_data', 'view_projects', 'manage_projects', 'assign_tasks',
  'view_time_tracking', 'approve_leave_requests'
);

-- Create enhanced permission checking function
CREATE OR REPLACE FUNCTION public.has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_val app_role;
BEGIN
  -- Get user's primary role
  SELECT role INTO user_role_val
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
    WHERE rp.role = user_role_val
      AND p.name = permission_name
      AND rp.granted = true
      AND p.is_active = true
  );
END;
$$;

-- Create department-based access function
CREATE OR REPLACE FUNCTION public.can_access_department_data(target_dept_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_role text;
  current_user_dept uuid;
BEGIN
  -- Get current user's role and department
  SELECT ur.role::text INTO current_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  -- Super admins, CEOs, CFOs can access all departments
  IF current_user_role IN ('super_admin', 'ceo', 'cfo') THEN
    RETURN true;
  END IF;

  -- HR can access all departments
  IF current_user_role = 'hr' THEN
    RETURN true;
  END IF;

  -- Department heads and managers can only access their own department
  IF current_user_role IN ('department_head', 'admin') THEN
    SELECT d.id INTO current_user_dept
    FROM public.departments d
    JOIN public.profiles p ON p.department = d.name
    WHERE p.user_id = auth.uid()
    LIMIT 1;
    
    RETURN current_user_dept = target_dept_id;
  END IF;

  RETURN false;
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

CREATE POLICY "Department roles viewable by authorized users"
ON public.department_roles FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr'::app_role) OR
  user_id = auth.uid() OR
  can_access_department_data(department_id)
);

CREATE POLICY "Authorized users can manage department roles"
ON public.department_roles FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr'::app_role) OR
  has_role(auth.uid(), 'department_head'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr'::app_role) OR
  has_role(auth.uid(), 'department_head'::app_role)
);

CREATE POLICY "Users can view their role change requests"
ON public.role_change_requests FOR SELECT
USING (
  user_id = auth.uid() OR
  requested_by = auth.uid() OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'ceo'::app_role) OR
  has_role(auth.uid(), 'hr'::app_role)
);

CREATE POLICY "Authorized users can create role change requests"
ON public.role_change_requests FOR INSERT
WITH CHECK (
  requested_by = auth.uid() AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'department_head'::app_role))
);

CREATE POLICY "Authorized users can approve role changes"
ON public.role_change_requests FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'ceo'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'ceo'::app_role)
);

CREATE POLICY "Users can view active feature flags"
ON public.feature_flags FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for role change request notifications
CREATE OR REPLACE FUNCTION public.notify_role_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Notify approvers when new request is created
  IF TG_OP = 'INSERT' THEN
    -- Create notifications for users who can approve
    INSERT INTO public.notifications (user_id, type, category, title, message, metadata, priority)
    SELECT 
      ur.user_id,
      'in_app',
      'role_change',
      'New Role Change Request',
      'A new role change request requires your approval',
      jsonb_build_object('request_id', NEW.id, 'requested_role', NEW.requested_role),
      'high'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'ceo');
    
    RETURN NEW;
  END IF;
  
  -- Notify requestor when status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'in_app',
      'role_change',
      'Role Change Request ' || INITCAP(NEW.status),
      'Your role change request has been ' || NEW.status || '.',
      jsonb_build_object('request_id', NEW.id, 'status', NEW.status),
      CASE NEW.status 
        WHEN 'approved' THEN 'normal'
        WHEN 'rejected' THEN 'high'
        ELSE 'normal'
      END
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER role_change_request_notifications
  AFTER INSERT OR UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_role_change_request();

-- Add updated_at trigger for role change requests
CREATE TRIGGER update_role_change_requests_updated_at
  BEFORE UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();