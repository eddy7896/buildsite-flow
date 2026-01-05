-- ============================================================================
-- BuildFlow ERP - Agency Maintenance Mode Migration
-- ============================================================================
-- This migration adds maintenance mode columns to agencies table
-- Database: buildflow_db (main database)
-- Created: 2025-01-XX
-- ============================================================================

-- Add maintenance mode columns to agencies table in main database
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

-- Add comments
COMMENT ON COLUMN public.agencies.maintenance_mode IS 'Whether this agency is in maintenance mode (blocks agency users)';
COMMENT ON COLUMN public.agencies.maintenance_message IS 'Message displayed to users when agency is in maintenance mode';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agencies_maintenance_mode ON public.agencies(maintenance_mode) WHERE maintenance_mode = true;

