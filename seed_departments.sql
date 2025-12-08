-- Seed Departments Data
-- This script adds comprehensive sample department data to the database

-- Use the default agency ID
DO $$
DECLARE
    v_agency_id UUID := '550e8400-e29b-41d4-a716-446655440000'::uuid;
    v_super_admin_id UUID := '550e8400-e29b-41d4-a716-446655440010'::uuid;
    v_hr_id UUID := '550e8400-e29b-41d4-a716-446655440012'::uuid;
    v_finance_id UUID := '550e8400-e29b-41d4-a716-446655440013'::uuid;
    v_admin_id UUID := '550e8400-e29b-41d4-a716-446655440011'::uuid;
    v_dept_exec UUID;
    v_dept_hr UUID;
    v_dept_finance UUID;
    v_dept_dev UUID;
    v_dept_sales UUID;
    v_dept_marketing UUID;
    v_dept_support UUID;
    v_dept_ops UUID;
BEGIN
    -- Generate department IDs
    v_dept_exec := gen_random_uuid();
    v_dept_hr := gen_random_uuid();
    v_dept_finance := gen_random_uuid();
    v_dept_dev := gen_random_uuid();
    v_dept_sales := gen_random_uuid();
    v_dept_marketing := gen_random_uuid();
    v_dept_support := gen_random_uuid();
    v_dept_ops := gen_random_uuid();

    -- Insert departments
    INSERT INTO public.departments (id, name, description, manager_id, parent_department_id, budget, is_active, agency_id, created_at, updated_at)
    VALUES 
        -- Executive Management (Top Level)
        (v_dept_exec, 'Executive Management', 'C-Suite and Executive Leadership responsible for strategic direction and overall company management', v_super_admin_id, NULL, 5000000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Human Resources (Top Level)
        (v_dept_hr, 'Human Resources', 'Employee Relations, Recruitment, Training & Development, Performance Management, and HR Operations', v_hr_id, NULL, 1500000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Finance & Accounting (Top Level)
        (v_dept_finance, 'Finance & Accounting', 'Financial Operations, Budgeting, Financial Reporting, Accounts Payable/Receivable, and Treasury Management', v_finance_id, NULL, 2000000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Software Development (Top Level)
        (v_dept_dev, 'Software Development', 'Product Development, Engineering, Quality Assurance, DevOps, and Technical Architecture', v_admin_id, NULL, 8000000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Sales & Business Development (Top Level)
        (v_dept_sales, 'Sales & Business Development', 'Client Acquisition, Revenue Growth, Account Management, and Business Partnerships', v_admin_id, NULL, 3000000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Marketing (Top Level)
        (v_dept_marketing, 'Marketing', 'Brand Management, Digital Marketing, Content Creation, Public Relations, and Marketing Communications', NULL, NULL, 2000000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Customer Support (Top Level)
        (v_dept_support, 'Customer Support', 'Client Support, Customer Success, Technical Support, and Customer Relationship Management', NULL, NULL, 1000000.00, true, v_agency_id, NOW(), NOW()),
        
        -- Operations (Top Level)
        (v_dept_ops, 'Operations', 'Business Operations, Process Improvement, Supply Chain Management, and Operational Excellence', v_admin_id, NULL, 2500000.00, true, v_agency_id, NOW(), NOW())
    ON CONFLICT (name, agency_id) DO UPDATE SET
        description = EXCLUDED.description,
        manager_id = EXCLUDED.manager_id,
        budget = EXCLUDED.budget,
        updated_at = NOW();

    RAISE NOTICE 'Successfully inserted/updated departments';
END $$;

-- Verify the data
SELECT 
    d.id,
    d.name,
    d.description,
    d.budget,
    d.is_active,
    p.full_name as manager_name,
    COUNT(ta.id) as team_members
FROM public.departments d
LEFT JOIN public.profiles p ON d.manager_id = p.user_id
LEFT JOIN public.team_assignments ta ON d.id = ta.department_id AND ta.is_active = true
WHERE d.agency_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
GROUP BY d.id, d.name, d.description, d.budget, d.is_active, p.full_name
ORDER BY d.name;

