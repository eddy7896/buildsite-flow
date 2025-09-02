-- Phase 2C: Enhanced Leave Management (Simple Update)

-- Just add the unique constraint to leave_types if it doesn't exist
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

-- Add default leave types if they don't exist (using WHERE NOT EXISTS)
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
    -- Check if leave_balances table exists, if not skip
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_balances' AND table_schema = 'public') THEN
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
    END IF;
  END LOOP;
END;
$$;