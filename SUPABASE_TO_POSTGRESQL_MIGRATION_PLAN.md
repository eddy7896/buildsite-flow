# Supabase to PostgreSQL Migration Plan
## Complete Database Audit & Migration Strategy

**Document Date:** 2025-01-15  
**Project:** BuildFlow Agency Management System  
**Current Database:** Supabase (PostgreSQL-based)  
**Target Database:** Self-hosted PostgreSQL  

---

## EXECUTIVE SUMMARY

This document provides a comprehensive audit of your Supabase database structure and a detailed step-by-step migration plan to move to a self-hosted PostgreSQL database. Your application is a multi-tenant agency management system with extensive HR, financial, CRM, and project management capabilities.

**Key Findings:**
- **Total Tables:** 45+ tables
- **Custom Functions:** 15+ database functions
- **Triggers:** 30+ triggers for automation
- **Row-Level Security (RLS) Policies:** 100+ policies
- **Enums:** 1 custom enum type (app_role)
- **Extensions:** pgcrypto for encryption
- **Storage:** Supabase Storage bucket for receipts
- **Authentication:** Supabase Auth (requires replacement)

---

## PART 1: COMPLETE DATABASE AUDIT

### 1.1 Database Schema Overview

#### Core Authentication & User Management Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `profiles` | User profile information | id, user_id, full_name, phone, department, position, hire_date, avatar_url, is_active, agency_id | auth.users (external) |
| `user_roles` | Role assignments | id, user_id, role, assigned_at, assigned_by, agency_id | auth.users, app_role enum |
| `employee_details` | Extended employee information | id, user_id, employee_id, first_name, last_name, date_of_birth, social_security_number (encrypted), nationality, marital_status, address, employment_type, work_location, supervisor_id, emergency_contact_*, skills (JSONB), is_active, agency_id | auth.users, profiles |
| `employee_salary_details` | Sensitive salary information | id, employee_id, salary, created_at, updated_at, created_by | employee_details |
| `employee_files` | Employee document storage references | id, employee_id, file_name, file_path, file_type, file_size, category, uploaded_by | employee_details |

#### Agency & Multi-Tenancy Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `agencies` | Multi-tenant agency records | id, name, domain (unique), is_active, subscription_plan, max_users, created_at, updated_at | None |
| `agency_settings` | Agency-specific configuration | id, agency_name, logo_url, agency_id, created_at, updated_at | agencies |

#### HR & Attendance Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `departments` | Organizational departments | id, name (unique), description, manager_id, parent_department_id, budget, is_active, agency_id | auth.users, self-referential |
| `team_assignments` | User-department relationships | id, user_id, department_id, position_title, role_in_department, reporting_to, start_date, end_date, is_active, agency_id | auth.users, departments |
| `department_hierarchy` | Organizational structure | id, department_id, parent_department_id, hierarchy_level, agency_id | departments (self-referential) |
| `team_members` | Team composition tracking | id, team_assignment_id, user_id, team_role, assigned_by, assigned_at, agency_id | team_assignments, auth.users |
| `leave_types` | Leave categories | id, name, description, max_days_per_year, is_paid, requires_approval, is_active | None |
| `leave_requests` | Leave request records | id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, rejection_reason, agency_id | auth.users, leave_types |
| `attendance` | Daily attendance tracking | id, employee_id, date, check_in_time, check_out_time, break_start_time, break_end_time, total_hours, overtime_hours, status, notes, location, ip_address, agency_id | auth.users |
| `payroll_periods` | Pay period management | id, name, start_date, end_date, pay_date, status, created_by | auth.users |
| `payroll` | Employee payroll records | id, employee_id, payroll_period_id, base_salary, overtime_pay, bonuses, deductions, gross_pay, tax_deductions, net_pay, hours_worked, overtime_hours, status, notes, created_by, agency_id | auth.users, payroll_periods |

#### Project Management Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `projects` | Project records | id, name, description, status, start_date, end_date, budget, client_id, assigned_team, progress (0-100), created_by, agency_id | clients, auth.users |
| `tasks` | Task records | id, project_id, title, description, assignee_id, created_by, status, priority, due_date, estimated_hours, actual_hours, completed_at, agency_id | projects, auth.users |
| `task_assignments` | Multiple assignees per task | id, task_id, user_id, role, assigned_by, assigned_at, agency_id | tasks, auth.users |
| `task_comments` | Task discussion | id, task_id, user_id, comment, created_at, agency_id | tasks, auth.users |
| `task_time_tracking` | Time tracking on tasks | id, task_id, user_id, start_time, end_time, hours_logged, description, created_at, agency_id | tasks, auth.users |

#### Financial & Accounting Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `clients` | Client records | id, client_number (unique), name, company_name, industry, email, phone, address, city, state, postal_code, country, website, contact_person, contact_position, contact_email, contact_phone, status, billing_address, tax_id, payment_terms, notes, created_by, agency_id | auth.users |
| `invoices` | Invoice records | id, invoice_number (unique), client_id, title, description, status, issue_date, due_date, subtotal, tax_rate, discount, total_amount (generated), notes, created_by, agency_id | clients, auth.users |
| `quotations` | Quotation records | id, quote_number (unique), client_id, template_id, title, description, status, valid_until, subtotal, tax_rate, tax_amount (generated), total_amount (generated), terms_conditions, notes, created_by, agency_id | clients, quotation_templates, auth.users |
| `quotation_templates` | Quotation templates | id, name, description, template_content (JSONB), is_active, created_by | auth.users |
| `quotation_line_items` | Quotation line items | id, quotation_id, item_name, description, quantity, unit_price, discount_percentage, line_total (generated), sort_order | quotations |
| `chart_of_accounts` | Chart of accounts | id, account_code (unique), account_name, account_type, parent_account_id, is_active, description | self-referential |
| `journal_entries` | Journal entries | id, entry_number (unique), entry_date, description, reference, total_debit, total_credit, status, created_by, agency_id | auth.users |
| `journal_entry_lines` | Journal entry line items | id, journal_entry_id, account_id, description, debit_amount, credit_amount, line_number | journal_entries, chart_of_accounts |

#### Job Costing Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `job_categories` | Job categories | id, name, description, created_at, updated_at | None |
| `jobs` | Job records | id, job_number (unique), client_id, category_id, title, description, status, start_date, end_date, estimated_hours, actual_hours, estimated_cost, actual_cost, budget, profit_margin, assigned_to, created_by, agency_id | clients, job_categories, auth.users |
| `job_cost_items` | Job cost tracking | id, job_id, category, description, quantity, unit_cost, total_cost (generated), vendor, date_incurred, created_by | jobs, auth.users |

#### CRM Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `lead_sources` | Lead source categories | id, name, description, is_active | None |
| `leads` | Lead records | id, lead_number (unique), company_name, contact_name, email, phone, address, lead_source_id, status, priority, estimated_value, probability (0-100), expected_close_date, assigned_to, notes, created_by, agency_id | lead_sources, auth.users |
| `crm_activities` | CRM activity tracking | id, lead_id, client_id, activity_type, subject, description, status, due_date, completed_date, assigned_to, created_by, agency_id | leads, clients, auth.users |
| `sales_pipeline` | Sales pipeline stages | id, name, stage_order, probability_percentage, is_active | None |

#### GST Compliance Tables (India-specific)

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `gst_settings` | GST configuration | id, agency_id, gstin, legal_name, trade_name, business_type, filing_frequency, composition_scheme, is_active | agencies |
| `gst_returns` | GST return filings | id, agency_id, return_type (GSTR1/3B/9/4), filing_period, due_date, status, total_taxable_value, total_tax_amount, cgst_amount, sgst_amount, igst_amount, cess_amount, filed_date, acknowledgment_number | agencies |
| `gst_transactions` | GST transaction records | id, agency_id, transaction_type, invoice_number, invoice_date, customer_gstin, customer_name, place_of_supply, hsn_sac_code, description, quantity, unit_price, taxable_value, cgst_rate, sgst_rate, igst_rate, cess_rate, cgst_amount, sgst_amount, igst_amount, cess_amount, total_amount | agencies |

#### Expense & Reimbursement Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `expense_categories` | Expense categories | id, name, description, is_active | None |
| `reimbursement_requests` | Reimbursement requests | id, employee_id, category_id, amount, currency, expense_date, description, business_purpose, status, submitted_at, reviewed_by, reviewed_at, rejection_reason, payment_date, agency_id | auth.users, expense_categories |
| `reimbursement_attachments` | Reimbursement receipts | id, reimbursement_id, file_name, file_path, file_type, file_size, uploaded_at | reimbursement_requests |

#### Calendar & Events Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `company_events` | Company events | id, agency_id, title, description, event_type, start_date, end_date, all_day, location, created_by, color, is_recurring, recurrence_pattern (JSONB), attendees (JSONB) | agencies, auth.users |
| `holidays` | Holiday records | id, agency_id, name, date, is_company_holiday, is_national_holiday, description | agencies |
| `calendar_settings` | Calendar configuration | id, agency_id, show_birthdays, show_leave_requests, show_company_events, show_holidays, default_view, working_days (JSONB), working_hours (JSONB) | agencies |

#### Reporting Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `reports` | Generated reports | id, name, description, report_type, parameters (JSONB), file_path, file_name, file_size, generated_by, generated_at, expires_at, is_public | auth.users |

#### Subscription & Billing Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `subscription_plans` | Subscription plans | id, name, description, price, currency, interval, is_active, stripe_product_id, stripe_price_id, max_users, max_agencies, max_storage_gb | None |
| `plan_features` | Feature definitions | id, name, description, feature_key (unique), is_active | None |
| `plan_feature_mappings` | Plan-feature relationships | id, plan_id, feature_id, enabled | subscription_plans, plan_features |

#### Audit & Security Tables

| Table | Purpose | Key Fields | Dependencies |
|-------|---------|-----------|--------------|
| `audit_logs` | Audit trail | id, table_name, action, user_id, record_id, old_values (JSONB), new_values (JSONB), ip_address, user_agent, created_at | auth.users |

---

### 1.2 Custom Data Types

#### Enums

```sql
-- app_role enum
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'hr',
  'finance_manager',
  'employee',
  'super_admin'
);
```

#### JSONB Fields

- `quotation_templates.template_content` - Template structure
- `employee_details.skills` - Employee skills array
- `company_events.recurrence_pattern` - Event recurrence rules
- `company_events.attendees` - Event attendees list
- `calendar_settings.working_days` - Working days configuration
- `calendar_settings.working_hours` - Working hours configuration
- `reports.parameters` - Report generation parameters
- `audit_logs.old_values` - Previous record values
- `audit_logs.new_values` - New record values

#### Special Data Types

- `INET` - IP addresses (attendance.ip_address)
- `NUMERIC(precision, scale)` - Financial amounts
- `TIMESTAMP WITH TIME ZONE` - Timezone-aware timestamps
- `DATE` - Date-only fields
- `BYTEA` - Encrypted SSN data

---

### 1.3 Database Functions

#### Authentication & Authorization Functions

1. **`has_role(_user_id UUID, _role app_role) → BOOLEAN`**
   - Purpose: Check if user has specific role
   - Security: SECURITY DEFINER
   - Used in: RLS policies

2. **`get_user_role(_user_id UUID) → app_role`**
   - Purpose: Get user's primary role
   - Security: SECURITY DEFINER
   - Used in: Application logic

3. **`get_user_agency_id() → UUID`**
   - Purpose: Get current user's agency ID
   - Security: SECURITY DEFINER
   - Used in: Multi-tenancy filtering

#### Trigger Functions

4. **`handle_new_user() → TRIGGER`**
   - Purpose: Auto-create profile and assign default role on user signup
   - Trigger: `on_auth_user_created` (AFTER INSERT on auth.users)

5. **`update_updated_at_column() → TRIGGER`**
   - Purpose: Auto-update `updated_at` timestamp
   - Trigger: Applied to 20+ tables

6. **`set_agency_id_from_user() → TRIGGER`**
   - Purpose: Auto-populate agency_id from user's profile
   - Trigger: Applied to clients, projects, jobs, leads, etc.

7. **`set_agency_id() → TRIGGER`**
   - Purpose: Generic agency_id auto-population
   - Trigger: Applied to GST, calendar, and other tables

8. **`audit_trigger_function() → TRIGGER`**
   - Purpose: Log changes to sensitive tables
   - Trigger: Applied to employee_details, employee_salary_details, user_roles

#### Utility Functions

9. **`generate_client_number() → TEXT`**
   - Purpose: Generate unique client numbers (CLT-XXX format)
   - Security: SECURITY DEFINER

10. **`encrypt_ssn(ssn_text TEXT, encryption_key TEXT) → TEXT`**
    - Purpose: Encrypt social security numbers
    - Uses: pgcrypto extension

11. **`decrypt_ssn(encrypted_ssn TEXT, encryption_key TEXT) → TEXT`**
    - Purpose: Decrypt SSN (with role-based access control)
    - Security: SECURITY DEFINER

12. **`calculate_gst_liability(p_agency_id UUID, p_start_date DATE, p_end_date DATE) → TABLE`**
    - Purpose: Calculate GST liability for period
    - Returns: Taxable value, CGST, SGST, IGST, CESS, total tax

#### View Functions

13. **`employee_basic_info` (VIEW)**
    - Purpose: Filtered employee data with role-based SSN masking
    - Security: RLS-protected

14. **`employee_details_with_salary` (VIEW)**
    - Purpose: Employee details with salary and decrypted SSN
    - Security: Role-based access control

---

### 1.4 Triggers Summary

**Total Triggers: 30+**

| Category | Count | Examples |
|----------|-------|----------|
| Timestamp Updates | 20+ | `update_*_updated_at` on all tables with updated_at |
| Agency ID Auto-population | 8 | `set_agency_id_*` on GST, calendar, tasks tables |
| Audit Logging | 3 | `audit_*` on sensitive tables |
| User Profile Creation | 1 | `on_auth_user_created` |

---

### 1.5 Row-Level Security (RLS) Policies

**Total RLS Policies: 100+**

#### Policy Categories

1. **Public Access Policies** (20+)
   - Allow authenticated users to view non-sensitive data
   - Applied to: job_categories, lead_sources, leave_types, etc.

2. **Role-Based Access Policies** (40+)
   - Admin/HR/Finance can manage specific resources
   - Applied to: employees, payroll, financial records, etc.

3. **User-Specific Policies** (20+)
   - Users can only access their own data
   - Applied to: profiles, leave_requests, attendance, payroll, etc.

4. **Agency Isolation Policies** (20+)
   - Multi-tenant isolation using agency_id
   - Applied to: all agency-scoped tables

5. **Department Manager Policies** (5+)
   - Department managers can manage their departments
   - Applied to: departments, team_assignments

#### Example RLS Policy Structure

```sql
-- Users can view their own data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can manage all data
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Multi-tenant isolation
CREATE POLICY "Users can view profiles in their agency"
ON public.profiles 
FOR SELECT 
USING (agency_id = get_user_agency_id());
```

---

### 1.6 Indexes

**Total Indexes: 40+**

#### Performance Indexes

```sql
-- Employee & HR
CREATE INDEX idx_employee_details_user_id ON public.employee_details(user_id);
CREATE INDEX idx_employee_details_employee_id ON public.employee_details(employee_id);
CREATE INDEX idx_employee_details_supervisor_id ON public.employee_details(supervisor_id);
CREATE INDEX idx_employee_files_employee_id ON public.employee_files(employee_id);

-- Attendance & Leave
CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);

-- Payroll
CREATE INDEX idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX idx_payroll_period_id ON public.payroll(payroll_period_id);

-- Clients & Projects
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_created_at ON public.clients(created_at);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Tasks
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_agency_id ON public.tasks(agency_id);

-- Departments
CREATE INDEX idx_departments_agency_id ON public.departments(agency_id);
CREATE INDEX idx_departments_manager_id ON public.departments(manager_id);
CREATE INDEX idx_departments_parent_id ON public.departments(parent_department_id);

-- Team Assignments
CREATE INDEX idx_team_assignments_user_id ON public.team_assignments(user_id);
CREATE INDEX idx_team_assignments_department_id ON public.team_assignments(department_id);
CREATE INDEX idx_team_assignments_agency_id ON public.team_assignments(agency_id);

-- Calendar
CREATE INDEX idx_company_events_agency_date ON public.company_events(agency_id, start_date);
CREATE INDEX idx_holidays_agency_date ON public.holidays(agency_id, date);
CREATE INDEX idx_calendar_settings_agency ON public.calendar_settings(agency_id);

-- Reports
CREATE INDEX idx_reports_type ON public.reports(report_type);
CREATE INDEX idx_reports_generated_by ON public.reports(generated_by);
```

---

### 1.7 Extensions

```sql
-- pgcrypto - For encryption/decryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

### 1.8 Storage

**Supabase Storage Bucket:**
- **Bucket Name:** `receipts`
- **Purpose:** Store reimbursement receipt files
- **Access:** Private (authenticated users only)
- **Policies:** User-specific and admin access

---

### 1.9 Authentication System

**Current:** Supabase Auth (managed service)
- Uses `auth.users` table (external to public schema)
- Handles user signup, login, password reset
- Provides JWT tokens for API authentication
- Manages session persistence

**Key Integration Points:**
- Foreign keys to `auth.users(id)` in profiles, user_roles, employee_details, etc.
- Triggers on `auth.users` for profile creation
- RLS policies use `auth.uid()` for user identification

---

### 1.10 Application Integration Points

#### Frontend Dependencies on Supabase

1. **Authentication**
   - `src/hooks/useAuth.tsx` - Auth state management
   - `src/pages/Auth.tsx` - Login/signup pages
   - `src/components/ProtectedRoute.tsx` - Route protection

2. **Data Access**
   - `src/integrations/supabase/client.ts` - Supabase client
   - `src/integrations/supabase/types.ts` - Generated types
   - Multiple service files for data operations

3. **Real-time Features**
   - Supabase real-time subscriptions (if used)
   - RLS policies enforce security

4. **File Storage**
   - Receipt uploads to `receipts` bucket
   - Employee file storage

#### Environment Variables Required

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

---

## PART 2: MIGRATION DEPENDENCIES & CHALLENGES

### 2.1 Critical Dependencies

#### 1. Authentication System
- **Current:** Supabase Auth (managed)
- **Challenge:** Supabase Auth is tightly integrated; requires replacement
- **Options:**
  - Option A: Keep Supabase Auth, only migrate data
  - Option B: Migrate to self-hosted auth (Keycloak, Auth0, etc.)
  - Option C: Implement custom JWT-based auth

#### 2. Foreign Key to auth.users
- **Issue:** All user-related tables reference `auth.users(id)`
- **Solution:** Create users table in PostgreSQL to replace auth.users
- **Impact:** Requires application code changes

#### 3. RLS Policies
- **Issue:** 100+ RLS policies depend on Supabase Auth context
- **Solution:** Implement application-level authorization
- **Impact:** Requires middleware/service layer changes

#### 4. Triggers on auth.users
- **Issue:** `handle_new_user()` trigger fires on auth.users INSERT
- **Solution:** Move logic to application layer or custom auth system
- **Impact:** Requires application code changes

#### 5. Storage Bucket
- **Issue:** Supabase Storage for receipts
- **Solution:** Migrate to file system or S3-compatible storage
- **Impact:** Requires storage infrastructure setup

#### 6. Real-time Subscriptions
- **Issue:** If using Supabase real-time features
- **Solution:** Implement WebSocket layer or polling
- **Impact:** Requires infrastructure changes

---

### 2.2 Data Migration Challenges

#### 1. UUID Generation
- **Current:** `gen_random_uuid()` in Supabase
- **Solution:** PostgreSQL has same function
- **Impact:** None - fully compatible

#### 2. Encryption
- **Current:** pgcrypto extension
- **Solution:** PostgreSQL has pgcrypto
- **Impact:** None - fully compatible

#### 3. JSONB Fields
- **Current:** JSONB data type
- **Solution:** PostgreSQL has JSONB
- **Impact:** None - fully compatible

#### 4. Timestamps
- **Current:** `TIMESTAMP WITH TIME ZONE`
- **Solution:** PostgreSQL has same type
- **Impact:** None - fully compatible

#### 5. Generated Columns
- **Current:** `GENERATED ALWAYS AS ... STORED`
- **Solution:** PostgreSQL supports generated columns
- **Impact:** None - fully compatible

---

### 2.3 Data Volume Considerations

**Estimated Data Volumes (based on typical usage):**
- Users: 100-1000
- Employees: 50-500
- Clients: 50-500
- Projects: 20-200
- Tasks: 100-1000
- Transactions: 1000-10000
- Audit logs: 10000-100000

**Total Database Size:** Likely < 1GB for typical usage

---

## PART 3: STEP-BY-STEP MIGRATION PLAN

### Phase 1: Planning & Preparation (Days 1-2)

#### Step 1.1: Assess Current State
- [ ] Document all Supabase project settings
- [ ] Export database schema
- [ ] Identify all custom functions and triggers
- [ ] List all RLS policies
- [ ] Document all storage buckets and files
- [ ] Identify all Supabase-specific features in use

**Deliverables:**
- Database schema documentation
- Feature inventory
- Risk assessment

#### Step 1.2: Plan Infrastructure
- [ ] Choose PostgreSQL hosting (self-hosted, AWS RDS, DigitalOcean, etc.)
- [ ] Plan server specifications (CPU, RAM, storage)
- [ ] Plan backup strategy
- [ ] Plan disaster recovery
- [ ] Plan monitoring and alerting

**Deliverables:**
- Infrastructure design document
- Server specifications
- Backup/recovery plan

#### Step 1.3: Plan Authentication Strategy
- [ ] Decide on auth replacement (keep Supabase Auth vs. migrate)
- [ ] If migrating, choose auth system
- [ ] Plan user migration strategy
- [ ] Plan session management

**Deliverables:**
- Authentication architecture document
- User migration plan

#### Step 1.4: Plan Application Changes
- [ ] Identify all Supabase SDK usage
- [ ] Plan database connection changes
- [ ] Plan RLS replacement strategy
- [ ] Plan storage migration

**Deliverables:**
- Application change list
- Code refactoring plan

---

### Phase 2: Infrastructure Setup (Days 3-5)

#### Step 2.1: Set Up PostgreSQL Server
- [ ] Provision PostgreSQL server (version 14+)
- [ ] Configure PostgreSQL settings
- [ ] Enable required extensions (pgcrypto)
- [ ] Configure authentication (pg_hba.conf)
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules

**Commands:**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Enable pgcrypto extension
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Configure PostgreSQL for remote connections
# Edit /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = '*'

# Edit /etc/postgresql/14/main/pg_hba.conf
# Add: host    all             all             0.0.0.0/0               md5
```

#### Step 2.2: Set Up Database User & Permissions
- [ ] Create application database user
- [ ] Create read-only user (for backups)
- [ ] Set up role-based access control
- [ ] Configure password policies

**Commands:**
```sql
-- Create application user
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Create database
CREATE DATABASE buildflow_db OWNER app_user;

-- Grant permissions
GRANT CONNECT ON DATABASE buildflow_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;

-- Create read-only user
CREATE USER readonly_user WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE buildflow_db TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

#### Step 2.3: Set Up Backup Infrastructure
- [ ] Configure automated backups
- [ ] Set up backup storage (S3, NAS, etc.)
- [ ] Test backup/restore process
- [ ] Document recovery procedures

**Commands:**
```bash
# Create backup script
cat > /usr/local/bin/backup_postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DB_NAME="buildflow_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U app_user $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup_postgres.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup_postgres.sh
```

#### Step 2.4: Set Up Monitoring & Logging
- [ ] Configure PostgreSQL logging
- [ ] Set up monitoring tools (Prometheus, Grafana, etc.)
- [ ] Configure alerting
- [ ] Set up log aggregation

---

### Phase 3: Database Schema Migration (Days 6-8)

#### Step 3.1: Create Base Schema
- [ ] Create custom enum type (app_role)
- [ ] Create all tables (in dependency order)
- [ ] Create all indexes
- [ ] Create all functions
- [ ] Create all triggers
- [ ] Create all views

**Process:**
```bash
# Export Supabase schema
pg_dump -U postgres --schema-only -d buildflow_db > schema.sql

# Review and adapt schema.sql for PostgreSQL
# Key changes:
# 1. Remove Supabase-specific functions
# 2. Update auth.users references
# 3. Update RLS policies (will be replaced)
# 4. Update trigger functions

# Apply schema to new PostgreSQL
psql -U app_user -d buildflow_db < schema.sql
```

**Schema Creation Order:**
1. Extensions (pgcrypto)
2. Enums (app_role)
3. Base tables (no foreign keys)
4. Reference tables (with foreign keys)
5. Dependent tables
6. Indexes
7. Functions
8. Triggers
9. Views
10. RLS policies (if keeping)

#### Step 3.2: Create Users Table
- [ ] Create users table to replace auth.users
- [ ] Add necessary columns (id, email, password_hash, etc.)
- [ ] Create indexes on email
- [ ] Add constraints

**SQL:**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_confirmed BOOLEAN DEFAULT false,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON public.users(email);
```

#### Step 3.3: Update Foreign Keys
- [ ] Update all foreign keys from auth.users to public.users
- [ ] Update all triggers referencing auth.users
- [ ] Update all functions referencing auth.users

**SQL:**
```sql
-- Example: Update profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
```

#### Step 3.4: Adapt RLS Policies
- [ ] Review all RLS policies
- [ ] Decide: keep RLS or implement application-level auth
- [ ] If keeping RLS, update policies to work with new users table
- [ ] If removing RLS, disable RLS on all tables

**Option A: Keep RLS (requires auth context)**
```sql
-- Update auth context function
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
  -- This will be set by application via SET LOCAL
  RETURN current_setting('app.current_user_id')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to use current_user_id()
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = current_user_id());
```

**Option B: Remove RLS (simpler, requires app-level auth)**
```sql
-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

#### Step 3.5: Create Storage Tables
- [ ] Create file storage metadata table
- [ ] Create indexes
- [ ] Set up file storage directory

**SQL:**
```sql
CREATE TABLE public.file_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bucket_name, file_path)
);

CREATE INDEX idx_file_storage_bucket ON public.file_storage(bucket_name);
CREATE INDEX idx_file_storage_uploaded_by ON public.file_storage(uploaded_by);
```

---

### Phase 4: Data Migration (Days 9-12)

#### Step 4.1: Export Data from Supabase
- [ ] Export all table data as CSV/JSON
- [ ] Verify data integrity
- [ ] Check for data quality issues

**Commands:**
```bash
# Export all tables
for table in profiles user_roles employee_details clients projects tasks \
             invoices quotations leave_requests attendance payroll \
             departments team_assignments jobs leads crm_activities \
             journal_entries gst_settings gst_returns gst_transactions \
             company_events holidays reimbursement_requests audit_logs; do
  psql -U postgres -d buildflow_db -c "COPY $table TO STDOUT WITH CSV HEADER" > $table.csv
done
```

#### Step 4.2: Prepare Data for Import
- [ ] Transform data format if needed
- [ ] Handle UUID conversions
- [ ] Handle timestamp conversions
- [ ] Handle encrypted fields
- [ ] Validate data

**Considerations:**
- UUID format compatibility
- Timezone handling
- Encrypted SSN data (already encrypted, just copy)
- JSONB field formatting
- NULL value handling

#### Step 4.3: Migrate User Data
- [ ] Export users from Supabase Auth
- [ ] Create users in new PostgreSQL users table
- [ ] Set temporary passwords or password reset tokens
- [ ] Verify user count matches

**Process:**
```bash
# Export Supabase Auth users (requires Supabase CLI)
supabase db pull

# Transform to CSV format
# Then import to PostgreSQL
psql -U app_user -d buildflow_db -c "COPY public.users FROM STDIN WITH CSV HEADER" < users.csv
```

#### Step 4.4: Migrate Related Data
- [ ] Migrate profiles
- [ ] Migrate user_roles
- [ ] Migrate employee_details
- [ ] Migrate all other tables in dependency order

**Process:**
```bash
# Disable foreign key constraints temporarily
psql -U app_user -d buildflow_db << 'EOF'
ALTER TABLE public.profiles DISABLE TRIGGER ALL;
ALTER TABLE public.user_roles DISABLE TRIGGER ALL;
-- ... disable for all tables

-- Import data
COPY public.profiles FROM STDIN WITH CSV HEADER;
COPY public.user_roles FROM STDIN WITH CSV HEADER;
-- ... import all tables

-- Re-enable triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;
ALTER TABLE public.user_roles ENABLE TRIGGER ALL;
-- ... enable for all tables
EOF
```

#### Step 4.5: Verify Data Integrity
- [ ] Count records in each table
- [ ] Verify foreign key relationships
- [ ] Check for orphaned records
- [ ] Validate data types
- [ ] Verify indexes are working

**Validation Queries:**
```sql
-- Check record counts
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'employee_details', COUNT(*) FROM public.employee_details
-- ... repeat for all tables

-- Check for orphaned records
SELECT * FROM public.profiles WHERE user_id NOT IN (SELECT id FROM public.users);
SELECT * FROM public.employee_details WHERE user_id NOT IN (SELECT id FROM public.users);
-- ... repeat for all foreign keys

-- Verify indexes
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

#### Step 4.6: Migrate File Storage
- [ ] Download all files from Supabase Storage
- [ ] Set up file storage directory on new server
- [ ] Upload files to new storage
- [ ] Update file_storage metadata table
- [ ] Verify file integrity (checksums)

**Commands:**
```bash
# Create storage directory
mkdir -p /var/lib/buildflow/storage/receipts

# Download files from Supabase (requires Supabase CLI)
supabase storage download receipts --recursive

# Upload to new storage
cp -r receipts/* /var/lib/buildflow/storage/receipts/

# Set permissions
chown -R app_user:app_user /var/lib/buildflow/storage
chmod -R 750 /var/lib/buildflow/storage
```

---

### Phase 5: Authentication System Migration (Days 13-15)

#### Step 5.1: Choose Authentication Approach

**Option A: Keep Supabase Auth (Simplest)**
- Keep using Supabase Auth for authentication
- Only migrate data to PostgreSQL
- Maintain Supabase Auth integration in application
- Pros: Minimal application changes
- Cons: Still dependent on Supabase for auth

**Option B: Implement Custom JWT Auth (Recommended)**
- Implement custom authentication in application
- Use PostgreSQL users table
- Generate JWT tokens in application
- Pros: Full independence from Supabase
- Cons: More application code changes

**Option C: Use Third-Party Auth Service**
- Migrate to Auth0, Keycloak, or similar
- Pros: Professional auth service
- Cons: Additional cost, external dependency

**Recommendation:** Option B (Custom JWT Auth)

#### Step 5.2: Implement Custom Authentication (if Option B)

**Backend Changes Required:**

1. **Create Authentication Service**
```typescript
// src/services/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '@/db/connection';

export async function registerUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, hashedPassword]
  );
  return result.rows[0];
}

export async function loginUser(email: string, password: string) {
  const result = await pool.query(
    'SELECT id, email, password_hash FROM public.users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    throw new Error('Invalid password');
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return { token, user: { id: user.id, email: user.email } };
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
```

2. **Create Middleware for Auth Context**
```typescript
// src/middleware/auth.ts
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    
    // Set auth context for RLS (if using RLS)
    await pool.query(
      'SET LOCAL app.current_user_id = $1',
      [decoded.userId]
    );
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

3. **Update Frontend Auth Hook**
```typescript
// src/hooks/useAuth.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token with backend
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('auth_token');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/login');
  };

  return { user, loading, login, logout };
}
```

#### Step 5.3: Migrate User Passwords
- [ ] Export password hashes from Supabase (if available)
- [ ] Or require password reset for all users
- [ ] Send password reset emails to all users
- [ ] Track password reset completion

**Option A: If password hashes available**
```sql
-- Import password hashes directly
UPDATE public.users u
SET password_hash = temp.password_hash
FROM temp_users temp
WHERE u.id = temp.id;
```

**Option B: Require password reset**
```sql
-- Create password reset tokens
CREATE TABLE public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generate tokens for all users
INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
SELECT id, encode(gen_random_bytes(32), 'hex'), now() + interval '7 days'
FROM public.users;
```

#### Step 5.4: Test Authentication
- [ ] Test user registration
- [ ] Test user login
- [ ] Test token generation
- [ ] Test token verification
- [ ] Test token expiration
- [ ] Test password reset

---

### Phase 6: Application Code Updates (Days 16-20)

#### Step 6.1: Update Database Connection
- [ ] Update connection string in environment variables
- [ ] Update database client initialization
- [ ] Test database connectivity

**Changes:**
```typescript
// Before (Supabase)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// After (PostgreSQL)
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

#### Step 6.2: Update Data Access Layer
- [ ] Replace Supabase queries with PostgreSQL queries
- [ ] Update all service files
- [ ] Update all API endpoints
- [ ] Test all data operations

**Example Changes:**
```typescript
// Before (Supabase)
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId);

// After (PostgreSQL)
const result = await pool.query(
  'SELECT * FROM public.profiles WHERE user_id = $1',
  [userId]
);
const data = result.rows;
```

#### Step 6.3: Update Real-time Features
- [ ] If using Supabase real-time, implement alternative
- [ ] Options: WebSocket, polling, Server-Sent Events
- [ ] Update frontend subscriptions

#### Step 6.4: Update File Upload/Download
- [ ] Replace Supabase Storage with file system or S3
- [ ] Update upload endpoints
- [ ] Update download endpoints
- [ ] Update file metadata tracking

**Example: File System Storage**
```typescript
// src/services/fileStorage.ts
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = '/var/lib/buildflow/storage';

export async function uploadFile(bucket: string, filePath: string, fileContent: Buffer) {
  const fullPath = path.join(STORAGE_DIR, bucket, filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if not exists
  fs.mkdirSync(dir, { recursive: true });
  
  // Write file
  fs.writeFileSync(fullPath, fileContent);
  
  // Record in database
  await pool.query(
    'INSERT INTO public.file_storage (bucket_name, file_path, file_name, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
    [bucket, filePath, path.basename(filePath), fileContent.length, userId]
  );
}

export async function downloadFile(bucket: string, filePath: string) {
  const fullPath = path.join(STORAGE_DIR, bucket, filePath);
  return fs.readFileSync(fullPath);
}
```

#### Step 6.5: Update Authorization Logic
- [ ] Replace RLS with application-level authorization
- [ ] Implement permission checks in API endpoints
- [ ] Update frontend permission checks
- [ ] Test authorization on all endpoints

**Example: Authorization Middleware**
```typescript
// src/middleware/authorize.ts
export function authorize(...allowedRoles: string[]) {
  return async (req, res, next) => {
    const userId = req.userId;
    
    // Get user roles from database
    const result = await pool.query(
      'SELECT role FROM public.user_roles WHERE user_id = $1',
      [userId]
    );
    
    const userRoles = result.rows.map(r => r.role);
    
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
app.get('/api/payroll', authorize('admin', 'finance_manager'), getPayroll);
```

#### Step 6.6: Update Environment Variables
- [ ] Update .env files
- [ ] Update deployment configurations
- [ ] Update CI/CD pipelines
- [ ] Document new environment variables

**New Environment Variables:**
```
DATABASE_URL=postgresql://app_user:password@localhost:5432/buildflow_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
FILE_STORAGE_PATH=/var/lib/buildflow/storage
```

---

### Phase 7: Testing & Validation (Days 21-25)

#### Step 7.1: Unit Testing
- [ ] Test all database functions
- [ ] Test all API endpoints
- [ ] Test authentication
- [ ] Test authorization
- [ ] Test file operations

#### Step 7.2: Integration Testing
- [ ] Test end-to-end workflows
- [ ] Test multi-user scenarios
- [ ] Test concurrent operations
- [ ] Test data consistency

#### Step 7.3: Performance Testing
- [ ] Load test database
- [ ] Load test API endpoints
- [ ] Monitor query performance
- [ ] Optimize slow queries

**Performance Testing Queries:**
```sql
-- Check slow queries
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM public.profiles WHERE agency_id = $1;
```

#### Step 7.4: Security Testing
- [ ] Test SQL injection prevention
- [ ] Test authentication bypass attempts
- [ ] Test authorization bypass attempts
- [ ] Test data encryption
- [ ] Test audit logging

#### Step 7.5: Data Validation
- [ ] Verify all data migrated correctly
- [ ] Check data integrity
- [ ] Verify calculations (totals, sums, etc.)
- [ ] Check for data loss

**Validation Queries:**
```sql
-- Compare record counts
SELECT 'profiles' as table_name, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'employees', COUNT(*) FROM public.employee_details
-- ... etc

-- Verify financial totals
SELECT SUM(total_amount) FROM public.invoices;
SELECT SUM(gross_pay) FROM public.payroll;

-- Check for NULL values in required fields
SELECT * FROM public.profiles WHERE full_name IS NULL;
SELECT * FROM public.clients WHERE name IS NULL;
```

#### Step 7.6: User Acceptance Testing
- [ ] Have users test all features
- [ ] Verify all workflows work
- [ ] Collect feedback
- [ ] Fix any issues

---

### Phase 8: Cutover & Go-Live (Days 26-27)

#### Step 8.1: Final Data Sync
- [ ] Perform final data export from Supabase
- [ ] Identify any new data since last migration
- [ ] Migrate new data to PostgreSQL
- [ ] Verify data consistency

#### Step 8.2: Pre-Cutover Checklist
- [ ] All tests passing
- [ ] All code deployed to staging
- [ ] Backups configured and tested
- [ ] Monitoring configured
- [ ] Support team trained
- [ ] Rollback plan documented
- [ ] Communication plan ready

#### Step 8.3: Cutover Process
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Stop application
- [ ] Perform final data sync
- [ ] Update DNS/connection strings
- [ ] Start application with new database
- [ ] Verify application is working
- [ ] Monitor for errors

**Cutover Checklist:**
```
[ ] Backup Supabase database
[ ] Backup PostgreSQL database
[ ] Stop application servers
[ ] Perform final data sync
[ ] Update application configuration
[ ] Update DNS records (if applicable)
[ ] Start application servers
[ ] Verify application health
[ ] Monitor error logs
[ ] Verify user access
[ ] Notify users of successful migration
```

#### Step 8.4: Post-Cutover Monitoring
- [ ] Monitor application performance
- [ ] Monitor database performance
- [ ] Monitor error rates
- [ ] Monitor user activity
- [ ] Be ready to rollback if needed

**Monitoring Queries:**
```sql
-- Monitor active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Monitor slow queries
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### Phase 9: Post-Migration (Days 28+)

#### Step 9.1: Decommission Supabase
- [ ] Verify all data migrated
- [ ] Verify no dependencies on Supabase
- [ ] Export final backup from Supabase
- [ ] Cancel Supabase subscription
- [ ] Document decommissioning

#### Step 9.2: Optimize PostgreSQL
- [ ] Analyze query performance
- [ ] Add missing indexes
- [ ] Optimize slow queries
- [ ] Tune PostgreSQL settings
- [ ] Vacuum and analyze tables

**Optimization Commands:**
```sql
-- Analyze all tables
ANALYZE;

-- Vacuum all tables
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Reindex if needed
REINDEX DATABASE buildflow_db;
```

#### Step 9.3: Document New System
- [ ] Document PostgreSQL setup
- [ ] Document backup procedures
- [ ] Document recovery procedures
- [ ] Document monitoring setup
- [ ] Document troubleshooting guide
- [ ] Update runbooks

#### Step 9.4: Train Operations Team
- [ ] Train on PostgreSQL administration
- [ ] Train on backup/recovery procedures
- [ ] Train on monitoring and alerting
- [ ] Train on troubleshooting
- [ ] Provide documentation

#### Step 9.5: Plan for Future Maintenance
- [ ] Schedule regular backups
- [ ] Schedule maintenance windows
- [ ] Plan for PostgreSQL upgrades
- [ ] Plan for capacity planning
- [ ] Plan for disaster recovery drills

---

## PART 4: DETAILED TECHNICAL SPECIFICATIONS

### 4.1 PostgreSQL Configuration

**Recommended PostgreSQL Settings:**

```ini
# postgresql.conf

# Memory
shared_buffers = 256MB              # 25% of system RAM
effective_cache_size = 1GB          # 50-75% of system RAM
work_mem = 16MB                     # shared_buffers / max_connections
maintenance_work_mem = 64MB

# Connections
max_connections = 200
superuser_reserved_connections = 3

# WAL (Write-Ahead Logging)
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB

# Checkpoints
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Query Planning
random_page_cost = 1.1              # For SSD
effective_io_concurrency = 200      # For SSD

# Logging
log_min_duration_statement = 1000   # Log queries > 1 second
log_connections = on
log_disconnections = on
log_statement = 'all'
log_duration = off

# Performance
enable_partitionwise_join = on
enable_partitionwise_aggregate = on
```

### 4.2 Backup Strategy

**Automated Backup Script:**

```bash
#!/bin/bash
# /usr/local/bin/backup_postgres.sh

BACKUP_DIR="/backups/postgres"
DB_NAME="buildflow_db"
DB_USER="app_user"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Full backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz"
  
  # Upload to S3 (optional)
  aws s3 cp $BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz s3://backups/postgres/
  
  # Clean old backups
  find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
else
  echo "Backup failed!"
  exit 1
fi
```

**Cron Schedule:**
```
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup_postgres.sh

# Weekly full backup at 3 AM on Sunday
0 3 * * 0 /usr/local/bin/backup_postgres.sh
```

### 4.3 Monitoring Setup

**Prometheus Queries:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
```

**Key Metrics to Monitor:**

```
# Connection metrics
pg_stat_activity_count
pg_stat_activity_max_tx_duration

# Query performance
pg_stat_statements_mean_time
pg_stat_statements_calls

# Table metrics
pg_table_size
pg_table_live_tuples
pg_table_dead_tuples

# Index metrics
pg_index_size
pg_index_idx_scan

# Replication metrics
pg_replication_lag
pg_wal_lsn_diff
```

### 4.4 Disaster Recovery Plan

**Recovery Procedures:**

```bash
#!/bin/bash
# /usr/local/bin/restore_postgres.sh

BACKUP_FILE=$1
DB_NAME="buildflow_db"
DB_USER="app_user"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Stop application
systemctl stop buildflow-app

# Drop existing database
dropdb -U postgres $DB_NAME

# Create new database
createdb -U postgres $DB_NAME

# Restore from backup
gunzip -c $BACKUP_FILE | psql -U $DB_USER -d $DB_NAME

# Verify restore
if [ $? -eq 0 ]; then
  echo "Restore successful"
  
  # Start application
  systemctl start buildflow-app
else
  echo "Restore failed!"
  exit 1
fi
```

---

## PART 5: RISK ASSESSMENT & MITIGATION

### 5.1 High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Data loss during migration | Critical | Low | Multiple backups, validation checks |
| Authentication failure | Critical | Medium | Thorough testing, rollback plan |
| Performance degradation | High | Medium | Load testing, query optimization |
| Downtime during cutover | High | Medium | Careful planning, rollback plan |
| Incomplete data migration | High | Low | Validation queries, record counts |
| RLS policy issues | Medium | Medium | Thorough testing, application-level auth |
| File storage issues | Medium | Low | File integrity checks, backup |
| User access issues | Medium | Medium | User testing, support team training |

### 5.2 Rollback Plan

**If migration fails:**

1. **Immediate Actions (0-5 minutes)**
   - Stop application
   - Revert DNS/connection strings to Supabase
   - Start application with Supabase

2. **Investigation (5-30 minutes)**
   - Identify root cause
   - Assess data integrity
   - Determine if rollback is necessary

3. **Rollback Execution (30-60 minutes)**
   - Restore from pre-migration backup
   - Verify data integrity
   - Notify users

4. **Post-Rollback (60+ minutes)**
   - Analyze what went wrong
   - Plan corrective actions
   - Schedule retry

---

## PART 6: COST ANALYSIS

### 6.1 Supabase Costs (Current)
- Estimated: $50-500/month depending on usage

### 6.2 PostgreSQL Costs (New)
- **Self-hosted:**
  - Server: $20-100/month (DigitalOcean, Linode, etc.)
  - Backups: $10-50/month (S3 storage)
  - Monitoring: $0-50/month (Prometheus/Grafana)
  - **Total: $30-200/month**

- **Managed (AWS RDS, DigitalOcean Managed):**
  - Database: $50-300/month
  - Backups: Included
  - Monitoring: Included
  - **Total: $50-300/month**

### 6.3 Migration Costs
- Development time: 80-120 hours
- Testing time: 40-60 hours
- Operations time: 20-40 hours
- **Total: 140-220 hours (~$7,000-$22,000 depending on rates)**

### 6.4 ROI Analysis
- **Payback period:** 1-3 months (if using self-hosted)
- **Annual savings:** $300-5,400 (if using self-hosted)
- **Annual savings:** $0-5,400 (if using managed PostgreSQL)

---

## PART 7: IMPLEMENTATION TIMELINE

### Gantt Chart

```
Week 1: Planning & Preparation
  ├─ Day 1-2: Assess current state
  ├─ Day 2-3: Plan infrastructure
  ├─ Day 3-4: Plan authentication
  └─ Day 4-5: Plan application changes

Week 2: Infrastructure Setup
  ├─ Day 6-7: Set up PostgreSQL server
  ├─ Day 7-8: Set up database user & permissions
  ├─ Day 8-9: Set up backup infrastructure
  └─ Day 9-10: Set up monitoring & logging

Week 3: Database Schema Migration
  ├─ Day 11-12: Create base schema
  ├─ Day 12-13: Create users table
  ├─ Day 13-14: Update foreign keys
  ├─ Day 14-15: Adapt RLS policies
  └─ Day 15-16: Create storage tables

Week 4: Data Migration
  ├─ Day 17-18: Export data from Supabase
  ├─ Day 18-19: Prepare data for import
  ├─ Day 19-20: Migrate user data
  ├─ Day 20-21: Migrate related data
  ├─ Day 21-22: Verify data integrity
  └─ Day 22-23: Migrate file storage

Week 5: Authentication System Migration
  ├─ Day 24-25: Choose authentication approach
  ├─ Day 25-26: Implement custom authentication
  ├─ Day 26-27: Migrate user passwords
  └─ Day 27-28: Test authentication

Week 6: Application Code Updates
  ├─ Day 29-30: Update database connection
  ├─ Day 30-31: Update data access layer
  ├─ Day 31-32: Update real-time features
  ├─ Day 32-33: Update file upload/download
  ├─ Day 33-34: Update authorization logic
  └─ Day 34-35: Update environment variables

Week 7: Testing & Validation
  ├─ Day 36-37: Unit testing
  ├─ Day 37-38: Integration testing
  ├─ Day 38-39: Performance testing
  ├─ Day 39-40: Security testing
  ├─ Day 40-41: Data validation
  └─ Day 41-42: User acceptance testing

Week 8: Cutover & Go-Live
  ├─ Day 43: Final data sync
  ├─ Day 43: Pre-cutover checklist
  ├─ Day 44: Cutover process
  └─ Day 44-45: Post-cutover monitoring

Week 9+: Post-Migration
  ├─ Day 46-47: Decommission Supabase
  ├─ Day 47-48: Optimize PostgreSQL
  ├─ Day 48-49: Document new system
  ├─ Day 49-50: Train operations team
  └─ Day 50+: Plan for future maintenance
```

**Total Duration:** 8-10 weeks (including buffer)

---

## PART 8: CHECKLIST & SIGN-OFF

### Pre-Migration Checklist

- [ ] Database audit completed
- [ ] Infrastructure planned
- [ ] Authentication strategy decided
- [ ] Application changes identified
- [ ] Backup strategy documented
- [ ] Disaster recovery plan documented
- [ ] Team trained on migration process
- [ ] Stakeholders informed
- [ ] Maintenance window scheduled

### Migration Checklist

- [ ] PostgreSQL server set up
- [ ] Database schema created
- [ ] Data migrated and validated
- [ ] Authentication system implemented
- [ ] Application code updated
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Backups working

### Post-Migration Checklist

- [ ] Application running smoothly
- [ ] All users can access system
- [ ] No data loss
- [ ] Performance acceptable
- [ ] Monitoring working
- [ ] Backups working
- [ ] Supabase decommissioned
- [ ] Documentation updated
- [ ] Team trained

---

## CONCLUSION

This comprehensive migration plan provides a detailed roadmap for moving your BuildFlow Agency Management System from Supabase to self-hosted PostgreSQL. The migration is technically feasible and can be completed in 8-10 weeks with proper planning and execution.

**Key Success Factors:**
1. Thorough planning and preparation
2. Comprehensive testing at each phase
3. Clear communication with stakeholders
4. Experienced team members
5. Documented procedures and rollback plans
6. Proper monitoring and alerting

**Next Steps:**
1. Review this plan with your team
2. Adjust timeline based on your resources
3. Begin Phase 1 (Planning & Preparation)
4. Schedule kickoff meeting
5. Assign team members to each phase

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** Ready for Implementation
