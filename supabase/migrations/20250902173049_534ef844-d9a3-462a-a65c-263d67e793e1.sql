-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month', -- month, year
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  max_users INTEGER,
  max_agencies INTEGER,
  max_storage_gb INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan features table
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  feature_key TEXT NOT NULL UNIQUE, -- e.g., 'ai_features', 'analytics', 'crm'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan feature mappings (junction table)
CREATE TABLE public.plan_feature_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.plan_features(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feature_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Super admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS Policies for plan_features
CREATE POLICY "Super admins can manage plan features" 
ON public.plan_features 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can view active plan features" 
ON public.plan_features 
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS Policies for plan_feature_mappings
CREATE POLICY "Super admins can manage plan feature mappings" 
ON public.plan_feature_mappings 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can view plan feature mappings" 
ON public.plan_feature_mappings 
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plan features
INSERT INTO public.plan_features (name, description, feature_key) VALUES
('AI Features', 'Access to AI-powered insights and automation', 'ai_features'),
('Advanced Analytics', 'Detailed analytics and reporting', 'analytics'),
('CRM Management', 'Customer relationship management tools', 'crm'),
('Project Management', 'Advanced project planning and tracking', 'project_management'),
('Financial Management', 'Comprehensive financial tools', 'financial_management'),
('HR Management', 'Human resources and payroll management', 'hr_management'),
('API Access', 'Full API access for integrations', 'api_access'),
('Priority Support', '24/7 priority customer support', 'priority_support'),
('Custom Branding', 'White-label and custom branding options', 'custom_branding'),
('Advanced Security', 'Enhanced security features and compliance', 'advanced_security');

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, max_users, max_agencies, max_storage_gb) VALUES
('Starter', 'Perfect for small teams getting started', 29.00, 5, 1, 10),
('Professional', 'For growing businesses with advanced needs', 99.00, 25, 3, 100),
('Enterprise', 'For large organizations with custom requirements', 299.00, 100, 10, 1000);

-- Link features to plans
DO $$
DECLARE
  starter_plan_id UUID;
  professional_plan_id UUID;
  enterprise_plan_id UUID;
  
  ai_feature_id UUID;
  analytics_feature_id UUID;
  crm_feature_id UUID;
  project_feature_id UUID;
  financial_feature_id UUID;
  hr_feature_id UUID;
  api_feature_id UUID;
  priority_support_id UUID;
  custom_branding_id UUID;
  advanced_security_id UUID;
BEGIN
  -- Get plan IDs
  SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE name = 'Starter';
  SELECT id INTO professional_plan_id FROM public.subscription_plans WHERE name = 'Professional';
  SELECT id INTO enterprise_plan_id FROM public.subscription_plans WHERE name = 'Enterprise';
  
  -- Get feature IDs
  SELECT id INTO ai_feature_id FROM public.plan_features WHERE feature_key = 'ai_features';
  SELECT id INTO analytics_feature_id FROM public.plan_features WHERE feature_key = 'analytics';
  SELECT id INTO crm_feature_id FROM public.plan_features WHERE feature_key = 'crm';
  SELECT id INTO project_feature_id FROM public.plan_features WHERE feature_key = 'project_management';
  SELECT id INTO financial_feature_id FROM public.plan_features WHERE feature_key = 'financial_management';
  SELECT id INTO hr_feature_id FROM public.plan_features WHERE feature_key = 'hr_management';
  SELECT id INTO api_feature_id FROM public.plan_features WHERE feature_key = 'api_access';
  SELECT id INTO priority_support_id FROM public.plan_features WHERE feature_key = 'priority_support';
  SELECT id INTO custom_branding_id FROM public.plan_features WHERE feature_key = 'custom_branding';
  SELECT id INTO advanced_security_id FROM public.plan_features WHERE feature_key = 'advanced_security';
  
  -- Starter plan features (basic features only)
  INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled) VALUES
  (starter_plan_id, crm_feature_id, true),
  (starter_plan_id, project_feature_id, true),
  (starter_plan_id, financial_feature_id, true);
  
  -- Professional plan features (most features)
  INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled) VALUES
  (professional_plan_id, ai_feature_id, true),
  (professional_plan_id, analytics_feature_id, true),
  (professional_plan_id, crm_feature_id, true),
  (professional_plan_id, project_feature_id, true),
  (professional_plan_id, financial_feature_id, true),
  (professional_plan_id, hr_feature_id, true),
  (professional_plan_id, api_feature_id, true);
  
  -- Enterprise plan features (all features)
  INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled) VALUES
  (enterprise_plan_id, ai_feature_id, true),
  (enterprise_plan_id, analytics_feature_id, true),
  (enterprise_plan_id, crm_feature_id, true),
  (enterprise_plan_id, project_feature_id, true),
  (enterprise_plan_id, financial_feature_id, true),
  (enterprise_plan_id, hr_feature_id, true),
  (enterprise_plan_id, api_feature_id, true),
  (enterprise_plan_id, priority_support_id, true),
  (enterprise_plan_id, custom_branding_id, true),
  (enterprise_plan_id, advanced_security_id, true);
END $$;