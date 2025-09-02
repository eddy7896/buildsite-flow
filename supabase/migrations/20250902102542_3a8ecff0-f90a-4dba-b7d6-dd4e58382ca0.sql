-- First, check and recreate the user_roles table if needed
-- Drop and recreate the app_role enum
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

-- Recreate user_roles table with the new enum
CREATE TABLE IF NOT EXISTS public.user_roles_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid,
  agency_id uuid,
  UNIQUE(user_id, role)
);

-- Migrate existing data if it exists
INSERT INTO public.user_roles_new (id, user_id, role, assigned_at, assigned_by, agency_id)
SELECT 
  id, 
  user_id, 
  CASE 
    WHEN role::text = 'admin' THEN 'admin'::app_role
    WHEN role::text = 'hr' THEN 'hr'::app_role
    WHEN role::text = 'finance_manager' THEN 'finance_manager'::app_role
    WHEN role::text = 'employee' THEN 'employee'::app_role
    WHEN role::text = 'super_admin' THEN 'super_admin'::app_role
    ELSE 'employee'::app_role
  END,
  assigned_at,
  assigned_by,
  agency_id
FROM public.user_roles 
WHERE EXISTS (SELECT 1 FROM public.user_roles LIMIT 1);

-- Drop old table and rename new one
DROP TABLE IF EXISTS public.user_roles CASCADE;
ALTER TABLE public.user_roles_new RENAME TO user_roles;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Super admins can manage roles in their agency" 
ON public.user_roles 
FOR ALL 
USING ((agency_id = get_user_agency_id()) AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Recreate functions
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