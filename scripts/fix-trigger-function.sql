-- Fix audit_trigger_function to use public.current_user_id() explicitly
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

