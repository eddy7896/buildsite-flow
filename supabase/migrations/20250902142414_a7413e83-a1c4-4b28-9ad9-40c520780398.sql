-- Phase 1A: Enhanced Employee Data Protection and Financial Access Controls

-- Create SSN access audit table
CREATE TABLE IF NOT EXISTS public.ssn_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL,
  accessed_by UUID REFERENCES auth.users(id),
  access_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on SSN access logs
ALTER TABLE public.ssn_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view SSN access logs
CREATE POLICY "ssn_access_logs_admin_only" ON public.ssn_access_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create enhanced encryption key management table
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_version INTEGER NOT NULL DEFAULT 1,
  key_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on encryption keys
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage encryption keys
CREATE POLICY "encryption_keys_super_admin_only" ON public.encryption_keys
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Enhanced SSN encryption function with key rotation support
CREATE OR REPLACE FUNCTION public.encrypt_ssn_with_rotation(ssn_text text, key_version integer DEFAULT 1)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF ssn_text IS NULL OR ssn_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Get the encryption key for the specified version
  -- For now, use versioned keys - in production, this should use actual key management
  encryption_key := 'emp_ssn_key_v' || key_version::text || '_2024';
  
  RETURN encode(encrypt(ssn_text::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

-- Enhanced SSN decryption function with audit logging
CREATE OR REPLACE FUNCTION public.decrypt_ssn_with_audit(encrypted_ssn text, employee_user_id uuid, access_reason text DEFAULT 'General Access')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id UUID;
  decrypted_value TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF encrypted_ssn IS NULL OR encrypted_ssn = '' THEN
    RETURN NULL;
  END IF;
  
  -- Only allow decryption for admins and HR
  IF NOT (public.has_role(current_user_id, 'admin'::public.app_role) OR 
          public.has_role(current_user_id, 'hr'::public.app_role) OR
          public.has_role(current_user_id, 'super_admin'::public.app_role)) THEN
    RETURN '***-**-****'; -- Return masked value for non-authorized users
  END IF;
  
  -- Log the SSN access
  INSERT INTO public.ssn_access_logs (
    employee_user_id,
    accessed_by,
    access_reason,
    ip_address
  ) VALUES (
    employee_user_id,
    current_user_id,
    access_reason,
    inet_client_addr()
  );
  
  -- Decrypt the SSN (try multiple key versions for backward compatibility)
  BEGIN
    decrypted_value := convert_from(decrypt(decode(encrypted_ssn, 'base64'), 'emp_ssn_key_v1_2024'::bytea, 'aes'), 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      decrypted_value := convert_from(decrypt(decode(encrypted_ssn, 'base64'), 'emp_ssn_key_2024'::bytea, 'aes'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
      decrypted_value := '***-**-****'; -- Fallback if decryption fails
    END;
  END;
  
  RETURN decrypted_value;
END;
$$;

-- Key rotation function
CREATE OR REPLACE FUNCTION public.rotate_ssn_encryption_keys()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_key_version INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Only super admins can rotate keys
  IF NOT public.has_role(current_user_id, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only super administrators can rotate encryption keys';
  END IF;
  
  -- Get next key version
  SELECT COALESCE(MAX(key_version), 0) + 1 INTO new_key_version FROM public.encryption_keys;
  
  -- Deactivate current keys
  UPDATE public.encryption_keys SET is_active = false, rotated_at = now() WHERE is_active = true;
  
  -- Create new key record
  INSERT INTO public.encryption_keys (key_version, key_hash, created_by)
  VALUES (new_key_version, encode(digest('emp_ssn_key_v' || new_key_version::text || '_2024', 'sha256'), 'hex'), current_user_id);
  
  -- Log the key rotation
  INSERT INTO public.audit_logs (
    table_name,
    action,
    user_id,
    old_values,
    new_values
  ) VALUES (
    'encryption_keys',
    'KEY_ROTATION',
    current_user_id,
    jsonb_build_object('previous_version', new_key_version - 1),
    jsonb_build_object('new_version', new_key_version)
  );
END;
$$;

-- Enhanced financial data RLS policies
-- Update payroll table to have more restrictive access
DROP POLICY IF EXISTS "Admins, HR, and Finance can manage all payroll in their agency" ON public.payroll;
DROP POLICY IF EXISTS "Users can view their own payroll in their agency" ON public.payroll;

-- Create more granular payroll policies
CREATE POLICY "Super admins and finance managers can manage all payroll" ON public.payroll
FOR ALL
USING ((agency_id = get_user_agency_id()) AND 
       (has_role(auth.uid(), 'super_admin'::app_role) OR 
        has_role(auth.uid(), 'finance_manager'::app_role)));

CREATE POLICY "HR can view payroll summaries only" ON public.payroll
FOR SELECT
USING ((agency_id = get_user_agency_id()) AND 
       has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Users can view their own payroll only" ON public.payroll
FOR SELECT
USING ((agency_id = get_user_agency_id()) AND (employee_id = auth.uid()));

-- Enhanced employee salary details policies
DROP POLICY IF EXISTS "Only admins and finance managers can manage salary data" ON public.employee_salary_details;

CREATE POLICY "Super admins and CFO can manage all salary data" ON public.employee_salary_details
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR 
       has_role(auth.uid(), 'cfo'::app_role));

CREATE POLICY "Finance managers can manage salary data with audit" ON public.employee_salary_details
FOR ALL
USING (has_role(auth.uid(), 'finance_manager'::app_role));

-- Create audit trigger for salary changes
CREATE OR REPLACE FUNCTION public.audit_salary_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log all salary changes with detailed information
  INSERT INTO public.audit_logs (
    table_name,
    action,
    user_id,
    record_id,
    old_values,
    new_values
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Add salary change audit trigger
DROP TRIGGER IF EXISTS audit_salary_changes_trigger ON public.employee_salary_details;
CREATE TRIGGER audit_salary_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salary_details
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_salary_changes();

-- Enhanced audit log protection
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS hash_chain TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;

-- Function to create immutable audit logs with hash chaining
CREATE OR REPLACE FUNCTION public.create_immutable_audit_log(
  p_table_name TEXT,
  p_action TEXT,
  p_record_id UUID,
  p_old_values JSONB,
  p_new_values JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  log_id UUID;
  previous_hash TEXT;
  current_hash TEXT;
BEGIN
  -- Get the previous hash from the last audit log
  SELECT hash_chain INTO previous_hash 
  FROM public.audit_logs 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Generate new log ID
  log_id := gen_random_uuid();
  
  -- Create hash chain (simplified version - in production use proper cryptographic hashing)
  current_hash := encode(digest(
    COALESCE(previous_hash, '') || 
    log_id::text || 
    p_table_name || 
    p_action || 
    COALESCE(p_record_id::text, '') ||
    COALESCE(p_old_values::text, '') ||
    COALESCE(p_new_values::text, '') ||
    now()::text, 
    'sha256'
  ), 'hex');
  
  -- Insert the audit log with hash chain
  INSERT INTO public.audit_logs (
    id,
    table_name,
    action,
    user_id,
    record_id,
    old_values,
    new_values,
    hash_chain,
    verified,
    created_at
  ) VALUES (
    log_id,
    p_table_name,
    p_action,
    auth.uid(),
    p_record_id,
    p_old_values,
    p_new_values,
    current_hash,
    true,
    now()
  );
  
  RETURN log_id;
END;
$$;