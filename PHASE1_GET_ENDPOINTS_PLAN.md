# Phase 1: Simple GET Endpoints Refactoring Plan

## Overview
This document provides a detailed, systematic plan for refactoring simple GET endpoints across the codebase. We'll start with the simplest endpoints and gradually move to more complex ones.

## Categorization

### Category 1: Simple Single-Record GET (Easiest - Start Here)
**Pattern**: Fetch one record by ID, simple query, minimal transformation
**Risk**: Low
**Estimated Time**: 5-10 minutes per endpoint

**Endpoints**:
1. ✅ `GET /api/system/agency-settings/:agencyId` (system.js:226)
   - Simple SELECT with WHERE clause
   - JSON parsing for modules field
   - Manual connection management
   - Console.error logging

2. `GET /api/webhooks/:id/deliveries` (webhooks.js:79)
   - Uses service, but simple pattern
   - Already uses service layer (good pattern)

### Category 2: Simple Multi-Record GET (Easy)
**Pattern**: Fetch multiple records, simple query, minimal transformation
**Risk**: Low-Medium
**Estimated Time**: 10-15 minutes per endpoint

**Endpoints**:
1. ✅ `GET /api/system/features` (system.js:633)
   - Simple SELECT with WHERE clause
   - Basic transformation
   - Manual connection management
   - Console.error logging
   - Special error handling for missing table

2. ✅ `GET /api/webhooks` (webhooks.js:50)
   - Direct query with manual connection
   - Simple SELECT with WHERE and ORDER BY
   - Manual pool management

3. `GET /api/currency/currencies` (currency.js:16)
   - Uses service layer (already good)
   - Just needs response standardization

### Category 3: Multi-Query GET (Medium)
**Pattern**: Multiple queries, joins, aggregations
**Risk**: Medium
**Estimated Time**: 15-30 minutes per endpoint

**Endpoints**:
1. ✅ `GET /api/system/plans` (system.js:542)
   - Two queries (plans + feature mappings)
   - Data transformation
   - Manual connection management
   - Console.error logging

2. `GET /api/system/metrics` (system.js:343)
   - Multiple queries
   - Complex aggregations
   - Data transformation

### Category 4: Complex GET (Hard - Do Later)
**Pattern**: Very complex queries, multiple transformations, business logic
**Risk**: High
**Estimated Time**: 30+ minutes per endpoint

**Endpoints**:
- `GET /api/system/support-tickets/stats` (system.js:1140)
- `GET /api/system/support-tickets` (system.js:1226)
- Other complex endpoints

## Refactoring Checklist (Per Endpoint)

### Step 1: Preparation
- [ ] Read and understand the endpoint
- [ ] Identify all database queries
- [ ] Identify all console.log/error/warn statements
- [ ] Identify response format
- [ ] Identify error handling patterns
- [ ] Check for validation needs

### Step 2: Imports
- [ ] Add `const { query, queryOne, queryMany } = require('../utils/dbQuery');`
- [ ] Add `const { success, error, notFound, databaseError, send } = require('../utils/responseHelper');`
- [ ] Add `const logger = require('../utils/logger');`
- [ ] Add validation middleware if needed: `const { validateUUID } = require('../middleware/commonMiddleware');`

### Step 3: Replace Database Queries
- [ ] Replace `pool.connect()` + `client.query()` → `query()` or `queryOne()`
- [ ] Remove manual `client.release()` calls
- [ ] Remove try/finally blocks for connection management
- [ ] Update query to use new helper

### Step 4: Replace Logging
- [ ] Replace `console.log()` → `logger.info()`
- [ ] Replace `console.error()` → `logger.error()`
- [ ] Replace `console.warn()` → `logger.warn()`
- [ ] Add context to log messages (requestId, userId, etc.)

### Step 5: Standardize Responses
- [ ] Replace manual `res.json({ success: true, data: ... })` → `send(res, success(...))`
- [ ] Replace manual error responses → `send(res, error(...))` or helper functions
- [ ] Add requestId to responses
- [ ] Ensure consistent response format

### Step 6: Add Validation
- [ ] Add `validateUUID()` middleware for UUID parameters
- [ ] Add `requireFields()` middleware for required body fields (if applicable)
- [ ] Remove manual validation if middleware handles it

### Step 7: Error Handling
- [ ] Replace try/catch with standardized error handling
- [ ] Use appropriate error helpers (`notFound`, `databaseError`, etc.)
- [ ] Ensure all errors are logged
- [ ] Remove duplicate error handling code

### Step 8: Testing
- [ ] Test success case
- [ ] Test error cases (not found, validation errors, database errors)
- [ ] Verify response format
- [ ] Check logs for proper logging
- [ ] Verify no connection leaks

## Implementation Order

### Batch 1: Category 1 (Simple Single-Record) - START HERE
**Priority**: HIGHEST
**Risk**: LOWEST
**Files**: system.js

1. **GET /api/system/agency-settings/:agencyId** (system.js:226)
   - Simple SELECT query
   - Single record fetch
   - JSON parsing logic
   - Perfect candidate to start

### Batch 2: Category 2 (Simple Multi-Record)
**Priority**: HIGH
**Risk**: LOW
**Files**: system.js, webhooks.js, currency.js

1. **GET /api/system/features** (system.js:633)
   - Simple SELECT with WHERE
   - Basic transformation
   - Special error handling for missing table

2. **GET /api/webhooks** (webhooks.js:50)
   - Direct query with manual connection
   - Simple SELECT with WHERE and ORDER BY

3. **GET /api/currency/currencies** (currency.js:16)
   - Already uses service (good)
   - Just needs response standardization

### Batch 3: Category 3 (Multi-Query)
**Priority**: MEDIUM
**Risk**: MEDIUM
**Files**: system.js

1. **GET /api/system/plans** (system.js:542)
   - Two queries (plans + mappings)
   - Data transformation
   - More complex but manageable

## Detailed Refactoring Steps for First Endpoint

### Endpoint: GET /api/system/agency-settings/:agencyId

#### Current Code Issues:
1. ❌ Manual connection management (`pool.connect()`, `client.release()`)
2. ❌ Manual error handling with try/catch/finally
3. ❌ Console.error instead of logger
4. ❌ Manual response formatting
5. ❌ Manual validation (can use middleware)
6. ❌ Inconsistent error response format

#### Refactored Code Structure:
```javascript
const { queryOne } = require('../utils/dbQuery');
const { success, notFound, databaseError, send, validationError } = require('../utils/responseHelper');
const { validateUUID } = require('../middleware/commonMiddleware');
const logger = require('../utils/logger');

router.get(
  '/agency-settings/:agencyId',
  authenticate,
  validateUUID('agencyId'), // Automatic UUID validation
  asyncHandler(async (req, res) => {
    const { agencyId } = req.params;

    try {
      // Use queryOne helper - automatic connection management
      const settings = await queryOne(
        `SELECT 
           id, agency_id, agency_name, logo_url, primary_focus,
           enable_gst, modules, industry, phone,
           address_street, address_city, address_state,
           address_zip, address_country, employee_count
         FROM public.agency_settings
         WHERE agency_id = $1
         LIMIT 1`,
        [agencyId]
      );

      if (!settings) {
        return send(res, notFound('Agency settings', agencyId));
      }

      // Parse modules if it's a string
      let modules = settings.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch {
          modules = null;
        }
      }

      return send(res, success(
        { settings: { ...settings, modules } },
        'Agency settings fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching agency settings', {
        agencyId,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch agency settings'));
    }
  })
);
```

#### Improvements:
1. ✅ No manual connection management
2. ✅ Automatic retry on transient errors
3. ✅ Proper logging with context
4. ✅ Standardized responses
5. ✅ UUID validation via middleware
6. ✅ Consistent error handling
7. ✅ Request ID tracking

## Success Criteria

### For Each Refactored Endpoint:
- [ ] No `console.log/error/warn` statements
- [ ] No manual `pool.connect()` or `client.release()`
- [ ] Uses `query()`, `queryOne()`, or `queryMany()` helpers
- [ ] Uses `success()` or `error()` response helpers
- [ ] Uses `send()` to send responses
- [ ] Proper logging with context
- [ ] Validation via middleware where applicable
- [ ] Consistent error handling
- [ ] Request ID in responses
- [ ] All tests pass

### Overall Metrics:
- [ ] 100% of simple GET endpoints refactored
- [ ] Zero console.log statements in refactored endpoints
- [ ] Zero manual connection management in refactored endpoints
- [ ] Consistent response format across all endpoints
- [ ] All endpoints tested and working

## Testing Strategy

### Unit Testing (Recommended):
- Test query helper functions
- Test response helpers
- Test middleware functions

### Integration Testing (Required):
- Test each refactored endpoint
- Test success scenarios
- Test error scenarios (not found, validation, database errors)
- Test response format
- Test logging output

### Manual Testing Checklist:
- [ ] Endpoint returns correct data
- [ ] Error handling works correctly
- [ ] Response format is consistent
- [ ] Logs are properly formatted
- [ ] No connection leaks
- [ ] Performance is acceptable

## Risk Mitigation

### Risks:
1. **Breaking Changes**: Refactoring might break existing functionality
2. **Performance Issues**: New helpers might be slower
3. **Missing Features**: Might miss some edge cases

### Mitigation:
1. **Incremental Changes**: Refactor one endpoint at a time
2. **Thorough Testing**: Test each endpoint before moving to next
3. **Rollback Plan**: Keep old code commented initially
4. **Monitoring**: Add logging to detect issues early
5. **Code Review**: Review each refactored endpoint

## Timeline

### Week 1: Category 1 & 2 (Simple Endpoints)
- Day 1-2: Refactor Category 1 endpoints (2-3 endpoints)
- Day 3-4: Refactor Category 2 endpoints (3-4 endpoints)
- Day 5: Testing and bug fixes

### Week 2: Category 3 (Multi-Query Endpoints)
- Day 1-3: Refactor Category 3 endpoints (2-3 endpoints)
- Day 4-5: Testing and optimization

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Start with Batch 1, Endpoint 1: `GET /api/system/agency-settings/:agencyId`
3. ⏭️ Test thoroughly
4. ⏭️ Move to next endpoint
5. ⏭️ Repeat until all simple GET endpoints are done

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start refactoring first endpoint

