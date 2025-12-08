-- ============================================================================
-- CRM SEED DATA
-- This file contains comprehensive seed data for CRM tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: LEAD SOURCES (if not already exists)
-- ============================================================================

INSERT INTO public.lead_sources (id, name, description, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440120'::uuid, 'Website', 'Leads from website', true),
  ('550e8400-e29b-41d4-a716-446655440121'::uuid, 'Referral', 'Referral leads', true),
  ('550e8400-e29b-41d4-a716-446655440122'::uuid, 'Social Media', 'Social media leads', true),
  ('550e8400-e29b-41d4-a716-446655440123'::uuid, 'Cold Outreach', 'Cold outreach leads', true),
  ('550e8400-e29b-41d4-a716-446655440124'::uuid, 'Trade Shows', 'Trade show leads', true),
  ('550e8400-e29b-41d4-a716-446655440125'::uuid, 'Email Campaign', 'Email marketing campaigns', true),
  ('550e8400-e29b-41d4-a716-446655440126'::uuid, 'LinkedIn', 'LinkedIn leads', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 2: SALES PIPELINE STAGES (if not already exists)
-- ============================================================================

INSERT INTO public.sales_pipeline (id, name, stage_order, probability_percentage, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440200'::uuid, 'New', 1, 10, true),
  ('550e8400-e29b-41d4-a716-446655440201'::uuid, 'Contacted', 2, 20, true),
  ('550e8400-e29b-41d4-a716-446655440202'::uuid, 'Qualified', 3, 40, true),
  ('550e8400-e29b-41d4-a716-446655440203'::uuid, 'Proposal', 4, 60, true),
  ('550e8400-e29b-41d4-a716-446655440204'::uuid, 'Negotiation', 5, 80, true),
  ('550e8400-e29b-41d4-a716-446655440205'::uuid, 'Won', 6, 100, true),
  ('550e8400-e29b-41d4-a716-446655440206'::uuid, 'Lost', 7, 0, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 3: LEADS
-- ============================================================================

INSERT INTO public.leads (
  id, 
  lead_number, 
  company_name, 
  contact_name, 
  email, 
  phone, 
  address,
  lead_source_id, 
  status, 
  priority, 
  estimated_value, 
  probability, 
  expected_close_date,
  notes,
  assigned_to, 
  created_by, 
  agency_id,
  created_at,
  updated_at
)
VALUES 
  -- New Leads
  ('550e8400-e29b-41d4-a716-446655440130'::uuid, 'LEAD-2024-000001', 'Future Tech Corp', 'John Smith', 'john@futuretech.com', '+1-555-2001', '123 Tech Street, San Francisco, CA 94105', '550e8400-e29b-41d4-a716-446655440120'::uuid, 'new', 'high', 50000.00, 30, '2024-12-31', 'Interested in ERP system implementation', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW(), NOW()),
  
  ('550e8400-e29b-41d4-a716-446655440131'::uuid, 'LEAD-2024-000002', 'Innovation Labs', 'Sarah Johnson', 'sarah@innovlabs.com', '+1-555-2002', '456 Innovation Ave, Austin, TX 78701', '550e8400-e29b-41d4-a716-446655440121'::uuid, 'contacted', 'medium', 30000.00, 50, '2024-11-30', 'Follow-up scheduled for next week', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
  
  ('550e8400-e29b-41d4-a716-446655440132'::uuid, 'LEAD-2024-000003', 'Digital Solutions Inc', 'Mike Davis', 'mike@digitalsolutions.com', '+1-555-2003', '789 Digital Blvd, Seattle, WA 98101', '550e8400-e29b-41d4-a716-446655440122'::uuid, 'qualified', 'high', 75000.00, 70, '2024-10-15', 'Strong interest, budget approved', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  
  ('550e8400-e29b-41d4-a716-446655440133'::uuid, 'LEAD-2024-000004', 'Cloud Services Group', 'Emily Chen', 'emily@cloudservices.com', '+1-555-2004', '321 Cloud Way, Denver, CO 80202', '550e8400-e29b-41d4-a716-446655440123'::uuid, 'proposal', 'high', 100000.00, 80, '2024-09-30', 'Proposal sent, awaiting response', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
  
  ('550e8400-e29b-41d4-a716-446655440134'::uuid, 'LEAD-2024-000005', 'Enterprise Systems', 'Robert Wilson', 'robert@enterprisesys.com', '+1-555-2005', '654 Enterprise St, Boston, MA 02101', '550e8400-e29b-41d4-a716-446655440124'::uuid, 'negotiation', 'high', 150000.00, 90, '2024-08-31', 'Finalizing contract terms', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
  
  -- Won Leads
  ('550e8400-e29b-41d4-a716-446655440135'::uuid, 'LEAD-2024-000006', 'TechStart Ventures', 'Lisa Anderson', 'lisa@techstart.com', '+1-555-2006', '987 Startup Lane, Palo Alto, CA 94301', '550e8400-e29b-41d4-a716-446655440120'::uuid, 'won', 'high', 200000.00, 100, '2024-07-15', 'Contract signed, project started', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),
  
  ('550e8400-e29b-41d4-a716-446655440136'::uuid, 'LEAD-2024-000007', 'Global Industries', 'David Brown', 'david@globalind.com', '+1-555-2007', '147 Global Plaza, New York, NY 10001', '550e8400-e29b-41d4-a716-446655440121'::uuid, 'won', 'medium', 120000.00, 100, '2024-06-20', 'Successfully closed', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),
  
  -- Lost Leads
  ('550e8400-e29b-41d4-a716-446655440137'::uuid, 'LEAD-2024-000008', 'Small Business Co', 'Jennifer Lee', 'jennifer@smallbiz.com', '+1-555-2008', '258 Small St, Portland, OR 97201', '550e8400-e29b-41d4-a716-446655440122'::uuid, 'lost', 'low', 15000.00, 0, NULL, 'Budget constraints, not proceeding', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'),
  
  -- More leads in various stages
  ('550e8400-e29b-41d4-a716-446655440138'::uuid, 'LEAD-2024-000009', 'Modern Solutions', 'James Taylor', 'james@modernsol.com', '+1-555-2009', '369 Modern Ave, Chicago, IL 60601', '550e8400-e29b-41d4-a716-446655440125'::uuid, 'new', 'medium', 40000.00, 25, '2024-12-15', 'Initial inquiry', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '2 days', NOW()),
  
  ('550e8400-e29b-41d4-a716-446655440139'::uuid, 'LEAD-2024-000010', 'NextGen Technologies', 'Maria Garcia', 'maria@nextgen.com', '+1-555-2010', '741 NextGen Rd, Miami, FL 33101', '550e8400-e29b-41d4-a716-446655440126'::uuid, 'contacted', 'high', 60000.00, 45, '2024-11-20', 'Very interested, needs custom solution', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 4: CRM ACTIVITIES
-- ============================================================================

INSERT INTO public.crm_activities (
  id,
  lead_id,
  client_id,
  activity_type,
  subject,
  description,
  status,
  due_date,
  completed_date,
  assigned_to,
  created_by,
  agency_id,
  created_at,
  updated_at
)
VALUES 
  -- Activities for Future Tech Corp (new lead)
  ('550e8400-e29b-41d4-a716-446655440300'::uuid, '550e8400-e29b-41d4-a716-446655440130'::uuid, NULL, 'call', 'Initial Discovery Call', 'Discuss ERP requirements and timeline', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  
  ('550e8400-e29b-41d4-a716-446655440301'::uuid, '550e8400-e29b-41d4-a716-446655440130'::uuid, NULL, 'email', 'Send Proposal Document', 'Send detailed proposal with pricing', 'pending', NOW() + INTERVAL '2 days', NULL, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  -- Activities for Innovation Labs (contacted)
  ('550e8400-e29b-41d4-a716-446655440302'::uuid, '550e8400-e29b-41d4-a716-446655440131'::uuid, NULL, 'meeting', 'Follow-up Meeting', 'Product demo for finance team', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
  
  ('550e8400-e29b-41d4-a716-446655440303'::uuid, '550e8400-e29b-41d4-a716-446655440131'::uuid, NULL, 'call', 'Check-in Call', 'Follow up on demo feedback', 'pending', NOW() + INTERVAL '3 days', NULL, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW(), NOW()),
  
  -- Activities for Digital Solutions (qualified)
  ('550e8400-e29b-41d4-a716-446655440304'::uuid, '550e8400-e29b-41d4-a716-446655440132'::uuid, NULL, 'meeting', 'Technical Requirements Meeting', 'Deep dive into technical requirements', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days'),
  
  ('550e8400-e29b-41d4-a716-446655440305'::uuid, '550e8400-e29b-41d4-a716-446655440132'::uuid, NULL, 'email', 'Send Custom Proposal', 'Custom proposal based on requirements', 'in_progress', NOW() + INTERVAL '1 day', NULL, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '2 days', NOW()),
  
  -- Activities for Cloud Services (proposal)
  ('550e8400-e29b-41d4-a716-446655440306'::uuid, '550e8400-e29b-41d4-a716-446655440133'::uuid, NULL, 'meeting', 'Proposal Presentation', 'Present proposal to decision makers', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
  
  ('550e8400-e29b-41d4-a716-446655440307'::uuid, '550e8400-e29b-41d4-a716-446655440133'::uuid, NULL, 'call', 'Proposal Follow-up', 'Answer questions about proposal', 'pending', NOW() + INTERVAL '1 day', NULL, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '2 days', NOW()),
  
  -- Activities for Enterprise Systems (negotiation)
  ('550e8400-e29b-41d4-a716-446655440308'::uuid, '550e8400-e29b-41d4-a716-446655440134'::uuid, NULL, 'meeting', 'Contract Negotiation', 'Finalize contract terms and pricing', 'in_progress', NOW() + INTERVAL '2 days', NULL, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '5 days', NOW()),
  
  -- Activities for NextGen Technologies (contacted)
  ('550e8400-e29b-41d4-a716-446655440309'::uuid, '550e8400-e29b-41d4-a716-446655440139'::uuid, NULL, 'call', 'Initial Contact Call', 'First call to discuss requirements', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
  
  ('550e8400-e29b-41d4-a716-446655440310'::uuid, '550e8400-e29b-41d4-a716-446655440139'::uuid, NULL, 'meeting', 'Requirements Gathering', 'Schedule requirements gathering session', 'pending', NOW() + INTERVAL '5 days', NULL, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count records
SELECT 'Lead Sources' as entity, COUNT(*) as count FROM public.lead_sources
UNION ALL
SELECT 'Sales Pipeline Stages', COUNT(*) FROM public.sales_pipeline
UNION ALL
SELECT 'Leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'CRM Activities', COUNT(*) FROM public.crm_activities
ORDER BY entity;

