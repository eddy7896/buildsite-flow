-- First, let's recreate the app_role enum with all new roles
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

-- Recreate user_roles table with the new enum
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid,
  agency_id uuid,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Super admins can manage roles in their agency" 
ON public.user_roles 
FOR ALL 
USING (agency_id = get_user_agency_id() AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());