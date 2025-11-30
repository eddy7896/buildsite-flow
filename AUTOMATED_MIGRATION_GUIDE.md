# Automated Migration Guide - Supabase to PostgreSQL

**Status:** Ready for Automated Implementation  
**Files to Update:** 70+  
**Estimated Time:** 2-3 days  

---

## 🎯 OVERVIEW

This guide provides a systematic approach to migrate all remaining files from Supabase to PostgreSQL. The migration follows consistent patterns that can be applied across all files.

---

## 📋 FILES TO UPDATE (Priority Order)

### PRIORITY 1: Core Services (2 files)
These files are used by many other files and should be updated first.

#### 1. `src/services/api/base.ts`
**Current Status:** Uses Supabase  
**Changes Needed:**
- Remove: `import { supabase } from '@/integrations/supabase/client';`
- Replace all Supabase query methods with PostgreSQL service calls
- Update error handling

**Pattern:**
```typescript
// BEFORE
let query = (supabase as any).from(table).select(options.select || '*');

// AFTER
const data = await selectRecords(table, {
  select: options.select,
  where: options.where,
  orderBy: options.orderBy,
  limit: options.limit
});
```

#### 2. `src/services/api/auth.ts`
**Current Status:** Uses Supabase Auth  
**Changes Needed:**
- Remove: All Supabase auth imports
- Replace with: PostgreSQL auth service
- Update signup, signin, signout methods

---

### PRIORITY 2: Hooks (8 files)
These are used throughout the application for data fetching.

#### Files:
1. `src/hooks/useAnalytics.ts`
2. `src/hooks/useAgencyAnalytics.ts`
3. `src/hooks/useSystemAnalytics.ts`
4. `src/hooks/usePlanManagement.ts`
5. `src/hooks/usePermissions.ts`
6. `src/hooks/useGST.ts`
7. `src/hooks/useCurrency.tsx`

**Pattern for all hooks:**
```typescript
// BEFORE
const { data, error } = await supabase.from('table').select('*');

// AFTER
import { selectRecords } from '@/services/api/postgresql-service';
const data = await selectRecords('table');
```

---

### PRIORITY 3: Pages (30+ files)
Update all page components to use PostgreSQL services.

#### Files in `src/pages/`:
- Users.tsx
- Employees.tsx
- Clients.tsx
- Projects.tsx
- Tasks.tsx
- Invoices.tsx
- Quotations.tsx
- Jobs.tsx
- Leads.tsx
- Reimbursements.tsx
- Attendance.tsx
- LeaveRequests.tsx
- Payroll.tsx
- DepartmentManagement.tsx
- MyProfile.tsx
- MyTeam.tsx
- MyAttendance.tsx
- MyLeave.tsx
- Settings.tsx
- Analytics.tsx
- CRM.tsx
- FinancialManagement.tsx
- ProjectManagement.tsx
- GstCompliance.tsx
- HolidayManagement.tsx
- CreateEmployee.tsx
- AssignUserRoles.tsx
- AIFeatures.tsx
- AgencySignUp.tsx
- SignUp.tsx
- EmployeeProjects.tsx
- And more...

**Pattern for all pages:**
```typescript
// BEFORE
const { data, error } = await supabase.from('table').select('*').eq('id', id);

// AFTER
import { selectOne } from '@/services/api/postgresql-service';
const data = await selectOne('table', { id });
```

---

### PRIORITY 4: Components (30+ files)
Update all component files to use PostgreSQL services.

#### Files in `src/components/`:
- UserFormDialog.tsx
- ClientFormDialog.tsx
- ProjectFormDialog.tsx
- TaskFormDialog.tsx
- InvoiceFormDialog.tsx
- QuotationFormDialog.tsx
- JobFormDialog.tsx
- LeadFormDialog.tsx
- DepartmentFormDialog.tsx
- HolidayFormDialog.tsx
- ReimbursementFormDialog.tsx
- ReimbursementReviewDialog.tsx
- ReceiptUpload.tsx
- TaskKanbanBoard.tsx
- TeamAssignmentPanel.tsx
- RoleChangeRequests.tsx
- LeaveBalanceWidget.tsx
- NotificationCenter.tsx
- DemoDataManager.tsx
- CreateDemoUsers.tsx
- ClockInOut.tsx
- PaymentDialog.tsx
- OnboardingWizard.tsx
- ReimbursementWorkflow.tsx
- DocumentManager.tsx
- DeleteConfirmDialog.tsx
- MessageCenter.tsx
- RealTimeUsageWidget.tsx
- SupportTicketsWidget.tsx
- CalendarEventDialog.tsx
- AdvancedDashboard.tsx
- And more...

**Pattern for all components:**
```typescript
// BEFORE
const { data, error } = await supabase.from('table').insert(record);

// AFTER
import { insertRecord } from '@/services/api/postgresql-service';
const data = await insertRecord('table', record);
```

---

### PRIORITY 5: Configuration (2 files)

#### 1. `src/config/services.ts`
**Changes Needed:**
- Remove Supabase endpoint references
- Update API endpoint configuration

#### 2. `src/stores/authStore.ts`
**Changes Needed:**
- Remove Supabase types
- Update to use PostgreSQL types

---

## 🔄 MIGRATION PATTERNS REFERENCE

### Pattern 1: SELECT Single Record
```typescript
// BEFORE
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single();

// AFTER
import { selectOne } from '@/services/api/postgresql-service';
const data = await selectOne('table', { id });
```

### Pattern 2: SELECT Multiple Records
```typescript
// BEFORE
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// AFTER
import { selectRecords } from '@/services/api/postgresql-service';
const data = await selectRecords('table', {
  where: { status: 'active' },
  orderBy: 'created_at DESC'
});
```

### Pattern 3: SELECT with Count
```typescript
// BEFORE
const { count, error } = await supabase
  .from('table')
  .select('*', { count: 'exact', head: true });

// AFTER
import { countRecords } from '@/services/api/postgresql-service';
const count = await countRecords('table');
```

### Pattern 4: INSERT Record
```typescript
// BEFORE
const { data, error } = await supabase
  .from('table')
  .insert(record)
  .select()
  .single();

// AFTER
import { insertRecord } from '@/services/api/postgresql-service';
const data = await insertRecord('table', record);
```

### Pattern 5: UPDATE Record
```typescript
// BEFORE
const { data, error } = await supabase
  .from('table')
  .update(updateData)
  .eq('id', id);

// AFTER
import { updateRecord } from '@/services/api/postgresql-service';
const data = await updateRecord('table', updateData, { id });
```

### Pattern 6: DELETE Record
```typescript
// BEFORE
const { error } = await supabase
  .from('table')
  .delete()
  .eq('id', id);

// AFTER
import { deleteRecord } from '@/services/api/postgresql-service';
await deleteRecord('table', { id });
```

### Pattern 7: RPC Function Call
```typescript
// BEFORE
const { data, error } = await supabase.rpc('function_name', { param: value });

// AFTER
import { rawQuery } from '@/services/api/postgresql-service';
const data = await rawQuery('SELECT * FROM function_name($1)', [value]);
```

### Pattern 8: File Upload
```typescript
// BEFORE
const { data, error } = await supabase.storage
  .from('bucket')
  .upload(path, file);

// AFTER
import { uploadFile } from '@/services/file-storage';
const fileStorage = await uploadFile('bucket', path, fileBuffer, userId, mimeType);
```

### Pattern 9: Error Handling
```typescript
// BEFORE
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error(error);
}

// AFTER
try {
  const data = await selectRecords('table');
  // Use data
} catch (error) {
  console.error('Database error:', error);
}
```

---

## 📝 STEP-BY-STEP IMPLEMENTATION

### Step 1: Update Core Services
1. Open `src/services/api/base.ts`
2. Remove Supabase import
3. Replace all Supabase methods with PostgreSQL service calls
4. Test the service

### Step 2: Update Hooks
1. For each hook file:
   - Remove Supabase imports
   - Replace all Supabase queries with PostgreSQL service calls
   - Update error handling
   - Test the hook

### Step 3: Update Pages
1. For each page file:
   - Remove Supabase imports
   - Replace all Supabase queries with PostgreSQL service calls
   - Update error handling
   - Test the page

### Step 4: Update Components
1. For each component file:
   - Remove Supabase imports
   - Replace all Supabase queries with PostgreSQL service calls
   - Update error handling
   - Test the component

### Step 5: Update Configuration
1. Update `src/config/services.ts`
2. Update `src/stores/authStore.ts`
3. Remove `src/integrations/supabase/` folder

---

## 🧪 TESTING CHECKLIST

After each file update:
- [ ] No Supabase imports remain
- [ ] All queries use PostgreSQL service
- [ ] Error handling is in place
- [ ] Component/page renders without errors
- [ ] Data operations work correctly
- [ ] No console errors

---

## 🚀 FINAL STEPS

### 1. Remove Supabase Folder
```bash
rm -r src/integrations/supabase/
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database
```bash
psql -U app_user -d buildflow_db -f seed_initial_data.sql
```

### 4. Test Application
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 📊 PROGRESS TRACKING

| Phase | Files | Status |
|-------|-------|--------|
| Core Services | 2 | ⏳ Ready |
| Hooks | 8 | ⏳ Ready |
| Pages | 30+ | ⏳ Ready |
| Components | 30+ | ⏳ Ready |
| Configuration | 2 | ⏳ Ready |
| **Total** | **70+** | **�� Ready** |

---

## 💡 TIPS FOR EFFICIENT MIGRATION

1. **Use Find & Replace:** Use your IDE's find and replace feature to quickly update imports
2. **Work in Batches:** Update files in priority order
3. **Test Frequently:** Test after each batch of changes
4. **Use Git:** Commit changes frequently to track progress
5. **Reference Patterns:** Keep this guide open while migrating

---

## 🎯 SUCCESS CRITERIA

- [ ] All 70+ files updated
- [ ] No Supabase imports remain
- [ ] All PostgreSQL services used
- [ ] Application builds successfully
- [ ] All features work correctly
- [ ] Database operations successful
- [ ] No console errors
- [ ] Ready for production deployment

---

**Status:** Ready for Implementation  
**Estimated Time:** 2-3 days  
**Next Step:** Begin with Priority 1 files
