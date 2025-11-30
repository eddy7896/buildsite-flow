# Core Authentication & User Management Schema

## Overview

This directory contains the complete SQL schema for the core authentication and user management system of the BuildFlow Agency Management System. This is the **foundational schema** that must be created **first** before any other database tables.

## Files Included

### 1. SQL Migration File
- **File:** `supabase/migrations/00_core_auth_schema.sql`
- **Size:** ~1000 lines
- **Purpose:** Complete SQL schema definition
- **Contains:**
  - 7 tables (users, profiles, user_roles, employee_details, employee_salary_details, employee_files, audit_logs)
  - 1 custom enum type (app_role)
  - 8+ utility functions
  - 8+ trigger functions
  - 30+ RLS policies
  - 40+ indexes
  - 2 views

### 2. Documentation Files
- **CORE_AUTH_SCHEMA_DOCUMENTATION.md** - Comprehensive documentation
  - Detailed table definitions
  - Column descriptions
  - Function documentation
  - Trigger explanations
  - RLS policy details
  - Usage examples
  - Migration instructions
  - Troubleshooting guide

- **CORE_AUTH_SCHEMA_QUICK_REFERENCE.md** - Quick reference guide
  - Table summaries
  - Function list
  - Common operations
  - Index list
  - Verification queries

### 3. Setup Scripts
- **scripts/setup_core_auth_schema.sh** - Linux/macOS setup script
  - Automated schema creation
  - Connection verification
  - Schema validation
  - Test user creation

- **scripts/setup_core_auth_schema.bat** - Windows setup script
  - Same functionality as shell script
  - Windows-compatible commands

### 4. This File
- **CORE_AUTH_SCHEMA_README.md** - Overview and quick start guide

---

## Quick Start

### Option 1: Using Setup Script (Recommended)

#### Linux/macOS
```bash
# Make script executable
chmod +x scripts/setup_core_auth_schema.sh

# Run with default settings
./scripts/setup_core_auth_schema.sh

# Run with custom settings
./scripts/setup_core_auth_schema.sh -h db.example.com -d production_db -u app_user

# Verify existing schema
./scripts/setup_core_auth_schema.sh --verify-only
```

#### Windows
```cmd
# Run with default settings
scripts\setup_core_auth_schema.bat

# Run with custom settings
scripts\setup_core_auth_schema.bat -h db.example.com -d production_db -u app_user

# Verify existing schema
scripts\setup_core_auth_schema.bat --verify-only
```

### Option 2: Manual SQL Execution

```bash
# Connect to PostgreSQL
psql -U postgres -d buildflow_db

# Run migration file
psql -U postgres -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql

# Or from within psql:
\i supabase/migrations/00_core_auth_schema.sql
```

### Option 3: Using npm Script (if configured)

```bash
npm run db:init
```

---

## Schema Overview

### Tables

| Table | Purpose | Relationships |
|-------|---------|---------------|
| `users` | Core user accounts | Primary key for all user-related tables |
| `profiles` | User profile information | 1:1 with users |
| `user_roles` | Role assignments | N:M with users |
| `employee_details` | Extended employee information | 1:1 with users |
| `employee_salary_details` | Sensitive salary information | 1:1 with employee_details |
| `employee_files` | Employee document references | N:1 with employee_details |
| `audit_logs` | Audit trail for sensitive operations | References users |

### Key Features

✅ **Multi-Tenancy Support**
- `agency_id` field on all tables
- RLS policies enforce agency isolation
- Supports multiple independent agencies

✅ **Role-Based Access Control**
- 5 predefined roles: admin, hr, finance_manager, employee, super_admin
- Role-based RLS policies
- Audit logging of role changes

✅ **Security**
- SSN encryption using pgcrypto
- Password hashing with bcrypt
- Row-level security on all tables
- Comprehensive audit logging
- Role-based access to sensitive data

✅ **Performance**
- 40+ indexes for query optimization
- Efficient foreign key relationships
- Optimized RLS policies

✅ **Data Integrity**
- Foreign key constraints
- Check constraints for valid values
- Unique constraints where needed
- Automatic timestamp management

---

## Common Tasks

### Create a New User

```sql
INSERT INTO public.users (email, password_hash, raw_user_meta_data)
VALUES (
  'john.doe@example.com',
  crypt('password123', gen_salt('bf')),
  '{"full_name": "John Doe"}'::jsonb
);

-- Profile created automatically by trigger
-- Default 'employee' role assigned automatically
```

### Assign a Role

```sql
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES (
  'user-id-here',
  'hr'::app_role,
  'admin-user-id-here'
);
```

### Create an Employee

```sql
INSERT INTO public.employee_details (
  user_id,
  employee_id,
  first_name,
  last_name,
  employment_type,
  social_security_number
)
VALUES (
  'user-id-here',
  'EMP-001',
  'John',
  'Doe',
  'full-time',
  public.encrypt_ssn('123-45-6789', 'encryption_key')
);
```

### Add Salary Information

```sql
INSERT INTO public.employee_salary_details (
  employee_id,
  salary,
  salary_frequency,
  effective_date
)
VALUES (
  'employee-id-here',
  75000.00,
  'annual',
  CURRENT_DATE
);
```

### Upload an Employee File

```sql
INSERT INTO public.employee_files (
  employee_id,
  file_name,
  file_path,
  file_type,
  file_size,
  category,
  uploaded_by
)
VALUES (
  'employee-id-here',
  'resume.pdf',
  '/storage/employees/EMP-001/resume.pdf',
  'application/pdf',
  245000,
  'resume',
  'admin-user-id-here'
);
```

### Query Employees

```sql
-- All active employees
SELECT * FROM public.employee_basic_info WHERE is_active = true;

-- Employees by department
SELECT * FROM public.profiles WHERE department = 'Engineering' AND is_active = true;

-- Employee with salary (authorized users only)
SELECT * FROM public.employee_details_with_salary WHERE employee_id = 'EMP-001';
```

### Check User Roles

```sql
-- Check if user is admin
SELECT public.has_role('user-id-here', 'admin'::app_role);

-- Get user's primary role
SELECT public.get_user_role('user-id-here');
```

### View Audit Logs

```sql
-- All changes to employee_details
SELECT * FROM public.audit_logs 
WHERE table_name = 'employee_details'
ORDER BY created_at DESC;

-- Changes made by specific user
SELECT * FROM public.audit_logs 
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;
```

---

## Verification

### Verify Schema Installation

```bash
# Using setup script
./scripts/setup_core_auth_schema.sh --verify-only
```

### Manual Verification

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'user_roles', 'employee_details', 
                   'employee_salary_details', 'employee_files', 'audit_logs')
ORDER BY table_name;

-- Check all functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check all triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;

-- Check RLS is enabled
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'profiles', 'user_roles', 'employee_details', 
                  'employee_salary_details', 'employee_files', 'audit_logs');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

---

## Security Considerations

### Password Hashing
- Use bcrypt for password hashing
- Never store plain text passwords
- Use `crypt()` function with `gen_salt('bf')`

### SSN Encryption
- SSN is encrypted using pgcrypto AES encryption
- Decryption is role-restricted
- Non-authorized users see masked value: `***-**-****`

### Row-Level Security
- All tables have RLS enabled
- Policies enforce data access at database level
- Application must set `app.current_user_id` context

### Audit Logging
- All changes to sensitive tables are logged
- Includes user ID, timestamp, old/new values
- Only admins can view audit logs

### Multi-Tenancy
- `agency_id` field enables multi-tenant isolation
- RLS policies filter by agency
- Prevents cross-tenant data access

---

## Application Integration

### Setting User Context

Before executing queries, set the current user context:

```sql
-- In application, before queries:
SET LOCAL app.current_user_id = 'user-id-here';
```

### Using Functions

```sql
-- Check if user has role
SELECT public.has_role('user-id', 'admin'::app_role);

-- Get user's primary role
SELECT public.get_user_role('user-id');

-- Get user's agency
SELECT public.get_user_agency_id();

-- Encrypt SSN
SELECT public.encrypt_ssn('123-45-6789', 'encryption_key');

-- Decrypt SSN (role-restricted)
SELECT public.decrypt_ssn(encrypted_ssn, 'encryption_key');
```

---

## Troubleshooting

### Issue: "Permission denied for schema public"

**Solution:** Ensure user has proper permissions:
```sql
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
```

### Issue: "Trigger function not found"

**Solution:** Ensure functions are created before triggers:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';
```

### Issue: "RLS policy not working"

**Solution:** Ensure `app.current_user_id` is set:
```sql
-- In application, before queries:
SET LOCAL app.current_user_id = 'user-id-here';
```

### Issue: "Cannot decrypt SSN"

**Solution:** Ensure encryption key matches:
```sql
-- Use same key for encryption and decryption
SELECT public.decrypt_ssn(encrypted_ssn, 'same_encryption_key');
```

---

## Next Steps

After successfully creating this core authentication schema:

1. ✅ **Core auth schema created** - You are here
2. ⏭️ **Create remaining tables** - Proceed with other schema migrations
3. ⏭️ **Migrate data from Supabase** - Import existing data
4. ⏭️ **Update application code** - Configure application to use new database
5. ⏭️ **Test thoroughly** - Verify all functionality works
6. ⏭️ **Deploy to production** - Follow deployment procedures

---

## Documentation

For detailed information, see:

- **CORE_AUTH_SCHEMA_DOCUMENTATION.md** - Complete documentation
- **CORE_AUTH_SCHEMA_QUICK_REFERENCE.md** - Quick reference guide
- **SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md** - Full migration plan

---

## Support

For questions or issues:

1. Review the documentation files
2. Check PostgreSQL documentation: https://www.postgresql.org/docs/
3. Review RLS documentation: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

## Version Information

- **Schema Version:** 1.0
- **PostgreSQL Version:** 14+
- **Last Updated:** 2025-01-15
- **Status:** Ready for Production

---

## License

This schema is part of the BuildFlow Agency Management System.

---

**Ready to get started? Run the setup script:**

```bash
# Linux/macOS
./scripts/setup_core_auth_schema.sh

# Windows
scripts\setup_core_auth_schema.bat
```
