-- Add new role values to existing enum (one at a time to ensure they commit)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cto';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cfo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_head';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'quality_assurance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'it_support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'legal_counsel';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business_analyst';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_success';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contractor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intern';