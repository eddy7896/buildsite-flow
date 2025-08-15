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
CREATE OR REPLACE FUNCTION public.encrypt_ssn(ssn_text TEXT, encryption_key TEXT DEFAULT 'emp_ssn_key_2024')
RETURNS TEXT AS $$
BEGIN
  IF ssn_text IS NULL OR ssn_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(encrypt(ssn_text::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt SSN (only for authorized users)
CREATE OR REPLACE FUNCTION public.decrypt_ssn(encrypted_ssn TEXT, encryption_key TEXT DEFAULT 'emp_ssn_key_2024')
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

-- Create trigger for salary table timestamps
CREATE TRIGGER update_employee_salary_details_updated_at
BEFORE UPDATE ON public.employee_salary_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();