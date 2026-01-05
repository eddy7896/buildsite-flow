# Agency Maintenance Mode Migration

This script migrates existing agencies to support per-agency maintenance mode.

## What It Does

1. **Main Database Migration**: Adds `maintenance_mode` and `maintenance_message` columns to the `agencies` table in the main database (buildflow_db)

2. **Agency Database Migration**: Adds `maintenance_mode` and `maintenance_message` columns to the `agency_settings` table in each existing agency database

## How to Run

### Option 1: Automatic (Recommended)
The migration runs automatically on server startup. The server will:
- Check if maintenance columns exist in the main database
- Add them if missing
- Agency databases are migrated automatically when accessed (via schema creation)

### Option 2: Manual Migration Script
If you need to run the migration manually for all existing agencies:

```bash
# From project root
node src/server/scripts/migrateAgencyMaintenanceMode.js
```

## What Happens

- **Main Database**: Adds columns to `agencies` table (if not exists)
- **Agency Databases**: Adds columns to `agency_settings` table in each agency database
- **Indexes**: Creates index on `maintenance_mode` for faster lookups
- **Defaults**: All existing agencies start with `maintenance_mode = false`

## Verification

After migration, you can verify by:

1. **Check main database**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'agencies' 
AND column_name IN ('maintenance_mode', 'maintenance_message');
```

2. **Check agency database**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'agency_settings' 
AND column_name IN ('maintenance_mode', 'maintenance_message');
```

## Notes

- The migration is **idempotent** - safe to run multiple times
- Existing data is preserved
- No downtime required
- New agencies automatically get maintenance columns via schema creation

