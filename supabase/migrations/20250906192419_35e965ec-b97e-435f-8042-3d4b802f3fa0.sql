-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id()
);

-- Create task assignments table for multiple assignees per task
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'assignee' CHECK (role IN ('assignee', 'reviewer', 'observer')),
  assigned_by UUID NOT NULL DEFAULT auth.uid(),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id(),
  UNIQUE(task_id, user_id)
);

-- Create task comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id()
);

-- Create task time tracking table
CREATE TABLE public.task_time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  hours_logged NUMERIC,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agency_id UUID DEFAULT get_user_agency_id()
);

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_time_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their agency" 
ON public.tasks FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Managers and team leads can manage tasks" 
ON public.tasks FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'operations_manager'::app_role) OR
    has_role(auth.uid(), 'department_head'::app_role) OR
    has_role(auth.uid(), 'project_manager'::app_role) OR
    has_role(auth.uid(), 'team_lead'::app_role) OR
    has_role(auth.uid(), 'sales_manager'::app_role) OR
    has_role(auth.uid(), 'marketing_manager'::app_role) OR
    assignee_id = auth.uid() OR
    created_by = auth.uid()
  )
);

CREATE POLICY "Users can update tasks assigned to them" 
ON public.tasks FOR UPDATE 
USING (
  agency_id = get_user_agency_id() AND (
    assignee_id = auth.uid() OR
    id IN (SELECT task_id FROM task_assignments WHERE user_id = auth.uid())
  )
);

-- RLS Policies for task assignments
CREATE POLICY "Users can view task assignments in their agency" 
ON public.task_assignments FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Managers and team leads can manage task assignments" 
ON public.task_assignments FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'operations_manager'::app_role) OR
    has_role(auth.uid(), 'department_head'::app_role) OR
    has_role(auth.uid(), 'project_manager'::app_role) OR
    has_role(auth.uid(), 'team_lead'::app_role) OR
    has_role(auth.uid(), 'sales_manager'::app_role) OR
    has_role(auth.uid(), 'marketing_manager'::app_role)
  )
);

-- RLS Policies for task comments
CREATE POLICY "Users can view task comments in their agency" 
ON public.task_comments FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can add comments to tasks they can access" 
ON public.task_comments FOR INSERT 
WITH CHECK (
  agency_id = get_user_agency_id() AND
  task_id IN (
    SELECT id FROM tasks WHERE 
    agency_id = get_user_agency_id() AND (
      assignee_id = auth.uid() OR
      created_by = auth.uid() OR
      id IN (SELECT task_id FROM task_assignments WHERE user_id = auth.uid())
    )
  )
);

-- RLS Policies for task time tracking
CREATE POLICY "Users can view time tracking in their agency" 
ON public.task_time_tracking FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can track time on assigned tasks" 
ON public.task_time_tracking FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'operations_manager'::app_role) OR
    has_role(auth.uid(), 'department_head'::app_role) OR
    has_role(auth.uid(), 'project_manager'::app_role) OR
    has_role(auth.uid(), 'team_lead'::app_role)
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_agency_id ON public.tasks(agency_id);
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_time_tracking_task_id ON public.task_time_tracking(task_id);