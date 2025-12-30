# Phase 6: Other Route Files Cleanup Plan

## Overview
Clean up and refactor other route files to match the standards established in `system.js`.

## Statistics
- **console.log/error/warn**: 173 instances across 14 files
- **Manual pool.connect()**: 111 instances across 13 files

## Priority Order (by console statement count)

### High Priority (Most console statements)
1. **database.js** - 60 console instances, 2 manual pool connections
2. **twoFactor.js** - 14 console instances
3. **systemHealth.js** - 13 console instances
4. **permissions.js** - 13 console instances

### Medium Priority
5. **slack.js** - 12 console instances
6. **files.js** - 11 console instances
6. **agencies.js** - 10 console instances

### Low Priority
- Remaining files with fewer instances

## Refactoring Strategy

### For Each File:
1. **Import Required Utilities**
   - Add `logger` from `../utils/logger`
   - Add `dbQuery` helpers (`query`, `queryOne`, `queryMany`, `transaction`) if needed
   - Add `responseHelper` functions (`sendSuccess`, `sendError`, `send`, etc.) if needed
   - Add middleware (`validateUUID`, `requireFields`) if needed

2. **Replace Console Statements**
   - Replace `console.log` with `logger.info`
   - Replace `console.error` with `logger.error`
   - Replace `console.warn` with `logger.warn`
   - Add structured logging with context (requestId, userId, etc.)

3. **Replace Manual Pool Connections**
   - Replace `pool.connect()` with `queryOne()`, `queryMany()`, or `query()` from `dbQuery.js`
   - Remove `client.release()` calls (handled automatically)
   - Use `transaction()` helper for multi-query operations

4. **Standardize API Responses**
   - Replace manual `res.json()` with `sendSuccess()`, `sendError()`, etc.
   - Use consistent error codes
   - Add proper status codes

5. **Add Middleware**
   - Add `validateUUID` for ID parameters
   - Add `requireFields` for POST/PUT endpoints
   - Use existing auth middleware appropriately

## Implementation Plan

### Batch 1: High Priority Files
1. **database.js** (60 instances)
   - Replace console statements with logger
   - Refactor manual pool connections
   - Standardize error responses
   - Note: This file has special query execution logic - be careful

2. **twoFactor.js** (14 instances)
   - Replace console statements with logger
   - Check for manual pool connections
   - Standardize responses

3. **systemHealth.js** (13 instances)
   - Replace console statements with logger
   - Check for manual pool connections
   - Standardize responses

4. **permissions.js** (13 instances)
   - Replace console statements with logger
   - Check for manual pool connections
   - Standardize responses

### Batch 2: Medium Priority Files
5. **slack.js** (12 instances)
6. **files.js** (11 instances)
7. **agencies.js** (10 instances)

### Batch 3: Low Priority Files
- Remaining files

## Special Considerations

### database.js
- Has special query execution logic
- Uses `executeQuery` service function
- May need careful refactoring to maintain functionality
- Some console.log statements may be for debugging - convert to logger.debug

### twoFactor.js
- Uses agency database connections
- Has helper functions that use client parameter
- May need special handling for agency context

### systemHealth.js
- Has caching logic
- Uses multiple health check functions
- May need to preserve performance optimizations

## Success Criteria

- ✅ Zero console statements in all route files
- ✅ All database queries use `dbQuery` helpers (where applicable)
- ✅ All API responses use `responseHelper` functions
- ✅ Consistent error handling across all files
- ✅ Proper middleware usage
- ✅ Structured logging with context

## Notes

- Some files may have special requirements (e.g., file downloads, streaming)
- Preserve existing functionality while improving code quality
- Test each refactored file to ensure no regressions
- Some console statements may be intentional for debugging - convert to appropriate log levels

