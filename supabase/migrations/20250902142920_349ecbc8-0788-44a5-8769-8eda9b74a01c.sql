-- Phase 2A: Complete Reimbursement System Enhancement

-- Enhanced reimbursement workflow states
CREATE TABLE IF NOT EXISTS public.reimbursement_workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.reimbursement_requests(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('draft', 'submitted', 'manager_review', 'finance_review', 'approved', 'rejected', 'paid')),
  actor_id UUID REFERENCES auth.users(id),
  action_date TIMESTAMPTZ DEFAULT now(),
  comments TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on workflow states
ALTER TABLE public.reimbursement_workflow_states ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow states
CREATE POLICY "Employees can view workflow for their requests" ON public.reimbursement_workflow_states
FOR SELECT
USING (request_id IN (
  SELECT id FROM public.reimbursement_requests 
  WHERE employee_id = auth.uid()
));

CREATE POLICY "Finance and admins can view all workflow states" ON public.reimbursement_workflow_states
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR 
       has_role(auth.uid(), 'finance_manager'::app_role) OR
       has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authorized users can create workflow states" ON public.reimbursement_workflow_states
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR 
            has_role(auth.uid(), 'finance_manager'::app_role) OR
            has_role(auth.uid(), 'super_admin'::app_role) OR
            request_id IN (
              SELECT id FROM public.reimbursement_requests 
              WHERE employee_id = auth.uid()
            ));

-- Enhanced reimbursement requests with mileage support
ALTER TABLE public.reimbursement_requests 
ADD COLUMN IF NOT EXISTS mileage_distance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS mileage_rate DECIMAL(10,4) DEFAULT 0.67,
ADD COLUMN IF NOT EXISTS mileage_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS receipt_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS policy_violation TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS finance_reviewer_id UUID REFERENCES auth.users(id);

-- Expense policy table
CREATE TABLE IF NOT EXISTS public.expense_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.expense_categories(id),
  max_amount DECIMAL(10,2),
  requires_receipt_above DECIMAL(10,2) DEFAULT 25.00,
  requires_manager_approval BOOLEAN DEFAULT true,
  requires_finance_approval BOOLEAN DEFAULT false,
  auto_approve_below DECIMAL(10,2),
  mileage_rate DECIMAL(10,4) DEFAULT 0.67,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  policy_description TEXT
);

-- Enable RLS on expense policies
ALTER TABLE public.expense_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view expense policies" ON public.expense_policies
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins and finance can manage expense policies" ON public.expense_policies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR 
       has_role(auth.uid(), 'finance_manager'::app_role) OR
       has_role(auth.uid(), 'super_admin'::app_role));

-- Function to validate expense against policy
CREATE OR REPLACE FUNCTION public.validate_expense_policy(
  p_category_id UUID,
  p_amount DECIMAL,
  p_has_receipt BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  policy_record RECORD;
  violations TEXT[] := '{}';
  approval_required JSONB := '{"manager": false, "finance": false}';
BEGIN
  -- Get the policy for this category
  SELECT * INTO policy_record
  FROM public.expense_policies
  WHERE category_id = p_category_id AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    violations := array_append(violations, 'No expense policy found for this category');
    RETURN jsonb_build_object(
      'valid', false,
      'violations', violations,
      'approval_required', approval_required
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
  
  -- Determine approval requirements
  IF policy_record.auto_approve_below IS NULL OR p_amount > policy_record.auto_approve_below THEN
    approval_required := jsonb_set(approval_required, '{manager}', 
      to_jsonb(policy_record.requires_manager_approval));
    approval_required := jsonb_set(approval_required, '{finance}', 
      to_jsonb(policy_record.requires_finance_approval OR p_amount > 500));
  END IF;
  
  RETURN jsonb_build_object(
    'valid', array_length(violations, 1) IS NULL,
    'violations', violations,
    'approval_required', approval_required,
    'policy', to_jsonb(policy_record)
  );
END;
$$;

-- Phase 2B: Notification System Implementation

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'in_app', 'push')),
  category TEXT NOT NULL CHECK (category IN ('approval', 'reminder', 'update', 'alert', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  agency_id UUID
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT
USING (user_id = auth.uid() AND (agency_id = get_user_agency_id() OR agency_id IS NULL));

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE
USING (user_id = auth.uid() AND (agency_id = get_user_agency_id() OR agency_id IS NULL));

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT
WITH CHECK (true); -- Allow system to create notifications

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  category TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  weekend_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  agency_id UUID
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
FOR ALL
USING (user_id = auth.uid() AND (agency_id = get_user_agency_id() OR agency_id IS NULL));

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  notification_id UUID;
  user_agency_id UUID;
BEGIN
  -- Get user's agency
  SELECT agency_id INTO user_agency_id 
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, category, title, message, metadata, 
    priority, action_url, expires_at, agency_id
  ) VALUES (
    p_user_id, p_type, p_category, p_title, p_message, p_metadata,
    p_priority, p_action_url, p_expires_at, user_agency_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id 
    AND user_id = auth.uid() 
    AND read_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = target_user_id
      AND read_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category, created_at);
CREATE INDEX IF NOT EXISTS idx_reimbursement_workflow_request ON public.reimbursement_workflow_states(request_id, action_date);
CREATE INDEX IF NOT EXISTS idx_expense_policies_category ON public.expense_policies(category_id) WHERE is_active = true;