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

### Reset Database to Fresh Seed Data

Open browser console (F12) and run:
```javascript
resetDatabase()
```

This will:
1. Clear all existing data
2. Re-seed with fresh comprehensive data
3. Reload the page

### Clear Database Completely
```javascript
clearDatabase()
```

### View Current Data
```javascript
JSON.parse(localStorage.getItem('buildflow_db'))
```

## 📦 Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** TailwindCSS, Radix UI, Shadcn/ui
- **State:** Zustand, React Query
- **Forms:** React Hook Form, Zod
- **Charts:** Recharts
- **Database:** Browser localStorage (development)

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
│   ├── database.ts    # Supabase-compatible query builder
│   ├── seedDatabase.ts # Comprehensive data seeder
│   └── utils.ts       # Helper functions
├── integrations/
│   ├── postgresql/    # Database client
│   └── supabase/      # Compatibility layer
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

The application uses a Supabase-compatible API interface that stores data in localStorage:

```typescript
// Query builder (Supabase-style)
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Direct service calls
import { selectRecords, insertRecord } from '@/services/api/postgresql-service';
const clients = await selectRecords('clients', { where: { status: 'active' } });
```

### Future Backend Integration

To connect a real PostgreSQL backend:
1. Set up an API server (Express/FastAPI)
2. Update `src/integrations/postgresql/client.ts` to make HTTP calls
3. The rest of the application works unchanged

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

## 📄 License

Private - All rights reserved.

---

**Status:** Fully Functional with Comprehensive Data  
**Last Updated:** November 2025  
**Seed Version:** 2.0.0
