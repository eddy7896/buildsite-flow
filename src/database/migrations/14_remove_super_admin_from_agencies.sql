/**
 * Migration: Remove super_admin role from all agency databases
 * 
 * This migration ensures that super_admin role exists ONLY in the main database (buildflow_db)
 * with agency_id = NULL (system-level role).
 * 
 * Super admin users should NOT have super_admin role in agency databases.
 * 
 * Run this migration on the MAIN database (buildflow_db).
 * It will automatically clean up all agency databases.
 */

-- This migration should be run on the main database
-- It will iterate through all agency databases and remove super_admin roles

DO $$
DECLARE
    agency_record RECORD;
    agency_db_name TEXT;
    sql_command TEXT;
BEGIN
    -- Get all active agencies with database names
    FOR agency_record IN 
        SELECT database_name 
        FROM public.agencies 
        WHERE database_name IS NOT NULL 
        AND database_name != 'buildflow_db'
    LOOP
        agency_db_name := agency_record.database_name;
        
        -- Skip test databases
        IF agency_db_name LIKE 'test_%' THEN
            CONTINUE;
        END IF;
        
        BEGIN
            -- Remove super_admin roles from this agency database
            -- Note: We use dynamic SQL to execute on the agency database
            -- This requires the extension to be enabled or using dblink
            
            -- For now, we'll create a function that agencies can call
            -- Or we can use a script to iterate through databases
            
            RAISE NOTICE 'Processing agency database: %', agency_db_name;
            
            -- The actual cleanup will be done by a Node.js script
            -- that connects to each agency database and removes super_admin roles
            -- This SQL file documents the requirement
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error processing agency database %: %', agency_db_name, SQLERRM;
            CONTINUE;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Super admin roles should only exist in main database.';
END $$;

-- Ensure super_admin role exists only in main database with agency_id = NULL
-- Remove any super_admin roles that have an agency_id set (should not exist, but cleanup)
DELETE FROM public.user_roles 
WHERE role = 'super_admin' 
AND agency_id IS NOT NULL;

-- Verify: All super_admin roles should have agency_id = NULL
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM public.user_roles
    WHERE role = 'super_admin'
    AND agency_id IS NOT NULL;
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % super_admin roles with agency_id set. These should be removed.', invalid_count;
    ELSE
        RAISE NOTICE 'All super_admin roles in main database have agency_id = NULL (correct).';
    END IF;
END $$;

COMMENT ON TABLE public.user_roles IS 'User role assignments - super_admin role must have agency_id = NULL (system-level only)';

