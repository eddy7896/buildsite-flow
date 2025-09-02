-- Create super admin user profile and role
-- Note: In a real system, this would be created through the signup process
-- This is for demo/testing purposes only

DO $$
DECLARE
    super_admin_user_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_agency_id UUID;
BEGIN
    -- Get or create a demo agency for the super admin
    SELECT id INTO demo_agency_id FROM agencies LIMIT 1;
    
    IF demo_agency_id IS NULL THEN
        INSERT INTO agencies (id, name, domain, subscription_plan, max_users, is_active)
        VALUES (gen_random_uuid(), 'BuildFlow System', 'system.buildflow.com', 'enterprise', 1000, true)
        RETURNING id INTO demo_agency_id;
    END IF;

    -- Insert super admin profile (if not exists)
    INSERT INTO profiles (user_id, full_name, department, position, agency_id, is_active)
    VALUES (
        super_admin_user_id,
        'Super Administrator',
        'System Administration',
        'Super Admin',
        demo_agency_id,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        is_active = true;

    -- Assign super_admin role (if not exists)
    INSERT INTO user_roles (user_id, role)
    VALUES (super_admin_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Also create the other demo users for testing
    -- Admin user
    INSERT INTO profiles (user_id, full_name, department, position, agency_id, is_active)
    VALUES (
        '00000000-0000-0000-0000-000000000002',
        'Demo Administrator',
        'Administration',
        'System Admin',
        demo_agency_id,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = true;

    INSERT INTO user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000002', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- HR user
    INSERT INTO profiles (user_id, full_name, department, position, agency_id, is_active)
    VALUES (
        '00000000-0000-0000-0000-000000000003',
        'Demo HR Manager',
        'Human Resources',
        'HR Manager',
        demo_agency_id,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = true;

    INSERT INTO user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000003', 'hr')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Finance user
    INSERT INTO profiles (user_id, full_name, department, position, agency_id, is_active)
    VALUES (
        '00000000-0000-0000-0000-000000000004',
        'Demo Finance Manager',
        'Finance',
        'Finance Manager',
        demo_agency_id,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = true;

    INSERT INTO user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000004', 'finance_manager')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Employee user
    INSERT INTO profiles (user_id, full_name, department, position, agency_id, is_active)
    VALUES (
        '00000000-0000-0000-0000-000000000005',
        'Demo Employee',
        'Construction',
        'Site Worker',
        demo_agency_id,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = true;

    INSERT INTO user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000005', 'employee')
    ON CONFLICT (user_id, role) DO NOTHING;

END $$;