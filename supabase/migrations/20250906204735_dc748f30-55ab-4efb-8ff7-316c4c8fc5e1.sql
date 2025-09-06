-- Fix critical security issues and complete reimbursement workflow

-- 1. Fix employee_details table structure (critical fix for phone column issue)
-- Add missing columns and fix structure
ALTER TABLE employee_details ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE employee_details ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE employee_details ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE employee_details ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- 2. Create stronger RLS policies for sensitive data
-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Users can view employee details in their agency" ON employee_details;
DROP POLICY IF EXISTS "Authorized personnel can manage employee details" ON employee_details;

-- Create field-level security policies for employee_details
CREATE POLICY "Users can view basic employee info" 
ON employee_details FOR SELECT 
USING (
  -- Users can see basic info for their agency
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2 
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = employee_details.user_id 
    AND p1.agency_id = p2.agency_id
  )
);

CREATE POLICY "HR and Admins can manage employee details" 
ON employee_details FOR ALL 
USING (
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. Strengthen RLS for salary data - only finance roles
DROP POLICY IF EXISTS "Finance roles only can manage salary data" ON employee_salary_details;

CREATE POLICY "Finance roles strict access to salary data" 
ON employee_salary_details FOR ALL 
USING (
  has_role(auth.uid(), 'cfo'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 4. Complete reimbursement workflow with notifications
-- Add missing columns to reimbursement_requests
ALTER TABLE reimbursement_requests ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE reimbursement_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE reimbursement_requests ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE reimbursement_requests ADD COLUMN IF NOT EXISTS approved_amount numeric;
ALTER TABLE reimbursement_requests ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE reimbursement_requests ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 5. Create reimbursement workflow trigger for notifications
CREATE OR REPLACE FUNCTION handle_reimbursement_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes, create notification
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify employee of status change
    INSERT INTO notifications (
      user_id, type, category, title, message, metadata, priority
    ) VALUES (
      NEW.employee_id,
      'in_app',
      'reimbursement',
      'Reimbursement Request ' || INITCAP(NEW.status),
      'Your reimbursement request for $' || NEW.amount::text || ' has been ' || NEW.status || '.',
      jsonb_build_object(
        'request_id', NEW.id,
        'amount', NEW.amount,
        'status', NEW.status,
        'reviewed_by', NEW.reviewed_by
      ),
      CASE NEW.status 
        WHEN 'approved' THEN 'normal'
        WHEN 'rejected' THEN 'high'
        ELSE 'normal'
      END
    );
    
    -- If approved, notify finance team for payment processing
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (
        user_id, type, category, title, message, metadata, priority
      ) 
      SELECT 
        p.user_id,
        'in_app',
        'finance',
        'New Approved Reimbursement',
        'Reimbursement for $' || NEW.amount::text || ' approved and ready for payment.',
        jsonb_build_object(
          'request_id', NEW.id,
          'amount', NEW.amount,
          'employee_name', emp_profile.full_name
        ),
        'high'
      FROM profiles p
      JOIN user_roles ur ON p.user_id = ur.user_id
      LEFT JOIN profiles emp_profile ON emp_profile.user_id = NEW.employee_id
      WHERE ur.role IN ('finance_manager', 'cfo', 'admin')
      AND p.agency_id = (SELECT agency_id FROM profiles WHERE user_id = NEW.employee_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reimbursement status changes
DROP TRIGGER IF EXISTS reimbursement_status_change_trigger ON reimbursement_requests;
CREATE TRIGGER reimbursement_status_change_trigger
  AFTER UPDATE ON reimbursement_requests
  FOR EACH ROW EXECUTE FUNCTION handle_reimbursement_status_change();

-- 6. Create payment tracking table for reimbursements
CREATE TABLE IF NOT EXISTS reimbursement_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reimbursement_id uuid NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  payment_reference text,
  stripe_payment_intent_id text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  agency_id uuid DEFAULT get_user_agency_id()
);

-- Enable RLS for payment tracking
ALTER TABLE reimbursement_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment tracking
CREATE POLICY "Finance can manage reimbursement payments" 
ON reimbursement_payments FOR ALL 
USING (
  agency_id = get_user_agency_id() AND (
    has_role(auth.uid(), 'finance_manager'::app_role) OR 
    has_role(auth.uid(), 'cfo'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can view their reimbursement payments" 
ON reimbursement_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM reimbursement_requests rr 
    WHERE rr.id = reimbursement_payments.reimbursement_id 
    AND rr.employee_id = auth.uid()
  )
);

-- 7. Add expense policy validation function
CREATE OR REPLACE FUNCTION validate_reimbursement_policy(
  p_category_id uuid,
  p_amount numeric,
  p_has_receipt boolean DEFAULT false
) RETURNS jsonb AS $$
DECLARE
  policy_record RECORD;
  violations text[] := '{}';
  auto_approve boolean := false;
BEGIN
  -- Get policy for category
  SELECT * INTO policy_record
  FROM expense_policies 
  WHERE category_id = p_category_id AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    violations := array_append(violations, 'No expense policy found for this category');
    RETURN jsonb_build_object(
      'valid', false,
      'violations', violations,
      'auto_approve', false
    );
  END IF;
  
  -- Check maximum amount
  IF policy_record.max_amount IS NOT NULL AND p_amount > policy_record.max_amount THEN
    violations := array_append(violations, 
      'Amount exceeds maximum allowed: $' || policy_record.max_amount::text);
  END IF;
  
  -- Check receipt requirement
  IF p_amount > policy_record.requires_receipt_above AND NOT p_has_receipt THEN
    violations := array_append(violations, 
      'Receipt required for amounts above $' || policy_record.requires_receipt_above::text);
  END IF;
  
  -- Determine auto-approval
  IF policy_record.auto_approve_below IS NOT NULL AND p_amount <= policy_record.auto_approve_below THEN
    auto_approve := true;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', array_length(violations, 1) IS NULL,
    'violations', violations,
    'auto_approve', auto_approve,
    'requires_manager_approval', policy_record.requires_manager_approval,
    'requires_finance_approval', policy_record.requires_finance_approval
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;