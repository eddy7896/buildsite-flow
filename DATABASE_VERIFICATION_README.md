# Database Schema Verification Guide

This guide helps you verify that the database schema matches the expected structure after the bug fixes.

## Quick Verification

### Option 1: Using the SQL Script (Recommended)

**Windows (PowerShell):**
```powershell
.\verify_database.ps1
```

**Linux/Mac:**
```bash
./verify_database.sh
```

**Direct SQL:**
```bash
psql -U your_user -d your_database -f verify_database_schema.sql
```

### Option 2: Manual Verification Commands

Connect to your database and run these commands:

#### 1. Check Holidays Table Structure
```sql
\d holidays
```

**Expected columns:**
- `id` (uuid)
- `agency_id` (uuid)
- `name` (text)
- `date` (date)
- `is_company_holiday` (boolean) ✅
- `is_national_holiday` (boolean) ✅
- `description` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

**Should NOT have:**
- `type` column ❌
- `is_mandatory` column ❌

#### 2. Check Company Events Table Structure
```sql
\d company_events
```

**Expected columns:**
- `id` (uuid)
- `agency_id` (uuid)
- `title` (text)
- `description` (text)
- `event_type` (text)
- `start_date` (timestamp with time zone)
- `end_date` (timestamp with time zone)
- `all_day` (boolean) ✅
- `location` (text)
- `created_by` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `color` (text)
- `is_recurring` (boolean)
- `recurrence_pattern` (jsonb)
- `attendees` (jsonb)

**Should NOT have:**
- `is_all_day` column ❌

#### 3. Verify No Incorrect Columns Exist

```sql
-- Check for incorrect columns in holidays table
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'holidays' 
  AND column_name IN ('type', 'is_mandatory');

-- Should return 0 rows

-- Check for incorrect column in company_events table
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'company_events' 
  AND column_name = 'is_all_day';

-- Should return 0 rows
```

#### 4. Check Sample Data

```sql
-- View sample holidays
SELECT 
    id,
    name,
    date,
    is_company_holiday,
    is_national_holiday,
    description
FROM holidays
ORDER BY created_at DESC
LIMIT 5;

-- View sample company events
SELECT 
    id,
    title,
    event_type,
    start_date,
    end_date,
    all_day,
    location
FROM company_events
ORDER BY created_at DESC
LIMIT 5;
```

#### 5. Count Records by Type

```sql
-- Holidays by type
SELECT 
    CASE 
        WHEN is_national_holiday = true THEN 'National Holiday'
        WHEN is_company_holiday = true THEN 'Company Holiday'
        ELSE 'Other'
    END as holiday_type,
    COUNT(*) as count
FROM holidays
GROUP BY 
    CASE 
        WHEN is_national_holiday = true THEN 'National Holiday'
        WHEN is_company_holiday = true THEN 'Company Holiday'
        ELSE 'Other'
    END;

-- Company events by all_day flag
SELECT 
    all_day,
    COUNT(*) as count
FROM company_events
GROUP BY all_day;
```

## What Was Fixed

### Bug 1 & 3: Holidays Table Schema Mismatch
- **Problem:** Code was trying to insert/read `type` and `is_mandatory` columns
- **Reality:** Database has `is_company_holiday` and `is_national_holiday` columns
- **Fix:** Updated code to:
  - Insert using `is_company_holiday` and `is_national_holiday`
  - Map database fields to interface fields when reading

### Bug 4: Company Events Column Name Mismatch
- **Problem:** Code was trying to insert `is_all_day` column
- **Reality:** Database column is named `all_day`
- **Fix:** Updated code to use `all_day` when inserting

## Verification Checklist

- [ ] Holidays table has `is_company_holiday` column (boolean)
- [ ] Holidays table has `is_national_holiday` column (boolean)
- [ ] Holidays table does NOT have `type` column
- [ ] Holidays table does NOT have `is_mandatory` column
- [ ] Company events table has `all_day` column (boolean)
- [ ] Company events table does NOT have `is_all_day` column
- [ ] Sample data shows correct values in the expected columns
- [ ] No errors when querying the tables

## If Issues Are Found

### If incorrect columns exist:
1. Check migration files in `supabase/migrations/`
2. Run the correct migration to fix the schema
3. Update any existing data if needed

### If data is in wrong format:
1. Create a migration script to transform data
2. Map old format to new format
3. Test the transformation on a backup first

## Connection Examples

### Using Connection String:
```bash
psql "postgresql://user:password@localhost:5432/database_name"
```

### Using Individual Parameters:
```bash
psql -h localhost -p 5432 -U username -d database_name
```

### Using Environment Variable:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
psql $DATABASE_URL -f verify_database_schema.sql
```

## Next Steps

After verification:
1. Test the application with the fixed code
2. Verify inserts work correctly
3. Verify reads return correct data
4. Check that the UI displays data correctly

