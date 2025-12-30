# Refactoring Example: Before and After

## Example: Agency Settings Endpoint

### BEFORE (Original Code)
```javascript
router.get(
  '/agency-settings/:agencyId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { agencyId } = req.params;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
        message: 'agencyId is required',
      });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
           id,
           agency_id,
           agency_name,
           logo_url,
           primary_focus,
           enable_gst,
           modules,
           industry,
           phone,
           address_street,
           address_city,
           address_state,
           address_zip,
           address_country,
           employee_count
         FROM public.agency_settings
         WHERE agency_id = $1
         LIMIT 1`,
        [agencyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Agency settings not found',
          },
          message: 'Agency settings not found',
        });
      }

      let modules = result.rows[0].modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch {
          modules = null;
        }
      }

      return res.json({
        success: true,
        data: {
          settings: {
            ...result.rows[0],
            modules,
          },
        },
        message: 'Agency settings fetched successfully',
      });
    } catch (error) {
      console.error('[System] Error fetching agency settings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch agency settings',
          details: error.message,
        },
        message: 'Failed to fetch agency settings',
      });
    } finally {
      client.release();
    }
  })
);
```

### AFTER (Refactored Code)
```javascript
const { queryOne } = require('../utils/dbQuery');
const { success, notFound, databaseError, send, validationError } = require('../utils/responseHelper');
const { validateUUID } = require('../middleware/commonMiddleware');
const logger = require('../utils/logger');

router.get(
  '/agency-settings/:agencyId',
  authenticate,
  validateUUID('agencyId'),
  asyncHandler(async (req, res) => {
    const { agencyId } = req.params;

    try {
      const settings = await queryOne(
        `SELECT 
           id,
           agency_id,
           agency_name,
           logo_url,
           primary_focus,
           enable_gst,
           modules,
           industry,
           phone,
           address_street,
           address_city,
           address_state,
           address_zip,
           address_country,
           employee_count
         FROM public.agency_settings
         WHERE agency_id = $1
         LIMIT 1`,
        [agencyId]
      );

      if (!settings) {
        return send(res, notFound('Agency settings', agencyId));
      }

      // Parse modules if it's a string
      let modules = settings.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch {
          modules = null;
        }
      }

      return send(res, success(
        { settings: { ...settings, modules } },
        'Agency settings fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching agency settings', {
        agencyId,
        error: error.message,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch agency settings'));
    }
  })
);
```

## Improvements

### 1. **Database Query**
- ✅ Uses centralized `queryOne()` helper
- ✅ Automatic connection management
- ✅ Built-in error handling and retry logic
- ✅ Query logging integrated

### 2. **Error Handling**
- ✅ Uses standardized error responses
- ✅ Proper error codes
- ✅ Consistent error format

### 3. **Logging**
- ✅ Uses proper logger instead of console.error
- ✅ Structured logging with context
- ✅ Request ID tracking

### 4. **Validation**
- ✅ Uses reusable `validateUUID` middleware
- ✅ Consistent validation across endpoints

### 5. **Response Format**
- ✅ Uses standardized response helpers
- ✅ Consistent response structure
- ✅ Request ID included

### 6. **Code Quality**
- ✅ Cleaner, more readable code
- ✅ Less boilerplate
- ✅ Better error messages
- ✅ Easier to maintain

## Migration Checklist

For each endpoint, follow these steps:

1. **Import helpers**
   ```javascript
   const { query, queryOne, queryMany, transaction } = require('../utils/dbQuery');
   const { success, error, notFound, databaseError, send } = require('../utils/responseHelper');
   const logger = require('../utils/logger');
   ```

2. **Replace database queries**
   - Replace `pool.query()` → `query()`
   - Replace `client.query()` → `query()` or `queryOne()`
   - Remove manual connection management

3. **Replace console logging**
   - Replace `console.log()` → `logger.info()`
   - Replace `console.error()` → `logger.error()`
   - Replace `console.warn()` → `logger.warn()`

4. **Standardize responses**
   - Replace manual JSON responses → `send(res, success(...))` or `send(res, error(...))`
   - Use appropriate error helpers (`notFound`, `validationError`, etc.)

5. **Add validation middleware**
   - Add `validateUUID()` for UUID parameters
   - Add `requireFields()` for required body fields

6. **Test thoroughly**
   - Test success cases
   - Test error cases
   - Verify response format
   - Check logs

## Next Steps

1. Start with smaller, less critical endpoints
2. Test each refactored endpoint thoroughly
3. Gradually move to larger endpoints
4. Monitor for any issues
5. Update documentation

