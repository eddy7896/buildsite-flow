-- Quick Database Schema Check
-- Run: psql -U your_user -d your_database -f quick_db_check.sql

\echo '========================================'
\echo 'QUICK DATABASE SCHEMA CHECK'
\echo '========================================'
\echo ''

-- 1. Holidays table - Check for correct columns
\echo '1. HOLIDAYS TABLE - Checking for CORRECT columns:'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'holidays' AND column_name = 'is_company_holiday'
        ) THEN '✓ is_company_holiday exists'
        ELSE '✗ is_company_holiday MISSING'
    END as check_result
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'holidays' AND column_name = 'is_national_holiday'
        ) THEN '✓ is_national_holiday exists'
        ELSE '✗ is_national_holiday MISSING'
    END;

\echo ''
\echo '2. HOLIDAYS TABLE - Checking for INCORRECT columns (should be empty):'
SELECT 
    column_name,
    '✗ This column should NOT exist!' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'holidays'
  AND column_name IN ('type', 'is_mandatory');

\echo ''
\echo '3. COMPANY_EVENTS TABLE - Checking for CORRECT column:'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'company_events' AND column_name = 'all_day'
        ) THEN '✓ all_day exists'
        ELSE '✗ all_day MISSING'
    END as check_result;

\echo ''
\echo '4. COMPANY_EVENTS TABLE - Checking for INCORRECT column (should be empty):'
SELECT 
    column_name,
    '✗ This column should NOT exist!' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'company_events'
  AND column_name = 'is_all_day';

\echo ''
\echo '5. SAMPLE DATA CHECK:'
\echo '----------------------------------------'
\echo 'First 3 holidays:'
SELECT 
    name,
    date,
    is_company_holiday,
    is_national_holiday
FROM holidays
ORDER BY created_at DESC
LIMIT 3;

\echo ''
\echo 'First 3 company events:'
SELECT 
    title,
    event_type,
    all_day,
    start_date
FROM company_events
ORDER BY created_at DESC
LIMIT 3;

\echo ''
\echo '========================================'
\echo 'CHECK COMPLETE'
\echo '========================================'

