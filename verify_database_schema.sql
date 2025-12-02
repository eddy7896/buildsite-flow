-- Database Schema Verification Script
-- This script checks the actual database schema for holidays and company_events tables
-- Run this with: psql -U your_user -d your_database -f verify_database_schema.sql

\echo '========================================'
\echo 'Database Schema Verification'
\echo '========================================'
\echo ''

-- 1. Check holidays table structure
\echo '1. HOLIDAYS TABLE STRUCTURE:'
\echo '----------------------------------------'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'holidays'
ORDER BY ordinal_position;

\echo ''
\echo 'Expected columns:'
\echo '  - id (uuid)'
\echo '  - agency_id (uuid)'
\echo '  - name (text)'
\echo '  - date (date)'
\echo '  - is_company_holiday (boolean)'
\echo '  - is_national_holiday (boolean)'
\echo '  - description (text)'
\echo '  - created_at (timestamp with time zone)'
\echo '  - updated_at (timestamp with time zone)'
\echo ''

-- Check for incorrect columns that should NOT exist
\echo 'Checking for incorrect columns (should NOT exist):'
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'holidays'
  AND (column_name = 'type' OR column_name = 'is_mandatory')
ORDER BY column_name;

\echo ''
\echo '2. COMPANY_EVENTS TABLE STRUCTURE:'
\echo '----------------------------------------'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'company_events'
ORDER BY ordinal_position;

\echo ''
\echo 'Expected columns:'
\echo '  - id (uuid)'
\echo '  - agency_id (uuid)'
\echo '  - title (text)'
\echo '  - description (text)'
\echo '  - event_type (text)'
\echo '  - start_date (timestamp with time zone)'
\echo '  - end_date (timestamp with time zone)'
\echo '  - all_day (boolean)'
\echo '  - location (text)'
\echo '  - created_by (uuid)'
\echo '  - created_at (timestamp with time zone)'
\echo '  - updated_at (timestamp with time zone)'
\echo '  - color (text)'
\echo '  - is_recurring (boolean)'
\echo '  - recurrence_pattern (jsonb)'
\echo '  - attendees (jsonb)'
\echo ''

-- Check for incorrect column name
\echo 'Checking for incorrect column (should NOT exist):'
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'company_events'
  AND column_name = 'is_all_day'
ORDER BY column_name;

\echo ''
\echo '3. SAMPLE DATA CHECK:'
\echo '----------------------------------------'

-- Check holidays data
\echo 'Holidays table - Sample records (first 5):'
SELECT 
    id,
    name,
    date,
    is_company_holiday,
    is_national_holiday,
    description,
    created_at
FROM public.holidays
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo 'Holidays count by type:'
SELECT 
    CASE 
        WHEN is_national_holiday = true THEN 'National Holiday'
        WHEN is_company_holiday = true THEN 'Company Holiday'
        ELSE 'Other'
    END as holiday_type,
    COUNT(*) as count
FROM public.holidays
GROUP BY 
    CASE 
        WHEN is_national_holiday = true THEN 'National Holiday'
        WHEN is_company_holiday = true THEN 'Company Holiday'
        ELSE 'Other'
    END;

\echo ''
\echo 'Company Events table - Sample records (first 5):'
SELECT 
    id,
    title,
    event_type,
    start_date,
    end_date,
    all_day,
    location,
    created_at
FROM public.company_events
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo 'Company Events - all_day column check:'
SELECT 
    all_day,
    COUNT(*) as count
FROM public.company_events
GROUP BY all_day;

\echo ''
\echo '4. INDEXES CHECK:'
\echo '----------------------------------------'
\echo 'Holidays indexes:'
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'holidays';

\echo ''
\echo 'Company Events indexes:'
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'company_events';

\echo ''
\echo '5. FOREIGN KEY CONSTRAINTS:'
\echo '----------------------------------------'
\echo 'Holidays foreign keys:'
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'holidays';

\echo ''
\echo 'Company Events foreign keys:'
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'company_events';

\echo ''
\echo '6. DATA INTEGRITY CHECK:'
\echo '----------------------------------------'

-- Check for holidays with both flags set (should be rare but possible)
\echo 'Holidays with both is_company_holiday and is_national_holiday = true:'
SELECT 
    id,
    name,
    date,
    is_company_holiday,
    is_national_holiday
FROM public.holidays
WHERE is_company_holiday = true 
  AND is_national_holiday = true;

-- Check for holidays with neither flag set
\echo ''
\echo 'Holidays with neither flag set (potential issue):'
SELECT 
    id,
    name,
    date,
    is_company_holiday,
    is_national_holiday
FROM public.holidays
WHERE is_company_holiday = false 
  AND is_national_holiday = false;

\echo ''
\echo '7. SUMMARY:'
\echo '----------------------------------------'
\echo 'Total holidays: ' || (SELECT COUNT(*) FROM public.holidays);
\echo 'Total company events: ' || (SELECT COUNT(*) FROM public.company_events);
\echo ''
\echo '========================================'
\echo 'Verification Complete'
\echo '========================================'

