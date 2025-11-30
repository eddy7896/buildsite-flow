-- Test Data Insertion Script
-- This script tests the database by inserting sample data

-- Test 1: Create a test user
INSERT INTO public.users (email, password_hash, is_active) 
VALUES ('test@example.com', 'hashed_password_123', true);

-- Test 2: Create a test agency
INSERT INTO public.agencies (name, domain, is_active) 
VALUES ('Test Agency', 'test-agency.local', true);

-- Test 3: Create a test client
INSERT INTO public.clients (client_number, name, email, agency_id) 
VALUES ('CLT-001', 'Test Client', 'client@example.com', (SELECT id FROM public.agencies LIMIT 1));

-- Test 4: Create a test project
INSERT INTO public.projects (name, status, agency_id) 
VALUES ('Test Project', 'planning', (SELECT id FROM public.agencies LIMIT 1));

-- Test 5: Create a test task
INSERT INTO public.tasks (project_id, title, status, priority, agency_id) 
VALUES ((SELECT id FROM public.projects LIMIT 1), 'Test Task', 'todo', 'medium', (SELECT id FROM public.agencies LIMIT 1));

-- Test 6: Create a test department
INSERT INTO public.departments (name, agency_id) 
VALUES ('Test Department', (SELECT id FROM public.agencies LIMIT 1));

-- Test 7: Create a test invoice
INSERT INTO public.invoices (invoice_number, client_id, title, status, subtotal, agency_id) 
VALUES ('INV-001', (SELECT id FROM public.clients LIMIT 1), 'Test Invoice', 'draft', 1000.00, (SELECT id FROM public.agencies LIMIT 1));

-- Test 8: Create a test quotation
INSERT INTO public.quotations (quote_number, client_id, title, status, subtotal, agency_id) 
VALUES ('QT-001', (SELECT id FROM public.clients LIMIT 1), 'Test Quotation', 'draft', 1500.00, (SELECT id FROM public.agencies LIMIT 1));

-- Test 9: Create a test job
INSERT INTO public.jobs (job_number, client_id, title, status, agency_id) 
VALUES ('JOB-001', (SELECT id FROM public.clients LIMIT 1), 'Test Job', 'planning', (SELECT id FROM public.agencies LIMIT 1));

-- Test 10: Create a test lead
INSERT INTO public.leads (lead_number, company_name, contact_name, status, agency_id) 
VALUES ('LEAD-001', 'Test Company', 'John Doe', 'new', (SELECT id FROM public.agencies LIMIT 1));

-- Final verification: Count all records
SELECT 
  'Users' as entity, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Agencies', COUNT(*) FROM public.agencies
UNION ALL
SELECT 'Clients', COUNT(*) FROM public.clients
UNION ALL
SELECT 'Projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'Tasks', COUNT(*) FROM public.tasks
UNION ALL
SELECT 'Departments', COUNT(*) FROM public.departments
UNION ALL
SELECT 'Invoices', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'Quotations', COUNT(*) FROM public.quotations
UNION ALL
SELECT 'Jobs', COUNT(*) FROM public.jobs
UNION ALL
SELECT 'Leads', COUNT(*) FROM public.leads
ORDER BY entity;
