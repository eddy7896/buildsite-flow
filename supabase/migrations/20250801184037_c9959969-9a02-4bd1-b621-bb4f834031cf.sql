-- Add domain field to agency_settings table
ALTER TABLE public.agency_settings 
ADD COLUMN domain TEXT;