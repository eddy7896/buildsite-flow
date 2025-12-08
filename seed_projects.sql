-- Seed Projects Data
-- This script adds sample project data to the projects table

-- First, ensure we have clients (they should exist from seed_initial_data.sql)
-- If not, we'll use the default client IDs

-- Insert sample projects with various statuses and details
INSERT INTO public.projects (
  id, 
  name, 
  description, 
  status, 
  start_date, 
  end_date, 
  budget, 
  client_id, 
  assigned_team, 
  progress, 
  created_by, 
  agency_id,
  created_at,
  updated_at
)
VALUES 
  -- Active Projects
  (
    '550e8400-e29b-41d4-a716-446655440100'::uuid,
    'E-Commerce Platform Development',
    'Build a comprehensive e-commerce platform with shopping cart, payment integration, and inventory management',
    'in-progress',
    '2024-12-01',
    '2025-06-30',
    1500000.00,
    '550e8400-e29b-41d4-a716-446655440070'::uuid,
    '["John Doe", "Jane Smith", "Mike Johnson"]'::jsonb,
    65,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440101'::uuid,
    'Mobile Banking App',
    'Develop a secure mobile banking application with biometric authentication and real-time transaction processing',
    'in-progress',
    '2024-11-15',
    '2025-05-15',
    2500000.00,
    '550e8400-e29b-41d4-a716-446655440071'::uuid,
    '["Sarah Williams", "David Brown", "Emily Davis"]'::jsonb,
    45,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Planning Projects
  (
    '550e8400-e29b-41d4-a716-446655440102'::uuid,
    'AI Chatbot Integration',
    'Integrate AI-powered chatbot for customer support with natural language processing capabilities',
    'planning',
    '2025-02-01',
    '2025-08-31',
    800000.00,
    '550e8400-e29b-41d4-a716-446655440072'::uuid,
    '["Alex Chen", "Lisa Wang"]'::jsonb,
    10,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440103'::uuid,
    'Cloud Infrastructure Migration',
    'Migrate legacy systems to cloud infrastructure with zero downtime and enhanced security',
    'planning',
    '2025-03-01',
    '2025-12-31',
    5000000.00,
    '550e8400-e29b-41d4-a716-446655440070'::uuid,
    '["Robert Taylor", "Maria Garcia", "James Wilson"]'::jsonb,
    5,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  -- Completed Projects
  (
    '550e8400-e29b-41d4-a716-446655440104'::uuid,
    'Website Redesign Project',
    'Complete redesign of corporate website with modern UI/UX and responsive design',
    'completed',
    '2024-08-01',
    '2024-11-30',
    600000.00,
    '550e8400-e29b-41d4-a716-446655440071'::uuid,
    '["Tom Anderson", "Jessica Martinez"]'::jsonb,
    100,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440105'::uuid,
    'Data Analytics Dashboard',
    'Build comprehensive analytics dashboard with real-time data visualization and reporting',
    'completed',
    '2024-06-01',
    '2024-10-15',
    900000.00,
    '550e8400-e29b-41d4-a716-446655440072'::uuid,
    '["Chris Lee", "Amanda White"]'::jsonb,
    100,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '210 days',
    NOW() - INTERVAL '60 days'
  ),
  -- On Hold Projects
  (
    '550e8400-e29b-41d4-a716-446655440106'::uuid,
    'Legacy System Modernization',
    'Modernize legacy systems with new architecture and improved performance',
    'on-hold',
    '2024-09-01',
    '2025-03-31',
    3000000.00,
    '550e8400-e29b-41d4-a716-446655440070'::uuid,
    '["Kevin Park", "Rachel Kim"]'::jsonb,
    30,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '20 days'
  ),
  -- Project without client
  (
    '550e8400-e29b-41d4-a716-446655440107'::uuid,
    'Internal Tool Development',
    'Develop internal project management tool for better team collaboration',
    'in-progress',
    '2024-12-15',
    '2025-04-30',
    400000.00,
    NULL,
    '["Internal Team"]'::jsonb,
    55,
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  budget = EXCLUDED.budget,
  client_id = EXCLUDED.client_id,
  assigned_team = EXCLUDED.assigned_team,
  progress = EXCLUDED.progress,
  updated_at = NOW();

-- Verify the insert
SELECT 
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'planning') as planning,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'on-hold') as on_hold,
  SUM(budget) as total_budget
FROM public.projects
WHERE agency_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

