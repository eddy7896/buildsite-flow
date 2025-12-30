# Phase 6 Batch 2: Remaining High Priority Files Plan

## Overview
Continue refactoring high-priority route files to replace console statements and improve code quality.

## Files to Refactor

### Batch 2A: High Priority (Remaining)
1. **systemHealth.js** - 13 console instances
   - Health monitoring routes
   - May have manual pool connections
   - Needs logger integration
   - May need responseHelper integration

2. **permissions.js** - 13 console instances
   - Permission management routes
   - May have manual pool connections
   - Needs logger integration
   - May need responseHelper integration

### Batch 2B: Medium Priority
3. **slack.js** - 12 console instances
4. **files.js** - 11 console instances
5. **agencies.js** - 10 console instances

### Batch 2C: Low Priority
6. Remaining files with fewer instances

## Refactoring Steps for Each File

### Step 1: Add Required Imports
- Add `logger` from `../utils/logger`
- Add `dbQuery` helpers if manual pool connections exist
- Add `responseHelper` functions if needed
- Add middleware (`validateUUID`, `requireFields`) if needed

### Step 2: Replace Console Statements
- Replace `console.log` with `logger.info` or `logger.debug`
- Replace `console.error` with `logger.error`
- Replace `console.warn` with `logger.warn`
- Add structured logging with context (requestId, userId, etc.)

### Step 3: Replace Manual Pool Connections (if any)
- Replace `pool.connect()` with `queryOne()`, `queryMany()`, or `query()`
- Remove `client.release()` calls
- Use `transaction()` helper for multi-query operations

### Step 4: Standardize API Responses (if needed)
- Replace manual `res.json()` with `sendSuccess()`, `sendError()`, etc.
- Use consistent error codes
- Add proper status codes

### Step 5: Add Middleware (if needed)
- Add `validateUUID` for ID parameters
- Add `requireFields` for POST/PUT endpoints

## Implementation Order

1. **systemHealth.js** (13 instances)
   - Read file structure
   - Identify console statements
   - Replace with logger
   - Check for manual pool connections
   - Standardize responses if needed

2. **permissions.js** (13 instances)
   - Read file structure
   - Identify console statements
   - Replace with logger
   - Check for manual pool connections
   - Standardize responses if needed

3. **slack.js** (12 instances)
4. **files.js** (11 instances)
5. **agencies.js** (10 instances)

## Success Criteria

- ✅ Zero console statements in all refactored files
- ✅ All database queries use `dbQuery` helpers (where applicable)
- ✅ All API responses use `responseHelper` functions (where applicable)
- ✅ Consistent error handling
- ✅ Structured logging with context
- ✅ No linter errors

## Notes

- Some files may have special requirements (e.g., file uploads, streaming)
- Preserve existing functionality while improving code quality
- Test each refactored file to ensure no regressions
- Some console statements may be intentional for debugging - convert to appropriate log levels

