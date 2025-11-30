-- ============================================================================
-- PHASE 2: BUSINESS TABLES MIGRATION
-- ============================================================================
-- Complete schema for all remaining business tables
-- This migration builds on Phase 1 (Core Authentication Schema)
-- 
-- Tables created in this migration:
-- 1. Agencies & Multi-Tenancy
-- 2. Departments & Team Management
-- 3. Projects & Tasks
-- 4. Clients & Financial
-- 5. Invoices & Quotations
-- 6. Job Costing
-- 7. CRM (Leads, Activities)
-- 8. Financial Accounting
-- 9. GST Compliance
-- 10. Expense & Reimbursement
-- 11. Calendar & Events
-- 12. Reporting
-- 13. Subscription & Billing
--
-- Total: 45+ tables with complete schema
-- ============================================================================

-- ============================================================================
-- SECTION 1: AGENCIES & MULTI-TENANCY TABLES
-- ============================================================================

-- Agencies table for multi-tenant support
CREATE TABLE public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_plan TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 50
);

CREATE INDEX idx_agencies_domain ON public.agencies(domain);
CREATE INDEX idx_agencies_is_active ON public.agencies(is_active);
CREATE INDEX idx_agencies_created_at ON public.agencies(created_at);

-- Agency settings for configuration
CREATE TABLE public.agency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  agency_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_settings_agency_id ON public.agency_settings(agency_id);

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies
CREATE POLICY "Super admins can manage their agency"
ON public.agencies 
FOR ALL 
USING (
  id IN (
    SELECT p.agency_id 
    FROM public.profiles p 
    JOIN public.user_roles ur ON p.user_id = ur.user_id 
    WHERE p.user_id = public.current_user_id() AND ur.role = 'super_admin'::public.app_role
  )
);

CREATE POLICY "Users can view their agency"
ON public.agencies 
FOR SELECT 
USING (
  id IN (
    SELECT agency_id 
    FROM public.profiles 
    WHERE user_id = public.current_user_id()
  )
);

-- RLS Policies for agency_settings
CREATE POLICY "Users can view their agency settings"
ON public.agency_settings 
FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Super admins can manage their agency settings"
ON public.agency_settings 
FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND 
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- Triggers
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_settings_updated_at
  BEFORE UPDATE ON public.agency_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 2: DEPARTMENTS & TEAM MANAGEMENT TABLES
-- ============================================================================

-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  budget NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, agency_id)
);

CREATE INDEX idx_departments_agency_id ON public.departments(agency_id);
CREATE INDEX idx_departments_manager_id ON public.departments(manager_id);
CREATE INDEX idx_departments_parent_id ON public.departments(parent_department_id);
CREATE INDEX idx_departments_is_active ON public.departments(is_active);

-- Team assignments table
CREATE TABLE public.team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  position_title TEXT,
  role_in_department TEXT DEFAULT 'member' CHECK (role_in_department IN ('member', 'lead', 'supervisor', 'manager')),
  reporting_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL DEFAULT public.current_user_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  UNIQUE(user_id, department_id, is_active)
);

CREATE INDEX idx_team_assignments_user_id ON public.team_assignments(user_id);
CREATE INDEX idx_team_assignments_department_id ON public.team_assignments(department_id);
CREATE INDEX idx_team_assignments_agency_id ON public.team_assignments(agency_id);
CREATE INDEX idx_team_assignments_reporting_to ON public.team_assignments(reporting_to);

-- Department hierarchy table
CREATE TABLE public.department_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  parent_department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  hierarchy_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  UNIQUE(department_id, parent_department_id)
);

CREATE INDEX idx_department_hierarchy_department_id ON public.department_hierarchy(department_id);
CREATE INDEX idx_department_hierarchy_parent_id ON public.department_hierarchy(parent_department_id);
CREATE INDEX idx_department_hierarchy_agency_id ON public.department_hierarchy(agency_id);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_assignment_id UUID NOT NULL REFERENCES public.team_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_role TEXT DEFAULT 'member' CHECK (team_role IN ('member', 'lead', 'supervisor')),
  assigned_by UUID NOT NULL DEFAULT public.current_user_id(),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  UNIQUE(team_assignment_id, user_id)
);

CREATE INDEX idx_team_members_team_assignment_id ON public.team_members(team_assignment_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_agency_id ON public.team_members(agency_id);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Users can view departments in their agency" 
ON public.departments FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins can manage all departments" 
ON public.departments FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Department managers can update their departments" 
ON public.departments FOR UPDATE 
USING (
  agency_id = public.get_user_agency_id() AND 
  manager_id = public.current_user_id()
);

-- RLS Policies for team_assignments
CREATE POLICY "Users can view team assignments in their agency" 
ON public.team_assignments FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage team assignments" 
ON public.team_assignments FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for department_hierarchy
CREATE POLICY "Users can view department hierarchy in their agency" 
ON public.department_hierarchy FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins can manage department hierarchy" 
ON public.department_hierarchy FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for team_members
CREATE POLICY "Users can view team members in their agency" 
ON public.team_members FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage team members" 
ON public.team_members FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Triggers
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_assignments_updated_at
  BEFORE UPDATE ON public.team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 3: CLIENTS TABLE
-- ============================================================================

CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  industry TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  contact_person TEXT,
  contact_position TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_created_at ON public.clients(created_at);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_agency_id ON public.clients(agency_id);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view clients"
ON public.clients
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage clients"
ON public.clients
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR 
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 4: PROJECTS & TASKS TABLES
-- ============================================================================

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12, 2) DEFAULT 0,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  assigned_team TEXT,
  progress NUMERIC(3, 0) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_agency_id ON public.projects(agency_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL DEFAULT public.current_user_id(),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  estimated_hours NUMERIC(10, 2),
  actual_hours NUMERIC(10, 2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_agency_id ON public.tasks(agency_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Task assignments table
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'assignee' CHECK (role IN ('assignee', 'reviewer', 'observer')),
  assigned_by UUID NOT NULL DEFAULT public.current_user_id(),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX idx_task_assignments_agency_id ON public.task_assignments(agency_id);

-- Task comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT public.current_user_id(),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX idx_task_comments_agency_id ON public.task_comments(agency_id);

-- Task time tracking table
CREATE TABLE public.task_time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT public.current_user_id(),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  hours_logged NUMERIC(10, 2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_time_tracking_task_id ON public.task_time_tracking(task_id);
CREATE INDEX idx_task_time_tracking_user_id ON public.task_time_tracking(user_id);
CREATE INDEX idx_task_time_tracking_agency_id ON public.task_time_tracking(agency_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_time_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their agency" 
ON public.projects FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage projects" 
ON public.projects FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their agency" 
ON public.tasks FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update tasks assigned to them" 
ON public.tasks FOR UPDATE 
USING (
  agency_id = public.get_user_agency_id() AND (
    assignee_id = public.current_user_id() OR
    id IN (SELECT task_id FROM public.task_assignments WHERE user_id = public.current_user_id())
  )
);

CREATE POLICY "Admins can manage all tasks" 
ON public.tasks FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for task_assignments
CREATE POLICY "Users can view task assignments in their agency" 
ON public.task_assignments FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins can manage task assignments" 
ON public.task_assignments FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for task_comments
CREATE POLICY "Users can view task comments in their agency" 
ON public.task_comments FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can add comments to tasks they can access" 
ON public.task_comments FOR INSERT 
WITH CHECK (
  agency_id = public.get_user_agency_id() AND
  task_id IN (
    SELECT id FROM public.tasks WHERE 
    agency_id = public.get_user_agency_id() AND (
      assignee_id = public.current_user_id() OR
      created_by = public.current_user_id() OR
      id IN (SELECT task_id FROM public.task_assignments WHERE user_id = public.current_user_id())
    )
  )
);

-- RLS Policies for task_time_tracking
CREATE POLICY "Users can view time tracking in their agency" 
ON public.task_time_tracking FOR SELECT 
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can track time on assigned tasks" 
ON public.task_time_tracking FOR ALL 
USING (
  agency_id = public.get_user_agency_id() AND (
    user_id = public.current_user_id() OR
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 5: INVOICES & QUOTATIONS TABLES
-- ============================================================================

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100) - COALESCE(discount, 0)) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_agency_id ON public.invoices(agency_id);

-- Quotation templates table
CREATE TABLE public.quotation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_content JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotation_templates_is_active ON public.quotation_templates(is_active);

-- Quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.quotation_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
  total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100)) STORED,
  terms_conditions TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_client_id ON public.quotations(client_id);
CREATE INDEX idx_quotations_valid_until ON public.quotations(valid_until);
CREATE INDEX idx_quotations_agency_id ON public.quotations(agency_id);

-- Quotation line items table
CREATE TABLE public.quotation_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  line_total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price * (100 - COALESCE(discount_percentage, 0)) / 100) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotation_line_items_quotation_id ON public.quotation_line_items(quotation_id);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Authenticated users can view invoices"
ON public.invoices
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and Finance can manage invoices"
ON public.invoices
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for quotations
CREATE POLICY "Authenticated users can view quotations"
ON public.quotations
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and Finance can manage quotations"
ON public.quotations
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Triggers
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotation_templates_updated_at
  BEFORE UPDATE ON public.quotation_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 6: JOB COSTING TABLES
-- ============================================================================

-- Job categories table
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_categories_name ON public.job_categories(name);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.job_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  estimated_hours NUMERIC(10, 2),
  actual_hours NUMERIC(10, 2) DEFAULT 0,
  estimated_cost NUMERIC(12, 2),
  actual_cost NUMERIC(12, 2) DEFAULT 0,
  budget NUMERIC(12, 2),
  profit_margin NUMERIC(5, 2),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_jobs_job_number ON public.jobs(job_number);
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_agency_id ON public.jobs(agency_id);

-- Job cost items table
CREATE TABLE public.job_cost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('labor', 'materials', 'equipment', 'overhead', 'other')),
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10, 2) NOT NULL,
  total_cost NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  vendor TEXT,
  date_incurred DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_cost_items_job_id ON public.job_cost_items(job_id);
CREATE INDEX idx_job_cost_items_category ON public.job_cost_items(category);

-- Enable RLS
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cost_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view job categories"
ON public.job_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins and HR can manage job categories"
ON public.job_categories
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

CREATE POLICY "Authenticated users can view jobs"
ON public.jobs
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and Finance can manage jobs"
ON public.jobs
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Triggers
CREATE TRIGGER update_job_categories_updated_at
  BEFORE UPDATE ON public.job_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 7: CRM TABLES
-- ============================================================================

-- Lead sources table
CREATE TABLE public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_sources_is_active ON public.lead_sources(is_active);

-- Leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_number TEXT NOT NULL UNIQUE,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  lead_source_id UUID REFERENCES public.lead_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_value NUMERIC(12, 2),
  probability NUMERIC(3, 0) DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_leads_lead_number ON public.leads(lead_number);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_priority ON public.leads(priority);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_agency_id ON public.leads(agency_id);

-- CRM activities table
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_crm_activities_lead_id ON public.crm_activities(lead_id);
CREATE INDEX idx_crm_activities_client_id ON public.crm_activities(client_id);
CREATE INDEX idx_crm_activities_activity_type ON public.crm_activities(activity_type);
CREATE INDEX idx_crm_activities_status ON public.crm_activities(status);
CREATE INDEX idx_crm_activities_agency_id ON public.crm_activities(agency_id);

-- Sales pipeline table
CREATE TABLE public.sales_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  probability_percentage NUMERIC(3, 0) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_pipeline_stage_order ON public.sales_pipeline(stage_order);

-- Enable RLS
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view lead sources"
ON public.lead_sources
FOR SELECT
USING (true);

CREATE POLICY "Admins and HR can manage lead sources"
ON public.lead_sources
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

CREATE POLICY "Authenticated users can view leads"
ON public.leads
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage leads"
ON public.leads
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Users can view and update leads assigned to them"
ON public.leads
FOR UPDATE
USING (assigned_to = public.current_user_id());

CREATE POLICY "Authenticated users can view CRM activities"
ON public.crm_activities
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Authenticated users can manage their own CRM activities"
ON public.crm_activities
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    created_by = public.current_user_id() OR assigned_to = public.current_user_id()
  )
);

CREATE POLICY "Admins and HR can manage all CRM activities"
ON public.crm_activities
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Authenticated users can view sales pipeline"
ON public.sales_pipeline
FOR SELECT
USING (true);

CREATE POLICY "Admins and HR can manage sales pipeline"
ON public.sales_pipeline
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- Triggers
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 8: FINANCIAL ACCOUNTING TABLES
-- ============================================================================

-- Chart of accounts table
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_chart_of_accounts_account_code ON public.chart_of_accounts(account_code);
CREATE INDEX idx_chart_of_accounts_account_type ON public.chart_of_accounts(account_type);
CREATE INDEX idx_chart_of_accounts_is_active ON public.chart_of_accounts(is_active);

-- Journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  reference TEXT,
  total_debit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_credit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_journal_entries_entry_number ON public.journal_entries(entry_number);
CREATE INDEX idx_journal_entries_entry_date ON public.journal_entries(entry_date);
CREATE INDEX idx_journal_entries_status ON public.journal_entries(status);
CREATE INDEX idx_journal_entries_agency_id ON public.journal_entries(agency_id);

-- Journal entry lines table
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
  description TEXT,
  debit_amount NUMERIC(12, 2) DEFAULT 0,
  credit_amount NUMERIC(12, 2) DEFAULT 0,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_entry_lines_journal_entry_id ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account_id ON public.journal_entry_lines(account_id);

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view chart of accounts"
ON public.chart_of_accounts
FOR SELECT
USING (true);

CREATE POLICY "Admins and Finance can manage chart of accounts"
ON public.chart_of_accounts
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

CREATE POLICY "Authenticated users can view journal entries"
ON public.journal_entries
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and Finance can manage journal entries"
ON public.journal_entries
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Authenticated users can view journal entry lines"
ON public.journal_entry_lines
FOR SELECT
USING (true);

CREATE POLICY "Admins and Finance can manage journal entry lines"
ON public.journal_entry_lines
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- Triggers
CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 9: HR & ATTENDANCE TABLES
-- ============================================================================

-- Leave types table
CREATE TABLE public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_days_per_year INTEGER DEFAULT 30,
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_leave_types_is_active ON public.leave_types(is_active);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_agency_id ON public.leave_requests(agency_id);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  break_start_time TIMESTAMP WITH TIME ZONE,
  break_end_time TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(10, 2) DEFAULT 0,
  overtime_hours NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
  notes TEXT,
  location TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);
CREATE INDEX idx_attendance_status ON public.attendance(status);
CREATE INDEX idx_attendance_agency_id ON public.attendance(agency_id);

-- Payroll periods table
CREATE TABLE public.payroll_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pay_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payroll_periods_status ON public.payroll_periods(status);
CREATE INDEX idx_payroll_periods_start_date ON public.payroll_periods(start_date);

-- Payroll table
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  overtime_pay NUMERIC(12, 2) DEFAULT 0,
  bonuses NUMERIC(12, 2) DEFAULT 0,
  deductions NUMERIC(12, 2) DEFAULT 0,
  gross_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_deductions NUMERIC(12, 2) DEFAULT 0,
  net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  hours_worked NUMERIC(10, 2) DEFAULT 0,
  overtime_hours NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  UNIQUE(employee_id, payroll_period_id)
);

CREATE INDEX idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX idx_payroll_period_id ON public.payroll(payroll_period_id);
CREATE INDEX idx_payroll_status ON public.payroll(status);
CREATE INDEX idx_payroll_agency_id ON public.payroll(agency_id);

-- Enable RLS
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_types
CREATE POLICY "Everyone can view leave types"
ON public.leave_types
FOR SELECT
USING (true);

CREATE POLICY "Admins and HR can manage leave types"
ON public.leave_types
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
ON public.leave_requests
FOR SELECT
USING (employee_id = public.current_user_id());

CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (employee_id = public.current_user_id());

CREATE POLICY "Users can update their own pending leave requests"
ON public.leave_requests
FOR UPDATE
USING (employee_id = public.current_user_id() AND status = 'pending');

CREATE POLICY "Admins and HR can manage all leave requests"
ON public.leave_requests
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance
FOR SELECT
USING (employee_id = public.current_user_id());

CREATE POLICY "Users can create their own attendance"
ON public.attendance
FOR INSERT
WITH CHECK (employee_id = public.current_user_id());

CREATE POLICY "Users can update their own attendance"
ON public.attendance
FOR UPDATE
USING (employee_id = public.current_user_id());

CREATE POLICY "Admins and HR can manage all attendance"
ON public.attendance
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- RLS Policies for payroll_periods
CREATE POLICY "Authenticated users can view payroll periods"
ON public.payroll_periods
FOR SELECT
USING (true);

CREATE POLICY "Admins, HR, and Finance can manage payroll periods"
ON public.payroll_periods
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
  public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- RLS Policies for payroll
CREATE POLICY "Users can view their own payroll"
ON public.payroll
FOR SELECT
USING (employee_id = public.current_user_id());

CREATE POLICY "Admins, HR, and Finance can manage all payroll"
ON public.payroll
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Triggers
CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at
  BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 10: GST COMPLIANCE TABLES
-- ============================================================================

-- GST settings table
CREATE TABLE public.gst_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  gstin TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  business_type TEXT NOT NULL DEFAULT 'regular' CHECK (business_type IN ('regular', 'composition', 'casual', 'non_resident')),
  filing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (filing_frequency IN ('monthly', 'quarterly', 'annual')),
  composition_scheme BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gst_settings_agency_id ON public.gst_settings(agency_id);
CREATE INDEX idx_gst_settings_is_active ON public.gst_settings(is_active);

-- GST returns table
CREATE TABLE public.gst_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  return_type TEXT NOT NULL CHECK (return_type IN ('GSTR1', 'GSTR3B', 'GSTR9', 'GSTR4')),
  filing_period DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'late', 'cancelled')),
  total_taxable_value NUMERIC(15, 2) DEFAULT 0,
  total_tax_amount NUMERIC(15, 2) DEFAULT 0,
  cgst_amount NUMERIC(15, 2) DEFAULT 0,
  sgst_amount NUMERIC(15, 2) DEFAULT 0,
  igst_amount NUMERIC(15, 2) DEFAULT 0,
  cess_amount NUMERIC(15, 2) DEFAULT 0,
  filed_date TIMESTAMP WITH TIME ZONE,
  acknowledgment_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gst_returns_agency_id ON public.gst_returns(agency_id);
CREATE INDEX idx_gst_returns_return_type ON public.gst_returns(return_type);
CREATE INDEX idx_gst_returns_status ON public.gst_returns(status);
CREATE INDEX idx_gst_returns_filing_period ON public.gst_returns(filing_period);

-- GST transactions table
CREATE TABLE public.gst_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'purchase', 'credit_note', 'debit_note')),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  customer_gstin TEXT,
  customer_name TEXT NOT NULL,
  place_of_supply TEXT,
  hsn_sac_code TEXT,
  description TEXT,
  quantity NUMERIC(10, 2) DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL,
  taxable_value NUMERIC(15, 2) NOT NULL,
  cgst_rate NUMERIC(5, 2) DEFAULT 0,
  sgst_rate NUMERIC(5, 2) DEFAULT 0,
  igst_rate NUMERIC(5, 2) DEFAULT 0,
  cess_rate NUMERIC(5, 2) DEFAULT 0,
  cgst_amount NUMERIC(15, 2) DEFAULT 0,
  sgst_amount NUMERIC(15, 2) DEFAULT 0,
  igst_amount NUMERIC(15, 2) DEFAULT 0,
  cess_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gst_transactions_agency_id ON public.gst_transactions(agency_id);
CREATE INDEX idx_gst_transactions_transaction_type ON public.gst_transactions(transaction_type);
CREATE INDEX idx_gst_transactions_invoice_date ON public.gst_transactions(invoice_date);

-- Enable RLS
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their agency GST settings"
ON public.gst_settings
FOR ALL
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can manage their agency GST returns"
ON public.gst_returns
FOR ALL
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can manage their agency GST transactions"
ON public.gst_transactions
FOR ALL
USING (agency_id = public.get_user_agency_id());

-- Triggers
CREATE TRIGGER update_gst_settings_updated_at
  BEFORE UPDATE ON public.gst_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gst_returns_updated_at
  BEFORE UPDATE ON public.gst_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gst_transactions_updated_at
  BEFORE UPDATE ON public.gst_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 11: EXPENSE & REIMBURSEMENT TABLES
-- ============================================================================

-- Expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_categories_is_active ON public.expense_categories(is_active);

-- Reimbursement requests table
CREATE TABLE public.reimbursement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  business_purpose TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_reimbursement_requests_employee_id ON public.reimbursement_requests(employee_id);
CREATE INDEX idx_reimbursement_requests_status ON public.reimbursement_requests(status);
CREATE INDEX idx_reimbursement_requests_expense_date ON public.reimbursement_requests(expense_date);
CREATE INDEX idx_reimbursement_requests_agency_id ON public.reimbursement_requests(agency_id);

-- Reimbursement attachments table
CREATE TABLE public.reimbursement_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reimbursement_id UUID NOT NULL REFERENCES public.reimbursement_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reimbursement_attachments_reimbursement_id ON public.reimbursement_attachments(reimbursement_id);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view expense categories"
ON public.expense_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins and Finance can manage expense categories"
ON public.expense_categories
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

CREATE POLICY "Employees can view their own reimbursement requests"
ON public.reimbursement_requests
FOR SELECT
USING (employee_id = public.current_user_id());

CREATE POLICY "Employees can create their own reimbursement requests"
ON public.reimbursement_requests
FOR INSERT
WITH CHECK (employee_id = public.current_user_id());

CREATE POLICY "Employees can update their own draft reimbursement requests"
ON public.reimbursement_requests
FOR UPDATE
USING (employee_id = public.current_user_id() AND status = 'draft');

CREATE POLICY "Finance and admins can view all reimbursement requests"
ON public.reimbursement_requests
FOR SELECT
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Finance and admins can update reimbursement requests"
ON public.reimbursement_requests
FOR UPDATE
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Employees can view attachments for their own requests"
ON public.reimbursement_attachments
FOR SELECT
USING (
  reimbursement_id IN (
    SELECT id FROM public.reimbursement_requests WHERE employee_id = public.current_user_id()
  )
);

CREATE POLICY "Employees can manage attachments for their own requests"
ON public.reimbursement_attachments
FOR ALL
USING (
  reimbursement_id IN (
    SELECT id FROM public.reimbursement_requests WHERE employee_id = public.current_user_id()
  )
);

CREATE POLICY "Finance and admins can view all attachments"
ON public.reimbursement_attachments
FOR SELECT
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- Triggers
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reimbursement_requests_updated_at
  BEFORE UPDATE ON public.reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 12: CALENDAR & EVENTS TABLES
-- ============================================================================

-- Company events table
CREATE TABLE public.company_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'conference', 'training', 'holiday', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  color TEXT DEFAULT '#3b82f6',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  attendees JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_company_events_agency_id ON public.company_events(agency_id);
CREATE INDEX idx_company_events_start_date ON public.company_events(start_date);
CREATE INDEX idx_company_events_event_type ON public.company_events(event_type);

-- Holidays table
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_company_holiday BOOLEAN DEFAULT true,
  is_national_holiday BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_holidays_agency_id ON public.holidays(agency_id);
CREATE INDEX idx_holidays_date ON public.holidays(date);

-- Calendar settings table
CREATE TABLE public.calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  show_birthdays BOOLEAN DEFAULT true,
  show_leave_requests BOOLEAN DEFAULT true,
  show_company_events BOOLEAN DEFAULT true,
  show_holidays BOOLEAN DEFAULT true,
  default_view TEXT DEFAULT 'month' CHECK (default_view IN ('day', 'week', 'month', 'year')),
  working_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb,
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_settings_agency_id ON public.calendar_settings(agency_id);

-- Enable RLS
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view events in their agency"
ON public.company_events
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage events"
ON public.company_events
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Users can view holidays in their agency"
ON public.holidays
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins and HR can manage holidays"
ON public.holidays
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Users can view calendar settings in their agency"
ON public.calendar_settings
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Admins can manage calendar settings"
ON public.calendar_settings
FOR ALL
USING (
  agency_id = public.get_user_agency_id() AND (
    public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
    public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
  )
);

-- Triggers
CREATE TRIGGER update_company_events_updated_at
  BEFORE UPDATE ON public.company_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON public.calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 13: REPORTING TABLES
-- ============================================================================

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('attendance', 'payroll', 'leave', 'employee', 'project', 'financial', 'gst', 'custom')),
  parameters JSONB DEFAULT '{}'::jsonb,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_report_type ON public.reports(report_type);
CREATE INDEX idx_reports_generated_by ON public.reports(generated_by);
CREATE INDEX idx_reports_generated_at ON public.reports(generated_at);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public reports"
ON public.reports
FOR SELECT
USING (is_public = true OR generated_by = public.current_user_id());

CREATE POLICY "Admins, HR, and Finance can manage reports"
ON public.reports
FOR ALL
USING (
  public.has_role(public.current_user_id(), 'admin'::public.app_role) OR
  public.has_role(public.current_user_id(), 'hr'::public.app_role) OR
  public.has_role(public.current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(public.current_user_id(), 'super_admin'::public.app_role)
);

-- ============================================================================
-- SECTION 14: SUBSCRIPTION & BILLING TABLES
-- ============================================================================

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  max_users INTEGER,
  max_agencies INTEGER,
  max_storage_gb INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_plans_is_active ON public.subscription_plans(is_active);

-- Plan features table
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  feature_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_features_feature_key ON public.plan_features(feature_key);
CREATE INDEX idx_plan_features_is_active ON public.plan_features(is_active);

-- Plan feature mappings table
CREATE TABLE public.plan_feature_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.plan_features(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

CREATE INDEX idx_plan_feature_mappings_plan_id ON public.plan_feature_mappings(plan_id);
CREATE INDEX idx_plan_feature_mappings_feature_id ON public.plan_feature_mappings(feature_id);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feature_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (public.has_role(public.current_user_id(), 'super_admin'::public.app_role));

CREATE POLICY "Authenticated users can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage plan features"
ON public.plan_features
FOR ALL
USING (public.has_role(public.current_user_id(), 'super_admin'::public.app_role));

CREATE POLICY "Authenticated users can view active plan features"
ON public.plan_features
FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage plan feature mappings"
ON public.plan_feature_mappings
FOR ALL
USING (public.has_role(public.current_user_id(), 'super_admin'::public.app_role));

CREATE POLICY "Authenticated users can view plan feature mappings"
ON public.plan_feature_mappings
FOR SELECT
USING (true);

-- Triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 15: UTILITY FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to calculate GST liability
CREATE OR REPLACE FUNCTION public.calculate_gst_liability(
  p_agency_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  total_taxable_value NUMERIC,
  total_cgst NUMERIC,
  total_sgst NUMERIC,
  total_igst NUMERIC,
  total_cess NUMERIC,
  total_tax NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(gt.taxable_value), 0) as total_taxable_value,
    COALESCE(SUM(gt.cgst_amount), 0) as total_cgst,
    COALESCE(SUM(gt.sgst_amount), 0) as total_sgst,
    COALESCE(SUM(gt.igst_amount), 0) as total_igst,
    COALESCE(SUM(gt.cess_amount), 0) as total_cess,
    COALESCE(SUM(gt.cgst_amount + gt.sgst_amount + gt.igst_amount + gt.cess_amount), 0) as total_tax
  FROM public.gst_transactions gt
  WHERE gt.agency_id = p_agency_id
    AND gt.invoice_date BETWEEN p_start_date AND p_end_date
    AND gt.transaction_type IN ('sale', 'debit_note');
END;
$$;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.invoices;
  invoice_number := 'INV-' || LPAD(next_num::TEXT, 5, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = invoice_number) LOOP
    next_num := next_num + 1;
    invoice_number := 'INV-' || LPAD(next_num::TEXT, 5, '0');
  END LOOP;
  
  RETURN invoice_number;
END;
$$;

-- Function to generate quotation numbers
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
  quote_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.quotations;
  quote_number := 'QT-' || LPAD(next_num::TEXT, 5, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.quotations WHERE quote_number = quote_number) LOOP
    next_num := next_num + 1;
    quote_number := 'QT-' || LPAD(next_num::TEXT, 5, '0');
  END LOOP;
  
  RETURN quote_number;
END;
$$;

-- Function to generate job numbers
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
  job_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.jobs;
  job_number := 'JOB-' || LPAD(next_num::TEXT, 5, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.jobs WHERE job_number = job_number) LOOP
    next_num := next_num + 1;
    job_number := 'JOB-' || LPAD(next_num::TEXT, 5, '0');
  END LOOP;
  
  RETURN job_number;
END;
$$;

-- Function to generate lead numbers
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
  lead_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.leads;
  lead_number := 'LEAD-' || LPAD(next_num::TEXT, 5, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.leads WHERE lead_number = lead_number) LOOP
    next_num := next_num + 1;
    lead_number := 'LEAD-' || LPAD(next_num::TEXT, 5, '0');
  END LOOP;
  
  RETURN lead_number;
END;
$$;

-- ============================================================================
-- SECTION 16: MIGRATION COMPLETE
-- ============================================================================
-- Phase 2 business tables schema has been successfully created
-- All tables, functions, triggers, and RLS policies are in place
-- Ready for data migration and application integration
-- ============================================================================
