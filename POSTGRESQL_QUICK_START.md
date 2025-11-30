# PostgreSQL Migration - Quick Start Guide

## 5-Minute Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Run these commands:
CREATE DATABASE buildflow_db;
CREATE USER app_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE buildflow_db TO app_user;
\c buildflow_db
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT ALL PRIVILEGES ON SCHEMA public TO app_user;
\q
```

### 3. Run Migrations

```bash
# From project root
psql -U app_user -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql
psql -U app_user -d buildflow_db -f supabase/migrations/01_phase2_business_tables.sql
```

### 4. Configure Environment

Create `.env.local`:
```env
VITE_DATABASE_URL=postgresql://app_user:dev_password_123@localhost:5432/buildflow_db
VITE_API_URL=http://localhost:3000/api
VITE_JWT_SECRET=dev-secret-key-change-in-production
VITE_FILE_STORAGE_PATH=/tmp/buildflow-storage
VITE_APP_ENVIRONMENT=development
```

### 5. Install Dependencies

```bash
npm install pg bcryptjs jsonwebtoken
npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
```

### 6. Start Development

```bash
npm run dev
```

### 7. Test Login

Use these credentials:
- **Email:** admin@buildflow.com
- **Password:** admin123

---

## Common Tasks

### Query Data

```typescript
import { selectRecords, selectOne } from '@/services/api/postgresql-service';

// Get all clients
const clients = await selectRecords('clients', {
  where: { agency_id: agencyId }
});

// Get single client
const client = await selectOne('clients', { id: clientId });
```

### Create Data

```typescript
import { insertRecord } from '@/services/api/postgresql-service';

const newClient = await insertRecord('clients', {
  name: 'Acme Corp',
  email: 'contact@acme.com',
  agency_id: agencyId,
  status: 'active'
});
```

### Update Data

```typescript
import { updateRecord } from '@/services/api/postgresql-service';

const updated = await updateRecord('clients',
  { status: 'inactive' },
  { id: clientId }
);
```

### Delete Data

```typescript
import { deleteRecord } from '@/services/api/postgresql-service';

await deleteRecord('clients', { id: clientId });
```

### Authenticate User

```typescript
import { loginUser } from '@/services/api/auth-postgresql';

const { token, user } = await loginUser({
  email: 'user@example.com',
  password: 'password123'
});

localStorage.setItem('auth_token', token);
```

---

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT NOW();"

# Check connection string
echo $VITE_DATABASE_URL

# Test connection
psql $VITE_DATABASE_URL -c "SELECT NOW();"
```

### Migration Failed

```bash
# Check if tables exist
psql -U app_user -d buildflow_db -c "\dt"

# Check for errors
psql -U app_user -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql
```

### Login Not Working

```typescript
// Check token in browser console
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// Verify token
import { verifyToken } from '@/services/api/auth-postgresql';
const decoded = verifyToken(token);
console.log('Decoded:', decoded);
```

### Slow Queries

```sql
-- Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Check indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## Mock Users for Testing

| Email | Password | Role |
|-------|----------|------|
| super@buildflow.com | super123 | super_admin |
| admin@buildflow.com | admin123 | admin |
| hr@buildflow.com | hr123 | hr |
| finance@buildflow.com | finance123 | finance_manager |
| employee@buildflow.com | employee123 | employee |
| ceo@buildflow.com | ceo123 | ceo |
| cto@buildflow.com | cto123 | cto |
| cfo@buildflow.com | cfo123 | cfo |
| pm@buildflow.com | pm123 | project_manager |
| sales@buildflow.com | sales123 | sales_manager |
| marketing@buildflow.com | marketing123 | marketing_manager |
| ops@buildflow.com | ops123 | operations_manager |
| lead@buildflow.com | lead123 | team_lead |
| it@buildflow.com | it123 | it_support |
| contractor@buildflow.com | contractor123 | contractor |
| intern@buildflow.com | intern123 | intern |

---

## File Structure

```
src/
├── integrations/
│   └── postgresql/
│       ├── client.ts          # Database connection
│       └── types.ts           # TypeScript types
├── services/
│   ├── api/
│   │   ├── auth-postgresql.ts # Authentication
│   │   └── postgresql-service.ts # Database operations
│   └── file-storage.ts        # File operations
├── config/
│   ├── env.ts                 # Environment variables
│   └── index.ts               # Configuration
└── hooks/
    └── useAuth.tsx            # Auth hook
```

---

## Environment Variables

```env
# Required
VITE_DATABASE_URL=postgresql://user:password@host:port/database
VITE_API_URL=http://localhost:3000/api
VITE_JWT_SECRET=your-secret-key

# Optional
VITE_FILE_STORAGE_PATH=/var/lib/buildflow/storage
VITE_APP_ENVIRONMENT=development
VITE_APP_NAME=BuildFlow Agency Management
VITE_APP_VERSION=1.0.0
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PROJECT_MANAGEMENT=true
VITE_ENABLE_FINANCIAL_MANAGEMENT=true
VITE_ENABLE_HR_MANAGEMENT=true
VITE_ENABLE_CRM=true
```

---

## Database Tables

### Core Tables
- `users` - User accounts
- `profiles` - User profiles
- `user_roles` - Role assignments
- `employee_details` - Employee info
- `employee_salary_details` - Salary info
- `employee_files` - Employee documents

### Business Tables
- `agencies` - Agencies
- `departments` - Departments
- `clients` - Clients
- `projects` - Projects
- `tasks` - Tasks
- `invoices` - Invoices
- `quotations` - Quotations
- `jobs` - Jobs
- `leads` - Leads
- `reimbursement_requests` - Reimbursements
- `attendance` - Attendance
- `leave_requests` - Leave requests
- `payroll` - Payroll
- `audit_logs` - Audit logs
- `file_storage` - File metadata

---

## API Examples

### Get All Records
```typescript
const records = await selectRecords('table_name', {
  where: { status: 'active' },
  orderBy: 'created_at DESC',
  limit: 10
});
```

### Get Single Record
```typescript
const record = await selectOne('table_name', { id: recordId });
```

### Create Record
```typescript
const record = await insertRecord('table_name', {
  name: 'Example',
  status: 'active'
});
```

### Update Record
```typescript
const record = await updateRecord('table_name',
  { status: 'inactive' },
  { id: recordId }
);
```

### Delete Record
```typescript
await deleteRecord('table_name', { id: recordId });
```

### Count Records
```typescript
const count = await countRecords('table_name', {
  status: 'active'
});
```

### Paginated Results
```typescript
const { data, total, page, pageSize } = await getPaginated(
  'table_name',
  1,  // page
  10, // pageSize
  { where: { status: 'active' } }
);
```

---

## Next Steps

1. ✅ Set up PostgreSQL
2. ✅ Create database and user
3. ✅ Run migrations
4. ✅ Configure environment
5. ✅ Install dependencies
6. ✅ Start development server
7. ⏭️ Update application code (see SUPABASE_REMOVAL_CHECKLIST.md)
8. ⏭️ Run tests
9. ⏭️ Deploy to production

---

## Support

- **Documentation:** See `POSTGRESQL_MIGRATION_COMPLETE.md`
- **Checklist:** See `SUPABASE_REMOVAL_CHECKLIST.md`
- **Migration Plan:** See `SUPABASE_TO_POSTGRESQL_MIGRATION_PLAN.md`
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Last Updated:** 2025-01-15  
**Status:** Ready to Use
