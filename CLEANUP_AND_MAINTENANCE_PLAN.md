# Cleanup and Maintenance Plan

## Overview
This document outlines the comprehensive cleanup and maintenance tasks needed to complete the refactoring effort and improve code quality across the codebase.

## Phase 5: Final Cleanup (system.js)

### 5A: Replace Console Statements with Logger
**Status**: In Progress
**Files**: `src/server/routes/system.js`
**Tasks**:
1. Replace 23 instances of `console.log/error/warn` with proper `logger` calls
2. Ensure appropriate log levels (info, warn, error, debug)
3. Add structured logging with context (requestId, agencyId, etc.)

**Instances to Replace**:
- Line 178: `console.error` in `determineTicketDepartment`
- Line 390: `console.error` in GET /api/system/metrics
- Line 426: `console.error` in GET /api/system/metrics
- Line 478: `console.warn` in GET /api/system/metrics
- Line 546-548: `console.error` (3 instances) in GET /api/system/metrics
- Line 1818, 1824: `console.log` (2 instances) in POST /api/system/agencies/:id/export-backup
- Line 1872: `console.error` in POST /api/system/agencies/:id/export-backup
- Line 1877, 1892: `console.log` (2 instances) in POST /api/system/agencies/:id/export-backup
- Line 1894: `console.error` in POST /api/system/agencies/:id/export-backup
- Line 2387, 2403, 2431: `console.warn` (3 instances) in GET /api/system/usage/realtime
- Line 2461: `console.error` in GET /api/system/usage/realtime
- Line 2496, 2509: `console.log/error` (2 instances) in POST /api/system/agencies/repair-database-names
- Line 2533: `console.error` in POST /api/system/agencies/repair-database-names
- Line 2789: `console.warn` in `ensureSystemSettingsSchema`
- Line 2805: `console.warn` in `ensureSystemSettingsSchema`
- Line 2917: `console.warn` in `verifySchemaExists`

### 5B: Refactor Remaining Endpoints to Use dbQuery Helpers
**Status**: Pending
**Files**: `src/server/routes/system.js`

#### 5B.1: GET /api/system/metrics
**Current Issues**:
- Uses manual `pool.connect()` and `client.release()`
- Uses `client.query()` directly
- Manual error handling
- Uses `console.error/warn` instead of logger

**Refactoring Steps**:
1. Replace `pool.connect()` with `queryMany()` and `queryOne()` from `dbQuery.js`
2. Replace manual error handling with `sendError()` from `responseHelper.js`
3. Replace `console.error/warn` with `logger.error/warn`
4. Use `sendSuccess()` for successful responses
5. Remove manual CORS handling (use middleware)

#### 5B.2: POST /api/system/agencies/:id/export-backup
**Current Issues**:
- Uses manual `pool.connect()` and `client.release()`
- Uses `client.query()` directly
- Uses `console.log/error` instead of logger
- Manual error handling

**Refactoring Steps**:
1. Replace `pool.connect()` with `queryOne()` from `dbQuery.js`
2. Replace `console.log/error` with `logger.info/error`
3. Use `sendError()` and `notFound()` from `responseHelper.js`
4. Add `validateUUID` middleware
5. Keep file download logic as-is (special case)

#### 5B.3: GET /api/system/usage/realtime
**Current Issues**:
- Uses manual `pool.connect()` and `client.release()`
- Uses `client.query()` directly
- Uses `console.warn/error` instead of logger
- Manual error handling

**Refactoring Steps**:
1. Replace `pool.connect()` with `queryMany()` and `queryOne()` from `dbQuery.js`
2. Replace `console.warn/error` with `logger.warn/error`
3. Use `sendSuccess()` and `sendError()` from `responseHelper.js`
4. Remove manual CORS handling (use middleware)

#### 5B.4: POST /api/system/agencies/repair-database-names
**Current Issues**:
- Uses manual `pool.connect()` and `client.release()`
- Uses `client.query()` directly
- Uses `console.log/error` instead of logger
- Manual error handling

**Refactoring Steps**:
1. Replace `pool.connect()` with `queryMany()` from `dbQuery.js`
2. Replace `console.log/error` with `logger.info/error`
3. Use `sendSuccess()` and `sendError()` from `responseHelper.js`

### 5C: Refactor Helper Functions
**Status**: Pending
**Files**: `src/server/routes/system.js`

#### Functions to Refactor:
1. **`determineTicketDepartment`** (Line ~150)
   - Replace `console.error` with `logger.error`
   - Add structured logging with context

2. **`ensureSupportTicketSchema`** (Line ~186)
   - Already uses client parameter (good)
   - No console statements (good)
   - Consider moving to separate utility file

3. **`ensureSystemSettingsSchema`** (Line ~2680)
   - Replace `console.warn` with `logger.warn`
   - Add structured logging

4. **`ensureSubscriptionSchema`** (Line ~2550)
   - Check for console statements
   - Consider moving to separate utility file

5. **`repairMissingColumn`** (Line ~2850)
   - Check for console statements
   - Replace with logger if found

6. **`verifySchemaExists`** (Line ~2901)
   - Replace `console.warn` with `logger.warn`
   - Add structured logging

## Phase 6: Other Route Files Cleanup

### 6A: Audit Other Route Files
**Status**: Pending
**Files**: All files in `src/server/routes/`

**Statistics**:
- **console.log/error/warn**: 173 instances across 14 files
- **Manual pool.connect()**: 111 instances across 13 files

**Priority Files** (by console statement count):
1. `system.js`: 23 instances (Phase 5)
2. `twoFactor.js`: 14 instances
3. `systemHealth.js`: 13 instances
4. `permissions.js`: 13 instances
5. `slack.js`: 12 instances
6. `files.js`: 11 instances
7. `agencies.js`: 10 instances
8. `database.js`: 60 instances (highest!)
9. Others: Various counts

### 6B: Refactoring Strategy for Other Files
**Approach**: Systematic refactoring by priority

1. **High Priority** (Most console statements):
   - `database.js` (60 instances)
   - `system.js` (23 instances - Phase 5)
   - `twoFactor.js` (14 instances)
   - `systemHealth.js` (13 instances)
   - `permissions.js` (13 instances)

2. **Medium Priority**:
   - `slack.js` (12 instances)
   - `files.js` (11 instances)
   - `agencies.js` (10 instances)

3. **Low Priority**:
   - Remaining files with fewer instances

### 6C: Standard Refactoring Pattern
For each file:
1. Replace `console.log/error/warn` with `logger.info/error/warn`
2. Replace manual `pool.connect()` with `dbQuery` helpers
3. Replace manual error handling with `responseHelper` functions
4. Add `validateUUID` middleware where appropriate
5. Add `requireFields` middleware for POST/PUT endpoints
6. Use `sendSuccess()`, `sendError()`, etc. for responses

## Phase 7: Route Organization and Structure

### 7A: Review Route Organization
**Status**: Pending

**Current Structure**:
- All routes in `src/server/routes/` directory
- Some routes are very large (e.g., `system.js` is 3213 lines)
- Some routes might benefit from splitting

### 7B: Potential Route Splits
**Consider splitting**:
1. `system.js` (3213 lines) - Already identified
   - Could split into:
     - `system/agencies.js`
     - `system/settings.js`
     - `system/tickets.js`
     - `system/plans.js`
     - `system/features.js`
     - `system/metrics.js`

2. `database.js` (if large)
3. `systemHealth.js` (828 lines - moderate)

### 7C: Route Grouping Strategy
**Option 1**: Keep current flat structure but improve organization
**Option 2**: Create subdirectories:
```
src/server/routes/
  system/
    agencies.js
    settings.js
    tickets.js
    plans.js
    features.js
    metrics.js
  health/
    systemHealth.js
    health.js
  ...
```

**Recommendation**: Start with Option 1 (improve current structure), then consider Option 2 if needed.

## Phase 8: Code Quality Improvements

### 8A: Remove Dead Code
- Check for unused functions
- Check for commented-out code
- Remove duplicate code

### 8B: Improve Error Messages
- Ensure all error messages are user-friendly
- Add error codes consistently
- Include helpful context in error details

### 8C: Add Missing Validations
- UUID validation on all ID parameters
- Required field validation on all POST/PUT endpoints
- Type validation where appropriate

### 8D: Improve Documentation
- Add JSDoc comments to all exported functions
- Document complex endpoints
- Add examples where helpful

## Implementation Order

1. **Phase 5A**: Replace console statements in system.js (Quick win)
2. **Phase 5B**: Refactor remaining endpoints in system.js
3. **Phase 5C**: Refactor helper functions in system.js
4. **Phase 6**: Clean up other route files (priority order)
5. **Phase 7**: Review and optimize route organization
6. **Phase 8**: Final code quality improvements

## Success Criteria

- ✅ Zero `console.log/error/warn` statements in route files
- ✅ All database queries use `dbQuery` helpers
- ✅ All API responses use `responseHelper` functions
- ✅ All endpoints have proper error handling
- ✅ All endpoints have appropriate middleware (validateUUID, requireFields)
- ✅ Consistent code style across all route files
- ✅ Improved maintainability and readability

## Notes

- Some endpoints (like file downloads) may need special handling
- Keep backward compatibility where possible
- Test each refactored endpoint thoroughly
- Consider performance implications of changes

