-- Create employee_details table for extended employee information
CREATE TABLE public.employee_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  social_security_number text,
  nationality text,
  marital_status text CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  address text,
  
  -- Employment details
  salary numeric,
  employment_type text CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  work_location text,
  supervisor_id uuid REFERENCES auth.users(id),
  
  -- Emergency contact
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  
  -- Additional info
  notes text,
  skills jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins and HR can manage all employee details" 
ON public.employee_details 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Users can view their own employee details" 
ON public.employee_details 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own employee details" 
ON public.employee_details 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_employee_details_updated_at
BEFORE UPDATE ON public.employee_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create employee_files table for document storage references
CREATE TABLE public.employee_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employee_details(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  category text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on employee_files
ALTER TABLE public.employee_files ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_files
CREATE POLICY "Admins and HR can manage all employee files" 
ON public.employee_files 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Users can view their own employee files" 
ON public.employee_files 
FOR SELECT 
USING (
  employee_id IN (
    SELECT id FROM public.employee_details WHERE user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX idx_employee_details_user_id ON public.employee_details(user_id);
CREATE INDEX idx_employee_details_employee_id ON public.employee_details(employee_id);
CREATE INDEX idx_employee_details_supervisor_id ON public.employee_details(supervisor_id);
CREATE INDEX idx_employee_files_employee_id ON public.employee_files(employee_id);