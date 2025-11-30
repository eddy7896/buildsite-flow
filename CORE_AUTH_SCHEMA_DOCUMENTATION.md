# Core Authentication & User Management Schema Documentation

## Overview

This document describes the foundational authentication and user management schema for the BuildFlow Agency Management System. These tables form the core of the system and must be created **first** before any other database tables.

**File Location:** `supabase/migrations/00_core_auth_schema.sql`

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Table Definitions](#table-definitions)
3. [Data Types & Constraints](#data-types--constraints)
4. [Functions](#functions)
5. [Triggers](#triggers)
6. [Row-Level Security (RLS)](#row-level-security-rls)
7. [Views](#views)
8. [Usage Examples](#usage-examples)
9. [Migration Instructions](#migration-instructions)

---

## Schema Overview

### Tables Created

| Table | Purpose | Relationships |
|-------|---------|---------------|
| `users` | Core user accounts | Primary key for all user-related tables |
| `profiles` | User profile information | 1:1 with users |
| `user_roles` | Role assignments | N:M with users (many roles per user) |
| `employee_details` | Extended employee information | 1:1 with users |
| `employee_salary_details` | Sensitive salary information | 1:1 with employee_details |
| `employee_files` | Employee document references | N:1 with employee_details |
| `audit_logs` | Audit trail for sensitive operations | References users |

### Custom Types

- **`app_role` (ENUM):** Defines available roles
  - `admin` - System administrator
  - `hr` - Human resources manager
  - `finance_manager` - Finance department manager
  - `employee` - Regular employee
  - `super_admin` - Super administrator (multi-tenant)

### Extensions

- **`pgcrypto`** - For encryption/decryption of sensitive data (SSN)

---

## Table Definitions

### 1. USERS Table

**Purpose:** Core user account table (replaces Supabase auth.users)

**SQL Definition:**
```sql
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_confirmed BOOLEAN DEFAULT false,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT users_email_check CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `email` | TEXT | NOT NULL, UNIQUE | User email address (must be valid format) |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password |
| `email_confirmed` | BOOLEAN | DEFAULT false | Email verification status |
| `email_confirmed_at` | TIMESTAMP WITH TIME ZONE | NULL | When email was confirmed |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update timestamp |
| `last_sign_in_at` | TIMESTAMP WITH TIME ZONE | NULL | Last login timestamp |
| `is_active` | BOOLEAN | DEFAULT true | Account active status |
| `raw_user_meta_data` | JSONB | DEFAULT '{}' | Additional user metadata |

**Indexes:**
- `idx_users_email` - For email lookups
- `idx_users_is_active` - For filtering active users
- `idx_users_created_at` - For sorting by creation date
- `idx_users_email_confirmed` - For finding unconfirmed emails

**Triggers:**
- `update_users_updated_at` - Auto-updates `updated_at` on modification

---

### 2. PROFILES Table

**Purpose:** User profile information (one-to-one with users)

**SQL Definition:**
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  hire_date DATE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  agency_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique profile identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK | Reference to users table |
| `full_name` | TEXT | NULL | User's full name |
| `phone` | TEXT | NULL | Contact phone number |
| `department` | TEXT | NULL | Department assignment |
| `position` | TEXT | NULL | Job position/title |
| `hire_date` | DATE | NULL | Employment start date |
| `avatar_url` | TEXT | NULL | Profile picture URL |
| `is_active` | BOOLEAN | DEFAULT true | Profile active status |
| `agency_id` | UUID | NULL | Multi-tenant agency reference |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_profiles_user_id` - For user lookups
- `idx_profiles_agency_id` - For multi-tenant filtering
- `idx_profiles_is_active` - For active profile filtering
- `idx_profiles_department` - For department queries
- `idx_profiles_created_at` - For sorting

**Triggers:**
- `update_profiles_updated_at` - Auto-updates `updated_at`

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 3. USER_ROLES Table

**Purpose:** Role assignments (many-to-many relationship)

**SQL Definition:**
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  agency_id UUID,
  
  UNIQUE (user_id, role, agency_id)
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique role assignment identifier |
| `user_id` | UUID | NOT NULL, FK | Reference to users table |
| `role` | app_role | NOT NULL | Role type (admin, hr, finance_manager, employee, super_admin) |
| `assigned_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | When role was assigned |
| `assigned_by` | UUID | FK | User who assigned the role |
| `agency_id` | UUID | NULL | Multi-tenant agency reference |

**Constraints:**
- `UNIQUE (user_id, role, agency_id)` - Each user can have each role only once per agency

**Indexes:**
- `idx_user_roles_user_id` - For user lookups
- `idx_user_roles_role` - For role filtering
- `idx_user_roles_agency_id` - For multi-tenant filtering
- `idx_user_roles_assigned_by` - For tracking who assigned roles
- `idx_user_roles_assigned_at` - For sorting by assignment date

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `assigned_by` → `users(id)` ON DELETE SET NULL

---

### 4. EMPLOYEE_DETAILS Table

**Purpose:** Extended employee information (one-to-one with users)

**SQL Definition:**
```sql
CREATE TABLE public.employee_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  social_security_number TEXT,
  nationality TEXT,
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  address TEXT,
  
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  work_location TEXT,
  supervisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  notes TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  agency_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique employee identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK | Reference to users table |
| `employee_id` | TEXT | UNIQUE, NOT NULL | Employee ID number |
| `first_name` | TEXT | NOT NULL | Employee first name |
| `last_name` | TEXT | NOT NULL | Employee last name |
| `date_of_birth` | DATE | NULL | Date of birth |
| `social_security_number` | TEXT | NULL | SSN (encrypted) |
| `nationality` | TEXT | NULL | Nationality |
| `marital_status` | TEXT | CHECK | single, married, divorced, widowed |
| `address` | TEXT | NULL | Home address |
| `employment_type` | TEXT | CHECK | full-time, part-time, contract, intern |
| `work_location` | TEXT | NULL | Work location/office |
| `supervisor_id` | UUID | FK | Reference to supervisor user |
| `emergency_contact_name` | TEXT | NULL | Emergency contact name |
| `emergency_contact_phone` | TEXT | NULL | Emergency contact phone |
| `emergency_contact_relationship` | TEXT | NULL | Relationship to employee |
| `notes` | TEXT | NULL | Additional notes |
| `skills` | JSONB | DEFAULT '[]' | Array of employee skills |
| `is_active` | BOOLEAN | DEFAULT true | Employee active status |
| `agency_id` | UUID | NULL | Multi-tenant agency reference |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Last update timestamp |
| `created_by` | UUID | FK | User who created record |

**Indexes:**
- `idx_employee_details_user_id` - For user lookups
- `idx_employee_details_employee_id` - For employee ID lookups
- `idx_employee_details_supervisor_id` - For supervisor queries
- `idx_employee_details_agency_id` - For multi-tenant filtering
- `idx_employee_details_is_active` - For active employee filtering
- `idx_employee_details_employment_type` - For employment type queries
- `idx_employee_details_created_at` - For sorting

**Triggers:**
- `update_employee_details_updated_at` - Auto-updates `updated_at`
- `audit_employee_details` - Logs changes to audit_logs table

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `supervisor_id` → `users(id)` ON DELETE SET NULL
- `created_by` → `users(id)` ON DELETE SET NULL

**Security Notes:**
- `social_security_number` is encrypted using pgcrypto
- Access controlled via RLS policies
- Audit logging enabled

---

### 5. EMPLOYEE_SALARY_DETAILS Table

**Purpose:** Sensitive salary information (one-to-one with employee_details)

**SQL Definition:**
```sql
CREATE TABLE public.employee_salary_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employee_details(id) ON DELETE CASCADE,
  salary NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  salary_frequency TEXT DEFAULT 'monthly' CHECK (salary_frequency IN ('hourly', 'daily', 'weekly', 'bi-weekly', 'monthly', 'annual')),
  effective_date DATE,
  agency_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique salary record identifier |
| `employee_id` | UUID | NOT NULL, UNIQUE, FK | Reference to employee_details |
| `salary` | NUMERIC(12, 2) | NULL | Salary amount |
| `currency` | TEXT | DEFAULT 'USD' | Currency code |
| `salary_frequency` | TEXT | CHECK | hourly, daily, weekly, bi-weekly, monthly, annual |
| `effective_date` | DATE | NULL | When salary became effective |
| `agency_id` | UUID | NULL | Multi-tenant agency reference |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Last update timestamp |
| `created_by` | UUID | FK | User who created record |

**Indexes:**
- `idx_employee_salary_details_employee_id` - For employee lookups
- `idx_employee_salary_details_agency_id` - For multi-tenant filtering
- `idx_employee_salary_details_effective_date` - For date range queries
- `idx_employee_salary_details_created_at` - For sorting

**Triggers:**
- `update_employee_salary_details_updated_at` - Auto-updates `updated_at`
- `audit_employee_salary_details` - Logs changes to audit_logs table

**Foreign Keys:**
- `employee_id` → `employee_details(id)` ON DELETE CASCADE
- `created_by` → `users(id)` ON DELETE SET NULL

**Security Notes:**
- Highly restricted access via RLS policies
- Only admins and finance managers can view/modify
- Audit logging enabled
- Separate table for enhanced security

---

### 6. EMPLOYEE_FILES Table

**Purpose:** Employee document storage references (many-to-one with employee_details)

**SQL Definition:**
```sql
CREATE TABLE public.employee_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employee_details(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  category TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique file record identifier |
| `employee_id` | UUID | NOT NULL, FK | Reference to employee_details |
| `file_name` | TEXT | NOT NULL | Original file name |
| `file_path` | TEXT | NOT NULL | Storage path/location |
| `file_type` | TEXT | NOT NULL | MIME type (e.g., application/pdf) |
| `file_size` | INTEGER | NOT NULL | File size in bytes |
| `category` | TEXT | NOT NULL | Document category (resume, contract, etc.) |
| `uploaded_by` | UUID | FK | User who uploaded file |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Upload timestamp |

**Indexes:**
- `idx_employee_files_employee_id` - For employee lookups
- `idx_employee_files_category` - For category filtering
- `idx_employee_files_uploaded_by` - For user lookups
- `idx_employee_files_created_at` - For sorting

**Foreign Keys:**
- `employee_id` → `employee_details(id)` ON DELETE CASCADE
- `uploaded_by` → `users(id)` ON DELETE SET NULL

---

### 7. AUDIT_LOGS Table

**Purpose:** Audit trail for sensitive operations

**SQL Definition:**
```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique audit log entry |
| `table_name` | TEXT | NOT NULL | Table that was modified |
| `action` | TEXT | NOT NULL | INSERT, UPDATE, or DELETE |
| `user_id` | UUID | FK | User who made the change |
| `record_id` | UUID | NULL | ID of modified record |
| `old_values` | JSONB | NULL | Previous values (for UPDATE/DELETE) |
| `new_values` | JSONB | NULL | New values (for INSERT/UPDATE) |
| `ip_address` | INET | NULL | IP address of user |
| `user_agent` | TEXT | NULL | User agent string |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | When change occurred |

**Indexes:**
- `idx_audit_logs_table_name` - For table filtering
- `idx_audit_logs_user_id` - For user lookups
- `idx_audit_logs_action` - For action filtering
- `idx_audit_logs_created_at` - For date range queries

---

## Data Types & Constraints

### UUID Type
- Used for all primary keys
- Generated using `gen_random_uuid()`
- Provides globally unique identifiers

### TIMESTAMP WITH TIME ZONE
- All timestamps include timezone information
- Automatically set to UTC
- Supports timezone-aware queries

### JSONB Type
- Used for flexible data storage
- Supports indexing and querying
- Examples: `skills`, `raw_user_meta_data`

### NUMERIC(12, 2)
- Used for financial amounts
- 12 total digits, 2 decimal places
- Prevents floating-point precision issues

### Enums
- `app_role` - Restricts role values to predefined set
- Provides type safety and validation

### Constraints
- **NOT NULL** - Required fields
- **UNIQUE** - Prevents duplicate values
- **CHECK** - Validates field values
- **FOREIGN KEY** - Maintains referential integrity
- **PRIMARY KEY** - Unique identifier for each row

---

## Functions

### Authentication Functions

#### `has_role(_user_id UUID, _role app_role) → BOOLEAN`
Checks if a user has a specific role.

```sql
SELECT public.has_role('user-id-here', 'admin'::app_role);
-- Returns: true or false
```

#### `get_user_role(_user_id UUID) → app_role`
Gets the user's primary role.

```sql
SELECT public.get_user_role('user-id-here');
-- Returns: 'admin', 'hr', 'finance_manager', 'employee', or 'super_admin'
```

#### `current_user_id() → UUID`
Gets the current user ID from application context.

```sql
SELECT public.current_user_id();
-- Returns: UUID of authenticated user
```

#### `get_user_agency_id() → UUID`
Gets the current user's agency ID.

```sql
SELECT public.get_user_agency_id();
-- Returns: UUID of user's agency
```

### Utility Functions

#### `update_updated_at_column() → TRIGGER`
Automatically updates the `updated_at` timestamp when a record is modified.

#### `encrypt_ssn(ssn_text TEXT, encryption_key TEXT) → TEXT`
Encrypts a social security number using AES encryption.

```sql
SELECT public.encrypt_ssn('123-45-6789', 'encryption_key');
-- Returns: Base64-encoded encrypted SSN
```

#### `decrypt_ssn(encrypted_ssn TEXT, encryption_key TEXT) → TEXT`
Decrypts an SSN (with role-based access control).

```sql
SELECT public.decrypt_ssn(encrypted_ssn, 'encryption_key');
-- Returns: Decrypted SSN or '***-**-****' if not authorized
```

### Trigger Functions

#### `handle_new_user() → TRIGGER`
Automatically creates a profile and assigns default role when a new user is created.

#### `audit_trigger_function() → TRIGGER`
Logs changes to sensitive tables (employee_details, employee_salary_details, user_roles) to the audit_logs table.

---

## Triggers

### Timestamp Update Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `update_users_updated_at` | users | BEFORE UPDATE | `update_updated_at_column()` |
| `update_profiles_updated_at` | profiles | BEFORE UPDATE | `update_updated_at_column()` |
| `update_employee_details_updated_at` | employee_details | BEFORE UPDATE | `update_updated_at_column()` |
| `update_employee_salary_details_updated_at` | employee_salary_details | BEFORE UPDATE | `update_updated_at_column()` |

### User Creation Trigger

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | users | AFTER INSERT | `handle_new_user()` |

**Effect:** When a new user is created, automatically:
1. Creates a profile record
2. Assigns default 'employee' role

### Audit Logging Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `audit_employee_details` | employee_details | AFTER INSERT/UPDATE/DELETE | `audit_trigger_function()` |
| `audit_employee_salary_details` | employee_salary_details | AFTER INSERT/UPDATE/DELETE | `audit_trigger_function()` |
| `audit_user_roles` | user_roles | AFTER INSERT/UPDATE/DELETE | `audit_trigger_function()` |

**Effect:** Logs all changes to sensitive tables for compliance and auditing.

---

## Row-Level Security (RLS)

RLS policies enforce data access control at the database level. All authentication tables have RLS enabled.

### USERS Table Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| Users can view their own user record | SELECT | `id = current_user_id()` |
| Admins can view all users | SELECT | User has admin role |
| Admins can update users | UPDATE | User has admin role |
| Users can update their own account | UPDATE | `id = current_user_id()` |

### PROFILES Table Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| Users can view their own profile | SELECT | `user_id = current_user_id()` |
| Users can update their own profile | UPDATE | `user_id = current_user_id()` |
| Users can insert their own profile | INSERT | `user_id = current_user_id()` |
| Admins can view all profiles | SELECT | User has admin role |
| HR can view all profiles | SELECT | User has hr role |
| Admins can manage all profiles | ALL | User has admin role |

### USER_ROLES Table Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| Users can view their own roles | SELECT | `user_id = current_user_id()` |
| Admins can view all roles | SELECT | User has admin role |
| Only admins can manage roles | ALL | User has admin role |

### EMPLOYEE_DETAILS Table Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| Users can view their own details | SELECT | `user_id = current_user_id()` |
| Users can update own basic info | UPDATE | `user_id = current_user_id()` (limited fields) |
| Admins and HR can view all | SELECT | User has admin or hr role |
| Admins and HR can manage all | ALL | User has admin or hr role |

### EMPLOYEE_SALARY_DETAILS Table Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| Only admins and finance managers can view | SELECT | User has admin or finance_manager role |
| Only admins and finance managers can manage | ALL | User has admin or finance_manager role |

### EMPLOYEE_FILES Table Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| Users can view their own files | SELECT | File belongs to user's employee record |
| Users can manage their own files | ALL | File belongs to user's employee record |
| Admins and HR can view all | SELECT | User has admin or hr role |
| Admins and HR can manage all | ALL | User has admin or hr role |

---

## Views

### employee_basic_info

Provides filtered employee data with role-based SSN masking.

```sql
SELECT * FROM public.employee_basic_info;
```

**Columns:**
- `id`, `user_id`, `employee_id`
- `first_name`, `last_name`
- `employment_type`, `is_active`
- `full_name`, `phone`, `department`, `position`, `hire_date`
- `social_security_number` (masked for non-authorized users)

### employee_details_with_salary

Combines employee details with salary information.

```sql
SELECT * FROM public.employee_details_with_salary;
```

**Columns:**
- All columns from `employee_details`
- `salary`, `salary_frequency`, `currency`, `effective_date`
- `decrypted_ssn` (masked for non-authorized users)

---

## Usage Examples

### Creating a New User

```sql
-- Insert new user
INSERT INTO public.users (email, password_hash, raw_user_meta_data)
VALUES (
  'john.doe@example.com',
  crypt('password123', gen_salt('bf')),
  '{"full_name": "John Doe"}'::jsonb
);

-- Note: Profile and default role are created automatically by trigger
```

### Assigning a Role to a User

```sql
-- Get user ID
SELECT id FROM public.users WHERE email = 'john.doe@example.com';

-- Assign role
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES (
  'user-id-here',
  'hr'::app_role,
  'admin-user-id-here'
);
```

### Creating an Employee Record

```sql
-- Insert employee details
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

### Adding Salary Information

```sql
-- Get employee ID
SELECT id FROM public.employee_details WHERE employee_id = 'EMP-001';

-- Insert salary
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

### Uploading an Employee File

```sql
-- Get employee ID
SELECT id FROM public.employee_details WHERE employee_id = 'EMP-001';

-- Insert file reference
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

### Checking User Roles

```sql
-- Check if user is admin
SELECT public.has_role('user-id-here', 'admin'::app_role);

-- Get user's primary role
SELECT public.get_user_role('user-id-here');
```

### Querying Employee Data

```sql
-- Get all active employees
SELECT * FROM public.employee_basic_info WHERE is_active = true;

-- Get employees by department
SELECT * FROM public.profiles WHERE department = 'Engineering' AND is_active = true;

-- Get employee with salary (authorized users only)
SELECT * FROM public.employee_details_with_salary WHERE employee_id = 'EMP-001';
```

### Viewing Audit Logs

```sql
-- Get all changes to employee_details
SELECT * FROM public.audit_logs 
WHERE table_name = 'employee_details'
ORDER BY created_at DESC;

-- Get changes made by specific user
SELECT * FROM public.audit_logs 
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;
```

---

## Migration Instructions

### Prerequisites

- PostgreSQL 14+ installed
- `psql` command-line tool available
- Database created and accessible

### Step 1: Connect to Database

```bash
psql -U postgres -d buildflow_db
```

### Step 2: Run Migration

```bash
psql -U postgres -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql
```

### Step 3: Verify Schema

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check triggers created
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;
```

### Step 4: Create Test User (Optional)

```sql
-- Create admin user
INSERT INTO public.users (email, password_hash, email_confirmed, email_confirmed_at, is_active)
VALUES (
  'admin@buildflow.local',
  crypt('admin123', gen_salt('bf')),
  true,
  now(),
  true
);

-- Get admin user ID
SELECT id FROM public.users WHERE email = 'admin@buildflow.local';

-- Assign super_admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('admin-user-id-here', 'super_admin'::app_role);
```

### Step 5: Verify Installation

```sql
-- Test has_role function
SELECT public.has_role('admin-user-id-here', 'super_admin'::app_role);
-- Should return: true

-- Test get_user_role function
SELECT public.get_user_role('admin-user-id-here');
-- Should return: super_admin

-- Check RLS is enabled
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'profiles', 'user_roles', 'employee_details', 'employee_salary_details', 'employee_files');
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
-- Check if function exists
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

1. **Create remaining tables** - Proceed with other schema migrations
2. **Set up application** - Configure application to use new database
3. **Migrate data** - Import data from Supabase
4. **Test thoroughly** - Verify all functionality works
5. **Deploy to production** - Follow deployment procedures

---

## Support & Questions

For questions or issues with this schema:

1. Review the [SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md](./SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md)
2. Check PostgreSQL documentation: https://www.postgresql.org/docs/
3. Review RLS documentation: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** Ready for Implementation
