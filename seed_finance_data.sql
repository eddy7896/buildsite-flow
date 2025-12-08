-- Seed data for Finance Dashboard
-- This script populates chart_of_accounts, journal_entries, and journal_entry_lines tables

-- First, get a default agency_id (or use a specific one)
DO $$
DECLARE
    default_agency_id UUID;
    default_user_id UUID;
    cash_account_id UUID;
    ar_account_id UUID;
    inventory_account_id UUID;
    ap_account_id UUID;
    revenue_account_id UUID;
    expense_account_id UUID;
    equity_account_id UUID;
    je1_id UUID;
    je2_id UUID;
    je3_id UUID;
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

    -- Insert Chart of Accounts
    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '1000', 'Cash', 'asset', true, 'Cash and cash equivalents', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO cash_account_id;

    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '1100', 'Accounts Receivable', 'asset', true, 'Amounts owed by customers', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO ar_account_id;

    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '1200', 'Inventory', 'asset', true, 'Stock and inventory items', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO inventory_account_id;

    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '2000', 'Accounts Payable', 'liability', true, 'Amounts owed to suppliers', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO ap_account_id;

    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '3000', 'Equity', 'equity', true, 'Owner equity and retained earnings', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO equity_account_id;

    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '4000', 'Revenue', 'revenue', true, 'Sales and service revenue', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO revenue_account_id;

    INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active, description, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), '5000', 'Operating Expenses', 'expense', true, 'General operating expenses', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO expense_account_id;

    -- Get account IDs if they already exist
    SELECT id INTO cash_account_id FROM chart_of_accounts WHERE account_code = '1000' LIMIT 1;
    SELECT id INTO ar_account_id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1;
    SELECT id INTO revenue_account_id FROM chart_of_accounts WHERE account_code = '4000' LIMIT 1;
    SELECT id INTO expense_account_id FROM chart_of_accounts WHERE account_code = '5000' LIMIT 1;
    SELECT id INTO ap_account_id FROM chart_of_accounts WHERE account_code = '2000' LIMIT 1;

    -- Insert Journal Entries
    -- Entry 1: Sales Revenue
    INSERT INTO journal_entries (id, entry_number, entry_date, description, reference, total_debit, total_credit, status, created_by, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'JE-2024-001', CURRENT_DATE - INTERVAL '10 days', 'Sales Revenue - January', 'INV-001-005', 85000, 85000, 'posted', default_user_id, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO je1_id;

    -- Entry 2: Equipment Purchase
    INSERT INTO journal_entries (id, entry_number, entry_date, description, reference, total_debit, total_credit, status, created_by, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'JE-2024-002', CURRENT_DATE - INTERVAL '5 days', 'Equipment Purchase', 'PO-2024-012', 45000, 45000, 'posted', default_user_id, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO je2_id;

    -- Entry 3: Office Rent
    INSERT INTO journal_entries (id, entry_number, entry_date, description, reference, total_debit, total_credit, status, created_by, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'JE-2024-003', CURRENT_DATE - INTERVAL '3 days', 'Office Rent Payment', 'RENT-JAN-2024', 25000, 25000, 'draft', default_user_id, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO je3_id;

    -- Get journal entry IDs if they already exist
    SELECT id INTO je1_id FROM journal_entries WHERE entry_number = 'JE-2024-001' LIMIT 1;
    SELECT id INTO je2_id FROM journal_entries WHERE entry_number = 'JE-2024-002' LIMIT 1;
    SELECT id INTO je3_id FROM journal_entries WHERE entry_number = 'JE-2024-003' LIMIT 1;

    -- Insert Journal Entry Lines
    -- Entry 1 Lines: Debit Accounts Receivable, Credit Revenue
    IF je1_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit_amount, credit_amount, line_number)
        VALUES 
            (gen_random_uuid(), je1_id, ar_account_id, 'Sales Revenue - January', 85000, 0, 1),
            (gen_random_uuid(), je1_id, revenue_account_id, 'Sales Revenue - January', 0, 85000, 2)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Entry 2 Lines: Debit Equipment (expense), Credit Accounts Payable
    IF je2_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit_amount, credit_amount, line_number)
        VALUES 
            (gen_random_uuid(), je2_id, expense_account_id, 'Equipment Purchase', 45000, 0, 1),
            (gen_random_uuid(), je2_id, ap_account_id, 'Equipment Purchase', 0, 45000, 2)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Entry 3 Lines: Debit Rent Expense, Credit Cash
    IF je3_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit_amount, credit_amount, line_number)
        VALUES 
            (gen_random_uuid(), je3_id, expense_account_id, 'Office Rent Payment', 25000, 0, 1),
            (gen_random_uuid(), je3_id, cash_account_id, 'Office Rent Payment', 0, 25000, 2)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

-- Verify the data
SELECT 'Chart of Accounts' as table_name, COUNT(*) as count FROM chart_of_accounts
UNION ALL
SELECT 'Journal Entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'Journal Entry Lines', COUNT(*) FROM journal_entry_lines;

