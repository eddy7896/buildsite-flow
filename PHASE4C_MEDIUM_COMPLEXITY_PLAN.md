# Phase 4C: Medium Complexity PUT/DELETE Endpoints Plan

## Overview
This document provides a detailed plan for refactoring medium complexity PUT and DELETE endpoints in `system.js`. These endpoints involve transactions, dynamic query building, and complex business logic.

## Current Status

### ✅ Completed (Phase 1, 2, 3A, 3B, 4A, 4B)
**Total: 20 endpoints refactored**
- Phase 1: 5 GET endpoints
- Phase 2: 5 GET endpoints
- Phase 3A: 3 GET endpoints
- Phase 3B: 4 POST endpoints
- Phase 4A: 2 DELETE endpoints
- Phase 4B: 1 PUT endpoint

## Phase 4C Endpoints Analysis

### Endpoints to Refactor: 4

#### Endpoint 1: PUT /api/system/plans/:id (Line 778)
**Complexity**: Medium-High
**Pattern**: UPDATE plan + DELETE/INSERT feature mappings
**Queries**: 
- 1 UPDATE (plan)
- 1 DELETE (existing mappings) - conditional
- 1 INSERT (new mappings) - conditional

**Transaction**: **REQUIRED** (multiple related operations must be atomic)

**Current Issues**:
- Manual `pool.connect()` and `client.release()`
- `console.error` logging
- Manual JSON responses
- **No transaction** (should use transaction helper)
- Feature mappings not atomic with plan update

**Business Logic to Preserve**:
- COALESCE pattern for partial updates
- Delete existing mappings if features array provided
- Insert new mappings if features array has items
- ON CONFLICT handling for feature mappings

**Refactoring Steps**:
1. Add `validateUUID()` middleware
2. Ensure schema exists (using main pool)
3. **Use `transaction()` helper** for all operations:
   - UPDATE plan
   - DELETE existing mappings (if features provided)
   - INSERT new mappings (if features provided and has items)
4. Replace `console.error` with `logger.error`
5. Replace manual responses with `send(res, success(...))` and `send(res, notFound(...))`
6. Add request ID tracking

**Estimated Time**: 25 minutes

---

#### Endpoint 2: DELETE /api/system/features/:id (Line 1048)
**Complexity**: Medium
**Pattern**: Check usage, then DELETE or soft-delete
**Queries**: 
- 1 SELECT (count usage)
- 1 UPDATE (soft delete) OR 1 DELETE (hard delete) - conditional

**Transaction**: Not strictly required, but could use for atomicity

**Current Issues**:
- Manual `pool.connect()` and `client.release()`
- `console.error` logging
- Manual JSON responses
- No transaction (usage check and delete not atomic)

**Business Logic to Preserve**:
- Check if feature is used in any plan_feature_mappings
- If used: soft delete (UPDATE is_active = false)
- If not used: hard delete (DELETE)
- Return appropriate message based on action

**Refactoring Steps**:
1. Add `validateUUID()` middleware
2. Ensure schema exists (using main pool)
3. Use `queryOne()` to check usage count
4. Use `query()` for UPDATE or DELETE based on usage
5. Replace `console.error` with `logger.error`
6. Replace manual responses with standardized responses
7. Add request ID tracking
8. Consider using transaction for atomicity (optional but recommended)

**Estimated Time**: 20 minutes

---

#### Endpoint 3: PUT /api/system/tickets/:id (Line 1551)
**Complexity**: Medium
**Pattern**: Dynamic UPDATE query building
**Queries**: 
- 1 UPDATE (dynamically built based on provided fields)

**Transaction**: Not needed (single query)

**Current Issues**:
- Manual `pool.connect()` and `client.release()`
- `console.error` logging
- Manual JSON responses
- Complex dynamic query building (preserve but improve structure)
- Manual validation (could use middleware)

**Business Logic to Preserve**:
- Dynamic field updates (only update provided fields)
- Status validation (validStatuses array)
- Priority validation (validPriorities array)
- Auto-set resolved_at when status = 'resolved'
- Auto-clear resolved_at when status != 'resolved'
- Validate no fields to update

**Refactoring Steps**:
1. Add `validateUUID()` middleware
2. Ensure schema exists (using main pool)
3. Keep dynamic query building logic (improve structure)
4. Use `query()` helper for UPDATE
5. Replace `console.error` with `logger.error`
6. Replace manual responses with standardized responses
7. Add request ID tracking
8. Improve validation error messages

**Estimated Time**: 20 minutes

---

#### Endpoint 4: PUT /api/system/agencies/:id (Line 2013)
**Complexity**: Medium
**Pattern**: Dynamic UPDATE query building
**Queries**: 
- 1 UPDATE (dynamically built based on provided fields)

**Transaction**: Not needed (single query)

**Current Issues**:
- Manual `pool.connect()` and `client.release()`
- `console.error` logging
- Manual JSON responses
- Complex dynamic query building (preserve but improve structure)
- Manual validation

**Business Logic to Preserve**:
- Dynamic field updates (only update provided fields)
- Validate no fields to update
- Allowed fields: name, domain, subscription_plan, max_users, is_active

**Refactoring Steps**:
1. Add `validateUUID()` middleware
2. Use `query()` helper for UPDATE
3. Replace `console.error` with `logger.error`
4. Replace manual responses with standardized responses
5. Add request ID tracking
6. Keep dynamic query building logic (improve structure)

**Estimated Time**: 20 minutes

---

## Implementation Order

### Batch 1: Transaction-Based (Highest Priority)
1. **PUT /api/system/plans/:id** (25 min)
   - Most complex, needs transaction
   - Critical for data integrity

### Batch 2: Conditional Logic
2. **DELETE /api/system/features/:id** (20 min)
   - Usage check logic
   - Conditional delete/soft-delete

### Batch 3: Dynamic Query Building
3. **PUT /api/system/tickets/:id** (20 min)
   - Dynamic query building
   - Status/priority validation

4. **PUT /api/system/agencies/:id** (20 min)
   - Dynamic query building
   - Simpler than tickets

**Total Estimated Time**: 85 minutes (~1.5 hours)

---

## Detailed Implementation Guide

### For PUT /api/system/plans/:id

#### Step 1: Understand Current Logic
```javascript
// Current flow:
1. UPDATE plan with COALESCE (partial updates)
2. If features array provided:
   a. DELETE all existing mappings
   b. If features.length > 0:
      INSERT new mappings with ON CONFLICT
```

#### Step 2: Refactor with Transaction
```javascript
// New flow with transaction:
const queries = [
  {
    sql: `UPDATE subscription_plans SET ... WHERE id = $1 RETURNING *`,
    params: [...]
  }
];

if (updates.features) {
  queries.push({
    sql: `DELETE FROM plan_feature_mappings WHERE plan_id = $1`,
    params: [id]
  });
  
  if (updates.features.length > 0) {
    // Build INSERT query for mappings
    queries.push({
      sql: `INSERT INTO plan_feature_mappings ... ON CONFLICT ...`,
      params: [...]
    });
  }
}

const results = await transaction(queries);
const plan = results[0].rows[0];
```

#### Step 3: Error Handling
- Check if plan exists (rowCount === 0)
- Handle transaction rollback automatically
- Log errors with context

---

### For DELETE /api/system/features/:id

#### Step 1: Understand Current Logic
```javascript
// Current flow:
1. SELECT COUNT(*) from plan_feature_mappings WHERE feature_id = $1
2. If count > 0:
   UPDATE plan_features SET is_active = false WHERE id = $1
   Return "deactivated" message
3. Else:
   DELETE FROM plan_features WHERE id = $1
   Return "deleted" message
```

#### Step 2: Refactor
```javascript
// New flow:
const usageResult = await queryOne(
  'SELECT COUNT(*) as count FROM plan_feature_mappings WHERE feature_id = $1',
  [id]
);
const usageCount = parseInt(usageResult?.count || '0', 10);

if (usageCount > 0) {
  // Soft delete
  const updateResult = await query(
    'UPDATE plan_features SET is_active = false, updated_at = NOW() WHERE id = $1',
    [id]
  );
  if (updateResult.rowCount === 0) {
    return send(res, notFound('Feature', id));
  }
  return send(res, success(null, 'Feature deactivated (it is still used in plans)')));
} else {
  // Hard delete
  const deleteResult = await query(
    'DELETE FROM plan_features WHERE id = $1',
    [id]
  );
  if (deleteResult.rowCount === 0) {
    return send(res, notFound('Feature', id));
  }
  return send(res, success(null, 'Feature deleted successfully')));
}
```

---

### For PUT /api/system/tickets/:id

#### Step 1: Understand Current Logic
```javascript
// Current flow:
1. Validate status (if provided)
2. Validate priority (if provided)
3. Build dynamic UPDATE query:
   - Only include fields that are provided (undefined check)
   - Auto-set resolved_at based on status
4. Execute UPDATE
5. Check rowCount for 404
```

#### Step 2: Refactor
```javascript
// New flow:
// Validation (keep existing logic)
const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
const validPriorities = ['low', 'medium', 'high'];

if (status && !validStatuses.includes(status)) {
  return send(res, validationError(`status must be one of: ${validStatuses.join(', ')}`));
}

// Dynamic query building (preserve logic)
const updates = [];
const params = [];
let paramIndex = 1;

if (title !== undefined) {
  updates.push(`title = $${paramIndex}`);
  params.push(title);
  paramIndex++;
}
// ... more fields

if (status === 'resolved') {
  updates.push(`resolved_at = NOW()`);
} else if (status !== undefined && status !== 'resolved') {
  updates.push(`resolved_at = NULL`);
}

if (updates.length === 0) {
  return send(res, validationError('No fields to update'));
}

updates.push(`updated_at = NOW()`);
params.push(id);

const sql = `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
const result = await query(sql, params);
```

---

### For PUT /api/system/agencies/:id

#### Step 1: Understand Current Logic
```javascript
// Current flow:
1. Build dynamic UPDATE query:
   - Only include fields that are provided (undefined check)
   - Allowed fields: name, domain, subscription_plan, max_users, is_active
2. Execute UPDATE
3. Check rowCount for 404
```

#### Step 2: Refactor
```javascript
// New flow:
const updates = [];
const params = [];
let paramIndex = 1;

if (name !== undefined) {
  updates.push(`name = $${paramIndex}`);
  params.push(name);
  paramIndex++;
}
// ... more fields

if (updates.length === 0) {
  return send(res, validationError('No fields to update'));
}

params.push(id);
const sql = `UPDATE agencies SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
const result = await query(sql, params);
```

---

## Success Criteria

### For Each Refactored Endpoint:
- [ ] No `console.log/error/warn` statements
- [ ] No manual `pool.connect()` or `client.release()`
- [ ] Uses `query()`, `queryOne()`, or `transaction()` helpers
- [ ] Uses `success()`, `error()`, `notFound()`, `validationError()` response helpers
- [ ] Uses `send()` to send responses
- [ ] Proper logging with context
- [ ] Validation via middleware where applicable
- [ ] Consistent error handling
- [ ] Request ID in responses
- [ ] Appropriate status codes (200, 404, 400)
- [ ] **Transactions used where needed** (PUT /plans/:id)
- [ ] All tests pass
- [ ] Data integrity verified
- [ ] Business logic preserved

### Special Requirements:
- [ ] PUT /plans/:id: All operations in transaction
- [ ] DELETE /features/:id: Usage check logic preserved
- [ ] PUT /tickets/:id: Dynamic query building preserved
- [ ] PUT /agencies/:id: Dynamic query building preserved

---

## Risk Mitigation

### Risks:
1. **Transaction Errors**: Incorrect transaction usage might cause deadlocks
2. **Dynamic Queries**: SQL injection if not properly parameterized
3. **Business Logic**: Might accidentally remove important logic
4. **Data Integrity**: Non-atomic operations might cause inconsistencies

### Mitigation:
1. **Test Transactions**: Verify transaction rollback on errors
2. **Parameterized Queries**: Always use parameterized queries (already done)
3. **Preserve Logic**: Keep all business logic, just improve structure
4. **Code Review**: Review each refactored endpoint carefully
5. **Logging**: Add detailed logging for debugging
6. **Testing**: Test all scenarios (success, not found, validation errors)

---

## Testing Checklist

### For PUT /api/system/plans/:id:
- [ ] Update plan without features
- [ ] Update plan with empty features array
- [ ] Update plan with features array
- [ ] Update non-existent plan (404)
- [ ] Transaction rollback on error
- [ ] Verify feature mappings are updated atomically

### For DELETE /api/system/features/:id:
- [ ] Delete feature with no usage (hard delete)
- [ ] Delete feature with usage (soft delete)
- [ ] Delete non-existent feature (404)
- [ ] Verify usage count is correct

### For PUT /api/system/tickets/:id:
- [ ] Update single field
- [ ] Update multiple fields
- [ ] Update status to 'resolved' (check resolved_at)
- [ ] Update status from 'resolved' (check resolved_at cleared)
- [ ] Invalid status (400)
- [ ] Invalid priority (400)
- [ ] No fields to update (400)
- [ ] Update non-existent ticket (404)

### For PUT /api/system/agencies/:id:
- [ ] Update single field
- [ ] Update multiple fields
- [ ] No fields to update (400)
- [ ] Update non-existent agency (404)

---

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Start with Batch 1: PUT /api/system/plans/:id
3. ⏭️ Test thoroughly
4. ⏭️ Move to Batch 2: DELETE /api/system/features/:id
5. ⏭️ Move to Batch 3: PUT /api/system/tickets/:id
6. ⏭️ Move to Batch 3: PUT /api/system/agencies/:id
7. ⏭️ Complete testing and bug fixes

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start refactoring PUT /api/system/plans/:id with transaction support

