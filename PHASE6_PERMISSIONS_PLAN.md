# Phase 6: permissions.js Refactoring Plan

## Overview
Refactor `permissions.js` to replace console statements and manual pool connections with centralized utilities.

## Statistics
- **Console statements**: 13 instances (console.error, console.warn)
- **Manual pool connections**: 26 instances (13 pool.connect + 13 client.release)
- **File size**: ~1099 lines

## Refactoring Strategy

### Step 1: Add Required Imports
- Add `logger` from `../utils/logger`
- Add `query`, `queryOne`, `queryMany`, `transaction` from `../utils/dbQuery`
- Add `send`, `success`, `error`, `databaseError`, etc. from `../utils/responseHelper`
- Add `validateUUID`, `requireFields` from `../middleware/commonMiddleware` if needed

### Step 2: Replace Console Statements
- Replace all 13 console.error/warn with logger.error/warn
- Add structured logging with context (requestId, userId, agencyDatabase, etc.)

### Step 3: Replace Manual Pool Connections
- **Critical**: This file uses agency databases, so we need to use `dbQuery` with `agencyDatabase` option
- Replace all `pool.connect()` patterns with `queryOne()`, `queryMany()`, or `query()`
- Remove all `client.release()` calls
- Use `transaction()` helper for multi-query operations
- **Note**: The file uses `getAgencyDb()` helper which creates agency-specific pools - we may need to keep this pattern or refactor it

### Step 4: Standardize API Responses
- Replace manual `res.json()` with `sendSuccess()`, `sendError()`, etc.
- Use consistent error codes
- Add proper status codes

### Step 5: Add Middleware (if needed)
- Add `validateUUID` for ID parameters
- Add `requireFields` for POST/PUT endpoints

## Implementation Approach

### Pattern to Replace:
```javascript
// OLD
const client = await pool.connect();
try {
  const result = await client.query('SELECT ...', [params]);
  // ... process result
} finally {
  client.release();
}

// NEW
const result = await queryOne('SELECT ...', [params], { 
  agencyDatabase,
  requestId: req.requestId 
});
```

### Special Considerations:
1. **Agency Database Context**: All queries use agency databases, so we need to pass `agencyDatabase` to dbQuery helpers
2. **Transactions**: Some endpoints use transactions - use `transaction()` helper
3. **Error Handling**: Maintain existing error handling patterns while using responseHelper
4. **Audit Logging**: The file has audit logging - preserve this functionality

## Endpoints to Refactor

1. GET /api/permissions - Fetch permissions
2. GET /api/permissions/categories - Fetch categories
3. GET /api/permissions/roles/:roleId - Fetch role permissions
4. GET /api/permissions/users/:userId - Fetch user permissions
5. GET /api/permissions/templates - Fetch templates
6. POST /api/permissions/templates - Create template
7. POST /api/permissions/templates/:id/apply - Apply template
8. GET /api/permissions/export - Export permissions
9. POST /api/permissions/import - Import permissions

## Success Criteria

- ✅ Zero console statements
- ✅ Zero manual pool connections
- ✅ All queries use dbQuery helpers with agencyDatabase context
- ✅ All responses use responseHelper functions
- ✅ Consistent error handling
- ✅ Structured logging with context
- ✅ No linter errors
- ✅ All functionality preserved

