-- Phase 1: Multi-tenant Database Schema Transformation

-- Step 1: Create agencies table
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

-- Step 2: Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Step 3: Add agency_id to all existing tables
ALTER TABLE public.profiles ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.employee_details ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.quotations ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.leave_requests ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.payroll ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.reimbursement_requests ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.crm_activities ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.journal_entries ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

-- Step 4: Enable RLS on agencies table
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for agencies table
CREATE POLICY "Super admins can manage their agency"
ON public.agencies 
FOR ALL 
USING (
  id IN (
    SELECT p.agency_id 
    FROM public.profiles p 
    JOIN public.user_roles ur ON p.user_id = ur.user_id 
    WHERE p.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Users can view their agency"
ON public.agencies 
FOR SELECT 
USING (
  id IN (
    SELECT agency_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Step 6: Create function to get user's agency_id
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
$$;

-- Step 7: Update existing RLS policies to include agency isolation

-- Drop existing policies and recreate with agency filtering
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "HR can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in their agency"
ON public.profiles 
FOR SELECT 
USING (
  agency_id = get_user_agency_id() OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can update their own profile"
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND agency_id = get_user_agency_id());

CREATE POLICY "Users can insert their own profile"
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update user_roles policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Super admins can manage roles in their agency"
ON public.user_roles 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can view their own roles"
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Update clients policies
DROP POLICY IF EXISTS "Authorized roles can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authorized roles can view clients" ON public.clients;

CREATE POLICY "Agency users can manage clients"
ON public.clients 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR 
   has_role(auth.uid(), 'finance_manager'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- Step 8: Create trigger to auto-assign agency_id
CREATE OR REPLACE FUNCTION public.set_agency_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get agency_id from user's profile
  SELECT agency_id INTO NEW.agency_id
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to relevant tables
CREATE TRIGGER set_agency_id_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_user();

CREATE TRIGGER set_agency_id_projects  
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_user();

CREATE TRIGGER set_agency_id_jobs
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_user();

CREATE TRIGGER set_agency_id_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_user();

-- Step 9: Update agency_settings to be per-agency
ALTER TABLE public.agency_settings ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

-- Make agency_id not nullable for agency_settings after adding the column
-- (We'll handle existing data migration separately)

CREATE POLICY "Users can view their agency settings"
ON public.agency_settings 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Super admins can manage their agency settings"
ON public.agency_settings 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  has_role(auth.uid(), 'super_admin'::app_role)
);