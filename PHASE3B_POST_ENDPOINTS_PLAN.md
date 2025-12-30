# Phase 3B: POST Endpoints Refactoring Plan

## Overview
This document provides a detailed plan for refactoring POST endpoints in `system.js`. POST endpoints are write operations that require careful handling of transactions, validation, and error handling.

## Current Status

### ✅ Completed (Phase 1, 2, 3A)
**Total: 13 GET endpoints refactored**
- Phase 1: 5 endpoints
- Phase 2: 5 endpoints
- Phase 3A: 3 endpoints

## POST Endpoints Analysis

### POST Endpoints in system.js: 6

#### Category 1: Simple POST (Start Here)
1. **POST /api/system/features** (line 934)
   - **Complexity**: Low
   - **Pattern**: Simple INSERT with validation
   - **Queries**: 1 INSERT query
   - **Transaction**: Not needed (single query)
   - **Issues**: 
     - Manual connection management
     - Console.error logging
     - Manual responses
     - Manual validation
   - **Estimated Time**: 15 minutes

#### Category 2: Medium Complexity POST
2. **POST /api/system/plans** (line 674)
   - **Complexity**: Medium
   - **Pattern**: INSERT + multiple feature mappings
   - **Queries**: 1 INSERT (plan) + N INSERTs (feature mappings)
   - **Transaction**: **REQUIRED** (multiple related inserts)
   - **Issues**:
     - Manual connection management
     - Console.error logging
     - Manual responses
     - Manual validation
     - **No transaction** (should use transaction helper)
   - **Estimated Time**: 25 minutes

3. **POST /api/system/tickets/public** (line 1284)
   - **Complexity**: Medium
   - **Pattern**: INSERT with validation, department assignment
   - **Queries**: 1 INSERT query
   - **Transaction**: Not needed (single query, but has department lookup)
   - **Issues**:
     - Manual connection management
     - Console.error logging
     - Manual responses
     - Manual validation
   - **Estimated Time**: 20 minutes

4. **POST /api/system/tickets** (line 1444)
   - **Complexity**: Medium
   - **Pattern**: INSERT with ticket number generation
   - **Queries**: 1 COUNT query + 1 INSERT query
   - **Transaction**: Not needed (count is just for number generation)
   - **Issues**:
     - Manual connection management
     - Console.error logging
     - Manual responses
     - Manual validation
   - **Estimated Time**: 20 minutes

#### Category 3: Complex POST (Do Later)
5. **POST /api/system/agencies/:id/export-backup** (line 1750)
   - Uses service layer, complex logic
   - Do later

6. **POST /api/system/agencies/repair-database-names** (line 2457)
   - Batch operation, complex logic
   - Do later

## Implementation Plan

### Batch 1: Simple POST Endpoints
**Priority**: HIGHEST
**Risk**: LOW-MEDIUM
**Estimated Time**: 1-1.5 hours

#### Endpoint 1: POST /api/system/features
**Steps**:
1. Add `requireFields()` middleware for validation
2. Replace `pool.connect()` with `query()` helper
3. Replace `console.error` with `logger.error`
4. Replace manual responses with `send(res, success(...))` and `send(res, validationError(...))`
5. Add request ID tracking
6. Use 201 status code for created resource

#### Endpoint 2: POST /api/system/plans
**Steps**:
1. Add `requireFields()` middleware for validation
2. **Use `transaction()` helper** for plan + feature mappings
3. Replace `console.error` with `logger.error`
4. Replace manual responses with standardized responses
5. Add request ID tracking
6. Use 201 status code for created resource
7. **Important**: Ensure all feature mappings are inserted in same transaction

#### Endpoint 3: POST /api/system/tickets/public
**Steps**:
1. Add `requireFields()` middleware for validation
2. Replace `pool.connect()` with `query()` helper
3. Replace `console.error` with `logger.error`
4. Replace manual responses with standardized responses
5. Add request ID tracking
6. Keep department assignment logic
7. Use 201 status code for created resource

#### Endpoint 4: POST /api/system/tickets
**Steps**:
1. Add `requireFields()` middleware for validation
2. Replace `pool.connect()` with `queryOne()` and `query()` helpers
3. Replace `console.error` with `logger.error`
4. Replace manual responses with standardized responses
5. Add request ID tracking
6. Keep ticket number generation logic
7. Use 201 status code for created resource

## Detailed Refactoring Steps

### For Each POST Endpoint:

#### Step 1: Analysis
- [ ] Read and understand the endpoint
- [ ] Identify all database queries (INSERT, UPDATE, SELECT for validation)
- [ ] Determine if transaction is needed
- [ ] Identify validation requirements
- [ ] Identify all console.log/error/warn statements
- [ ] Identify response format
- [ ] Check for business logic (number generation, defaults, etc.)

#### Step 2: Preparation
- [ ] Add validation middleware (`requireFields()`, `validateUUID()`, etc.)
- [ ] Plan query replacements
- [ ] Plan transaction usage (if needed)

#### Step 3: Refactoring
- [ ] Add validation middleware
- [ ] Replace database queries with helpers
- [ ] Use `transaction()` if multiple related queries
- [ ] Replace logging
- [ ] Standardize responses
- [ ] Improve error handling
- [ ] Add request ID tracking
- [ ] Preserve business logic
- [ ] Use 201 status code for created resources

#### Step 4: Testing
- [ ] Test success case
- [ ] Test validation errors
- [ ] Test database errors
- [ ] Test transaction rollback (if applicable)
- [ ] Verify response format
- [ ] Check logs
- [ ] Verify no connection leaks
- [ ] Verify data integrity

## Special Considerations for POST Endpoints

### 1. Transactions
**When to use transactions**:
- Multiple related INSERTs (e.g., plan + feature mappings)
- INSERT + UPDATE operations
- Any operation that must be atomic

**How to use**:
```javascript
const results = await transaction([
  { sql: 'INSERT INTO plans ... RETURNING *', params: [...] },
  { sql: 'INSERT INTO mappings ...', params: [...] },
], { userId: req.user.id });
```

### 2. Validation
**Use middleware**:
```javascript
router.post('/endpoint',
  authenticate,
  requireFields(['name', 'email']),
  validateUUID('id'), // if needed
  asyncHandler(async (req, res) => { ... })
);
```

### 3. Response Codes
- **201 Created**: For successful resource creation
- **400 Bad Request**: For validation errors
- **500 Internal Server Error**: For database errors

### 4. Business Logic
- **Preserve**: Number generation, defaults, calculations
- **Improve**: Structure, error handling, logging
- **Don't change**: Core business rules

## Implementation Order

### Day 1: Simple POST Endpoints
1. POST /api/system/features (15 min)
2. POST /api/system/tickets/public (20 min)
3. POST /api/system/tickets (20 min)

### Day 2: Transaction-Based POST
1. POST /api/system/plans (25 min)
2. Testing and bug fixes

## Success Criteria

### For Each Refactored POST Endpoint:
- [ ] No `console.log/error/warn` statements
- [ ] No manual `pool.connect()` or `client.release()`
- [ ] Uses `query()`, `queryOne()`, or `transaction()` helpers
- [ ] Uses `success()` or `error()` response helpers
- [ ] Uses `send()` to send responses
- [ ] Proper logging with context
- [ ] Validation via middleware
- [ ] Consistent error handling
- [ ] Request ID in responses
- [ ] 201 status code for created resources
- [ ] Transactions used where needed
- [ ] All tests pass
- [ ] Data integrity verified

### Overall Metrics:
- [ ] 100% of simple POST endpoints refactored
- [ ] Zero console.log statements in refactored endpoints
- [ ] Zero manual connection management in refactored endpoints
- [ ] Consistent response format across all endpoints
- [ ] All endpoints tested and working
- [ ] Transactions properly implemented

## Risk Mitigation

### Risks:
1. **Data Integrity**: Incorrect transaction usage might cause data inconsistency
2. **Validation Issues**: Missing validation might allow invalid data
3. **Business Logic**: Might accidentally remove important business logic
4. **Transaction Errors**: Incorrect transaction handling might cause deadlocks

### Mitigation:
1. **Thorough Testing**: Test each endpoint thoroughly, especially transactions
2. **Use Transactions**: Use transactions for multi-step operations
3. **Preserve Logic**: Keep all business logic, just improve structure
4. **Code Review**: Review each refactored endpoint carefully
5. **Monitoring**: Add logging to detect issues early
6. **Rollback Testing**: Test transaction rollback scenarios

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Start with Batch 1, Endpoint 1: POST /api/system/features
3. ⏭️ Test thoroughly
4. ⏭️ Move to next endpoint
5. ⏭️ Complete all simple POST endpoints
6. ⏭️ Move to PUT/PATCH endpoints
7. ⏭️ Move to DELETE endpoints

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start refactoring POST /api/system/features

