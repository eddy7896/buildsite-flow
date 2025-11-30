-- ============================================================================
-- SEED INITIAL DATA FOR BUILDFLOW AGENCY MANAGEMENT SYSTEM
-- ============================================================================
-- This script seeds the database with initial data for testing and demo purposes
-- Run this after all migrations are complete

-- ============================================================================
-- SECTION 1: CREATE INITIAL AGENCY
-- ============================================================================

INSERT INTO public.agencies (id, name, domain, is_active, subscription_plan, max_users)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'BuildFlow Demo Agency',
  'demo.buildflow.local',
  true,
  'professional',
  100
) ON CONFLICT DO NOTHING;

INSERT INTO public.agency_settings (id, agency_id, agency_name, logo_url)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'BuildFlow Demo Agency',
  'https://via.placeholder.com/200'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 2: CREATE INITIAL USERS
-- ============================================================================

-- Super Admin User
INSERT INTO public.users (id, email, password_hash, email_confirmed, email_confirmed_at, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440010'::uuid,
  'super@buildflow.local',
  '$2b$10$YourHashedPasswordHere1',
  true,
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- Admin User
INSERT INTO public.users (id, email, password_hash, email_confirmed, email_confirmed_at, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440011'::uuid,
  'admin@buildflow.local',
  '$2b$10$YourHashedPasswordHere2',
  true,
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- HR Manager User
INSERT INTO public.users (id, email, password_hash, email_confirmed, email_confirmed_at, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440012'::uuid,
  'hr@buildflow.local',
  '$2b$10$YourHashedPasswordHere3',
  true,
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- Finance Manager User
INSERT INTO public.users (id, email, password_hash, email_confirmed, email_confirmed_at, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440013'::uuid,
  'finance@buildflow.local',
  '$2b$10$YourHashedPasswordHere4',
  true,
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- Employee User
INSERT INTO public.users (id, email, password_hash, email_confirmed, email_confirmed_at, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440014'::uuid,
  'employee@buildflow.local',
  '$2b$10$YourHashedPasswordHere5',
  true,
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 3: CREATE PROFILES FOR USERS
-- ============================================================================

INSERT INTO public.profiles (id, user_id, full_name, phone, department, position, hire_date, is_active, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'Super Administrator', '+1-555-0001', 'Administration', 'Super Admin', '2024-01-01', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440021'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'System Administrator', '+1-555-0002', 'Administration', 'Admin', '2024-01-01', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440022'::uuid, '550e8400-e29b-41d4-a716-446655440012'::uuid, 'HR Manager', '+1-555-0003', 'Human Resources', 'Manager', '2024-01-15', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440023'::uuid, '550e8400-e29b-41d4-a716-446655440013'::uuid, 'Finance Manager', '+1-555-0004', 'Finance', 'Manager', '2024-01-15', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440024'::uuid, '550e8400-e29b-41d4-a716-446655440014'::uuid, 'John Employee', '+1-555-0005', 'Operations', 'Employee', '2024-02-01', true, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 4: ASSIGN ROLES TO USERS
-- ============================================================================

INSERT INTO public.user_roles (id, user_id, role, assigned_at, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'super_admin'::public.app_role, NOW(), '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440031'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'admin'::public.app_role, NOW(), '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440032'::uuid, '550e8400-e29b-41d4-a716-446655440012'::uuid, 'hr'::public.app_role, NOW(), '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440033'::uuid, '550e8400-e29b-41d4-a716-446655440013'::uuid, 'finance_manager'::public.app_role, NOW(), '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440034'::uuid, '550e8400-e29b-41d4-a716-446655440014'::uuid, 'employee'::public.app_role, NOW(), '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 5: CREATE DEPARTMENTS
-- ============================================================================

INSERT INTO public.departments (id, name, description, manager_id, is_active, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440040'::uuid, 'Administration', 'Administrative Department', '550e8400-e29b-41d4-a716-446655440010'::uuid, true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440041'::uuid, 'Human Resources', 'HR Department', '550e8400-e29b-41d4-a716-446655440012'::uuid, true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440042'::uuid, 'Finance', 'Finance Department', '550e8400-e29b-41d4-a716-446655440013'::uuid, true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440043'::uuid, 'Operations', 'Operations Department', '550e8400-e29b-41d4-a716-446655440014'::uuid, true, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 6: CREATE TEAM ASSIGNMENTS
-- ============================================================================

INSERT INTO public.team_assignments (id, user_id, department_id, position_title, role_in_department, start_date, is_active, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440050'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440040'::uuid, 'Super Admin', 'manager', '2024-01-01', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440051'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440040'::uuid, 'Administrator', 'manager', '2024-01-01', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440052'::uuid, '550e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440041'::uuid, 'HR Manager', 'manager', '2024-01-15', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440053'::uuid, '550e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440042'::uuid, 'Finance Manager', 'manager', '2024-01-15', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440054'::uuid, '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440043'::uuid, 'Operations Staff', 'member', '2024-02-01', true, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 7: CREATE LEAVE TYPES
-- ============================================================================

INSERT INTO public.leave_types (id, name, description, max_days_per_year, is_paid, requires_approval, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440060'::uuid, 'Annual Leave', 'Paid annual leave', 20, true, true, true),
  ('550e8400-e29b-41d4-a716-446655440061'::uuid, 'Sick Leave', 'Paid sick leave', 10, true, true, true),
  ('550e8400-e29b-41d4-a716-446655440062'::uuid, 'Unpaid Leave', 'Unpaid leave', 30, false, true, true),
  ('550e8400-e29b-41d4-a716-446655440063'::uuid, 'Maternity Leave', 'Maternity leave', 90, true, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 8: CREATE CLIENTS
-- ============================================================================

INSERT INTO public.clients (id, client_number, name, company_name, email, phone, status, created_by, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440070'::uuid, 'CLT-00001', 'Acme Corporation', 'Acme Corp', 'contact@acme.com', '+1-555-1001', 'active', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440071'::uuid, 'CLT-00002', 'Tech Solutions Inc', 'Tech Solutions', 'info@techsol.com', '+1-555-1002', 'active', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440072'::uuid, 'CLT-00003', 'Global Enterprises', 'Global Ent', 'hello@globalent.com', '+1-555-1003', 'active', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 9: CREATE PROJECTS
-- ============================================================================

INSERT INTO public.projects (id, name, description, status, start_date, budget, client_id, progress, created_by, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440080'::uuid, 'Website Redesign', 'Complete website redesign project', 'in_progress', '2024-02-01', 50000.00, '550e8400-e29b-41d4-a716-446655440070'::uuid, 45, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440081'::uuid, 'Mobile App Development', 'iOS and Android app development', 'planning', '2024-03-01', 75000.00, '550e8400-e29b-41d4-a716-446655440071'::uuid, 10, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440082'::uuid, 'System Integration', 'ERP system integration', 'completed', '2024-01-15', 100000.00, '550e8400-e29b-41d4-a716-446655440072'::uuid, 100, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 10: CREATE TASKS
-- ============================================================================

INSERT INTO public.tasks (id, project_id, title, description, assignee_id, created_by, status, priority, due_date, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440090'::uuid, '550e8400-e29b-41d4-a716-446655440080'::uuid, 'Design Homepage', 'Create homepage design mockups', '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'in_progress', 'high', '2024-02-15', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440091'::uuid, '550e8400-e29b-41d4-a716-446655440080'::uuid, 'Develop Frontend', 'Implement frontend components', '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'todo', 'high', '2024-02-28', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440092'::uuid, '550e8400-e29b-41d4-a716-446655440081'::uuid, 'Setup Development Environment', 'Configure dev environment', '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'todo', 'medium', '2024-03-05', '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 11: CREATE INVOICES
-- ============================================================================

INSERT INTO public.invoices (id, invoice_number, client_id, title, status, issue_date, due_date, subtotal, tax_rate, total_amount, created_by, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440100'::uuid, 'INV-2024-00001', '550e8400-e29b-41d4-a716-446655440070'::uuid, 'Website Redesign - Phase 1', 'sent', '2024-02-01', '2024-03-01', 25000.00, 10.0, 27500.00, '550e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440101'::uuid, 'INV-2024-00002', '550e8400-e29b-41d4-a716-446655440071'::uuid, 'Consultation Services', 'draft', '2024-02-10', '2024-03-10', 5000.00, 10.0, 5500.00, '550e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 12: CREATE EXPENSE CATEGORIES
-- ============================================================================

INSERT INTO public.expense_categories (id, name, description, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440110'::uuid, 'Travel', 'Travel and transportation expenses', true),
  ('550e8400-e29b-41d4-a716-446655440111'::uuid, 'Meals', 'Meal and food expenses', true),
  ('550e8400-e29b-41d4-a716-446655440112'::uuid, 'Office Supplies', 'Office supplies and equipment', true),
  ('550e8400-e29b-41d4-a716-446655440113'::uuid, 'Software', 'Software and subscriptions', true),
  ('550e8400-e29b-41d4-a716-446655440114'::uuid, 'Training', 'Training and development', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 13: CREATE LEAD SOURCES
-- ============================================================================

INSERT INTO public.lead_sources (id, name, description, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440120'::uuid, 'Website', 'Leads from website', true),
  ('550e8400-e29b-41d4-a716-446655440121'::uuid, 'Referral', 'Referral leads', true),
  ('550e8400-e29b-41d4-a716-446655440122'::uuid, 'Social Media', 'Social media leads', true),
  ('550e8400-e29b-41d4-a716-446655440123'::uuid, 'Cold Outreach', 'Cold outreach leads', true),
  ('550e8400-e29b-41d4-a716-446655440124'::uuid, 'Trade Shows', 'Trade show leads', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 14: CREATE LEADS
-- ============================================================================

INSERT INTO public.leads (id, lead_number, company_name, contact_name, email, phone, lead_source_id, status, priority, estimated_value, probability, assigned_to, created_by, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440130'::uuid, 'LEAD-00001', 'Future Tech Corp', 'John Smith', 'john@futuretech.com', '+1-555-2001', '550e8400-e29b-41d4-a716-446655440120'::uuid, 'new', 'high', 50000.00, 30, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440131'::uuid, 'LEAD-00002', 'Innovation Labs', 'Sarah Johnson', 'sarah@innovlabs.com', '+1-555-2002', '550e8400-e29b-41d4-a716-446655440121'::uuid, 'contacted', 'medium', 30000.00, 50, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 15: CREATE JOB CATEGORIES
-- ============================================================================

INSERT INTO public.job_categories (id, name, description)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440140'::uuid, 'Web Development', 'Web development projects'),
  ('550e8400-e29b-41d4-a716-446655440141'::uuid, 'Mobile Development', 'Mobile app development'),
  ('550e8400-e29b-41d4-a716-446655440142'::uuid, 'Consulting', 'Consulting services'),
  ('550e8400-e29b-41d4-a716-446655440143'::uuid, 'System Integration', 'System integration projects'),
  ('550e8400-e29b-41d4-a716-446655440144'::uuid, 'Maintenance', 'Maintenance and support')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 16: CREATE JOBS
-- ============================================================================

INSERT INTO public.jobs (id, job_number, client_id, category_id, title, description, status, start_date, estimated_hours, estimated_cost, budget, assigned_to, created_by, agency_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440150'::uuid, 'JOB-00001', '550e8400-e29b-41d4-a716-446655440070'::uuid, '550e8400-e29b-41d4-a716-446655440140'::uuid, 'Website Homepage', 'Design and develop homepage', 'in_progress', '2024-02-01', 40.0, 4000.00, 5000.00, '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('550e8400-e29b-41d4-a716-446655440151'::uuid, 'JOB-00002', '550e8400-e29b-41d4-a716-446655440071'::uuid, '550e8400-e29b-41d4-a716-446655440141'::uuid, 'iOS App Development', 'Develop iOS application', 'planning', '2024-03-01', 160.0, 16000.00, 20000.00, '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 17: CREATE HOLIDAYS
-- ============================================================================

INSERT INTO public.holidays (id, agency_id, name, date, is_company_holiday, is_national_holiday, description)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440160'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'New Year Day', '2024-01-01', true, true, 'New Year Holiday'),
  ('550e8400-e29b-41d4-a716-446655440161'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Independence Day', '2024-07-04', true, true, 'Independence Day Holiday'),
  ('550e8400-e29b-41d4-a716-446655440162'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Christmas', '2024-12-25', true, true, 'Christmas Holiday'),
  ('550e8400-e29b-41d4-a716-446655440163'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Company Anniversary', '2024-06-15', true, false, 'Company Anniversary')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 18: CREATE CALENDAR SETTINGS
-- ============================================================================

INSERT INTO public.calendar_settings (id, agency_id, show_birthdays, show_leave_requests, show_company_events, show_holidays, default_view, working_days, working_hours)
VALUES (
  '550e8400-e29b-41d4-a716-446655440170'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  true,
  true,
  true,
  true,
  'month',
  '[1,2,3,4,5]'::jsonb,
  '{"start": "09:00", "end": "17:00"}'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 19: CREATE SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO public.subscription_plans (id, name, description, price, currency, interval, is_active, max_users, max_agencies, max_storage_gb)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440180'::uuid, 'Starter', 'Starter plan for small teams', 99.00, 'usd', 'month', true, 5, 1, 10),
  ('550e8400-e29b-41d4-a716-446655440181'::uuid, 'Professional', 'Professional plan for growing teams', 299.00, 'usd', 'month', true, 25, 3, 100),
  ('550e8400-e29b-41d4-a716-446655440182'::uuid, 'Enterprise', 'Enterprise plan for large organizations', 999.00, 'usd', 'month', true, 100, 10, 500)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 20: CREATE PLAN FEATURES
-- ============================================================================

INSERT INTO public.plan_features (id, name, description, feature_key, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440190'::uuid, 'User Management', 'Manage users and roles', 'user_management', true),
  ('550e8400-e29b-41d4-a716-446655440191'::uuid, 'Project Management', 'Manage projects and tasks', 'project_management', true),
  ('550e8400-e29b-41d4-a716-446655440192'::uuid, 'Financial Management', 'Manage invoices and payments', 'financial_management', true),
  ('550e8400-e29b-41d4-a716-446655440193'::uuid, 'HR Management', 'Manage employees and leave', 'hr_management', true),
  ('550e8400-e29b-41d4-a716-446655440194'::uuid, 'CRM', 'Customer relationship management', 'crm', true),
  ('550e8400-e29b-41d4-a716-446655440195'::uuid, 'Analytics', 'Advanced analytics and reporting', 'analytics', true),
  ('550e8400-e29b-41d4-a716-446655440196'::uuid, 'API Access', 'API access for integrations', 'api_access', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 21: CREATE PLAN FEATURE MAPPINGS
-- ============================================================================

-- Starter Plan Features
INSERT INTO public.plan_feature_mappings (id, plan_id, feature_id, enabled)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440200'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440190'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440201'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440191'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440202'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440192'::uuid, false),
  ('550e8400-e29b-41d4-a716-446655440203'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440193'::uuid, false),
  ('550e8400-e29b-41d4-a716-446655440204'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440194'::uuid, false),
  ('550e8400-e29b-41d4-a716-446655440205'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440195'::uuid, false),
  ('550e8400-e29b-41d4-a716-446655440206'::uuid, '550e8400-e29b-41d4-a716-446655440180'::uuid, '550e8400-e29b-41d4-a716-446655440196'::uuid, false),
  
  -- Professional Plan Features
  ('550e8400-e29b-41d4-a716-446655440207'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440190'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440208'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440191'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440209'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440192'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440210'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440193'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440211'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440194'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440212'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440195'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440213'::uuid, '550e8400-e29b-41d4-a716-446655440181'::uuid, '550e8400-e29b-41d4-a716-446655440196'::uuid, false),
  
  -- Enterprise Plan Features
  ('550e8400-e29b-41d4-a716-446655440214'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440190'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440215'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440191'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440216'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440192'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440217'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440193'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440218'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440194'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440219'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440195'::uuid, true),
  ('550e8400-e29b-41d4-a716-446655440220'::uuid, '550e8400-e29b-41d4-a716-446655440182'::uuid, '550e8400-e29b-41d4-a716-446655440196'::uuid, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 22: VERIFY DATA
-- ============================================================================

SELECT 'Seed data completed successfully!' as status;
SELECT COUNT(*) as agencies_count FROM public.agencies;
SELECT COUNT(*) as users_count FROM public.users;
SELECT COUNT(*) as profiles_count FROM public.profiles;
SELECT COUNT(*) as departments_count FROM public.departments;
SELECT COUNT(*) as clients_count FROM public.clients;
SELECT COUNT(*) as projects_count FROM public.projects;
SELECT COUNT(*) as tasks_count FROM public.tasks;
SELECT COUNT(*) as invoices_count FROM public.invoices;
SELECT COUNT(*) as leads_count FROM public.leads;
SELECT COUNT(*) as jobs_count FROM public.jobs;
