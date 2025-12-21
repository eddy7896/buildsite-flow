# 🚀 PROMPT FOR NEW CHAT - Fix All Test Failures

Copy and paste this entire prompt into a new chat:

---

## 🎯 **TASK: Fix All Failing Tests in ERP System**

I need you to systematically fix all 29 failing tests in my ERP system. Here's the complete context:

### **Current Test Status:**
- **Total Tests:** 58
- **Passing:** 29 (50%)
- **Failing:** 29 (50%)

### **Critical Information:**

**Database Connection:**
```
postgresql://postgres:admin@localhost:5432/buildflow_db
```

**Test Failure Documentation:**
- Complete breakdown: `docs/TEST_FAILURES_DOCUMENTATION.md`
- All failures are documented with root causes and fix strategies

### **Test Suites Status:**

#### ✅ **Fully Passing (16 tests):**
- Encryption Service: 9/9 ✅
- Cache Service: 7/7 ✅

#### ⚠️ **Partially Passing (13 tests):**
- Two-Factor Authentication: 2/5 ⚠️
- Inventory Management: 4/6 ⚠️
- Procurement Management: 2/4 ⚠️
- Webhooks: 1/3 ⚠️
- GraphQL: 1/2 ⚠️

#### ❌ **All Failing (15 tests):**
- Financial Management: 0/5 ❌ **HIGH PRIORITY**
- Project Enhancements: 0/5 ❌ **HIGH PRIORITY**
- CRM Enhancements: 0/5 ❌ **HIGH PRIORITY**

### **Common Root Causes:**

1. **Missing Test Data** (Most Common)
   - Tests expect data that doesn't exist
   - Need to seed test data in `beforeAll` hooks
   - Examples: Projects, leads, purchase orders, budgets, currencies

2. **Test Expectations Mismatch**
   - Tests expect 200 when 400/404 is correct
   - Need to adjust expectations to match actual API behavior

3. **Schema Dependencies**
   - New tables from recent implementations may not be created
   - Ensure all schemas included in `createAgencySchema`

4. **Missing Foreign Key Data**
   - Tests create records without required parent records
   - Need to create dependencies first

### **What You Need to Do:**

1. **Read the Documentation:**
   - `docs/TEST_FAILURES_DOCUMENTATION.md` - Complete failure breakdown
   - `docs/PROMPT_FOR_TEST_FIXES.md` - Detailed instructions

2. **Fix Priority Order:**
   1. Financial Management (0/5) - **START HERE**
   2. Project Enhancements (0/5)
   3. CRM Enhancements (0/5)
   4. Procurement (2/4)
   5. Inventory (4/6)
   6. Webhooks (1/3)
   7. Two-Factor (2/5)
   8. GraphQL (1/2)

3. **For Each Test Suite:**
   - Read the test file: `server/__tests__/api/[suite].test.js`
   - Identify what's failing (check error messages)
   - Fix missing data or incorrect expectations
   - Run tests: `cd server && npm test`
   - Verify all tests in suite pass
   - Move to next suite

4. **Key Files:**
   - Test helpers: `server/__tests__/helpers/testHelpers.js`
   - Mock auth: `server/__tests__/helpers/mockAuth.js`
   - Schema creator: `server/utils/schemaCreator.js`
   - All test files: `server/__tests__/api/*.test.js`

### **Test Infrastructure:**

- Each test suite has `beforeAll` and `afterAll` hooks
- `beforeAll`: Creates test agency DB, user, sets global context
- `afterAll`: Cleans up test database
- Tests use mock authentication
- Tests create isolated databases per suite

### **Common Fixes:**

1. **Add Test Data Seeding:**
   ```javascript
   beforeAll(async () => {
     // ... existing setup ...
     
     // Add missing test data
     await createTestProject(client, testAgency.agencyDatabase);
     await createTestCurrency(client, testAgency.agencyDatabase);
     // etc.
   });
   ```

2. **Fix Test Expectations:**
   ```javascript
   // Wrong:
   .expect(200)
   
   // Right (if API correctly returns 400):
   .expect(400)
   ```

3. **Create Dependencies First:**
   ```javascript
   // Create parent record first
   const requisition = await createTestRequisition(...);
   // Then create child record
   const po = await createPurchaseOrder(requisition.id, ...);
   ```

### **Success Criteria:**
- ✅ All 58 tests passing
- ✅ No test failures
- ✅ All test suites green

### **Testing Command:**
```bash
cd server && npm test
```

### **Important Notes:**

- **Database:** Always use `postgresql://postgres:admin@localhost:5432/buildflow_db`
- **Test DBs:** Each test creates isolated database (e.g., `test_agency_1234567890`)
- **Schema:** All test DBs use `createAgencySchema` - ensure all new schemas included
- **Auth:** Tests use mock auth - check `global.testUserId`, `global.testAgencyId`, `global.testAgencyDatabase`

### **Start Here:**

1. Read `docs/TEST_FAILURES_DOCUMENTATION.md` for detailed breakdown
2. Start with Financial Management tests (highest priority)
3. Fix one suite at a time
4. Test after each fix
5. Continue until all 58 tests pass

---

**GOAL: Fix all 29 failing tests until all 58 tests pass.**

**Begin by reading the test failure documentation, then systematically fix each test suite starting with Financial Management.**
