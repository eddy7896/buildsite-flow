-- Fix all trigger functions to use public.current_user_id() explicitly
-- This ensures they work with SET search_path = ''

-- Fix decrypt_ssn function
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
  IF NOT (public.has_role(public.current_user_id(), 'admin'::public.app_role) 
          OR public.has_role(public.current_user_id(), 'hr'::public.app_role)
          OR public.has_role(public.current_user_id(), 'super_admin'::public.app_role)) THEN
    RETURN '***-**-****'; -- Return masked value for non-authorized users
  END IF;
  
  RETURN convert_from(decrypt(decode(encrypted_ssn, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$;

-- Fix audit_trigger_function (already done, but included for completeness)
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
      public.current_user_id(),
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

