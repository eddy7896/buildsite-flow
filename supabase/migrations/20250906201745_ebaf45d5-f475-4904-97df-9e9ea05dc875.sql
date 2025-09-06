-- Complete RLS policies for Phase 2 tables

-- Complete department_roles policies
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

-- Department roles policies
CREATE POLICY "Department roles viewable by authorized users"
ON public.department_roles FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'hr'::app_role) OR
  user_id = auth.uid()
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

-- Feature flags policies
CREATE POLICY "Users can view active feature flags"
ON public.feature_flags FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add role permission mappings for the roles
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'super_admin'::app_role, id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING; -- Super admin gets all permissions

-- CFO permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'cfo'::app_role, id FROM public.permissions 
WHERE category IN ('financial', 'hr', 'projects', 'system')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Finance Manager permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'finance_manager'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_payroll', 'manage_payroll', 'view_invoices', 'manage_invoices',
  'view_payments', 'manage_payments', 'view_financial_reports', 'manage_budgets',
  'view_employee_data', 'view_projects', 'view_analytics'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- HR permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'hr'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_employee_data', 'manage_employee_data', 'approve_leave_requests',
  'manage_departments', 'view_projects'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Admin permissions (reduced from previous)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_employee_data', 'manage_employee_data', 'manage_departments',
  'view_projects', 'manage_projects', 'manage_clients', 'manage_users',
  'view_analytics'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Department Head permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'department_head'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_employee_data', 'view_projects', 'manage_projects', 'assign_tasks',
  'view_time_tracking', 'approve_leave_requests'
)
ON CONFLICT (role, permission_id) DO NOTHING;