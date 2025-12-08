-- Seed data for Payroll and Invoices
-- This script populates payroll_periods, payroll, and invoices tables

DO $$
DECLARE
    default_agency_id UUID;
    default_user_id UUID;
    period1_id UUID;
    period2_id UUID;
    employee1_id UUID;
    employee2_id UUID;
    employee3_id UUID;
    client1_id UUID;
BEGIN
    -- Get or create default agency
    SELECT id INTO default_agency_id FROM agencies LIMIT 1;
    IF default_agency_id IS NULL THEN
        default_agency_id := '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- Get or create default user
    SELECT id INTO default_user_id FROM users LIMIT 1;
    IF default_user_id IS NULL THEN
        default_user_id := '550e8400-e29b-41d4-a716-446655440011';
    END IF;

    -- Get employees
    SELECT user_id INTO employee1_id FROM employee_details WHERE is_active = true LIMIT 1;
    SELECT user_id INTO employee2_id FROM employee_details WHERE is_active = true OFFSET 1 LIMIT 1;
    SELECT user_id INTO employee3_id FROM employee_details WHERE is_active = true OFFSET 2 LIMIT 1;

    -- Get a client
    SELECT id INTO client1_id FROM clients WHERE status = 'active' LIMIT 1;

    -- Insert Payroll Periods
    INSERT INTO payroll_periods (id, name, start_date, end_date, pay_date, status, created_by, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'January 2024 Payroll', 
         DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month',
         DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
         DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days',
         'paid', default_user_id, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO period1_id;

    INSERT INTO payroll_periods (id, name, start_date, end_date, pay_date, status, created_by, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'February 2024 Payroll',
         DATE_TRUNC('month', CURRENT_DATE),
         DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
         DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '5 days',
         'processing', default_user_id, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO period2_id;

    -- Get period IDs if they already exist
    SELECT id INTO period1_id FROM payroll_periods WHERE name = 'January 2024 Payroll' LIMIT 1;
    SELECT id INTO period2_id FROM payroll_periods WHERE name = 'February 2024 Payroll' LIMIT 1;

    -- Insert Payroll Records (only if we have employees and periods)
    IF employee1_id IS NOT NULL AND period1_id IS NOT NULL THEN
        INSERT INTO payroll (
            id, employee_id, payroll_period_id, base_salary, overtime_pay, bonuses, 
            deductions, gross_pay, tax_deductions, net_pay, hours_worked, 
            overtime_hours, status, created_by, created_at, updated_at
        )
        VALUES 
            (gen_random_uuid(), employee1_id, period1_id, 50000, 5000, 2000, 
             5000, 57000, 8000, 44000, 160, 10, 'paid', default_user_id, NOW(), NOW()),
            (gen_random_uuid(), employee1_id, period2_id, 50000, 3000, 0, 
             5000, 53000, 7500, 40500, 160, 5, 'draft', default_user_id, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    IF employee2_id IS NOT NULL AND period1_id IS NOT NULL THEN
        INSERT INTO payroll (
            id, employee_id, payroll_period_id, base_salary, overtime_pay, bonuses, 
            deductions, gross_pay, tax_deductions, net_pay, hours_worked, 
            overtime_hours, status, created_by, created_at, updated_at
        )
        VALUES 
            (gen_random_uuid(), employee2_id, period1_id, 45000, 3000, 1000, 
             4000, 49000, 7000, 38000, 160, 8, 'paid', default_user_id, NOW(), NOW()),
            (gen_random_uuid(), employee2_id, period2_id, 45000, 2000, 0, 
             4000, 47000, 6500, 36500, 160, 4, 'draft', default_user_id, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    IF employee3_id IS NOT NULL AND period1_id IS NOT NULL THEN
        INSERT INTO payroll (
            id, employee_id, payroll_period_id, base_salary, overtime_pay, bonuses, 
            deductions, gross_pay, tax_deductions, net_pay, hours_worked, 
            overtime_hours, status, created_by, created_at, updated_at
        )
        VALUES 
            (gen_random_uuid(), employee3_id, period1_id, 40000, 2000, 0, 
             3000, 42000, 6000, 33000, 160, 5, 'approved', default_user_id, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert Sample Invoices (only if we have a client)
    IF client1_id IS NOT NULL THEN
        INSERT INTO invoices (
            id, invoice_number, client_id, title, description, status, 
            issue_date, due_date, subtotal, tax_rate, discount, total_amount, 
            notes, created_by, created_at, updated_at
        )
        VALUES 
            (gen_random_uuid(), 'INV-2024-001', client1_id, 
             'Web Development Services - January', 
             'Monthly web development and maintenance services', 
             'paid', CURRENT_DATE - INTERVAL '20 days', 
             CURRENT_DATE - INTERVAL '10 days', 50000, 18, 0, 59000,
             'Payment received via bank transfer', default_user_id, NOW(), NOW()),
            
            (gen_random_uuid(), 'INV-2024-002', client1_id,
             'Marketing Campaign Services - February',
             'Social media marketing and content creation',
             'pending', CURRENT_DATE - INTERVAL '5 days',
             CURRENT_DATE + INTERVAL '25 days', 35000, 18, 2000, 39300,
             'Awaiting payment', default_user_id, NOW(), NOW()),
            
            (gen_random_uuid(), 'INV-2024-003', client1_id,
             'Consulting Services - Q1 2024',
             'Business consulting and strategy development',
             'sent', CURRENT_DATE - INTERVAL '2 days',
             CURRENT_DATE + INTERVAL '28 days', 75000, 18, 0, 88500,
             NULL, default_user_id, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

-- Verify the data
SELECT 'Payroll Periods' as table_name, COUNT(*) as count FROM payroll_periods
UNION ALL
SELECT 'Payroll Records', COUNT(*) FROM payroll
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices;

