-- Phase 1B: Authentication Security Hardening

-- Set proper OTP expiry to 5 minutes (300 seconds) instead of default 24 hours
-- This needs to be configured in Supabase dashboard under Authentication > Settings
-- Adding a configuration reminder in audit logs
INSERT INTO public.audit_logs (
  table_name,
  action,
  user_id,
  old_values,
  new_values
) VALUES (
  'auth_config',
  'SECURITY_CONFIG_REMINDER',
  NULL,
  jsonb_build_object('status', 'requires_manual_configuration'),
  jsonb_build_object(
    'otp_expiry_required', '300 seconds (5 minutes)',
    'password_leak_protection', 'must be enabled',
    'instructions', 'Configure in Supabase Dashboard > Authentication > Settings'
  )
);

-- Create session timeout management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "users_own_sessions" ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

-- Only system can manage sessions (for cleanup)
CREATE POLICY "system_manage_sessions" ON public.user_sessions
FOR ALL
USING (auth.uid() IS NULL); -- System operations

-- Failed login tracking table
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on failed login attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed login attempts
CREATE POLICY "admins_view_failed_logins" ON public.failed_login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Account lockout tracking
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on account lockouts
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage lockouts
CREATE POLICY "admins_manage_lockouts" ON public.account_lockouts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record 
  FROM public.account_lockouts 
  WHERE email = user_email 
    AND locked_until > now() 
    AND unlocked_at IS NULL
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RETURN FOUND;
END;
$$;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
  user_email TEXT,
  client_ip INET DEFAULT NULL,
  client_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  recent_attempts INTEGER;
  lockout_duration INTERVAL := '15 minutes';
  max_attempts INTEGER := 5;
BEGIN
  -- Record the failed attempt
  INSERT INTO public.failed_login_attempts (email, ip_address, user_agent)
  VALUES (user_email, client_ip, client_user_agent);
  
  -- Count recent failed attempts (last 15 minutes)
  SELECT COUNT(*) INTO recent_attempts
  FROM public.failed_login_attempts
  WHERE email = user_email
    AND attempt_time > now() - lockout_duration;
  
  -- If max attempts reached, create lockout
  IF recent_attempts >= max_attempts THEN
    -- Check if already locked
    IF NOT public.is_account_locked(user_email) THEN
      INSERT INTO public.account_lockouts (email, locked_until, failed_attempts, ip_address)
      VALUES (user_email, now() + lockout_duration, recent_attempts, client_ip);
    END IF;
    RETURN TRUE; -- Account is locked
  END IF;
  
  RETURN FALSE; -- Account is not locked
END;
$$;

-- Function to unlock account (for admins)
CREATE OR REPLACE FUNCTION public.unlock_account(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Only admins can unlock accounts
  IF NOT (has_role(current_user_id, 'admin'::app_role) OR 
          has_role(current_user_id, 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Only administrators can unlock accounts';
  END IF;
  
  -- Update lockout record
  UPDATE public.account_lockouts
  SET unlocked_at = now(), unlocked_by = current_user_id
  WHERE email = user_email 
    AND locked_until > now() 
    AND unlocked_at IS NULL;
  
  -- Log the unlock action
  INSERT INTO public.audit_logs (
    table_name,
    action,
    user_id,
    old_values,
    new_values
  ) VALUES (
    'account_lockouts',
    'ACCOUNT_UNLOCKED',
    current_user_id,
    jsonb_build_object('email', user_email),
    jsonb_build_object('unlocked_by', current_user_id, 'unlocked_at', now())
  );
  
  RETURN TRUE;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Delete expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR last_activity < now() - interval '30 minutes';
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log cleanup action
  INSERT INTO public.audit_logs (
    table_name,
    action,
    user_id,
    old_values,
    new_values
  ) VALUES (
    'user_sessions',
    'CLEANUP_EXPIRED',
    NULL,
    jsonb_build_object('sessions_cleaned', cleanup_count),
    jsonb_build_object('cleanup_time', now())
  );
  
  RETURN cleanup_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_time ON public.failed_login_attempts(email, attempt_time);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email_active ON public.account_lockouts(email, locked_until) WHERE unlocked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON public.user_sessions(expires_at, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON public.user_sessions(last_activity) WHERE is_active = true;