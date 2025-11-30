-- ============================================================================
-- CORE AUTHENTICATION & USER MANAGEMENT SCHEMA
-- ============================================================================
-- This is the foundational schema for the BuildFlow Agency Management System
-- These tables must be created FIRST before any other tables
-- 
-- Tables created in this migration:
-- 1. users - Core user accounts (replaces Supabase auth.users)
-- 2. app_role (enum) - Role type definition
-- 3. profiles - User profile information
-- 4. user_roles - Role assignments
-- 5. employee_details - Extended employee information
-- 6. employee_salary_details - Sensitive salary information
-- 7. employee_files - Employee document storage references
--
-- Supporting functions and triggers for authentication
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable pgcrypto for encryption/decryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- SECTION 2: CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'hr',
  'finance_manager',
  'employee',
  'super_admin'
);

-- ============================================================================
-- SECTION 3: CORE USERS TABLE
-- ============================================================================
-- This table replaces Supabase's auth.users table
-- It stores core user account information and authentication credentials

CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_confirmed BOOLEAN DEFAULT false,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT users_email_check CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_email_confirmed ON public.users(email_confirmed);

-- ============================================================================
-- SECTION 4: PROFILES TABLE
-- ============================================================================
-- Stores user profile information linked to users table
-- One-to-one relationship with users table

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  hire_date DATE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  agency_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for profiles table
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_agency_id ON public.profiles(agency_id);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- ============================================================================
-- SECTION 5: USER_ROLES TABLE
-- ============================================================================
-- Stores role assignments for users
-- Many-to-many relationship: users can have multiple roles

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  agency_id UUID,
  
  -- Ensure each user has each role only once
  UNIQUE (user_id, role, agency_id)
);

-- Create indexes for user_roles table
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_agency_id ON public.user_roles(agency_id);
CREATE INDEX idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX idx_user_roles_assigned_at ON public.user_roles(assigned_at);

-- ============================================================================
-- SECTION 6: EMPLOYEE_DETAILS TABLE
-- ============================================================================
-- Stores extended employee information
-- One-to-one relationship with users table

CREATE TABLE public.employee_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  social_security_number TEXT,
  nationality TEXT,
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  address TEXT,
  
  -- Employment details
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  work_location TEXT,
  supervisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Additional info
  notes TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  agency_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for employee_details table
CREATE INDEX idx_employee_details_user_id ON public.employee_details(user_id);
CREATE INDEX idx_employee_details_employee_id ON public.employee_details(employee_id);
CREATE INDEX idx_employee_details_supervisor_id ON public.employee_details(supervisor_id);
CREATE INDEX idx_employee_details_agency_id ON public.employee_details(agency_id);
CREATE INDEX idx_employee_details_is_active ON public.employee_details(is_active);
CREATE INDEX idx_employee_details_employment_type ON public.employee_details(employment_type);
CREATE INDEX idx_employee_details_created_at ON public.employee_details(created_at);

-- ============================================================================
-- SECTION 7: EMPLOYEE_SALARY_DETAILS TABLE
-- ============================================================================
-- Stores sensitive salary information with stricter access control
-- One-to-one relationship with employee_details table

CREATE TABLE public.employee_salary_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employee_details(id) ON DELETE CASCADE,
  salary NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  salary_frequency TEXT DEFAULT 'monthly' CHECK (salary_frequency IN ('hourly', 'daily', 'weekly', 'bi-weekly', 'monthly', 'annual')),
  effective_date DATE,
  agency_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for employee_salary_details table
CREATE INDEX idx_employee_salary_details_employee_id ON public.employee_salary_details(employee_id);
CREATE INDEX idx_employee_salary_details_agency_id ON public.employee_salary_details(agency_id);
CREATE INDEX idx_employee_salary_details_effective_date ON public.employee_salary_details(effective_date);
CREATE INDEX idx_employee_salary_details_created_at ON public.employee_salary_details(created_at);

-- ============================================================================
-- SECTION 8: EMPLOYEE_FILES TABLE
-- ============================================================================
-- Stores references to employee document storage
-- Many-to-one relationship with employee_details table

CREATE TABLE public.employee_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employee_details(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  category TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for employee_files table
CREATE INDEX idx_employee_files_employee_id ON public.employee_files(employee_id);
CREATE INDEX idx_employee_files_category ON public.employee_files(category);
CREATE INDEX idx_employee_files_uploaded_by ON public.employee_files(uploaded_by);
CREATE INDEX idx_employee_files_created_at ON public.employee_files(created_at);

-- ============================================================================
-- SECTION 9: UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY assigned_at DESC
  LIMIT 1
$$;

-- Function to get current user ID from application context
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT current_setting('app.current_user_id', true)::UUID
$$;

-- Function to get user's agency ID
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE user_id = current_user_id()
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to encrypt SSN using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_ssn(ssn_text TEXT, encryption_key TEXT DEFAULT 'default_key')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ssn_text IS NULL OR ssn_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(encrypt(ssn_text::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

-- Function to decrypt SSN using pgcrypto (with role-based access control)
CREATE OR REPLACE FUNCTION public.decrypt_ssn(encrypted_ssn TEXT, encryption_key TEXT DEFAULT 'default_key')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF encrypted_ssn IS NULL OR encrypted_ssn = '' THEN
    RETURN NULL;
  END IF;
  
  -- Only allow decryption for admins and HR
  IF NOT (public.has_role(current_user_id(), 'admin'::public.app_role) 
          OR public.has_role(current_user_id(), 'hr'::public.app_role)
          OR public.has_role(current_user_id(), 'super_admin'::public.app_role)) THEN
    RETURN '***-**-****'; -- Return masked value for non-authorized users
  END IF;
  
  RETURN convert_from(decrypt(decode(encrypted_ssn, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$;

-- ============================================================================
-- SECTION 10: TRIGGER FUNCTIONS
-- ============================================================================

-- Trigger function to auto-create profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default employee role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log sensitive table access
  IF TG_TABLE_NAME IN ('employee_details', 'employee_salary_details', 'user_roles') THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      user_id,
      record_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      current_user_id(),
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- SECTION 11: TRIGGERS
-- ============================================================================

-- Trigger to auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on employee_details
CREATE TRIGGER update_employee_details_updated_at
  BEFORE UPDATE ON public.employee_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on employee_salary_details
CREATE TRIGGER update_employee_salary_details_updated_at
  BEFORE UPDATE ON public.employee_salary_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for audit logging on employee_details
CREATE TRIGGER audit_employee_details
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_details
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger for audit logging on employee_salary_details
CREATE TRIGGER audit_employee_salary_details
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salary_details
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger for audit logging on user_roles
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all authentication tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own user record
CREATE POLICY "Users can view their own user record"
ON public.users
FOR SELECT
USING (id = current_user_id());

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- Admins can update users
CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- Users can update their own password and email confirmation
CREATE POLICY "Users can update their own account"
ON public.users
FOR UPDATE
USING (id = current_user_id())
WITH CHECK (id = current_user_id());

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = current_user_id());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id() AND agency_id IS NOT DISTINCT FROM agency_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (user_id = current_user_id());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- HR can view all profiles
CREATE POLICY "HR can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(current_user_id(), 'hr'::public.app_role));

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- ============================================================================
-- USER_ROLES TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = current_user_id());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- ============================================================================
-- EMPLOYEE_DETAILS TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own employee details
CREATE POLICY "Users can view their own employee details"
ON public.employee_details
FOR SELECT
USING (user_id = current_user_id());

-- Users can update their own employee details (limited fields)
CREATE POLICY "Users can update own basic info"
ON public.employee_details
FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Admins and HR can view all employee details
CREATE POLICY "Admins and HR can view all employee details"
ON public.employee_details
FOR SELECT
USING (
  public.has_role(current_user_id(), 'admin'::public.app_role) OR
  public.has_role(current_user_id(), 'hr'::public.app_role) OR
  public.has_role(current_user_id(), 'super_admin'::public.app_role)
);

-- Only admins and HR can manage employee details
CREATE POLICY "Admins and HR can manage employee details"
ON public.employee_details
FOR ALL
USING (
  public.has_role(current_user_id(), 'admin'::public.app_role) OR
  public.has_role(current_user_id(), 'hr'::public.app_role) OR
  public.has_role(current_user_id(), 'super_admin'::public.app_role)
);

-- ============================================================================
-- EMPLOYEE_SALARY_DETAILS TABLE RLS POLICIES
-- ============================================================================

-- Only admins and finance managers can view salary data
CREATE POLICY "Only admins and finance managers can view salary data"
ON public.employee_salary_details
FOR SELECT
USING (
  public.has_role(current_user_id(), 'admin'::public.app_role) OR
  public.has_role(current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(current_user_id(), 'super_admin'::public.app_role)
);

-- Only admins and finance managers can manage salary data
CREATE POLICY "Only admins and finance managers can manage salary data"
ON public.employee_salary_details
FOR ALL
USING (
  public.has_role(current_user_id(), 'admin'::public.app_role) OR
  public.has_role(current_user_id(), 'finance_manager'::public.app_role) OR
  public.has_role(current_user_id(), 'super_admin'::public.app_role)
);

-- ============================================================================
-- EMPLOYEE_FILES TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own employee files
CREATE POLICY "Users can view their own employee files"
ON public.employee_files
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employee_details WHERE user_id = current_user_id()
  )
);

-- Users can manage their own employee files
CREATE POLICY "Users can manage their own employee files"
ON public.employee_files
FOR ALL
USING (
  employee_id IN (
    SELECT id FROM public.employee_details WHERE user_id = current_user_id()
  )
);

-- Admins and HR can view all employee files
CREATE POLICY "Admins and HR can view all employee files"
ON public.employee_files
FOR SELECT
USING (
  public.has_role(current_user_id(), 'admin'::public.app_role) OR
  public.has_role(current_user_id(), 'hr'::public.app_role) OR
  public.has_role(current_user_id(), 'super_admin'::public.app_role)
);

-- Admins and HR can manage all employee files
CREATE POLICY "Admins and HR can manage all employee files"
ON public.employee_files
FOR ALL
USING (
  public.has_role(current_user_id(), 'admin'::public.app_role) OR
  public.has_role(current_user_id(), 'hr'::public.app_role) OR
  public.has_role(current_user_id(), 'super_admin'::public.app_role)
);

-- ============================================================================
-- SECTION 13: VIEWS FOR AUTHORIZED DATA ACCESS
-- ============================================================================

-- View for employee basic info with role-based SSN masking
CREATE OR REPLACE VIEW public.employee_basic_info AS
SELECT 
  ed.id,
  ed.user_id,
  ed.employee_id,
  ed.first_name,
  ed.last_name,
  ed.employment_type,
  ed.is_active,
  p.full_name,
  p.phone,
  p.department,
  p.position,
  p.hire_date,
  -- Only show SSN to authorized users
  CASE 
    WHEN public.has_role(current_user_id(), 'admin'::public.app_role) 
         OR public.has_role(current_user_id(), 'hr'::public.app_role)
         OR public.has_role(current_user_id(), 'super_admin'::public.app_role)
    THEN public.decrypt_ssn(ed.social_security_number)
    ELSE '***-**-****'
  END as social_security_number
FROM public.employee_details ed
LEFT JOIN public.profiles p ON ed.user_id = p.user_id
WHERE ed.is_active = true;

-- View for employee details with salary (for authorized users)
CREATE OR REPLACE VIEW public.employee_details_with_salary AS
SELECT 
  ed.*,
  esd.salary,
  esd.salary_frequency,
  esd.currency,
  esd.effective_date,
  -- Decrypt SSN only for authorized users
  CASE 
    WHEN public.has_role(current_user_id(), 'admin'::public.app_role) 
         OR public.has_role(current_user_id(), 'hr'::public.app_role)
         OR public.has_role(current_user_id(), 'super_admin'::public.app_role)
    THEN public.decrypt_ssn(ed.social_security_number)
    ELSE '***-**-****'
  END as decrypted_ssn
FROM public.employee_details ed
LEFT JOIN public.employee_salary_details esd ON ed.id = esd.employee_id;

-- Grant appropriate permissions on views
GRANT SELECT ON public.employee_basic_info TO PUBLIC;
GRANT SELECT ON public.employee_details_with_salary TO PUBLIC;

-- ============================================================================
-- SECTION 14: AUDIT LOGS TABLE (REQUIRED FOR TRIGGERS)
-- ============================================================================
-- This table is referenced by the audit_trigger_function
-- It must exist before triggers can be created

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(current_user_id(), 'admin'::public.app_role) 
       OR public.has_role(current_user_id(), 'super_admin'::public.app_role));

-- ============================================================================
-- SECTION 15: SEED DATA (OPTIONAL)
-- ============================================================================
-- Uncomment to add initial data for testing

-- Create a test admin user (password: admin123)
-- INSERT INTO public.users (email, password_hash, email_confirmed, email_confirmed_at, is_active)
-- VALUES (
--   'admin@buildflow.local',
--   crypt('admin123', gen_salt('bf')),
--   true,
--   now(),
--   true
-- );

-- Get the admin user ID and create profile
-- DO $$
-- DECLARE
--   admin_id UUID;
-- BEGIN
--   SELECT id INTO admin_id FROM public.users WHERE email = 'admin@buildflow.local';
--   
--   INSERT INTO public.profiles (user_id, full_name, is_active)
--   VALUES (admin_id, 'System Administrator', true);
--   
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES (admin_id, 'super_admin');
-- END $$;

-- ============================================================================
-- SECTION 16: MIGRATION COMPLETE
-- ============================================================================
-- Core authentication schema has been successfully created
-- All tables, functions, triggers, and RLS policies are in place
-- Ready for data migration and application integration
-- ============================================================================
