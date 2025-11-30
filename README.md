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

| Email | Password | Role |
|-------|----------|------|
| super@buildflow.local | super123 | Super Admin |
| admin@buildflow.local | admin123 | Admin |
| hr@buildflow.local | hr123 | HR Manager |
| finance@buildflow.local | finance123 | Finance Manager |
| employee@buildflow.local | employee123 | Employee |

## 📦 Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** TailwindCSS, Radix UI, Shadcn/ui
- **State:** Zustand, React Query
- **Forms:** React Hook Form, Zod
- **Charts:** Recharts

## 🗃️ Data Storage

The application uses a browser-based database (localStorage) for development and demonstration purposes. Data persists across sessions in the same browser.

### Reset Database

To reset the database to initial seed data, open browser console and run:
```javascript
import('/src/lib/seedDatabase').then(m => m.resetDatabase())
```

Or clear localStorage:
```javascript
localStorage.clear()
```

## 📁 Project Structure

```
src/
├── components/     # React components
│   ├── ui/        # Shadcn UI components
│   ├── layout/    # Layout components
│   └── ...        # Feature components
├── pages/         # Page components (42 pages)
├── hooks/         # Custom React hooks
├── services/      # API services
├── stores/        # Zustand stores
├── lib/           # Utilities
│   ├── database.ts    # Supabase-compatible query builder
│   ├── seedDatabase.ts # Database seeder
│   └── utils.ts       # Helper functions
├── integrations/
│   └── postgresql/    # Database client
├── config/        # App configuration
└── constants/     # App constants
```

## 🔐 Features

### Core Modules
- ✅ Multi-tenant architecture
- ✅ Role-based access control (22 roles)
- ✅ User authentication & sessions

### HR Management
- ✅ Employee records & profiles
- ✅ Attendance tracking (clock in/out)
- ✅ Leave management
- ✅ Payroll processing
- ✅ Department management

### Project Management
- ✅ Project/job tracking
- ✅ Task management (Kanban board)
- ✅ Resource allocation
- ✅ Client management

### Financial Management
- ✅ Invoicing & billing
- ✅ Payment tracking
- ✅ Expense reimbursements
- ✅ GST compliance (India)

### CRM
- ✅ Lead tracking
- ✅ Sales pipeline
- ✅ Quotation system

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

The application uses a Supabase-compatible API interface (`src/lib/database.ts`) that currently stores data in localStorage. This design allows for:

1. **Easy Development:** No external database setup required
2. **Future Migration:** Same API works with real PostgreSQL backend
3. **Persistence:** Data survives page refreshes

To connect a real PostgreSQL backend:
1. Set up an API server with the PostgreSQL connection
2. Update `src/integrations/postgresql/client.ts` to make HTTP calls instead of localStorage operations

### Authentication

Authentication uses mock credentials with simulated JWT tokens stored in localStorage. For production:
1. Implement a proper backend auth service
2. Use secure token storage (httpOnly cookies)
3. Add proper session management

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_APP_NAME=BuildFlow
VITE_APP_ENVIRONMENT=development
VITE_DATABASE_URL=your-database-url
VITE_API_URL=your-api-url
```

## 📄 License

Private - All rights reserved.

---

**Status:** Development/Demo Ready  
**Last Updated:** November 2025
