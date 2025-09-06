-- Create departments table for structured department management
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID,
  parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  budget NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id()
);

-- Create team assignments table for user-department relationships
CREATE TABLE public.team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  position_title TEXT,
  role_in_department TEXT DEFAULT 'member' CHECK (role_in_department IN ('member', 'lead', 'supervisor', 'manager')),
  reporting_to UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id(),
  UNIQUE(user_id, department_id, is_active)
);

-- Create department hierarchy table for organizational structure
CREATE TABLE public.department_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  parent_department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  hierarchy_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id(),
  UNIQUE(department_id, parent_department_id)
);

-- Create team members table for team composition tracking
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_assignment_id UUID NOT NULL REFERENCES public.team_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_role TEXT DEFAULT 'member' CHECK (team_role IN ('member', 'lead', 'supervisor')),
  assigned_by UUID NOT NULL DEFAULT auth.uid(),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id(),
  UNIQUE(team_assignment_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Users can view departments in their agency" 
ON public.departments FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins can manage all departments" 
ON public.departments FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Department managers can update their departments" 
ON public.departments FOR UPDATE 
USING (
  agency_id = get_user_agency_id() AND 
  manager_id = auth.uid()
);

-- RLS Policies for team assignments
CREATE POLICY "Users can view team assignments in their agency" 
ON public.team_assignments FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins and HR can manage team assignments" 
ON public.team_assignments FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Department managers can manage their team assignments" 
ON public.team_assignments FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  department_id IN (
    SELECT id FROM departments WHERE manager_id = auth.uid()
  )
);

-- RLS Policies for department hierarchy
CREATE POLICY "Users can view department hierarchy in their agency" 
ON public.department_hierarchy FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins can manage department hierarchy" 
ON public.department_hierarchy FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- RLS Policies for team members
CREATE POLICY "Users can view team members in their agency" 
ON public.team_members FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins and HR can manage team members" 
ON public.team_members FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_assignments_updated_at
  BEFORE UPDATE ON public.team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_departments_agency_id ON public.departments(agency_id);
CREATE INDEX idx_departments_manager_id ON public.departments(manager_id);
CREATE INDEX idx_departments_parent_id ON public.departments(parent_department_id);
CREATE INDEX idx_team_assignments_user_id ON public.team_assignments(user_id);
CREATE INDEX idx_team_assignments_department_id ON public.team_assignments(department_id);
CREATE INDEX idx_team_assignments_agency_id ON public.team_assignments(agency_id);
CREATE INDEX idx_department_hierarchy_department_id ON public.department_hierarchy(department_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- Migrate existing department data from profiles table
INSERT INTO public.departments (name, agency_id, is_active)
SELECT DISTINCT 
  COALESCE(department, 'General') as name,
  agency_id,
  true
FROM public.profiles 
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (name) DO NOTHING;