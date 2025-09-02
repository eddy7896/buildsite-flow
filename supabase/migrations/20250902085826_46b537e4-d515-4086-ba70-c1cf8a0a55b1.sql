-- Add default_currency column to agency_settings table
ALTER TABLE public.agency_settings 
ADD COLUMN default_currency TEXT DEFAULT 'US';