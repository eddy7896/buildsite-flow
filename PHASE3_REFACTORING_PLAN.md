# Phase 3: Remaining GET & POST Endpoints Refactoring Plan

## Overview
This document provides a detailed plan for refactoring the remaining GET endpoints and starting POST endpoints refactoring in `system.js`. We'll continue systematically, completing simple GET endpoints first, then moving to POST (write operations).

## Current Status

### ✅ Completed (Phase 1 & 2)
**Total: 10 GET endpoints refactored**
- Phase 1: 5 endpoints (agency-settings, plans, features, webhooks, currencies)
- Phase 2: 5 endpoints (tickets/:id, tickets, tickets/summary, settings, agencies/:id)

## Remaining Endpoints Analysis

### Remaining GET Endpoints in system.js: 5

#### Category 1: Simple GET (Easy - Do First)
1. **GET /api/system/maintenance-status** (line 3182)
   - **Complexity**: Low
   - **Pattern**: Single query, simple response
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 10 minutes

2. **GET /api/system/agencies/:id/users** (line 2124)
   - **Complexity**: Low-Medium
   - **Pattern**: Agency check + user query with error handling
   - **Issues**: Manual connection, console.warn/error, manual responses
   - **Estimated Time**: 15 minutes

#### Category 2: Medium Complexity GET
3. **GET /api/system/agencies/:id/usage** (line 2197)
   - **Complexity**: Medium
   - **Pattern**: Agency check + 5 parallel count queries (already uses Promise.all)
   - **Issues**: Manual connection, console.warn/error, manual responses, custom safeCountQuery function
   - **Estimated Time**: 20 minutes
   - **Note**: Already optimized with Promise.all, just needs helper migration

#### Category 3: Complex GET (Do Later)
4. **GET /api/system/usage/realtime** (line 2290)
   - **Complexity**: High
   - **Pattern**: Multiple queries with table existence checks, CORS handling
   - **Issues**: Manual connection, console.warn, complex logic
   - **Estimated Time**: 30-45 minutes
   - **Note**: Complex endpoint, refactor after simpler ones

5. **GET /api/system/metrics** (line 321)
   - **Complexity**: Very High
   - **Pattern**: Multiple queries, aggregations, CORS handling
   - **Issues**: Manual connection, console.error, very complex
   - **Estimated Time**: 45-60 minutes
   - **Note**: Most complex endpoint, do last

### POST Endpoints in system.js: 6

#### Category 1: Simple POST (Start Here)
1. **POST /api/system/features** (line 934)
   - **Complexity**: Low
   - **Pattern**: Simple INSERT with validation
   - **Issues**: Manual connection, console.error, manual responses, no transaction
   - **Estimated Time**: 15 minutes

2. **POST /api/system/plans** (line 674)
   - **Complexity**: Medium
   - **Pattern**: INSERT + multiple feature mappings (needs transaction)
   - **Issues**: Manual connection, console.error, manual responses, should use transaction
   - **Estimated Time**: 25 minutes

#### Category 2: Medium Complexity POST
3. **POST /api/system/tickets/public** (line 1284)
   - **Complexity**: Medium
   - **Pattern**: INSERT with validation, department assignment
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 20 minutes

4. **POST /api/system/tickets** (line 1444)
   - **Complexity**: Medium
   - **Pattern**: INSERT with ticket number generation, validation
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 20 minutes

#### Category 3: Complex POST (Do Later)
5. **POST /api/system/...** (line 1750, 2457)
   - Need to analyze these endpoints

## Implementation Plan

### Phase 3A: Complete Remaining Simple GET Endpoints
**Priority**: HIGH
**Risk**: LOW
**Estimated Time**: 30-40 minutes

#### Batch 1: Simple GET Endpoints
1. **GET /api/system/maintenance-status**
   - Replace `pool.connect()` with `queryOne()`
   - Replace `console.error` with `logger.error`
   - Replace manual responses with `send(res, success(...))`
   - Add request ID tracking
   - Keep "fail open" logic (important for maintenance mode)

2. **GET /api/system/agencies/:id/users**
   - Replace `pool.connect()` with `queryOne()` and `queryMany()`
   - Replace `console.warn/error` with `logger.warn/error`
   - Replace manual responses with `send(res, success(...))` and `send(res, notFound(...))`
   - Add `validateUUID()` middleware
   - Add request ID tracking
   - Keep error handling for missing tables (42P01)

3. **GET /api/system/agencies/:id/usage**
   - Replace `pool.connect()` with `queryOne()` and `queryMany()`
   - Replace custom `safeCountQuery` with `queryOne()` in Promise.allSettled
   - Replace `console.warn/error` with `logger.warn/error`
   - Replace manual responses with `send(res, success(...))` and `send(res, notFound(...))`
   - Add `validateUUID()` middleware
   - Add request ID tracking
   - Keep Promise.all pattern (already optimized)

### Phase 3B: Start POST Endpoints Refactoring
**Priority**: HIGH
**Risk**: MEDIUM (write operations need careful handling)
**Estimated Time**: 1-2 hours

#### Batch 2: Simple POST Endpoints
1. **POST /api/system/features**
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with `send(res, success(...))` and `send(res, validationError(...))`
   - Add `requireFields()` middleware
   - Add request ID tracking
   - Use transaction if needed (single INSERT, probably not needed)

2. **POST /api/system/plans**
   - Replace `pool.connect()` with `transaction()` helper (multiple inserts)
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add `requireFields()` middleware
   - Add request ID tracking
   - **Important**: Use transaction for plan + feature mappings

3. **POST /api/system/tickets/public**
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add `requireFields()` middleware
   - Add request ID tracking
   - Keep department assignment logic

4. **POST /api/system/tickets**
   - Replace `pool.connect()` with `query()` helper (2 queries: count + insert)
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add `requireFields()` middleware
   - Add request ID tracking
   - Keep ticket number generation logic

## Detailed Refactoring Steps

### For GET Endpoints:

#### Step 1: Analysis
- [ ] Read and understand the endpoint
- [ ] Identify all database queries
- [ ] Identify all console.log/error/warn statements
- [ ] Identify response format
- [ ] Identify error handling patterns
- [ ] Check for validation needs
- [ ] Note any special logic (fail open, default values, etc.)

#### Step 2: Refactoring
- [ ] Replace database queries with helpers
- [ ] Replace logging
- [ ] Standardize responses
- [ ] Add validation middleware
- [ ] Improve error handling
- [ ] Add request ID tracking
- [ ] Preserve special business logic

#### Step 3: Testing
- [ ] Test success case
- [ ] Test error cases
- [ ] Verify response format
- [ ] Check logs
- [ ] Verify no connection leaks

### For POST Endpoints:

#### Step 1: Analysis
- [ ] Read and understand the endpoint
- [ ] Identify all database queries (INSERT, UPDATE, etc.)
- [ ] Determine if transaction is needed
- [ ] Identify validation requirements
- [ ] Identify all console.log/error/warn statements
- [ ] Identify response format
- [ ] Check for business logic (number generation, etc.)

#### Step 2: Refactoring
- [ ] Add validation middleware (`requireFields()`, `validateUUID()`, etc.)
- [ ] Replace database queries with helpers
- [ ] Use `transaction()` if multiple related queries
- [ ] Replace logging
- [ ] Standardize responses
- [ ] Improve error handling
- [ ] Add request ID tracking
- [ ] Preserve business logic

#### Step 3: Testing
- [ ] Test success case
- [ ] Test validation errors
- [ ] Test database errors
- [ ] Test transaction rollback (if applicable)
- [ ] Verify response format
- [ ] Check logs
- [ ] Verify no connection leaks
- [ ] Verify data integrity

## Implementation Order

### Week 1: Phase 3A (Remaining GET Endpoints)
**Day 1**: Batch 1 (3 simple GET endpoints)
- GET /api/system/maintenance-status
- GET /api/system/agencies/:id/users
- GET /api/system/agencies/:id/usage

**Day 2**: Testing and bug fixes

### Week 2: Phase 3B (POST Endpoints)
**Day 1-2**: Batch 2 (4 POST endpoints)
- POST /api/system/features
- POST /api/system/plans
- POST /api/system/tickets/public
- POST /api/system/tickets

**Day 3-4**: Testing and bug fixes

## Success Criteria

### For Each Refactored Endpoint:
- [ ] No `console.log/error/warn` statements
- [ ] No manual `pool.connect()` or `client.release()`
- [ ] Uses `query()`, `queryOne()`, `queryMany()`, or `transaction()` helpers
- [ ] Uses `success()` or `error()` response helpers
- [ ] Uses `send()` to send responses
- [ ] Proper logging with context
- [ ] Validation via middleware where applicable
- [ ] Consistent error handling
- [ ] Request ID in responses
- [ ] All tests pass
- [ ] For POST: Transactions used where needed
- [ ] For POST: Proper validation

### Overall Metrics:
- [ ] 100% of simple GET endpoints refactored
- [ ] 100% of simple POST endpoints refactored
- [ ] Zero console.log statements in refactored endpoints
- [ ] Zero manual connection management in refactored endpoints
- [ ] Consistent response format across all endpoints
- [ ] All endpoints tested and working

## Risk Mitigation

### Risks:
1. **Breaking Changes**: Refactoring write operations might break functionality
2. **Transaction Issues**: Incorrect transaction usage might cause data inconsistency
3. **Validation Issues**: Missing validation might allow invalid data
4. **Business Logic**: Might accidentally remove important business logic

### Mitigation:
1. **Incremental Changes**: Refactor one endpoint at a time
2. **Thorough Testing**: Test each endpoint thoroughly, especially write operations
3. **Preserve Logic**: Keep all business logic, just improve structure
4. **Use Transactions**: Use transactions for multi-step operations
5. **Code Review**: Review each refactored endpoint carefully
6. **Monitoring**: Add logging to detect issues early

## Special Considerations

### For POST Endpoints:
1. **Transactions**: Use `transaction()` helper for multiple related queries
2. **Validation**: Use middleware for validation (don't skip)
3. **Error Handling**: Ensure proper rollback on errors
4. **Business Logic**: Preserve number generation, defaults, etc.
5. **Response Codes**: Use 201 for created resources

### For Maintenance Status Endpoint:
- **Fail Open**: Must return success even on error (important for maintenance mode)
- **No Authentication**: Public endpoint, don't add auth

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Start with Phase 3A, Batch 1: GET /api/system/maintenance-status
3. ⏭️ Test thoroughly
4. ⏭️ Move to next endpoint
5. ⏭️ Complete Phase 3A
6. ⏭️ Start Phase 3B (POST endpoints)

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start refactoring Phase 3A, Batch 1, Endpoint 1

