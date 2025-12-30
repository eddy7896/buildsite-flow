# Phase 6: Remaining Console Statements Cleanup Plan

## Overview
Clean up remaining console statements in route files, prioritizing by count.

## Remaining Files with Console Statements

### High Priority (Most instances)
1. **slack.js** - 12 console instances
2. **files.js** - 11 console instances
3. **agencies.js** - 10 console instances

### Medium Priority
4. **reports.js** - 2 console instances
5. **messaging.js** - 2 console instances
6. **pageCatalog.js** - 4 console instances
7. **graphql.js** - 1 console instance
8. **auth.js** - 3 console instances

### Low Priority
9. **schema.js** - 5 console instances
10. **webhooks.js** - Already refactored (0 instances)

## Refactoring Strategy

### For Each File:
1. **Add Logger Import**
   - Add `const logger = require('../utils/logger');`

2. **Replace Console Statements**
   - Replace `console.log` with `logger.info` or `logger.debug`
   - Replace `console.error` with `logger.error`
   - Replace `console.warn` with `logger.warn`
   - Add structured logging with context (requestId, userId, etc.)

3. **Check for Manual Pool Connections** (if any)
   - Replace with dbQuery helpers if found
   - Use responseHelper for standardized responses

## Implementation Order

### Batch 1: High Priority
1. **slack.js** (12 instances)
   - Read file structure
   - Replace all console statements
   - Check for manual pool connections

2. **files.js** (11 instances)
   - Read file structure
   - Replace all console statements
   - Check for manual pool connections

3. **agencies.js** (10 instances)
   - Read file structure
   - Replace all console statements
   - Check for manual pool connections

### Batch 2: Medium Priority
4. **pageCatalog.js** (4 instances)
5. **schema.js** (5 instances)
6. **auth.js** (3 instances)
7. **reports.js** (2 instances)
8. **messaging.js** (2 instances)
9. **graphql.js** (1 instance)

## Success Criteria

- ✅ Zero console statements in all route files
- ✅ All logging uses structured logger with context
- ✅ Consistent logging patterns across all files
- ✅ No linter errors

## Notes

- Some console statements may be for debugging - convert to appropriate log levels (debug/info)
- Preserve existing functionality
- Add appropriate context to all log statements
- Test each file after refactoring

