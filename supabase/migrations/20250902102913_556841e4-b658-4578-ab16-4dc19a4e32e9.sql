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