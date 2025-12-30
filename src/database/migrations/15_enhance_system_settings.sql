-- ============================================================================
-- BuildFlow ERP - Enhanced System Settings Schema Migration
-- ============================================================================
-- This migration adds additional settings categories:
-- - Email/SMTP Configuration
-- - Security Settings
-- - Database Configuration (read-only display)
-- - Docker/Environment Settings
-- Database: buildflow_db
-- Created: 2025-01-15
-- ============================================================================

-- Add email/SMTP configuration fields
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS email_provider TEXT DEFAULT 'smtp',
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS smtp_from TEXT,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sendgrid_api_key TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS sendgrid_from TEXT,
ADD COLUMN IF NOT EXISTS mailgun_api_key TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS mailgun_domain TEXT,
ADD COLUMN IF NOT EXISTS aws_ses_region TEXT,
ADD COLUMN IF NOT EXISTS aws_access_key_id TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS aws_secret_access_key TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS resend_api_key TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS resend_from TEXT;

-- Add security settings
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS password_min_length INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS password_require_uppercase BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS password_require_lowercase BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS password_require_numbers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS password_require_symbols BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_expiry_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS max_login_attempts INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS lockout_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_two_factor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_captcha BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS captcha_site_key TEXT,
ADD COLUMN IF NOT EXISTS captcha_secret_key TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS enable_rate_limiting BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rate_limit_requests_per_minute INTEGER DEFAULT 60;

-- Add Docker/environment configuration (read-only display)
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS docker_compose_version TEXT,
ADD COLUMN IF NOT EXISTS node_version TEXT,
ADD COLUMN IF NOT EXISTS postgres_version TEXT,
ADD COLUMN IF NOT EXISTS redis_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS redis_host TEXT,
ADD COLUMN IF NOT EXISTS redis_port INTEGER DEFAULT 6379;

-- Add file storage settings
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS file_storage_provider TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS file_storage_path TEXT DEFAULT '/app/storage',
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT DEFAULT 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip',
ADD COLUMN IF NOT EXISTS aws_s3_bucket TEXT,
ADD COLUMN IF NOT EXISTS aws_s3_region TEXT,
ADD COLUMN IF NOT EXISTS aws_s3_access_key_id TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS aws_s3_secret_access_key TEXT; -- Encrypted in application

-- Add API configuration
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS api_rate_limit_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS api_rate_limit_requests_per_minute INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS api_timeout_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS enable_api_documentation BOOLEAN DEFAULT true;

-- Add logging and monitoring
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS log_level TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS enable_audit_logging BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS log_retention_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS enable_error_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sentry_dsn TEXT, -- Encrypted in application
ADD COLUMN IF NOT EXISTS enable_performance_monitoring BOOLEAN DEFAULT false;

-- Add backup settings
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS enable_auto_backup BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS backup_frequency_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS backup_retention_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS backup_storage_path TEXT DEFAULT '/app/backups';

-- Add comments
COMMENT ON COLUMN public.system_settings.email_provider IS 'Email provider: smtp, sendgrid, mailgun, aws_ses, resend';
COMMENT ON COLUMN public.system_settings.smtp_password IS 'SMTP password (encrypted in application)';
COMMENT ON COLUMN public.system_settings.password_min_length IS 'Minimum password length requirement';
COMMENT ON COLUMN public.system_settings.session_timeout_minutes IS 'User session timeout in minutes';
COMMENT ON COLUMN public.system_settings.max_login_attempts IS 'Maximum failed login attempts before lockout';
COMMENT ON COLUMN public.system_settings.file_storage_provider IS 'File storage provider: local, s3';
COMMENT ON COLUMN public.system_settings.log_level IS 'Logging level: debug, info, warn, error';
COMMENT ON COLUMN public.system_settings.enable_auto_backup IS 'Enable automatic database backups';

