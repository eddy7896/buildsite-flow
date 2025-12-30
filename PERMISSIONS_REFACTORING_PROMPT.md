# Prompt for Refactoring permissions.js Manual Pool Connections

## Context

I'm working on a large-scale refactoring of an ERP system codebase. We've successfully completed replacing all console statements with structured logger calls across all route files. Now I need to refactor the `permissions.js` file to replace 26 manual pool connections with centralized `dbQuery` helpers.

## Current State

**File**: `src/server/routes/permissions.js`
- **Size**: ~1099 lines
- **Console statements**: ✅ Already replaced (13 instances)
- **Manual pool connections**: ❌ 26 instances remaining (13 `pool.connect()` + 13 `client.release()`)
- **Logger**: ✅ Already integrated
- **Response helpers**: ✅ Already imported but not fully utilized

## The Task

Refactor all 26 manual pool connections in `permissions.js` to use the centralized `dbQuery` helpers (`query`, `queryOne`, `queryMany`, `transaction`) from `../utils/dbQuery.js`.

### Critical Considerations

1. **Agency Database Context**: This file uses **agency-specific databases**, not the main database. All queries must pass `agencyDatabase` to the dbQuery helpers.

2. **Current Pattern**: The file uses a `getAgencyDb()` helper that creates agency-specific pools:
   ```javascript
   const pool = await getAgencyDb(agencyDatabase);
   const client = await pool.connect();
   try {
     // queries...
   } finally {
     client.release();
   }
   ```

3. **dbQuery Pattern**: The `dbQuery` helpers support agency databases via options:
   ```javascript
   const result = await queryOne('SELECT ...', [params], { 
     agencyDatabase,
     requestId: req.requestId 
   });
   ```

4. **Transactions**: Some endpoints use transactions - use the `transaction()` helper for those.

## Files to Reference

1. **`src/server/routes/permissions.js`** - The file to refactor
2. **`src/server/utils/dbQuery.js`** - Contains `query`, `queryOne`, `queryMany`, `transaction` helpers
3. **`src/server/utils/responseHelper.js`** - Contains `sendSuccess`, `sendError`, `databaseError`, etc.
4. **`src/server/middleware/commonMiddleware.js`** - Contains `validateUUID`, `requireFields` middleware

## Endpoints to Refactor

The file contains 9 main endpoints, each with manual pool connections:

1. **GET /api/permissions** - Fetch permissions (paginated)
2. **GET /api/permissions/categories** - Fetch categories
3. **GET /api/permissions/roles/:roleId** - Fetch role permissions
4. **GET /api/permissions/users/:userId** - Fetch user permissions
5. **GET /api/permissions/templates** - Fetch templates
6. **POST /api/permissions/templates** - Create template
7. **POST /api/permissions/templates/:id/apply** - Apply template (uses transaction)
8. **GET /api/permissions/export** - Export permissions
9. **POST /api/permissions/import** - Import permissions (uses transaction)

## Transformation Pattern

### Before (Current Pattern):
```javascript
router.get('/', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const pool = await getAgencyDb(agencyDatabase);
  const client = await pool.connect();

  try {
    // Check if permissions table exists
    const tableCheck = await client.query(`SELECT EXISTS ...`);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ success: true, data: [], ... });
    }

    let query = 'SELECT * FROM public.permissions WHERE 1=1';
    const params = [];
    // ... build query ...
    
    const result = await client.query(query, params);
    const countResult = await client.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: { ... }
    });
  } catch (error) {
    logger.error('Error fetching permissions', { ... });
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}));
```

### After (Target Pattern):
```javascript
router.get('/', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { page = 1, limit = 100, category, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Check if permissions table exists
    const tableCheck = await queryOne(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      )`,
      [],
      { agencyDatabase, requestId: req.requestId }
    );
    
    if (!tableCheck.exists) {
      return sendSuccess(res, {
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // Build query dynamically
    let query = 'SELECT * FROM public.permissions WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM public.permissions WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      countQuery += ` AND category = $${paramCount}`;
      params.push(category);
      countParams.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      countQuery += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY category, name';
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    // Execute queries in parallel
    const [result, countResult] = await Promise.all([
      queryMany(query, params, { agencyDatabase, requestId: req.requestId }),
      queryOne(countQuery, countParams, { agencyDatabase, requestId: req.requestId })
    ]);

    return sendSuccess(res, {
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.count),
        totalPages: Math.ceil(parseInt(countResult.count) / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return databaseError(res, error, 'Failed to fetch permissions');
  }
}));
```

## Special Cases

### 1. Transactions
For endpoints that use transactions (e.g., `POST /api/permissions/templates/:id/apply`, `POST /api/permissions/import`), use the `transaction()` helper:

```javascript
await transaction(async (client) => {
  await client.query('INSERT INTO ...', [params]);
  await client.query('UPDATE ...', [params]);
  // ... more queries ...
}, { agencyDatabase, requestId: req.requestId });
```

### 2. Table Existence Checks
Some endpoints check if tables exist before querying. Use `queryOne` for these:

```javascript
const tableCheck = await queryOne(
  `SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'table_name'
  )`,
  [],
  { agencyDatabase, requestId: req.requestId }
);
```

### 3. Helper Functions
The file has helper functions like `logAudit()` and `ensureUserPermissionsTable()` that also use `client`. These need to be refactored to accept `agencyDatabase` and use dbQuery helpers, or kept as-is if they're called within a transaction context.

## Response Helper Usage

Replace manual `res.json()` and `res.status().json()` calls with response helpers:
- `sendSuccess(res, data, message)` - for success responses
- `sendError(res, error, message, statusCode)` - for error responses
- `databaseError(res, error, message)` - for database errors
- `notFound(res, message)` - for 404 responses
- `validationError(res, message, errors)` - for validation errors

## Success Criteria

- ✅ Zero `pool.connect()` calls
- ✅ Zero `client.release()` calls
- ✅ All queries use `query`, `queryOne`, `queryMany`, or `transaction` from dbQuery
- ✅ All queries pass `agencyDatabase` in options
- ✅ All responses use responseHelper functions
- ✅ All error handling uses logger with structured context
- ✅ No linter errors
- ✅ All functionality preserved
- ✅ Transactions properly handled
- ✅ Helper functions refactored if needed

## Important Notes

1. **DO NOT** remove the `getAgencyDb()` helper function yet - it may still be needed for the helper functions or can be removed if all usages are replaced.

2. **DO NOT** change the endpoint logic - only refactor the database access pattern.

3. **DO** test each endpoint after refactoring to ensure functionality is preserved.

4. **DO** use `Promise.all()` or `Promise.allSettled()` for parallel queries where appropriate.

5. **DO** maintain all existing error handling and validation logic.

6. **DO** ensure all queries that need agency database context pass `agencyDatabase` in the options.

## Verification Steps

After refactoring, verify:
1. Run linter: `npm run lint` (or equivalent)
2. Check for any remaining `pool.connect()` or `client.release()` calls
3. Check that all queries use dbQuery helpers
4. Check that all responses use responseHelper functions
5. Test each endpoint manually or with automated tests

## Expected Outcome

After completion:
- File should have **zero** manual pool connections
- All database queries should use centralized `dbQuery` helpers
- All responses should use `responseHelper` functions
- Code should be more maintainable and consistent with the rest of the codebase
- Better error handling and logging throughout

---

**Please refactor this file carefully, one endpoint at a time, ensuring each works correctly before moving to the next. This is a critical refactoring that affects permission management functionality.**

