# Phase 4: PUT/PATCH/DELETE Endpoints Refactoring Plan

## Overview
This document provides a detailed plan for refactoring PUT, PATCH, and DELETE endpoints in `system.js`. These endpoints handle updates and deletions, requiring careful handling of transactions, validation, and business logic.

## Current Status

### ✅ Completed (Phase 1, 2, 3A, 3B)
**Total: 17 endpoints refactored**
- Phase 1: 5 GET endpoints
- Phase 2: 5 GET endpoints
- Phase 3A: 3 GET endpoints
- Phase 3B: 4 POST endpoints

## PUT/PATCH/DELETE Endpoints Analysis

### Endpoints in system.js: 9

#### Category 1: Simple DELETE (Start Here)
1. **DELETE /api/system/plans/:id** (line 883)
   - **Complexity**: Low
   - **Pattern**: Soft delete (UPDATE is_active = false)
   - **Queries**: 1 UPDATE query
   - **Transaction**: Not needed
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 10 minutes

2. **DELETE /api/system/tickets/:id** (line 1691)
   - **Complexity**: Low
   - **Pattern**: Hard delete
   - **Queries**: 1 DELETE query
   - **Transaction**: Not needed
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 10 minutes

#### Category 2: Simple PUT
3. **PUT /api/system/features/:id** (line 988)
   - **Complexity**: Low
   - **Pattern**: Simple UPDATE with COALESCE
   - **Queries**: 1 UPDATE query
   - **Transaction**: Not needed
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 15 minutes

#### Category 3: Medium Complexity PUT/DELETE
4. **PUT /api/system/plans/:id** (line 778)
   - **Complexity**: Medium-High
   - **Pattern**: UPDATE plan + DELETE/INSERT feature mappings
   - **Queries**: 1 UPDATE + 1 DELETE + 1 INSERT (if features provided)
   - **Transaction**: **REQUIRED** (multiple related operations)
   - **Issues**: Manual connection, console.error, manual responses, no transaction
   - **Estimated Time**: 25 minutes

5. **DELETE /api/system/features/:id** (line 1048)
   - **Complexity**: Medium
   - **Pattern**: Check usage, then DELETE or soft-delete
   - **Queries**: 1 SELECT (count) + 1 UPDATE or 1 DELETE
   - **Transaction**: Not needed (but could use for atomicity)
   - **Issues**: Manual connection, console.error, manual responses
   - **Estimated Time**: 20 minutes

6. **PUT /api/system/tickets/:id** (line 1551)
   - **Complexity**: Medium
   - **Pattern**: Dynamic UPDATE query building
   - **Queries**: 1 UPDATE query (dynamically built)
   - **Transaction**: Not needed
   - **Issues**: Manual connection, console.error, manual responses, complex query building
   - **Estimated Time**: 20 minutes

7. **PUT /api/system/agencies/:id** (line 2013)
   - **Complexity**: Medium
   - **Pattern**: Dynamic UPDATE query building
   - **Queries**: 1 UPDATE query (dynamically built)
   - **Transaction**: Not needed
   - **Issues**: Manual connection, console.error, manual responses, complex query building
   - **Estimated Time**: 20 minutes

#### Category 4: Complex PUT/DELETE (Do Later)
8. **DELETE /api/system/agencies/:id** (line 1870)
   - **Complexity**: High
   - **Pattern**: Uses service function `deleteAgency()`
   - **Queries**: Handled by service
   - **Transaction**: Handled by service
   - **Issues**: Uses service layer, complex logic
   - **Estimated Time**: 30 minutes
   - **Note**: May need to refactor service function separately

9. **PUT /api/system/settings** (line 2946)
   - **Complexity**: Very High
   - **Pattern**: Dynamic UPDATE with many allowed fields, user check
   - **Queries**: 1 SELECT (user check) + 1 UPDATE
   - **Transaction**: Not needed (but could use for atomicity)
   - **Issues**: Manual connection, console.error, manual responses, very complex
   - **Estimated Time**: 30-40 minutes
   - **Note**: Most complex endpoint, do last

## Implementation Plan

### Phase 4A: Simple DELETE Endpoints
**Priority**: HIGHEST
**Risk**: LOW
**Estimated Time**: 20-30 minutes

#### Batch 1: Simple DELETE
1. **DELETE /api/system/plans/:id**
   - Add `validateUUID()` middleware
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with `send(res, success(...))` and `send(res, notFound(...))`
   - Add request ID tracking
   - Use 200 status code (soft delete)

2. **DELETE /api/system/tickets/:id**
   - Add `validateUUID()` middleware
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - Use 200 status code

### Phase 4B: Simple PUT Endpoints
**Priority**: HIGH
**Risk**: LOW-MEDIUM
**Estimated Time**: 30-45 minutes

#### Batch 2: Simple PUT
3. **PUT /api/system/features/:id**
   - Add `validateUUID()` middleware
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - Keep COALESCE pattern for partial updates

### Phase 4C: Medium Complexity PUT/DELETE
**Priority**: HIGH
**Risk**: MEDIUM
**Estimated Time**: 1.5-2 hours

#### Batch 3: Medium Complexity
4. **PUT /api/system/plans/:id**
   - Add `validateUUID()` middleware
   - **Use `transaction()` helper** for plan update + feature mappings
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - **Important**: Ensure all operations in transaction

5. **DELETE /api/system/features/:id**
   - Add `validateUUID()` middleware
   - Replace `pool.connect()` with `queryOne()` and `query()` helpers
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - Keep business logic (check usage, then delete/deactivate)

6. **PUT /api/system/tickets/:id**
   - Add `validateUUID()` middleware
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - Keep dynamic query building logic
   - Improve validation with middleware

7. **PUT /api/system/agencies/:id**
   - Add `validateUUID()` middleware
   - Replace `pool.connect()` with `query()` helper
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - Keep dynamic query building logic

### Phase 4D: Complex PUT/DELETE (Do Later)
**Priority**: MEDIUM
**Risk**: HIGH
**Estimated Time**: 1-2 hours

#### Batch 4: Complex Endpoints
8. **DELETE /api/system/agencies/:id**
   - Analyze service function first
   - May need separate refactoring of service
   - Add `validateUUID()` middleware
   - Replace `console.log/error` with `logger`
   - Replace manual responses with standardized responses

9. **PUT /api/system/settings**
   - Add validation middleware
   - Replace `pool.connect()` with `queryOne()` and `query()` helpers
   - Replace `console.error` with `logger.error`
   - Replace manual responses with standardized responses
   - Add request ID tracking
   - Keep complex field validation logic
   - Consider extracting field list to constant

## Detailed Refactoring Steps

### For Each PUT/PATCH/DELETE Endpoint:

#### Step 1: Analysis
- [ ] Read and understand the endpoint
- [ ] Identify all database queries (UPDATE, DELETE, SELECT for validation)
- [ ] Determine if transaction is needed
- [ ] Identify validation requirements
- [ ] Identify all console.log/error/warn statements
- [ ] Identify response format
- [ ] Check for business logic (soft delete, usage checks, etc.)

#### Step 2: Preparation
- [ ] Add validation middleware (`validateUUID()`, etc.)
- [ ] Plan query replacements
- [ ] Plan transaction usage (if needed)
- [ ] Plan response standardization

#### Step 3: Refactoring
- [ ] Add validation middleware
- [ ] Replace database queries with helpers
- [ ] Use `transaction()` if multiple related queries
- [ ] Replace logging
- [ ] Standardize responses
- [ ] Improve error handling
- [ ] Add request ID tracking
- [ ] Preserve business logic
- [ ] Use appropriate status codes (200 for updates/deletes, 404 for not found)

#### Step 4: Testing
- [ ] Test success case
- [ ] Test validation errors
- [ ] Test not found (404)
- [ ] Test database errors
- [ ] Test transaction rollback (if applicable)
- [ ] Verify response format
- [ ] Check logs
- [ ] Verify no connection leaks
- [ ] Verify data integrity

## Special Considerations for PUT/PATCH/DELETE Endpoints

### 1. Transactions
**When to use transactions**:
- Multiple related UPDATEs/DELETEs (e.g., plan + feature mappings)
- UPDATE + DELETE operations
- Any operation that must be atomic

**How to use**:
```javascript
const results = await transaction([
  { sql: 'UPDATE plans ... RETURNING *', params: [...] },
  { sql: 'DELETE FROM mappings ...', params: [...] },
  { sql: 'INSERT INTO mappings ...', params: [...] },
], { userId: req.user.id });
```

### 2. Validation
**Use middleware**:
```javascript
router.put('/endpoint/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req, res) => { ... })
);
```

### 3. Response Codes
- **200 OK**: For successful updates/deletes
- **404 Not Found**: For resources that don't exist
- **400 Bad Request**: For validation errors
- **500 Internal Server Error**: For database errors

### 4. Business Logic
- **Preserve**: Soft delete logic, usage checks, dynamic query building
- **Improve**: Structure, error handling, logging
- **Don't change**: Core business rules

### 5. Dynamic Query Building
**Pattern to preserve**:
```javascript
const updates = [];
const params = [];
let paramIndex = 1;

if (field1 !== undefined) {
  updates.push(`field1 = $${paramIndex}`);
  params.push(field1);
  paramIndex++;
}
// ... more fields

if (updates.length === 0) {
  return send(res, validationError('No fields to update'));
}

const sql = `UPDATE table SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
params.push(id);
const result = await query(sql, params);
```

## Implementation Order

### Day 1: Phase 4A & 4B (Simple Endpoints)
1. DELETE /api/system/plans/:id (10 min)
2. DELETE /api/system/tickets/:id (10 min)
3. PUT /api/system/features/:id (15 min)
4. Testing and bug fixes (15 min)

### Day 2: Phase 4C (Medium Complexity)
1. PUT /api/system/plans/:id (25 min)
2. DELETE /api/system/features/:id (20 min)
3. PUT /api/system/tickets/:id (20 min)
4. PUT /api/system/agencies/:id (20 min)
5. Testing and bug fixes (30 min)

### Day 3: Phase 4D (Complex Endpoints - Optional)
1. DELETE /api/system/agencies/:id (30 min)
2. PUT /api/system/settings (40 min)
3. Testing and bug fixes (30 min)

## Success Criteria

### For Each Refactored Endpoint:
- [ ] No `console.log/error/warn` statements
- [ ] No manual `pool.connect()` or `client.release()`
- [ ] Uses `query()`, `queryOne()`, or `transaction()` helpers
- [ ] Uses `success()` or `error()` response helpers
- [ ] Uses `send()` to send responses
- [ ] Proper logging with context
- [ ] Validation via middleware where applicable
- [ ] Consistent error handling
- [ ] Request ID in responses
- [ ] Appropriate status codes (200, 404, etc.)
- [ ] Transactions used where needed
- [ ] All tests pass
- [ ] Data integrity verified
- [ ] Business logic preserved

### Overall Metrics:
- [ ] 100% of simple PUT/DELETE endpoints refactored
- [ ] 100% of medium complexity PUT/DELETE endpoints refactored
- [ ] Zero console.log statements in refactored endpoints
- [ ] Zero manual connection management in refactored endpoints
- [ ] Consistent response format across all endpoints
- [ ] All endpoints tested and working
- [ ] Transactions properly implemented

## Risk Mitigation

### Risks:
1. **Data Integrity**: Incorrect transaction usage might cause data inconsistency
2. **Business Logic**: Might accidentally remove important business logic
3. **Dynamic Queries**: Complex query building might break
4. **Soft Deletes**: Might accidentally change soft delete behavior

### Mitigation:
1. **Thorough Testing**: Test each endpoint thoroughly, especially transactions
2. **Use Transactions**: Use transactions for multi-step operations
3. **Preserve Logic**: Keep all business logic, just improve structure
4. **Code Review**: Review each refactored endpoint carefully
5. **Monitoring**: Add logging to detect issues early
6. **Rollback Testing**: Test transaction rollback scenarios

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Start with Phase 4A, Batch 1: DELETE /api/system/plans/:id
3. ⏭️ Test thoroughly
4. ⏭️ Move to next endpoint
5. ⏭️ Complete all simple endpoints
6. ⏭️ Move to medium complexity endpoints
7. ⏭️ Move to complex endpoints (optional)

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start refactoring DELETE /api/system/plans/:id

