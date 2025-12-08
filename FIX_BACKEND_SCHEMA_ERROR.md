# Fix: Backend Schema Error

## Problem
Error: `column "domain" of relation "agency_settings" does not exist`

## Root Cause
The database schema has all the required columns, but the backend server's connection pool may have cached the old schema or needs to reconnect.

## Solution

### Step 1: Restart the Backend Server

**If the backend is running in a terminal:**
1. Stop the server (Ctrl+C)
2. Restart it:
   ```bash
   cd server
   npm start
   ```

**If the backend is running as a service:**
1. Restart the service
2. Or restart the process

### Step 2: Verify the Fix

1. Try saving settings again in the UI
2. The error should be resolved

## Verification

The schema verification script confirms all columns exist:
```bash
node scripts/verify-agency-settings-schema.cjs
```

All required columns are present:
- ✅ domain
- ✅ default_currency
- ✅ currency
- ✅ primary_color
- ✅ secondary_color
- ✅ timezone
- ✅ date_format
- ✅ fiscal_year_start
- ✅ working_hours_start
- ✅ working_hours_end
- ✅ working_days

## Why This Happens

PostgreSQL connection pools can sometimes cache schema information. When you add new columns via migration, existing connections in the pool may not see them until they reconnect. Restarting the server forces all connections to reconnect and see the updated schema.

## Alternative (If Restart Doesn't Work)

If restarting doesn't work, check:
1. Backend is connecting to the correct database (`buildflow_db`)
2. Backend is using the correct schema (`public`)
3. No connection string issues in environment variables

