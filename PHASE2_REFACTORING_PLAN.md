# Phase 2: Comprehensive GET Endpoints Refactoring Plan

## Overview
This document provides a detailed plan for refactoring the remaining GET endpoints in `system.js` and other route files. We'll continue systematically, starting with simpler endpoints and moving to more complex ones.

## Current Status

### ✅ Completed (Phase 1)
- GET /api/system/agency-settings/:agencyId
- GET /api/system/plans
- GET /api/system/features
- GET /api/webhooks
- GET /api/currency/currencies

### 📋 Remaining GET Endpoints in system.js

**Total**: 10 remaining GET endpoints

#### Category 1: Simple Single-Record (Easy - Start Here)
1. **GET /api/system/tickets/:id** (line 1385)
   - Single record fetch by ID
   - Manual connection management
   - Console.error logging
   - Simple pattern

2. **GET /api/system/settings** (line 2902)
   - Single record fetch with default creation
   - Manual connection management
   - Console.error logging
   - Special logic for creating defaults

#### Category 2: Simple Multi-Record with Filters (Medium)
3. **GET /api/system/tickets** (line 1209)
   - Dynamic query building with filters
   - Manual connection management
   - Console.error logging
   - Pagination support

#### Category 3: Multi-Query Aggregations (Medium-Hard)
4. **GET /api/system/tickets/summary** (line 1123)
   - 4 queries with aggregations
   - Manual connection management
   - Console.error logging
   - Complex data transformation

5. **GET /api/system/agencies/:id** (line 1914)
   - Multiple queries for counts
   - Manual connection management
   - Console.warn logging
   - Error handling for missing tables

#### Category 4: Complex Endpoints (Hard - Do Later)
6. **GET /api/system/metrics** (line 321)
   - Very complex, multiple queries
   - Data transformations
   - CORS handling
   - Large endpoint

7. **GET /api/system/agencies/:id/users** (line 2124)
   - Need to analyze

8. **GET /api/system/agencies/:id/usage** (line 2197)
   - Need to analyze

9. **GET /api/system/usage/realtime** (line 2290)
   - Need to analyze

10. **GET /api/system/maintenance-status** (line 3182)
    - Need to analyze

## Implementation Plan

### Batch 1: Category 1 (Simple Single-Record) - START HERE
**Priority**: HIGHEST
**Risk**: LOWEST
**Estimated Time**: 15-20 minutes per endpoint

#### Endpoint 1: GET /api/system/tickets/:id
**Location**: system.js:1385
**Complexity**: Low
**Changes Needed**:
- Replace `pool.connect()` with `queryOne()`
- Replace `console.error` with `logger.error`
- Replace manual responses with `send(res, success(...))` and `send(res, notFound(...))`
- Add `validateUUID()` middleware
- Add request ID tracking
- Standardize error handling

#### Endpoint 2: GET /api/system/settings
**Location**: system.js:2902
**Complexity**: Low-Medium (has default creation logic)
**Changes Needed**:
- Replace `pool.connect()` with `queryOne()` and `query()` for insert
- Replace `console.error` with `logger.error`
- Replace manual responses with `send(res, success(...))`
- Add request ID tracking
- Standardize error handling
- Keep default creation logic but use helpers

### Batch 2: Category 2 (Simple Multi-Record with Filters)
**Priority**: HIGH
**Risk**: LOW-MEDIUM
**Estimated Time**: 20-30 minutes per endpoint

#### Endpoint 3: GET /api/system/tickets
**Location**: system.js:1209
**Complexity**: Medium (dynamic query building)
**Changes Needed**:
- Replace `pool.connect()` with `queryMany()`
- Replace `console.error` with `logger.error`
- Replace manual responses with `send(res, success(...))`
- Add request ID tracking
- Standardize error handling
- Keep dynamic query building logic (it's necessary)
- Consider extracting query builder to helper (future optimization)

### Batch 3: Category 3 (Multi-Query Aggregations)
**Priority**: MEDIUM
**Risk**: MEDIUM
**Estimated Time**: 30-45 minutes per endpoint

#### Endpoint 4: GET /api/system/tickets/summary
**Location**: system.js:1123
**Complexity**: Medium-Hard (4 queries)
**Changes Needed**:
- Replace `pool.connect()` with multiple `queryOne()` calls
- Replace `console.error` with `logger.error`
- Replace manual responses with `send(res, success(...))`
- Add request ID tracking
- Standardize error handling
- Consider using Promise.all for parallel queries (optimization)

#### Endpoint 5: GET /api/system/agencies/:id
**Location**: system.js:1914
**Complexity**: Medium-Hard (multiple queries with error handling)
**Changes Needed**:
- Replace `pool.connect()` with `queryOne()` and `queryMany()` for counts
- Replace `console.warn` with `logger.warn`
- Replace `console.error` with `logger.error`
- Replace manual responses with `send(res, success(...))` and `send(res, notFound(...))`
- Add `validateUUID()` middleware
- Add request ID tracking
- Standardize error handling
- Keep error handling for missing tables (42P01)

### Batch 4: Category 4 (Complex Endpoints) - DO LATER
**Priority**: LOW
**Risk**: HIGH
**Estimated Time**: 45+ minutes per endpoint

These will be refactored after simpler endpoints are complete.

## Detailed Refactoring Steps

### For Each Endpoint:

#### Step 1: Analysis
- [ ] Read and understand the endpoint
- [ ] Identify all database queries
- [ ] Identify all console.log/error/warn statements
- [ ] Identify response format
- [ ] Identify error handling patterns
- [ ] Check for validation needs
- [ ] Note any special logic (defaults, transformations, etc.)

#### Step 2: Preparation
- [ ] Ensure imports are at top of file
- [ ] Check if middleware is needed
- [ ] Plan query replacements

#### Step 3: Refactoring
- [ ] Replace database queries
- [ ] Replace logging
- [ ] Standardize responses
- [ ] Add validation middleware
- [ ] Improve error handling
- [ ] Add request ID tracking

#### Step 4: Testing
- [ ] Test success case
- [ ] Test error cases
- [ ] Verify response format
- [ ] Check logs
- [ ] Verify no connection leaks

## Implementation Order

### Week 1: Batch 1 & 2 (Simple Endpoints)
**Day 1-2**: Batch 1 (2 endpoints)
- GET /api/system/tickets/:id
- GET /api/system/settings

**Day 3-4**: Batch 2 (1 endpoint)
- GET /api/system/tickets

**Day 5**: Testing and bug fixes

### Week 2: Batch 3 (Multi-Query Endpoints)
**Day 1-2**: Batch 3 (2 endpoints)
- GET /api/system/tickets/summary
- GET /api/system/agencies/:id

**Day 3-5**: Testing and optimization

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

## Risk Mitigation

### Risks:
1. **Breaking Changes**: Refactoring might break existing functionality
2. **Performance Issues**: New helpers might be slower
3. **Missing Features**: Might miss some edge cases
4. **Complex Logic**: Some endpoints have complex business logic

### Mitigation:
1. **Incremental Changes**: Refactor one endpoint at a time
2. **Thorough Testing**: Test each endpoint before moving to next
3. **Keep Special Logic**: Preserve business logic, just improve structure
4. **Code Review**: Review each refactored endpoint
5. **Monitoring**: Add logging to detect issues early

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Start with Batch 1, Endpoint 1: GET /api/system/tickets/:id
3. ⏭️ Test thoroughly
4. ⏭️ Move to next endpoint
5. ⏭️ Repeat until all simple endpoints are done

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start refactoring Batch 1, Endpoint 1

