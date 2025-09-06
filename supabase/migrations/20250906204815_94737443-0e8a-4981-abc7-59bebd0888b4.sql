-- Fix security warnings from linter

-- Fix search_path for functions (security warning)
CREATE OR REPLACE FUNCTION public.handle_reimbursement_status_change()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_reimbursement_policy(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;