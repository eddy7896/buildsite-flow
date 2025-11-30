# Core Authentication Schema - Complete Index

## 📋 Documentation Index

This index provides a complete guide to all files and resources for the core authentication schema implementation.

---

## 🚀 Quick Start

**New to this schema? Start here:**

1. **Read:** [CORE_AUTH_SCHEMA_README.md](./CORE_AUTH_SCHEMA_README.md) - Overview and quick start
2. **Run:** `./scripts/setup_core_auth_schema.sh` (Linux/macOS) or `scripts\setup_core_auth_schema.bat` (Windows)
3. **Verify:** `./scripts/setup_core_auth_schema.sh --verify-only`
4. **Learn:** [CORE_AUTH_SCHEMA_DOCUMENTATION.md](./CORE_AUTH_SCHEMA_DOCUMENTATION.md) - Detailed documentation

---

## 📁 File Structure

```
buildsite-flow/
├── supabase/
│   └── migrations/
│       └── 00_core_auth_schema.sql          ← SQL Schema (1000+ lines)
├── scripts/
│   ├── setup_core_auth_schema.sh            ← Linux/macOS setup script
│   └── setup_core_auth_schema.bat           ← Windows setup script
├── CORE_AUTH_SCHEMA_README.md               ← Getting started guide
├── CORE_AUTH_SCHEMA_DOCUMENTATION.md        ← Complete documentation
├── CORE_AUTH_SCHEMA_QUICK_REFERENCE.md      ← Quick reference guide
├── CORE_AUTH_SCHEMA_SUMMARY.md              ← Implementation summary
├── CORE_AUTH_SCHEMA_INDEX.md                ← This file
└── SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md ← Full migration plan
```

---

## 📚 Documentation Files

### 1. CORE_AUTH_SCHEMA_README.md
**Purpose:** Getting started guide and overview

**Contains:**
- Quick start instructions
- Setup options (script, manual, npm)
- Schema overview
- Common tasks
- Verification procedures
- Troubleshooting
- Next steps

**Best for:** First-time users, quick reference

**Read time:** 10-15 minutes

---

### 2. CORE_AUTH_SCHEMA_DOCUMENTATION.md
**Purpose:** Complete technical documentation

**Contains:**
- Detailed table definitions
- Column descriptions and constraints
- Data types explained
- Function documentation with examples
- Trigger explanations
- RLS policy details
- Views documentation
- Usage examples
- Migration instructions
- Troubleshooting guide
- Security considerations

**Best for:** Developers, database administrators, detailed reference

**Read time:** 30-45 minutes

---

### 3. CORE_AUTH_SCHEMA_QUICK_REFERENCE.md
**Purpose:** Quick lookup guide

**Contains:**
- Table summaries
- Function list
- Trigger list
- RLS policies summary
- Common operations
- Index list
- Installation steps
- Verification queries
- Security checklist

**Best for:** Quick lookups, reference during development

**Read time:** 5-10 minutes

---

### 4. CORE_AUTH_SCHEMA_SUMMARY.md
**Purpose:** Implementation summary

**Contains:**
- What was created
- Files delivered
- Database schema overview
- Functions created
- Triggers created
- RLS policies created
- Indexes created
- Key features
- How to use
- Common operations
- Verification checklist
- Next steps

**Best for:** Project managers, team leads, implementation overview

**Read time:** 15-20 minutes

---

### 5. CORE_AUTH_SCHEMA_INDEX.md
**Purpose:** This file - complete index and navigation

**Contains:**
- File structure
- Documentation index
- Setup instructions
- Common tasks
- Troubleshooting
- FAQ
- Related resources

**Best for:** Navigation, finding specific information

**Read time:** 5-10 minutes

---

### 6. SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md
**Purpose:** Complete migration plan from Supabase to PostgreSQL

**Contains:**
- Complete database audit
- Migration dependencies
- 9-phase migration plan
- Technical specifications
- Risk assessment
- Cost analysis
- Implementation timeline
- Checklists

**Best for:** Understanding full migration context, planning

**Read time:** 60+ minutes

---

## 🔧 Setup Scripts

### Linux/macOS: setup_core_auth_schema.sh

**Features:**
- Automated schema creation
- Connection verification
- Schema validation
- Test user creation
- Colored output
- Error handling
- Help documentation

**Usage:**
```bash
# Make executable
chmod +x scripts/setup_core_auth_schema.sh

# Run with defaults
./scripts/setup_core_auth_schema.sh

# Run with custom settings
./scripts/setup_core_auth_schema.sh -h db.example.com -d production_db -u app_user

# Verify only
./scripts/setup_core_auth_schema.sh --verify-only

# Show help
./scripts/setup_core_auth_schema.sh --help
```

**Options:**
- `-h, --host HOST` - PostgreSQL host (default: localhost)
- `-p, --port PORT` - PostgreSQL port (default: 5432)
- `-u, --user USER` - PostgreSQL user (default: postgres)
- `-d, --database DATABASE` - Database name (default: buildflow_db)
- `-f, --file FILE` - Migration file path
- `--verify-only` - Only verify schema
- `--help` - Show help

---

### Windows: setup_core_auth_schema.bat

**Features:**
- Same functionality as shell script
- Windows-compatible commands
- Batch file format
- Error handling
- Help documentation

**Usage:**
```cmd
# Run with defaults
scripts\setup_core_auth_schema.bat

# Run with custom settings
scripts\setup_core_auth_schema.bat -h db.example.com -d production_db -u app_user

# Verify only
scripts\setup_core_auth_schema.bat --verify-only

# Show help
scripts\setup_core_auth_schema.bat --help
```

---

## 💾 SQL Migration File

### supabase/migrations/00_core_auth_schema.sql

**Size:** ~1000 lines

**Contains:**
- Extensions (pgcrypto)
- Custom types (app_role enum)
- 7 tables with all columns, constraints, and indexes
- 8+ utility functions
- 8+ trigger functions
- 30+ RLS policies
- 40+ performance indexes
- 2 authorized views
- Complete SQL comments

**Structure:**
1. Extensions
2. Custom types
3. Core tables
4. Utility functions
5. Trigger functions
6. Triggers
7. RLS policies
8. Views
9. Audit logs table
10. Seed data (commented)

**How to use:**
```bash
# Option 1: Using psql
psql -U postgres -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql

# Option 2: From within psql
\i supabase/migrations/00_core_auth_schema.sql

# Option 3: Using setup script
./scripts/setup_core_auth_schema.sh
```

---

## 📊 Schema Overview

### Tables (7)
1. **users** - Core user accounts
2. **profiles** - User profile information
3. **user_roles** - Role assignments
4. **employee_details** - Extended employee information
5. **employee_salary_details** - Sensitive salary information
6. **employee_files** - Employee document references
7. **audit_logs** - Audit trail

### Functions (8+)
- `has_role()` - Check user role
- `get_user_role()` - Get primary role
- `current_user_id()` - Get current user
- `get_user_agency_id()` - Get agency
- `update_updated_at_column()` - Auto-update timestamp
- `encrypt_ssn()` - Encrypt SSN
- `decrypt_ssn()` - Decrypt SSN
- `handle_new_user()` - Create profile on signup
- `audit_trigger_function()` - Log changes

### Triggers (8+)
- Timestamp updates (4)
- User creation (1)
- Audit logging (3)

### RLS Policies (30+)
- users (4)
- profiles (7)
- user_roles (3)
- employee_details (4)
- employee_salary_details (2)
- employee_files (4)
- audit_logs (1)

### Indexes (40+)
- Email lookups
- User filtering
- Department queries
- Employee lookups
- Multi-tenant filtering
- Date range queries
- Category filtering
- Audit queries

### Views (2)
- `employee_basic_info` - Filtered employee data
- `employee_details_with_salary` - Employee with salary

---

## 🎯 Common Tasks

### Setup & Installation

**First time setup:**
```bash
./scripts/setup_core_auth_schema.sh
```

**Verify existing schema:**
```bash
./scripts/setup_core_auth_schema.sh --verify-only
```

**Manual setup:**
```bash
psql -U postgres -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql
```

---

### User Management

**Create user:**
```sql
INSERT INTO public.users (email, password_hash, raw_user_meta_data)
VALUES ('user@example.com', crypt('password', gen_salt('bf')), '{"full_name": "Name"}'::jsonb);
```

**Assign role:**
```sql
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('user-id', 'hr'::app_role, 'admin-id');
```

**Check role:**
```sql
SELECT public.has_role('user-id', 'admin'::app_role);
```

---

### Employee Management

**Create employee:**
```sql
INSERT INTO public.employee_details (user_id, employee_id, first_name, last_name, employment_type, social_security_number)
VALUES ('user-id', 'EMP-001', 'John', 'Doe', 'full-time', public.encrypt_ssn('123-45-6789', 'key'));
```

**Add salary:**
```sql
INSERT INTO public.employee_salary_details (employee_id, salary, salary_frequency, effective_date)
VALUES ('emp-id', 75000.00, 'annual', CURRENT_DATE);
```

**Upload file:**
```sql
INSERT INTO public.employee_files (employee_id, file_name, file_path, file_type, file_size, category, uploaded_by)
VALUES ('emp-id', 'resume.pdf', '/path/resume.pdf', 'application/pdf', 245000, 'resume', 'user-id');
```

---

### Queries

**All active employees:**
```sql
SELECT * FROM public.employee_basic_info WHERE is_active = true;
```

**Employees by department:**
```sql
SELECT * FROM public.profiles WHERE department = 'Engineering' AND is_active = true;
```

**Employee with salary:**
```sql
SELECT * FROM public.employee_details_with_salary WHERE employee_id = 'EMP-001';
```

**Audit logs:**
```sql
SELECT * FROM public.audit_logs WHERE table_name = 'employee_details' ORDER BY created_at DESC;
```

---

## 🔍 Verification

### Quick Verification

```bash
./scripts/setup_core_auth_schema.sh --verify-only
```

### Manual Verification

**Check tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'user_roles', 'employee_details', 
                   'employee_salary_details', 'employee_files', 'audit_logs')
ORDER BY table_name;
```

**Check functions:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Check triggers:**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' ORDER BY trigger_name;
```

**Check RLS:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'profiles', 'user_roles', 'employee_details', 
                  'employee_salary_details', 'employee_files', 'audit_logs');
```

---

## ❓ FAQ

### Q: How do I run the setup script?

**A:** 
- Linux/macOS: `./scripts/setup_core_auth_schema.sh`
- Windows: `scripts\setup_core_auth_schema.bat`

### Q: What if I get a connection error?

**A:** Check:
1. PostgreSQL is running
2. Host, port, user, database are correct
3. User has proper permissions
4. See CORE_AUTH_SCHEMA_DOCUMENTATION.md troubleshooting section

### Q: How do I verify the schema was created?

**A:** Run: `./scripts/setup_core_auth_schema.sh --verify-only`

### Q: Can I use this with Supabase Auth?

**A:** Yes, but you'll need to adapt the `users` table to work with Supabase Auth. See SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md for details.

### Q: How do I encrypt/decrypt SSN?

**A:** 
```sql
-- Encrypt
SELECT public.encrypt_ssn('123-45-6789', 'encryption_key');

-- Decrypt (role-restricted)
SELECT public.decrypt_ssn(encrypted_ssn, 'encryption_key');
```

### Q: What are the default roles?

**A:** 
- `admin` - System administrator
- `hr` - Human resources manager
- `finance_manager` - Finance department manager
- `employee` - Regular employee
- `super_admin` - Super administrator (multi-tenant)

### Q: How do I set the current user context?

**A:** 
```sql
SET LOCAL app.current_user_id = 'user-id-here';
```

### Q: What's the difference between the documentation files?

**A:**
- **README.md** - Getting started
- **DOCUMENTATION.md** - Complete reference
- **QUICK_REFERENCE.md** - Quick lookup
- **SUMMARY.md** - Implementation overview
- **INDEX.md** - Navigation (this file)

---

## 🔗 Related Resources

### Internal Documentation
- [SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md](./SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md) - Full migration plan
- [CORE_AUTH_SCHEMA_README.md](./CORE_AUTH_SCHEMA_README.md) - Getting started
- [CORE_AUTH_SCHEMA_DOCUMENTATION.md](./CORE_AUTH_SCHEMA_DOCUMENTATION.md) - Complete reference

### External Resources
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL pgcrypto Documentation](https://www.postgresql.org/docs/current/pgcrypto.html)
- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html)

---

## 📞 Support

### Getting Help

1. **Check documentation:**
   - CORE_AUTH_SCHEMA_DOCUMENTATION.md - Detailed reference
   - CORE_AUTH_SCHEMA_QUICK_REFERENCE.md - Quick lookup

2. **Review examples:**
   - See "Common Tasks" section above
   - Check CORE_AUTH_SCHEMA_DOCUMENTATION.md usage examples

3. **Troubleshoot:**
   - See CORE_AUTH_SCHEMA_DOCUMENTATION.md troubleshooting section
   - Run verification: `./scripts/setup_core_auth_schema.sh --verify-only`

4. **External resources:**
   - PostgreSQL documentation
   - Stack Overflow
   - PostgreSQL community forums

---

## ✅ Checklist

Before proceeding to next phase:

- [ ] Read CORE_AUTH_SCHEMA_README.md
- [ ] Run setup script successfully
- [ ] Verify schema installation
- [ ] Review CORE_AUTH_SCHEMA_DOCUMENTATION.md
- [ ] Understand table structure
- [ ] Understand RLS policies
- [ ] Test common operations
- [ ] Create test user (optional)
- [ ] Review security considerations
- [ ] Plan next steps

---

## 🚀 Next Steps

1. ✅ **Core auth schema created** - COMPLETE
2. ⏭️ **Create remaining tables** - Proceed with other migrations
3. ⏭️ **Migrate data from Supabase** - Import existing data
4. ⏭️ **Update application code** - Configure to use new database
5. ⏭️ **Test thoroughly** - Verify all functionality
6. ⏭️ **Deploy to production** - Follow deployment procedures

---

## 📝 Version Information

- **Schema Version:** 1.0
- **PostgreSQL Version:** 14+
- **Created:** 2025-01-15
- **Status:** Production Ready

---

## 🎓 Learning Path

**Beginner:**
1. Read CORE_AUTH_SCHEMA_README.md
2. Run setup script
3. Review CORE_AUTH_SCHEMA_QUICK_REFERENCE.md

**Intermediate:**
1. Read CORE_AUTH_SCHEMA_DOCUMENTATION.md
2. Review SQL migration file
3. Test common operations

**Advanced:**
1. Study RLS policies
2. Review trigger functions
3. Understand encryption/decryption
4. Plan application integration

---

**Ready to get started? Run the setup script:**

```bash
# Linux/macOS
./scripts/setup_core_auth_schema.sh

# Windows
scripts\setup_core_auth_schema.bat
```

---

**Last Updated:** 2025-01-15  
**Status:** Ready for Implementation
