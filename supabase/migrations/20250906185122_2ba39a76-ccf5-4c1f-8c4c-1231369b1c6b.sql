-- Remove GST-related tables and functions
DROP TABLE IF EXISTS public.gst_transactions CASCADE;
DROP TABLE IF EXISTS public.gst_filings CASCADE;
DROP TABLE IF EXISTS public.gst_settings CASCADE;
DROP FUNCTION IF EXISTS public.calculate_gst_liability(uuid, date, date) CASCADE;