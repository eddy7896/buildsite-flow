# BuildFlow Agency Management System

A comprehensive multi-tenant SaaS ERP platform for construction and agency management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080` (or next available port).

### Test Credentials

The application comes with pre-configured test accounts:

| Email | Password | Role | Name |
|-------|----------|------|------|
| super@buildflow.local | super123 | Super Admin | Rajesh Kumar (CEO) |
| admin@buildflow.local | admin123 | Admin | Priya Sharma |
| hr@buildflow.local | hr123 | HR Manager | Anita Desai |
| finance@buildflow.local | finance123 | Finance Manager | Vikram Mehta |
| employee@buildflow.local | employee123 | Employee | Amit Patel |
| pm@buildflow.local | pm123 | Project Manager | David Rodriguez |
| sales@buildflow.local | sales123 | Sales Manager | Lisa Thompson |
| devlead@buildflow.local | devlead123 | Dev Lead | Alex Williams |

## 📊 Comprehensive Seed Data

The application comes pre-loaded with realistic business data:

### Companies & Organization
- **TechBuild Solutions** - Main demo company (Enterprise plan)
- **ConstructPro Inc** - Secondary company (Professional plan)
- 8 Departments (Management, HR, Finance, Development, Sales, PM, Marketing, Support)
- 10 Employees with complete profiles

### Clients (6 Major Indian Companies)
- Tata Consultancy Services (TCS)
- Infosys Limited
- Reliance Industries
- HDFC Bank
- Wipro Limited
- Flipkart Internet

### Projects & Tasks
- 6 Active projects with various statuses
- 12+ Tasks with assignments and progress tracking
- Project budgets ranging from ₹25L to ₹85L

### Financial Data
- 6 Invoices (paid, sent, draft)
- 3 Quotations
- Job costing records
- GST settings and HSN/SAC codes
- Chart of accounts

### HR & Payroll
- Complete employee details with salaries
- 30 days of attendance records
- Leave types and balances
- Payroll periods and processed payments
- Reimbursement categories and requests

### CRM
- 4 Lead sources
- 4 Active leads with different statuses
- Client contact information

### Calendar
- 10 Indian public holidays (2025)
- Company events
- Leave requests

## 🗃️ Database Tables

The following tables are fully functional with CRUD operations:

| Category | Tables |
|----------|--------|
| **Core** | agencies, agency_settings, users, profiles, user_roles |
| **HR** | employee_details, employee_salary_details, departments, team_assignments |
| **Attendance** | attendance, leave_types, leave_balances, leave_requests |
| **Payroll** | payroll_periods, payroll, reimbursement_categories, reimbursement_requests |
| **Projects** | projects, tasks, job_categories, jobs |
| **Finance** | clients, invoices, quotations, chart_of_accounts |
| **CRM** | leads, lead_sources |
| **GST** | gst_settings, hsn_sac_codes |
| **Calendar** | holidays, company_events |
| **System** | notifications, audit_logs |

## 🔧 Database Management

### Database Connection

- **Database:** `buildflow_db`
- **User:** `postgres`
- **Password:** `admin`
- **Connection:** `postgresql://postgres:admin@localhost:5432/buildflow_db`

### Verify Database

```bash
psql -U postgres -d buildflow_db -c "\dt"
```

### Run Migrations

Check `database/migrations/` for SQL migration files to set up the database schema.

## 📦 Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** TailwindCSS, Radix UI, Shadcn/ui
- **State:** Zustand, React Query
- **Forms:** React Hook Form, Zod
- **Charts:** Recharts
- **Database:** PostgreSQL (buildflow_db)

## 📁 Project Structure

```
src/
├── components/     # React components (150+)
│   ├── ui/        # Shadcn UI components (50+)
│   ├── layout/    # Layout components
│   ├── analytics/ # Dashboard components
│   └── ...        # Feature components
├── pages/         # Page components (44 pages)
├── hooks/         # Custom React hooks
├── services/      # API services
│   └── api/       # PostgreSQL service layer
├── stores/        # Zustand stores
├── lib/           # Utilities
│   ├── database.ts    # PostgreSQL query builder
│   ├── seedDatabase.ts # Comprehensive data seeder
│   └── utils.ts       # Helper functions
├── integrations/
│   └── postgresql/    # PostgreSQL database client
├── config/        # App configuration
└── constants/     # App constants
```

## 🔐 Features

### Core Modules
- ✅ Multi-tenant architecture
- ✅ Role-based access control (22 roles)
- ✅ User authentication & sessions
- ✅ Comprehensive audit logging

### HR Management
- ✅ Employee records & profiles
- ✅ Attendance tracking (clock in/out)
- ✅ Leave management with balances
- ✅ Payroll processing
- ✅ Department & team management
- ✅ Reimbursement workflow

### Project Management
- ✅ Project tracking with budgets
- ✅ Task management (Kanban board)
- ✅ Job costing with categories
- ✅ Resource allocation
- ✅ Progress tracking

### Financial Management
- ✅ Client management
- ✅ Invoicing & billing
- ✅ Quotation system
- ✅ Payment tracking
- ✅ Chart of accounts
- ✅ GST compliance (India)

### CRM
- ✅ Lead tracking with sources
- ✅ Sales pipeline
- ✅ Client communication

### Calendar & Events
- ✅ Holiday management
- ✅ Company events
- ✅ Leave calendar integration

## 🛠️ Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## 📝 Architecture Notes

### Database Layer

The application uses PostgreSQL with a query builder API:

```typescript
// Query builder (PostgreSQL)
const { data, error } = await db
  .from('clients')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Direct service calls
import { selectRecords, insertRecord } from '@/services/api/postgresql-service';
const clients = await selectRecords('clients', { where: { status: 'active' } });
```

### Multi-Tenancy

- Each agency has isolated data via `agency_id` column
- Backend routes requests to agency-specific databases
- Frontend automatically includes `agency_id` in all operations

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_APP_NAME=BuildFlow
VITE_APP_ENVIRONMENT=development
VITE_DATABASE_URL=your-database-url
VITE_API_URL=your-api-url
```

## 📊 Sample Data Summary

| Entity | Count |
|--------|-------|
| Agencies | 2 |
| Users | 10 |
| Departments | 8 |
| Clients | 6 |
| Projects | 6 |
| Tasks | 12+ |
| Invoices | 6 |
| Quotations | 3 |
| Jobs | 3 |
| Leads | 4 |
| Holidays | 10 |
| Attendance Records | 150+ |
| Leave Types | 6 |

## 📚 Documentation

For detailed documentation, see the `docs/` folder:

- **[Architecture](docs/architecture.md)** - System architecture and design
- **[Database](docs/database.md)** - Database structure and schema
- **[API](docs/api.md)** - API documentation and usage
- **[Development](docs/development.md)** - Development guide and best practices

## 📄 License

Private - All rights reserved.

---

**Status:** Production Ready - PostgreSQL Multi-Tenant ERP  
**Last Updated:** January 2025  
**Version:** 1.0.0
