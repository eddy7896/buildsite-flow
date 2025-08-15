-- Fix search_path security issues for encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_ssn(ssn_text TEXT, encryption_key TEXT DEFAULT 'emp_ssn_key_2024')
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

-- Fix search_path security issues for decryption function
CREATE OR REPLACE FUNCTION public.decrypt_ssn(encrypted_ssn TEXT, encryption_key TEXT DEFAULT 'emp_ssn_key_2024')
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
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'hr'::public.app_role)) THEN
    RETURN '***-**-****'; -- Return masked value for non-authorized users
  END IF;
  RETURN convert_from(decrypt(decode(encrypted_ssn, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$;