-- Phase 2C: Enhanced Leave Management (Fixed)

-- Leave balances tracking
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES public.leave_types(id),
  year INTEGER NOT NULL,
  allocated_days DECIMAL(5,2) NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0,
  pending_days DECIMAL(5,2) DEFAULT 0,
  remaining_days DECIMAL(5,2) GENERATED ALWAYS AS (allocated_days - used_days - pending_days) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  agency_id UUID,
  UNIQUE(employee_id, leave_type_id, year)
);

-- Enable RLS on leave balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leave balances" ON public.leave_balances
FOR SELECT
USING ((agency_id = get_user_agency_id()) AND (employee_id = auth.uid()));

CREATE POLICY "Admins and HR can view all leave balances in their agency" ON public.leave_balances
FOR SELECT
USING ((agency_id = get_user_agency_id()) AND 
       (has_role(auth.uid(), 'admin'::app_role) OR 
        has_role(auth.uid(), 'hr'::app_role) OR
        has_role(auth.uid(), 'super_admin'::app_role)));

CREATE POLICY "Admins and HR can manage leave balances in their agency" ON public.leave_balances
FOR ALL
USING ((agency_id = get_user_agency_id()) AND 
       (has_role(auth.uid(), 'admin'::app_role) OR 
        has_role(auth.uid(), 'hr'::app_role) OR
        has_role(auth.uid(), 'super_admin'::app_role)));

-- Add unique constraint to leave_types if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leave_types_name_key' 
    AND conrelid = 'public.leave_types'::regclass
  ) THEN
    ALTER TABLE public.leave_types ADD CONSTRAINT leave_types_name_key UNIQUE (name);
  END IF;
END $$;

-- Add default leave types if they don't exist
INSERT INTO public.leave_types (name, description, max_days_per_year, is_paid, requires_approval)
SELECT 'Annual Leave', 'Regular vacation time', 25, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.leave_types WHERE name = 'Annual Leave');

INSERT INTO public.leave_types (name, description, max_days_per_year, is_paid, requires_approval)
SELECT 'Sick Leave', 'Medical leave for illness', 10, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.leave_types WHERE name = 'Sick Leave');

INSERT INTO public.leave_types (name, description, max_days_per_year, is_paid, requires_approval)
SELECT 'Personal Leave', 'Personal time off', 5, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.leave_types WHERE name = 'Personal Leave');

INSERT INTO public.leave_types (name, description, max_days_per_year, is_paid, requires_approval)
SELECT 'Maternity/Paternity Leave', 'Leave for new parents', 90, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.leave_types WHERE name = 'Maternity/Paternity Leave');

-- Function to update leave balances when requests are approved/rejected
CREATE OR REPLACE FUNCTION public.update_leave_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  leave_year INTEGER;
  employee_agency_id UUID;
BEGIN
  -- Get the year from the request
  leave_year := EXTRACT(YEAR FROM COALESCE(NEW.start_date, OLD.start_date));
  
  -- Get employee's agency
  SELECT agency_id INTO employee_agency_id 
  FROM public.profiles 
  WHERE user_id = COALESCE(NEW.employee_id, OLD.employee_id);
  
  -- Handle status changes
  IF TG_OP = 'UPDATE' THEN
    -- If request was approved (changing from pending to approved)
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      -- Move days from pending to used
      INSERT INTO public.leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, pending_days, agency_id)
      VALUES (NEW.employee_id, NEW.leave_type_id, leave_year, 0, NEW.total_days, 0, employee_agency_id)
      ON CONFLICT (employee_id, leave_type_id, year)
      DO UPDATE SET 
        used_days = leave_balances.used_days + NEW.total_days,
        pending_days = leave_balances.pending_days - NEW.total_days,
        updated_at = now();
        
    -- If request was rejected (changing from pending to rejected)
    ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      -- Remove days from pending
      UPDATE public.leave_balances
      SET pending_days = pending_days - NEW.total_days,
          updated_at = now()
      WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id 
        AND year = leave_year;
    END IF;
    
  -- Handle new requests (INSERT)
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Add to pending days
    INSERT INTO public.leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, pending_days, agency_id)
    VALUES (NEW.employee_id, NEW.leave_type_id, leave_year, 0, 0, NEW.total_days, employee_agency_id)
    ON CONFLICT (employee_id, leave_type_id, year)
    DO UPDATE SET 
      pending_days = leave_balances.pending_days + NEW.total_days,
      updated_at = now();
      
  -- Handle request deletion
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'pending' THEN
      -- Remove from pending
      UPDATE public.leave_balances
      SET pending_days = pending_days - OLD.total_days,
          updated_at = now()
      WHERE employee_id = OLD.employee_id 
        AND leave_type_id = OLD.leave_type_id 
        AND year = EXTRACT(YEAR FROM OLD.start_date);
    ELSIF OLD.status = 'approved' THEN
      -- Remove from used
      UPDATE public.leave_balances
      SET used_days = used_days - OLD.total_days,
          updated_at = now()
      WHERE employee_id = OLD.employee_id 
        AND leave_type_id = OLD.leave_type_id 
        AND year = EXTRACT(YEAR FROM OLD.start_date);
    END IF;
  END IF;
  
  -- Create notification for employee on status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.create_notification(
      NEW.employee_id,
      'in_app',
      'update',
      'Leave Request ' || INITCAP(NEW.status),
      'Your leave request from ' || NEW.start_date::text || ' to ' || NEW.end_date::text || ' has been ' || NEW.status || '.',
      jsonb_build_object('request_id', NEW.id, 'status', NEW.status),
      CASE NEW.status 
        WHEN 'approved' THEN 'normal'
        WHEN 'rejected' THEN 'high'
        ELSE 'normal'
      END,
      '/my-leave'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for leave balance updates
DROP TRIGGER IF EXISTS leave_balance_update_trigger ON public.leave_requests;
CREATE TRIGGER leave_balance_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leave_balance();

-- Function to initialize leave balances for new employees
CREATE OR REPLACE FUNCTION public.initialize_leave_balances(
  p_employee_id UUID,
  p_year INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  target_year INTEGER;
  leave_type_record RECORD;
  employee_agency_id UUID;
BEGIN
  target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));
  
  -- Get employee's agency
  SELECT agency_id INTO employee_agency_id 
  FROM public.profiles 
  WHERE user_id = p_employee_id;
  
  -- Create balances for all active leave types
  FOR leave_type_record IN 
    SELECT id, max_days_per_year, name 
    FROM public.leave_types 
    WHERE is_active = true
  LOOP
    INSERT INTO public.leave_balances (
      employee_id, 
      leave_type_id, 
      year, 
      allocated_days,
      agency_id
    ) VALUES (
      p_employee_id,
      leave_type_record.id,
      target_year,
      leave_type_record.max_days_per_year,
      employee_agency_id
    ) ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
  END LOOP;
END;
$$;

-- Function to get leave balance summary for an employee
CREATE OR REPLACE FUNCTION public.get_leave_balance_summary(
  p_employee_id UUID DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  leave_type_name TEXT,
  allocated_days DECIMAL(5,2),
  used_days DECIMAL(5,2),
  pending_days DECIMAL(5,2),
  remaining_days DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  target_employee_id UUID;
  target_year INTEGER;
BEGIN
  target_employee_id := COALESCE(p_employee_id, auth.uid());
  target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));
  
  RETURN QUERY
  SELECT 
    lt.name,
    lb.allocated_days,
    lb.used_days,
    lb.pending_days,
    lb.remaining_days
  FROM public.leave_balances lb
  JOIN public.leave_types lt ON lb.leave_type_id = lt.id
  WHERE lb.employee_id = target_employee_id
    AND lb.year = target_year
    AND lt.is_active = true
  ORDER BY lt.name;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON public.leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_type_year ON public.leave_balances(leave_type_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_dates ON public.leave_requests(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status, created_at);