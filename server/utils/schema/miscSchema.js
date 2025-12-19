/**
 * Miscellaneous Schema
 * 
 * Manages:
 * - notifications: System notifications
 * - holidays: Holiday calendar
 * - company_events: Company event records
 * - calendar_settings: Calendar configuration
 * - reports: Generated report records
 * - custom_reports: Custom report definitions
 * - role_change_requests: Role change request tracking
 * - feature_flags: Feature flag management
 * - file_storage: File storage metadata
 * 
 * Dependencies:
 * - users (for user_id and created_by references)
 * - Requires sync_holidays_date() function (from sharedFunctions)
 */

/**
 * Ensure notifications table exists
 */
async function ensureNotificationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'in_app',
      category TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      priority TEXT NOT NULL DEFAULT 'normal',
      action_url TEXT,
      read_at TIMESTAMP WITH TIME ZONE,
      sent_at TIMESTAMP WITH TIME ZONE,
      expires_at TIMESTAMP WITH TIME ZONE,
      agency_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Add agency_id column if it doesn't exist (for existing tables)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'agency_id'
      ) THEN
        ALTER TABLE public.notifications ADD COLUMN agency_id UUID;
        -- Set default agency_id for existing records (will need to be updated based on user's agency)
        UPDATE public.notifications SET agency_id = (
          SELECT agency_id FROM public.profiles WHERE profiles.user_id = notifications.user_id LIMIT 1
        ) WHERE agency_id IS NULL;
        -- If still null, set to default (shouldn't happen in production)
        UPDATE public.notifications SET agency_id = '00000000-0000-0000-0000-000000000000' WHERE agency_id IS NULL;
        ALTER TABLE public.notifications ALTER COLUMN agency_id SET NOT NULL;
      END IF;
    END $$;
  `);

  // Create index for agency_id
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON public.notifications(agency_id);
  `);
}

/**
 * Ensure holidays table exists
 */
async function ensureHolidaysTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.holidays (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      holiday_date DATE NOT NULL,
      date DATE,
      holiday_type TEXT DEFAULT 'public',
      is_recurring BOOLEAN DEFAULT false,
      description TEXT,
      is_company_holiday BOOLEAN DEFAULT false,
      is_national_holiday BOOLEAN DEFAULT false,
      agency_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(holiday_date, name, agency_id)
    );
  `);

  // Add missing columns and indexes for existing tables (migrate in-place)
  await client.query(`
    DO $$ 
    BEGIN
      -- Add date column if it doesn't exist (alias for holiday_date for frontend compatibility)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holidays' 
        AND column_name = 'date'
      ) THEN
        ALTER TABLE public.holidays ADD COLUMN date DATE;
        -- Copy holiday_date to date for existing records
        UPDATE public.holidays SET date = holiday_date WHERE date IS NULL;
      END IF;

      -- Add is_company_holiday column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holidays' 
        AND column_name = 'is_company_holiday'
      ) THEN
        ALTER TABLE public.holidays ADD COLUMN is_company_holiday BOOLEAN DEFAULT false;
        -- Set default based on existing holiday_type if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'holidays' 
          AND column_name = 'holiday_type'
        ) THEN
          UPDATE public.holidays SET is_company_holiday = (holiday_type = 'company') WHERE is_company_holiday IS NULL;
        END IF;
        UPDATE public.holidays SET is_company_holiday = false WHERE is_company_holiday IS NULL;
      END IF;

      -- Add is_national_holiday column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holidays' 
        AND column_name = 'is_national_holiday'
      ) THEN
        ALTER TABLE public.holidays ADD COLUMN is_national_holiday BOOLEAN DEFAULT false;
        -- Set default based on existing holiday_type if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'holidays' 
          AND column_name = 'holiday_type'
        ) THEN
          UPDATE public.holidays SET is_national_holiday = (holiday_type = 'public' OR holiday_type = 'national') WHERE is_national_holiday IS NULL;
        END IF;
        UPDATE public.holidays SET is_national_holiday = false WHERE is_national_holiday IS NULL;
      END IF;

      -- Add agency_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holidays' 
        AND column_name = 'agency_id'
      ) THEN
        ALTER TABLE public.holidays ADD COLUMN agency_id UUID;
      END IF;
    END $$;
  `);

  // Create indexes for performance and multi-tenancy filtering
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
    CREATE INDEX IF NOT EXISTS idx_holidays_holiday_date ON public.holidays(holiday_date);
    CREATE INDEX IF NOT EXISTS idx_holidays_agency_id ON public.holidays(agency_id);
  `);

  // Create trigger for sync_holidays_date function (after table exists)
  await client.query(`
    DROP TRIGGER IF EXISTS sync_holidays_date_trigger ON public.holidays;
    CREATE TRIGGER sync_holidays_date_trigger
      BEFORE INSERT OR UPDATE ON public.holidays
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_holidays_date();
  `);
}

/**
 * Ensure company_events table exists
 */
async function ensureCompanyEventsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.company_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT,
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE,
      location TEXT,
      is_all_day BOOLEAN DEFAULT false,
      color TEXT DEFAULT '#3b82f6',
      created_by UUID REFERENCES public.users(id),
      agency_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Add missing columns and indexes for existing tables (migrate in-place)
  await client.query(`
    DO $$
    BEGIN
      -- Add color column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'company_events' 
          AND column_name = 'color'
      ) THEN
        ALTER TABLE public.company_events ADD COLUMN color TEXT DEFAULT '#3b82f6';
      END IF;

      -- Add agency_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'company_events' 
          AND column_name = 'agency_id'
      ) THEN
        ALTER TABLE public.company_events ADD COLUMN agency_id UUID;
      END IF;

      -- Ensure is_all_day column exists (rename all_day if present)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'company_events' 
          AND column_name = 'is_all_day'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'company_events' 
            AND column_name = 'all_day'
        ) THEN
          ALTER TABLE public.company_events RENAME COLUMN all_day TO is_all_day;
        ELSE
          ALTER TABLE public.company_events ADD COLUMN is_all_day BOOLEAN DEFAULT false;
        END IF;
      END IF;
    END $$;
  `);

  // Indexes for performance and multi-tenancy filtering
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_company_events_agency_id ON public.company_events(agency_id);
    CREATE INDEX IF NOT EXISTS idx_company_events_start_date ON public.company_events(start_date);
  `);
}

/**
 * Ensure calendar_settings table exists
 */
async function ensureCalendarSettingsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.calendar_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      setting_key TEXT UNIQUE NOT NULL,
      setting_value JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure reports table exists
 */
async function ensureReportsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      description TEXT,
      parameters JSONB,
      file_path TEXT,
      file_name TEXT,
      file_size BIGINT,
      generated_by UUID REFERENCES public.users(id),
      expires_at TIMESTAMP WITH TIME ZONE,
      is_public BOOLEAN DEFAULT false,
      agency_id UUID,
      generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Add missing columns if they don't exist (for existing tables)
  // First check if table exists
  const tableExists = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'reports'
    )
  `);
  
  if (tableExists.rows[0].exists) {
    // Table exists, check and migrate columns
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'reports' 
      AND column_name IN ('type', 'report_type')
    `);
    
    const hasType = columnCheck.rows.some(r => r.column_name === 'type');
    const hasReportType = columnCheck.rows.some(r => r.column_name === 'report_type');
    
    // Rename 'type' to 'report_type' if needed
    if (hasType && !hasReportType) {
      await client.query('ALTER TABLE public.reports RENAME COLUMN type TO report_type');
      console.log('[SQL] ✅ Renamed reports.type to reports.report_type');
    }
    
    // Add report_type if it still doesn't exist
    if (!hasReportType) {
      // Check if table has rows
      const rowCount = await client.query('SELECT COUNT(*) as count FROM public.reports');
      const count = parseInt(rowCount.rows[0].count);
      
      if (count > 0) {
        // Table has data, add as nullable first
        await client.query('ALTER TABLE public.reports ADD COLUMN report_type TEXT');
        await client.query('UPDATE public.reports SET report_type = \'custom\' WHERE report_type IS NULL');
        await client.query('ALTER TABLE public.reports ALTER COLUMN report_type SET NOT NULL');
        await client.query('ALTER TABLE public.reports ALTER COLUMN report_type SET DEFAULT \'custom\'');
      } else {
        // Empty table, can add as NOT NULL directly
        await client.query('ALTER TABLE public.reports ADD COLUMN report_type TEXT NOT NULL DEFAULT \'custom\'');
      }
      console.log('[SQL] ✅ Added report_type column to reports table');
    }
  }
  
  // Use DO block for other columns (simpler)
  await client.query(`
    DO $$
    BEGIN

      -- Add file_name if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'file_name'
      ) THEN
        ALTER TABLE public.reports ADD COLUMN file_name TEXT;
      END IF;

      -- Add file_size if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'file_size'
      ) THEN
        ALTER TABLE public.reports ADD COLUMN file_size BIGINT;
      END IF;

      -- Add expires_at if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'expires_at'
      ) THEN
        ALTER TABLE public.reports ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
      END IF;

      -- Add is_public if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'is_public'
      ) THEN
        ALTER TABLE public.reports ADD COLUMN is_public BOOLEAN DEFAULT false;
      END IF;

      -- Add agency_id if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'agency_id'
      ) THEN
        ALTER TABLE public.reports ADD COLUMN agency_id UUID;
        CREATE INDEX IF NOT EXISTS idx_reports_agency_id ON public.reports(agency_id);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error adding columns to reports table: %', SQLERRM;
    END $$;
  `);
}

/**
 * Ensure custom_reports table exists
 */
async function ensureCustomReportsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.custom_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      report_type TEXT NOT NULL,
      query_config JSONB,
      created_by UUID REFERENCES public.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure role_change_requests table exists
 */
async function ensureRoleChangeRequestsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.role_change_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      requested_role TEXT NOT NULL,
      previous_role TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      requested_by UUID REFERENCES public.users(id),
      reviewed_by UUID REFERENCES public.users(id),
      reviewed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure feature_flags table exists
 */
async function ensureFeatureFlagsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.feature_flags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      feature_key TEXT UNIQUE NOT NULL,
      feature_name TEXT NOT NULL,
      description TEXT,
      is_enabled BOOLEAN DEFAULT false,
      settings JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure file_storage table exists
 */
async function ensureFileStorageTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.file_storage (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      bucket_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT,
      file_size BIGINT,
      mime_type TEXT,
      uploaded_by UUID REFERENCES public.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure all miscellaneous tables
 */
async function ensureMiscSchema(client) {
  console.log('[SQL] Ensuring miscellaneous schema...');
  
  await ensureNotificationsTable(client);
  await ensureHolidaysTable(client);
  await ensureCompanyEventsTable(client);
  await ensureCalendarSettingsTable(client);
  await ensureReportsTable(client);
  await ensureCustomReportsTable(client);
  await ensureRoleChangeRequestsTable(client);
  await ensureFeatureFlagsTable(client);
  await ensureFileStorageTable(client);
  
  console.log('[SQL] ✅ Miscellaneous schema ensured');
}

module.exports = {
  ensureMiscSchema,
  ensureNotificationsTable,
  ensureHolidaysTable,
  ensureCompanyEventsTable,
  ensureCalendarSettingsTable,
  ensureReportsTable,
  ensureCustomReportsTable,
  ensureRoleChangeRequestsTable,
  ensureFeatureFlagsTable,
  ensureFileStorageTable,
};
