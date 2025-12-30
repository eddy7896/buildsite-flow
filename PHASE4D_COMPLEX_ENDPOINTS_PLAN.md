# Phase 4D: Complex Endpoints Refactoring Plan

## Overview
This document provides a detailed plan for refactoring the remaining complex PUT/DELETE endpoints in `system.js`. These endpoints involve service layer functions, complex business logic, and many fields.

## Current Status

### ✅ Completed (Phase 1, 2, 3A, 3B, 4A, 4B, 4C)
**Total: 24 endpoints refactored**
- Phase 1: 5 GET endpoints
- Phase 2: 5 GET endpoints
- Phase 3A: 3 GET endpoints
- Phase 3B: 4 POST endpoints
- Phase 4A: 2 DELETE endpoints
- Phase 4B: 1 PUT endpoint
- Phase 4C: 4 PUT/DELETE endpoints

## Phase 4D Endpoints Analysis

### Endpoints to Refactor: 2

#### Endpoint 1: DELETE /api/system/agencies/:id (Line 1870)
**Complexity**: High
**Pattern**: Uses service layer functions
**Dependencies**:
- `deleteAgency(id)` - Service function
- `checkAgencyDeletionSafety(id)` - Service function

**Current Issues**:
- Uses `console.log` and `console.error`
- Manual JSON responses
- Service functions may need refactoring separately
- No request ID tracking

**Business Logic**:
- Check deletion safety (warnings)
- Delete agency using service function
- Return warnings and deletion result

**Refactoring Strategy**:
1. **Step 1**: Analyze service functions (may need separate refactoring)
2. **Step 2**: Add `validateUUID()` middleware
3. **Step 3**: Replace `console.log/error` with `logger`
4. **Step 4**: Replace manual responses with standardized responses
5. **Step 5**: Add request ID tracking
6. **Step 6**: Improve error handling

**Estimated Time**: 30-40 minutes

**Note**: If service functions use manual connections, they may need separate refactoring. For now, focus on the route handler.

---

#### Endpoint 2: PUT /api/system/settings (Line 2946)
**Complexity**: Very High
**Pattern**: Dynamic UPDATE with many allowed fields, user check
**Queries**: 
- 1 SELECT (user check) - conditional
- 1 UPDATE (dynamically built with many fields)

**Current Issues**:
- Manual `pool.connect()` and `client.release()`
- `console.error` logging
- Manual JSON responses
- Very complex field validation (60+ allowed fields)
- User existence check before setting updated_by
- No request ID tracking

**Business Logic to Preserve**:
- Large list of allowed fields (60+ fields)
- Dynamic field updates (only update provided fields)
- User existence check before setting updated_by
- Validate no valid fields to update
- Handle missing users table gracefully

**Refactoring Steps**:
1. **Step 1**: Extract allowed fields list to constant (improve maintainability)
2. **Step 2**: Add validation middleware (if needed)
3. **Step 3**: Ensure schema exists (using main pool)
4. **Step 4**: Use `queryOne()` for user check
5. **Step 5**: Build dynamic UPDATE query
6. **Step 6**: Use `query()` helper for UPDATE
7. **Step 7**: Replace `console.error` with `logger.error`
8. **Step 8**: Replace manual responses with standardized responses
9. **Step 9**: Add request ID tracking
10. **Step 10**: Improve error handling

**Estimated Time**: 40-50 minutes

**Special Considerations**:
- Many fields (60+) - extract to constant
- User check is conditional (only if userId provided)
- Must handle missing users table gracefully
- updated_by is optional (only set if user exists in main DB)

---

## Implementation Order

### Step 1: DELETE /api/system/agencies/:id
**Priority**: HIGH
**Risk**: MEDIUM (uses service layer)
**Estimated Time**: 30-40 minutes

**Implementation Steps**:
1. Read and understand the endpoint
2. Check service functions (may need analysis)
3. Add `validateUUID()` middleware
4. Replace logging
5. Standardize responses
6. Add request ID tracking
7. Test thoroughly

### Step 2: PUT /api/system/settings
**Priority**: HIGH
**Risk**: MEDIUM (very complex)
**Estimated Time**: 40-50 minutes

**Implementation Steps**:
1. Read and understand the endpoint
2. Extract allowed fields to constant
3. Add validation (if needed)
4. Refactor user check
5. Refactor dynamic query building
6. Replace logging
7. Standardize responses
8. Add request ID tracking
9. Test thoroughly

**Total Estimated Time**: 70-90 minutes (~1.5 hours)

---

## Detailed Implementation Guide

### For DELETE /api/system/agencies/:id

#### Current Code Analysis:
```javascript
// Current flow:
1. Check deletion safety (optional warnings)
2. Delete agency using service function
3. Return result with warnings
```

#### Refactoring:
```javascript
router.delete(
  '/agencies/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Check deletion safety (optional - for warnings)
      const safetyCheck = await checkAgencyDeletionSafety(id);

      // Delete the agency
      logger.info('Deleting agency', { agencyId: id, requestId: req.requestId });
      const result = await deleteAgency(id);

      return send(res, success(
        {
          agencyId: id,
          agencyName: result.agencyName,
          databaseName: result.databaseName,
          warnings: safetyCheck.warnings || [],
        },
        result.message,
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error deleting agency', {
        agencyId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Delete agency'));
    }
  })
);
```

**Note**: Service functions (`deleteAgency`, `checkAgencyDeletionSafety`) may need separate refactoring if they use manual connections. For now, focus on the route handler.

---

### For PUT /api/system/settings

#### Step 1: Extract Allowed Fields Constant
```javascript
// At top of file or in constants section
const ALLOWED_SETTINGS_FIELDS = [
  // Identity & Branding
  'system_name', 'system_tagline', 'system_description',
  'logo_url', 'favicon_url', 'login_logo_url', 'email_logo_url',
  // SEO
  'meta_title', 'meta_description', 'meta_keywords',
  'og_image_url', 'og_title', 'og_description',
  'twitter_card_type', 'twitter_site', 'twitter_creator',
  // ... (all other fields)
];
```

#### Step 2: Refactor Endpoint
```javascript
router.put(
  '/settings',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const updates = req.body || {};
    const userId = req.user?.id || null;

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSystemSettingsSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Build dynamic update query
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      for (const field of ALLOWED_SETTINGS_FIELDS) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          params.push(updates[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return send(res, validationError(
          'No valid fields to update',
          { providedFields: Object.keys(updates), allowedFields: ALLOWED_SETTINGS_FIELDS }
        ));
      }

      // Check if user exists in main DB before setting updated_by
      if (userId) {
        try {
          const userCheck = await queryOne(
            'SELECT id FROM public.users WHERE id = $1 LIMIT 1',
            [userId]
          );
          if (userCheck) {
            // User exists in main DB, safe to set updated_by
            updateFields.push(`updated_by = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
          }
          // If user doesn't exist in main DB, skip setting updated_by (expected behavior)
        } catch (err) {
          // If users table doesn't exist or query fails, skip setting updated_by
          logger.warn('Could not check user existence for updated_by', {
            userId,
            error: err.message,
            requestId: req.requestId,
          });
        }
      }

      const sql = `
        UPDATE public.system_settings
        SET ${updateFields.join(', ')}
        WHERE id = (SELECT id FROM public.system_settings ORDER BY created_at DESC LIMIT 1)
        RETURNING *
      `;

      const result = await query(sql, params);

      if (result.rowCount === 0) {
        // No settings exist, create new one
        const insertResult = await query(
          `INSERT INTO public.system_settings (${updateFields.map((f, i) => f.split(' = ')[0]).join(', ')}, created_at)
           VALUES (${params.map((_, i) => `$${i + 1}`).join(', ')}, NOW())
           RETURNING *`,
          params
        );
        return send(res, success(
          { settings: insertResult.rows[0] },
          'Settings created successfully',
          { requestId: req.requestId }
        ));
      }

      return send(res, success(
        { settings: result.rows[0] },
        'Settings updated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error updating system settings', {
        userId,
        updatedFields: Object.keys(updates),
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Update system settings'));
    }
  })
);
```

**Note**: The current implementation updates the most recent settings record. This logic should be preserved.

---

## Success Criteria

### For DELETE /api/system/agencies/:id:
- [ ] No `console.log/error` statements
- [ ] Uses standardized response helpers
- [ ] Proper logging with context
- [ ] Request ID tracking
- [ ] Service functions work correctly
- [ ] Warnings are returned properly

### For PUT /api/system/settings:
- [ ] No `console.log/error` statements
- [ ] No manual `pool.connect()` or `client.release()`
- [ ] Uses `query()` and `queryOne()` helpers
- [ ] Uses standardized response helpers
- [ ] Proper logging with context
- [ ] Request ID tracking
- [ ] Allowed fields extracted to constant
- [ ] User check logic preserved
- [ ] Dynamic query building preserved
- [ ] Handles missing users table gracefully

---

## Risk Mitigation

### Risks:
1. **Service Functions**: May use manual connections (need separate refactoring)
2. **Complex Logic**: Many fields and conditions might break
3. **User Check**: Missing users table might cause errors
4. **Settings Creation**: Logic for creating settings if none exist

### Mitigation:
1. **Service Analysis**: Check service functions first
2. **Preserve Logic**: Keep all business logic, just improve structure
3. **Error Handling**: Handle missing tables gracefully
4. **Testing**: Test all scenarios thoroughly
5. **Code Review**: Review carefully before committing

---

## Testing Checklist

### For DELETE /api/system/agencies/:id:
- [ ] Delete existing agency (success)
- [ ] Delete non-existent agency (error handling)
- [ ] Verify warnings are returned
- [ ] Verify service functions are called correctly
- [ ] Check logs for proper context

### For PUT /api/system/settings:
- [ ] Update single field
- [ ] Update multiple fields
- [ ] Update with user that exists in main DB
- [ ] Update with user that doesn't exist in main DB
- [ ] Update when no settings exist (should create)
- [ ] Update with invalid fields (should ignore)
- [ ] Update with no valid fields (400 error)
- [ ] Verify updated_by is set correctly
- [ ] Verify updated_by is not set if user doesn't exist
- [ ] Check logs for proper context

---

## Next Steps

1. ✅ Create detailed plan (THIS DOCUMENT)
2. ⏭️ Step 1: Analyze DELETE /api/system/agencies/:id
3. ⏭️ Step 2: Refactor DELETE /api/system/agencies/:id
4. ⏭️ Step 3: Test DELETE endpoint
5. ⏭️ Step 4: Analyze PUT /api/system/settings
6. ⏭️ Step 5: Extract allowed fields constant
7. ⏭️ Step 6: Refactor PUT /api/system/settings
8. ⏭️ Step 7: Test PUT endpoint
9. ⏭️ Step 8: Final review and bug fixes

---

**Status**: Plan Complete ✅ | Ready for Implementation 🚀
**Next Action**: Start with Step 1 - Analyze DELETE /api/system/agencies/:id

