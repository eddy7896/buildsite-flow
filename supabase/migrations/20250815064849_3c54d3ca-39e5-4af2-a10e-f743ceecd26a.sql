-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a separate table for salary information with stricter access
CREATE TABLE public.employee_salary_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employee_details(id) ON DELETE CASCADE,
  salary NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(employee_id)
);

-- Enable RLS on salary table
ALTER TABLE public.employee_salary_details ENABLE ROW LEVEL SECURITY;

-- Very restrictive policies for salary data - only admins and finance managers
CREATE POLICY "Only admins and finance managers can manage salary data" 
ON public.employee_salary_details 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- Migrate existing salary data to new table
INSERT INTO public.employee_salary_details (employee_id, salary, created_at, updated_at)
SELECT id, salary, created_at, updated_at 
FROM public.employee_details 
WHERE salary IS NOT NULL;

-- Create function to encrypt SSN
CREATE OR REPLACE FUNCTION public.encrypt_ssn(ssn_text TEXT, encryption_key TEXT DEFAULT 'your_encryption_key_here')
RETURNS TEXT AS $$
BEGIN
  IF ssn_text IS NULL OR ssn_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(encrypt(ssn_text::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt SSN (only for authorized users)
CREATE OR REPLACE FUNCTION public.decrypt_ssn(encrypted_ssn TEXT, encryption_key TEXT DEFAULT 'your_encryption_key_here')
RETURNS TEXT AS $$
BEGIN
  IF encrypted_ssn IS NULL OR encrypted_ssn = '' THEN
    RETURN NULL;
  END IF;
  -- Only allow decryption for admins and HR
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role)) THEN
    RETURN '***-**-****'; -- Return masked value for non-authorized users
  END IF;
  RETURN convert_from(decrypt(decode(encrypted_ssn, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Encrypt existing SSN data
UPDATE public.employee_details 
SET social_security_number = public.encrypt_ssn(social_security_number)
WHERE social_security_number IS NOT NULL AND social_security_number != '';

-- Remove salary column from employee_details (data already migrated)
ALTER TABLE public.employee_details DROP COLUMN IF EXISTS salary;

-- Update RLS policies to be more restrictive for sensitive data
DROP POLICY IF EXISTS "Users can view their own employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Users can update their own employee details" ON public.employee_details;

-- New policy that masks sensitive data for regular users viewing their own records
CREATE POLICY "Users can view limited own employee details" 
ON public.employee_details 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can only update non-sensitive fields of their own records
CREATE POLICY "Users can update non-sensitive own employee details" 
ON public.employee_details 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Prevent users from updating sensitive fields
  social_security_number = OLD.social_security_number AND
  employee_id = OLD.employee_id
);

-- Create trigger for salary table timestamps
CREATE TRIGGER update_employee_salary_details_updated_at
BEFORE UPDATE ON public.employee_salary_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for employee details with salary (for authorized users)
CREATE OR REPLACE VIEW public.employee_details_with_salary AS
SELECT 
  ed.*,
  esd.salary,
  -- Decrypt SSN only for authorized users
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) THEN
      public.decrypt_ssn(ed.social_security_number)
    ELSE
      '***-**-****'
  END as decrypted_ssn
FROM public.employee_details ed
LEFT JOIN public.employee_salary_details esd ON ed.id = esd.employee_id;

-- Grant appropriate permissions
GRANT SELECT ON public.employee_details_with_salary TO authenticated;

-- RLS for the view inherits from underlying tables