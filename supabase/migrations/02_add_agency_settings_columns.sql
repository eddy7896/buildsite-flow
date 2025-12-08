-- ============================================================================
-- MIGRATION: Add missing columns to agency_settings table
-- ============================================================================
-- This migration adds all the columns needed for agency settings functionality
-- including branding, theme, regional, financial, and working hours settings

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Domain column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'domain') THEN
        ALTER TABLE public.agency_settings ADD COLUMN domain VARCHAR(255);
    END IF;

    -- Currency columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'default_currency') THEN
        ALTER TABLE public.agency_settings ADD COLUMN default_currency VARCHAR(10) DEFAULT 'IN';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'currency') THEN
        ALTER TABLE public.agency_settings ADD COLUMN currency VARCHAR(10);
    END IF;

    -- Theme/Branding columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'primary_color') THEN
        ALTER TABLE public.agency_settings ADD COLUMN primary_color VARCHAR(7) DEFAULT '#3b82f6';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'secondary_color') THEN
        ALTER TABLE public.agency_settings ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#1e40af';
    END IF;

    -- Regional settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'timezone') THEN
        ALTER TABLE public.agency_settings ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'date_format') THEN
        ALTER TABLE public.agency_settings ADD COLUMN date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY';
    END IF;

    -- Financial settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'fiscal_year_start') THEN
        ALTER TABLE public.agency_settings ADD COLUMN fiscal_year_start VARCHAR(5) DEFAULT '04-01';
    END IF;

    -- Working hours and days
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'working_hours_start') THEN
        ALTER TABLE public.agency_settings ADD COLUMN working_hours_start TIME DEFAULT '09:00:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'working_hours_end') THEN
        ALTER TABLE public.agency_settings ADD COLUMN working_hours_end TIME DEFAULT '18:00:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_settings' AND column_name = 'working_days') THEN
        ALTER TABLE public.agency_settings ADD COLUMN working_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb;
    END IF;
END $$;

-- Update existing records with default values if they're null
UPDATE public.agency_settings
SET 
    default_currency = COALESCE(default_currency, 'IN'),
    currency = COALESCE(currency, default_currency, 'IN'),
    primary_color = COALESCE(primary_color, '#3b82f6'),
    secondary_color = COALESCE(secondary_color, '#1e40af'),
    timezone = COALESCE(timezone, 'Asia/Kolkata'),
    date_format = COALESCE(date_format, 'DD/MM/YYYY'),
    fiscal_year_start = COALESCE(fiscal_year_start, '04-01'),
    working_hours_start = COALESCE(working_hours_start, '09:00:00'),
    working_hours_end = COALESCE(working_hours_end, '18:00:00'),
    working_days = COALESCE(working_days, '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb)
WHERE 
    default_currency IS NULL 
    OR primary_color IS NULL 
    OR secondary_color IS NULL
    OR timezone IS NULL
    OR date_format IS NULL
    OR fiscal_year_start IS NULL
    OR working_hours_start IS NULL
    OR working_hours_end IS NULL
    OR working_days IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.agency_settings.domain IS 'Email domain for auto-generating employee emails';
COMMENT ON COLUMN public.agency_settings.default_currency IS 'Default currency code (e.g., IN, US, GB)';
COMMENT ON COLUMN public.agency_settings.currency IS 'Legacy currency field for backward compatibility';
COMMENT ON COLUMN public.agency_settings.primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN public.agency_settings.secondary_color IS 'Secondary brand color in hex format';
COMMENT ON COLUMN public.agency_settings.timezone IS 'Agency timezone (e.g., Asia/Kolkata)';
COMMENT ON COLUMN public.agency_settings.date_format IS 'Preferred date format (e.g., DD/MM/YYYY)';
COMMENT ON COLUMN public.agency_settings.fiscal_year_start IS 'Fiscal year start date (MM-DD format)';
COMMENT ON COLUMN public.agency_settings.working_hours_start IS 'Default working hours start time';
COMMENT ON COLUMN public.agency_settings.working_hours_end IS 'Default working hours end time';
COMMENT ON COLUMN public.agency_settings.working_days IS 'Array of working days (JSONB format)';

