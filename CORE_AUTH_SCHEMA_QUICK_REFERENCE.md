# Core Authentication Schema - Quick Reference Guide

## File Location
`supabase/migrations/00_core_auth_schema.sql`

## Tables at a Glance

### 1. users
Core user accounts (replaces Supabase auth.users)
```
id (UUID) → Primary Key
email (TEXT) → UNIQUE, email validation
password_hash (TEXT) → Bcrypt hashed
email_confirmed (BOOLEAN)
created_at, updated_at (TIMESTAMP WITH TIME ZONE)
last_sign_in_at (TIMESTAMP WITH TIME ZONE)
is_active (BOOLEAN)
raw_user_meta_data (JSONB)
```

### 2. profiles
User profile information (1:1 with users)
```
id (UUID) → Primary Key
user_id (UUID) → FK to users, UNIQUE
full_name, phone, department, position
hire_date (DATE)
avatar_url (TEXT)
is_active (BOOLEAN)
agency_id (UUID) → Multi-tenant
created_at, updated_at (TIMESTAMP WITH TIME ZONE)
```

### 3. user_roles
Role assignments (N:M with users)
```
id (UUID) → Primary Key
user_id (UUID) → FK to users
role (app_role) → ENUM: admin, hr, finance_manager, employee, super_admin
assigned_at (TIMESTAMP WITH TIME ZONE)
assigned_by (UUID) → FK to users
agency_id (UUID) → Multi-tenant
UNIQUE(user_id, role, agency_id)
```

### 4. employee_details
Extended employee information (1:1 with users)
```
id (UUID) → Primary Key
user_id (UUID) → FK to users, UNIQUE
employee_id (TEXT) → UNIQUE
first_name, last_name (TEXT)
date_of_birth (DATE)
social_security_number (TEXT) → ENCRYPTED
nationality, marital_status (TEXT)
address (TEXT)
employment_type (TEXT) → CHECK: full-time, part-time, contract, intern
work_location (TEXT)
supervisor_id (UUID) → FK to users
emergency_contact_* (TEXT)
notes (TEXT)
skills (JSONB)
is_active (BOOLEAN)
agency_id (UUID) → Multi-tenant
created_at, updated_at (TIMESTAMP WITH TIME ZONE)
created_by (UUID) → FK to users
```

### 5. employee_salary_details
Sensitive salary information (1:1 with employee_details)
```
id (UUID) → Primary Key
employee_id (UUID) → FK to employee_details, UNIQUE
salary (NUMERIC(12,2))
currency (TEXT) → DEFAULT 'USD'
salary_frequency (TEXT) → CHECK: hourly, daily, weekly, bi-weekly, monthly, annual
effective_date (DATE)
agency_id (UUID) → Multi-tenant
created_at, updated_at (TIMESTAMP WITH TIME ZONE)
created_by (UUID) → FK to users
```

### 6. employee_files
Employee document references (N:1 with employee_details)
```
id (UUID) → Primary Key
employee_id (UUID) → FK to employee_details
file_name, file_path (TEXT)
file_type (TEXT) → MIME type
file_size (INTEGER)
category (TEXT)
uploaded_by (UUID) → FK to users
created_at (TIMESTAMP WITH TIME ZONE)
```

### 7. audit_logs
Audit trail for sensitive operations
```
id (UUID) → Primary Key
table_name (TEXT)
action (TEXT) → INSERT, UPDATE, DELETE
user_id (UUID) → FK to users
record_id (UUID)
old_values, new_values (JSONB)
ip_address (INET)
user_agent (TEXT)
created_at (TIMESTAMP WITH TIME ZONE)
```

## Enum Types

### app_role
```
'admin'
'hr'
'finance_manager'
'employee'
'super_admin'
```

## Key Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `has_role(user_id, role)` | BOOLEAN | Check if user has role |
| `get_user_role(user_id)` | app_role | Get user's primary role |
| `current_user_id()` | UUID | Get current user ID from context |
| `get_user_agency_id()` | UUID | Get user's agency ID |
| `encrypt_ssn(ssn, key)` | TEXT | Encrypt SSN |
| `decrypt_ssn(encrypted, key)` | TEXT | Decrypt SSN (role-restricted) |
| `update_updated_at_column()` | TRIGGER | Auto-update timestamp |

## Key Triggers

| Trigger | Table | Event | Effect |
|---------|-------|-------|--------|
| `on_auth_user_created` | users | AFTER INSERT | Create profile + assign employee role |
| `update_*_updated_at` | All tables | BEFORE UPDATE | Auto-update `updated_at` |
| `audit_*` | Sensitive tables | AFTER INSERT/UPDATE/DELETE | Log to audit_logs |

## RLS Policies Summary

### users
- Users can view/update their own record
- Admins can view/update all users

### profiles
- Users can view/update their own profile
- Admins/HR can view all profiles
- Admins can manage all profiles

### user_roles
- Users can view their own roles
- Only admins can manage roles

### employee_details
- Users can view/update their own details (limited fields)
- Admins/HR can view/manage all details

### employee_salary_details
- Only admins/finance managers can view/manage

### employee_files
- Users can view/manage their own files
- Admins/HR can view/manage all files

## Common Operations

### Create User
```sql
INSERT INTO public.users (email, password_hash, raw_user_meta_data)
VALUES (
  'user@example.com',
  crypt('password', gen_salt('bf')),
  '{"full_name": "Name"}'::jsonb
);
-- Profile created automatically by trigger
```

### Assign Role
```sql
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('user-id', 'hr'::app_role, 'admin-id');
```

### Create Employee
```sql
INSERT INTO public.employee_details (
  user_id, employee_id, first_name, last_name,
  employment_type, social_security_number
)
VALUES (
  'user-id', 'EMP-001', 'John', 'Doe',
  'full-time', public.encrypt_ssn('123-45-6789', 'key')
);
```

### Add Salary
```sql
INSERT INTO public.employee_salary_details (
  employee_id, salary, salary_frequency, effective_date
)
VALUES ('emp-id', 75000.00, 'annual', CURRENT_DATE);
```

### Upload File
```sql
INSERT INTO public.employee_files (
  employee_id, file_name, file_path, file_type, file_size, category, uploaded_by
)
VALUES (
  'emp-id', 'resume.pdf', '/path/resume.pdf',
  'application/pdf', 245000, 'resume', 'user-id'
);
```

### Check Role
```sql
SELECT public.has_role('user-id', 'admin'::app_role);
```

### Query Employees
```sql
-- All active employees
SELECT * FROM public.employee_basic_info WHERE is_active = true;

-- By department
SELECT * FROM public.profiles WHERE department = 'Engineering';

-- With salary (authorized only)
SELECT * FROM public.employee_details_with_salary WHERE employee_id = 'EMP-001';
```

### View Audit Log
```sql
SELECT * FROM public.audit_logs 
WHERE table_name = 'employee_details'
ORDER BY created_at DESC;
```

## Indexes Created

### users
- `idx_users_email`
- `idx_users_is_active`
- `idx_users_created_at`
- `idx_users_email_confirmed`

### profiles
- `idx_profiles_user_id`
- `idx_profiles_agency_id`
- `idx_profiles_is_active`
- `idx_profiles_department`
- `idx_profiles_created_at`

### user_roles
- `idx_user_roles_user_id`
- `idx_user_roles_role`
- `idx_user_roles_agency_id`
- `idx_user_roles_assigned_by`
- `idx_user_roles_assigned_at`

### employee_details
- `idx_employee_details_user_id`
- `idx_employee_details_employee_id`
- `idx_employee_details_supervisor_id`
- `idx_employee_details_agency_id`
- `idx_employee_details_is_active`
- `idx_employee_details_employment_type`
- `idx_employee_details_created_at`

### employee_salary_details
- `idx_employee_salary_details_employee_id`
- `idx_employee_salary_details_agency_id`
- `idx_employee_salary_details_effective_date`
- `idx_employee_salary_details_created_at`

### employee_files
- `idx_employee_files_employee_id`
- `idx_employee_files_category`
- `idx_employee_files_uploaded_by`
- `idx_employee_files_created_at`

### audit_logs
- `idx_audit_logs_table_name`
- `idx_audit_logs_user_id`
- `idx_audit_logs_action`
- `idx_audit_logs_created_at`

## Installation

```bash
# Connect to database
psql -U postgres -d buildflow_db

# Run migration
psql -U postgres -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql

# Verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

## Verification Queries

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
```

## Security Checklist

- [ ] pgcrypto extension enabled
- [ ] All tables have RLS enabled
- [ ] All RLS policies created
- [ ] Audit logging configured
- [ ] Password hashing using bcrypt
- [ ] SSN encryption enabled
- [ ] Indexes created for performance
- [ ] Foreign keys configured
- [ ] Triggers configured
- [ ] Functions created

## Next Steps

1. ✅ Core auth schema created
2. ⏭️ Create remaining tables (agencies, departments, projects, etc.)
3. ⏭️ Migrate data from Supabase
4. ⏭️ Update application code
5. ⏭️ Test thoroughly
6. ⏭️ Deploy to production

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2025-01-15
