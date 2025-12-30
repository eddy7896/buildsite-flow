/**
 * Permissions Management Routes
 * Handles all permission-related operations including role permissions, user permissions, templates, and bulk operations
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireRole, requireAgencyContext } = require('../middleware/authMiddleware');
const { getAgencyPool } = require('../utils/poolManager');
const logger = require('../utils/logger');
const { query, queryOne, queryMany } = require('../utils/dbQuery');
const { withTransaction } = require('../utils/transactionHelper');
const { send, success, error: errorResponse, databaseError, validationError, notFound } = require('../utils/responseHelper');

// Helper to ensure user_permissions table exists
async function ensureUserPermissionsTable(agencyDatabase, requestId) {
  const tableCheck = await queryOne(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_permissions'
    )`,
    [],
    { agencyDatabase, requestId }
  );
  
  if (!tableCheck.exists) {
    const pool = getAgencyPool(agencyDatabase);
    const client = await pool.connect();
    try {
      const { ensureUserPermissionsTable: ensureTable } = require('../utils/schema/authSchema');
      await ensureTable(client);
    } finally {
      client.release();
    }
  }
}

// Helper to log audit trail
async function logAudit(agencyDatabase, tableName, action, userId, recordId, oldValues, newValues, ipAddress, userAgent, requestId) {
  try {
    // Ensure audit_logs table exists
    await query(
      `CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name TEXT NOT NULL,
        action TEXT NOT NULL,
        user_id UUID REFERENCES public.users(id),
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )`,
      [],
      { agencyDatabase, requestId }
    );

    await query(
      `INSERT INTO public.audit_logs (table_name, action, user_id, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tableName, action, userId, recordId, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null, ipAddress, userAgent],
      { agencyDatabase, requestId }
    );
  } catch (error) {
    logger.error('Failed to log audit trail', {
      error: error.message,
      code: error.code,
      userId,
      action,
      tableName,
      recordId,
      agencyDatabase,
      requestId,
    });
    // Don't throw - audit logging failure shouldn't break the operation
  }
}

/**
 * GET /api/permissions
 * Get all permissions (paginated)
 */
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
      return send(res, success([], null, {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        },
        requestId: req.requestId
      }));
    }

    let sqlQuery = 'SELECT * FROM public.permissions WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM public.permissions WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      sqlQuery += ` AND category = $${paramCount}`;
      countQuery += ` AND category = $${paramCount}`;
      params.push(category);
      countParams.push(category);
    }

    if (search) {
      paramCount++;
      sqlQuery += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      countQuery += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    sqlQuery += ' ORDER BY category, name';
    paramCount++;
    sqlQuery += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    paramCount++;
    sqlQuery += ` OFFSET $${paramCount}`;
    params.push(offset);

    // Execute queries in parallel
    const [result, countResult] = await Promise.all([
      queryMany(sqlQuery, params, { agencyDatabase, requestId: req.requestId }),
      queryOne(countQuery, countParams, { agencyDatabase, requestId: req.requestId })
    ]);

    return send(res, success(result, null, {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.count),
        totalPages: Math.ceil(parseInt(countResult.count) / parseInt(limit))
      },
      requestId: req.requestId
    }));
  } catch (error) {
    logger.error('Error fetching permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to fetch permissions'));
  }
}));

/**
 * GET /api/permissions/categories
 * Get all permission categories
 */
router.get('/categories', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;

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
      return send(res, success([], null, { requestId: req.requestId }));
    }

    const result = await queryMany(
      'SELECT DISTINCT category FROM public.permissions WHERE is_active = true ORDER BY category',
      [],
      { agencyDatabase, requestId: req.requestId }
    );

    return send(res, success(result.map(r => r.category), null, { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error fetching categories', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to fetch categories'));
  }
}));

/**
 * GET /api/permissions/roles/:role
 * Get all permissions for a specific role
 */
router.get('/roles/:role', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { role } = req.params;

  try {
    // Check if tables exist
    const permissionsTableCheck = await queryOne(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      )`,
      [],
      { agencyDatabase, requestId: req.requestId }
    );

    if (!permissionsTableCheck.exists) {
      return send(res, success([], null, { requestId: req.requestId }));
    }

    const result = await queryMany(
      `SELECT p.*, rp.granted, rp.id as role_permission_id
       FROM public.permissions p
       LEFT JOIN public.role_permissions rp ON p.id = rp.permission_id AND rp.role = $1
       WHERE p.is_active = true
       ORDER BY p.category, p.name`,
      [role],
      { agencyDatabase, requestId: req.requestId }
    );

    return send(res, success(result, null, { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error fetching role permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      role: req.params.role,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to fetch role permissions'));
  }
}));

/**
 * PUT /api/permissions/roles/:role
 * Update permissions for a specific role
 */
router.put('/roles/:role', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { role } = req.params;
  const { permissions } = req.body; // Array of { permission_id, granted }
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!Array.isArray(permissions)) {
    return send(res, validationError('Permissions must be an array'), 400);
  }

  const pool = getAgencyPool(agencyDatabase);

  try {
    await withTransaction(pool, async (client) => {
      for (const perm of permissions) {
        const { permission_id, granted } = perm;

        // Check if permission exists
        const permCheck = await client.query('SELECT id FROM public.permissions WHERE id = $1', [permission_id]);
        if (permCheck.rows.length === 0) {
          throw new Error(`Permission ${permission_id} does not exist`);
        }

        // Check if role_permission exists
        const existing = await client.query(
          'SELECT id, granted FROM public.role_permissions WHERE role = $1 AND permission_id = $2',
          [role, permission_id]
        );

        if (existing.rows.length > 0) {
          const oldValue = existing.rows[0].granted;
          if (oldValue !== granted) {
            await client.query(
              'UPDATE public.role_permissions SET granted = $1, updated_at = now() WHERE id = $2',
              [granted, existing.rows[0].id]
            );
            // Log audit after transaction commits
            await logAudit(agencyDatabase, 'role_permissions', 'UPDATE', userId, existing.rows[0].id,
              { granted: oldValue }, { granted }, ipAddress, userAgent, req.requestId);
          }
        } else {
          const insertResult = await client.query(
            'INSERT INTO public.role_permissions (role, permission_id, granted) VALUES ($1, $2, $3) RETURNING id',
            [role, permission_id, granted]
          );
          // Log audit after transaction commits
          await logAudit(agencyDatabase, 'role_permissions', 'INSERT', userId, insertResult.rows[0].id,
            null, { role, permission_id, granted }, ipAddress, userAgent, req.requestId);
        }
      }
    });

    return send(res, success(null, 'Role permissions updated successfully', { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error updating role permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      role: req.params.role,
      agencyDatabase,
      requestId: req.requestId,
    });
    
    if (error.message.includes('does not exist')) {
      return send(res, validationError(error.message), 400);
    }
    
    return send(res, databaseError(error, 'Failed to update role permissions'));
  }
}));

/**
 * GET /api/permissions/users/:userId
 * Get all permissions for a specific user (including role-based and overrides)
 */
router.get('/users/:userId', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { userId } = req.params;

  try {
    // Get user roles
    const rolesResult = await queryMany(
      'SELECT role FROM public.user_roles WHERE user_id = $1',
      [userId],
      { agencyDatabase, requestId: req.requestId }
    );
    const roles = rolesResult.map(r => r.role);

    // Get role-based permissions (only if user has roles)
    let rolePermsResult = [];
    if (roles.length > 0) {
      rolePermsResult = await queryMany(
        `SELECT DISTINCT p.*, rp.granted, 'role' as source
         FROM public.permissions p
         INNER JOIN public.role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role = ANY($1::text[]) AND rp.granted = true AND p.is_active = true`,
        [roles],
        { agencyDatabase, requestId: req.requestId }
      );
    }

    // Get user-specific overrides (if user_permissions table exists)
    let userPermsResult = [];
    try {
      // Check if user_permissions table exists
      const tableCheck = await queryOne(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_permissions'
        )`,
        [],
        { agencyDatabase, requestId: req.requestId }
      );
      
      if (tableCheck.exists) {
        userPermsResult = await queryMany(
          `SELECT p.*, up.granted, up.reason, up.expires_at, 'user' as source
           FROM public.permissions p
           INNER JOIN public.user_permissions up ON p.id = up.permission_id
           WHERE up.user_id = $1 AND p.is_active = true`,
          [userId],
          { agencyDatabase, requestId: req.requestId }
        );
      }
    } catch (error) {
      // If table doesn't exist or query fails, continue without user permissions
      if (error.code !== '42P01') {
        logger.warn('Error fetching user permissions', {
          error: error.message,
          code: error.code,
          userId: req.params.userId,
          agencyDatabase,
          requestId: req.requestId,
        });
      }
    }

    // Merge and deduplicate (user overrides take precedence)
    const permissionsMap = new Map();
    rolePermsResult.forEach(p => {
      permissionsMap.set(p.id, p);
    });
    userPermsResult.forEach(p => {
      permissionsMap.set(p.id, p);
    });

    return send(res, success(Array.from(permissionsMap.values()), null, { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error fetching user permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId: req.params.userId,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to fetch user permissions'));
  }
}));

/**
 * PUT /api/permissions/users/:userId
 * Update user-specific permission overrides
 */
router.put('/users/:userId', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { userId } = req.params;
  const { permissions } = req.body; // Array of { permission_id, granted, reason, expires_at }
  const grantedBy = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!Array.isArray(permissions)) {
    return send(res, validationError('Permissions must be an array'), 400);
  }

  const pool = getAgencyPool(agencyDatabase);

  try {
    // Ensure user_permissions table exists before transaction
    await ensureUserPermissionsTable(agencyDatabase, req.requestId);

    await withTransaction(pool, async (client) => {
      for (const perm of permissions) {
        const { permission_id, granted, reason, expires_at } = perm;

        // Check if permission exists
        const permCheck = await client.query('SELECT id FROM public.permissions WHERE id = $1', [permission_id]);
        if (permCheck.rows.length === 0) {
          throw new Error(`Permission ${permission_id} does not exist`);
        }
        
        // Check if user_permission exists
        const existing = await client.query(
          'SELECT id, granted FROM public.user_permissions WHERE user_id = $1 AND permission_id = $2',
          [userId, permission_id]
        );

        if (existing.rows.length > 0) {
          const oldValue = existing.rows[0].granted;
          if (oldValue !== granted) {
            await client.query(
              `UPDATE public.user_permissions 
               SET granted = $1, reason = $2, expires_at = $3, granted_at = now()
               WHERE id = $4`,
              [granted, reason || null, expires_at || null, existing.rows[0].id]
            );
            // Log audit after transaction commits
            await logAudit(agencyDatabase, 'user_permissions', 'UPDATE', grantedBy, existing.rows[0].id,
              { granted: oldValue }, { granted, reason, expires_at }, ipAddress, userAgent, req.requestId);
          }
        } else {
          const insertResult = await client.query(
            `INSERT INTO public.user_permissions (user_id, permission_id, granted, granted_by, reason, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [userId, permission_id, granted, grantedBy, reason || null, expires_at || null]
          );
          // Log audit after transaction commits
          await logAudit(agencyDatabase, 'user_permissions', 'INSERT', grantedBy, insertResult.rows[0].id,
            null, { user_id: userId, permission_id, granted, reason, expires_at }, ipAddress, userAgent, req.requestId);
        }
      }
    });

    return send(res, success(null, 'User permissions updated successfully', { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error updating user permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId: req.params.userId,
      agencyDatabase,
      requestId: req.requestId,
    });
    
    if (error.message.includes('does not exist')) {
      return send(res, validationError(error.message), 400);
    }
    
    return send(res, databaseError(error, 'Failed to update user permissions'));
  }
}));

/**
 * DELETE /api/permissions/users/:userId/overrides
 * Remove all user permission overrides (reset to role defaults)
 */
router.delete('/users/:userId/overrides', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { userId } = req.params;
  const grantedBy = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const pool = getAgencyPool(agencyDatabase);

  try {
    // Ensure user_permissions table exists before transaction
    await ensureUserPermissionsTable(agencyDatabase, req.requestId);

    await withTransaction(pool, async (client) => {
      // Get all overrides before deleting
      const overrides = await client.query(
        'SELECT id FROM public.user_permissions WHERE user_id = $1',
        [userId]
      );

      await client.query('DELETE FROM public.user_permissions WHERE user_id = $1', [userId]);

      // Log audit after transaction commits
      for (const override of overrides.rows) {
        await logAudit(agencyDatabase, 'user_permissions', 'DELETE', grantedBy, override.id,
          { user_id: userId }, null, ipAddress, userAgent, req.requestId);
      }
    });

    return send(res, success(null, 'User permission overrides removed successfully', { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error removing user permission overrides', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId: req.params.userId,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to remove user permission overrides'));
  }
}));

/**
 * POST /api/permissions/bulk
 * Bulk update permissions for multiple roles/users
 */
router.post('/bulk', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { type, targets, permissions } = req.body; // type: 'roles' | 'users', targets: string[], permissions: { permission_id, granted }[]
  const userId = req.user.id;

  if (!['roles', 'users'].includes(type) || !Array.isArray(targets) || !Array.isArray(permissions)) {
    return send(res, validationError('Invalid request body'), 400);
  }

  const pool = getAgencyPool(agencyDatabase);

  try {
    // Ensure user_permissions table exists if needed
    if (type === 'users') {
      await ensureUserPermissionsTable(agencyDatabase, req.requestId);
    }
    
    await withTransaction(pool, async (client) => {
      for (const target of targets) {
        for (const perm of permissions) {
          const { permission_id, granted } = perm;

          if (type === 'roles') {
            const existing = await client.query(
              'SELECT id FROM public.role_permissions WHERE role = $1 AND permission_id = $2',
              [target, permission_id]
            );

            if (existing.rows.length > 0) {
              await client.query(
                'UPDATE public.role_permissions SET granted = $1, updated_at = now() WHERE id = $2',
                [granted, existing.rows[0].id]
              );
            } else {
              await client.query(
                'INSERT INTO public.role_permissions (role, permission_id, granted) VALUES ($1, $2, $3)',
                [target, permission_id, granted]
              );
            }
          } else {
            const existing = await client.query(
              'SELECT id FROM public.user_permissions WHERE user_id = $1 AND permission_id = $2',
              [target, permission_id]
            );

            if (existing.rows.length > 0) {
              await client.query(
                'UPDATE public.user_permissions SET granted = $1, granted_at = now() WHERE id = $2',
                [granted, existing.rows[0].id]
              );
            } else {
              await client.query(
                'INSERT INTO public.user_permissions (user_id, permission_id, granted, granted_by) VALUES ($1, $2, $3, $4)',
                [target, permission_id, granted, userId]
              );
            }
          }
        }
      }
    });

    return send(res, success(null, 'Bulk permissions update completed successfully', { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error updating bulk permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      type,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to update bulk permissions'));
  }
}));

/**
 * GET /api/permissions/templates
 * Get all permission templates
 */
router.get('/templates', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;

  try {
    // Check if table exists first
    const tableCheck = await queryOne(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permission_templates'
      )`,
      [],
      { agencyDatabase, requestId: req.requestId }
    );

    if (!tableCheck.exists) {
      // Table doesn't exist, return empty array
      return send(res, success([], null, { requestId: req.requestId }));
    }

    const result = await queryMany(
      'SELECT * FROM public.permission_templates WHERE is_active = true ORDER BY name',
      [],
      { agencyDatabase, requestId: req.requestId }
    );
    
    // Parse JSONB permissions field if it exists
    const templates = result.map(row => ({
      ...row,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || [])
    }));

    return send(res, success(templates, null, { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error fetching templates', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to fetch templates'));
  }
}));

/**
 * POST /api/permissions/templates
 * Create a new permission template
 */
router.post('/templates', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { name, description, permissions } = req.body;
  const createdBy = req.user.id;

  if (!name || !Array.isArray(permissions)) {
    return send(res, validationError('Name and permissions array are required'), 400);
  }

  try {
    // Ensure table exists
    await query(
      `CREATE TABLE IF NOT EXISTS public.permission_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        is_active BOOLEAN DEFAULT true
      )`,
      [],
      { agencyDatabase, requestId: req.requestId }
    );

    const result = await queryOne(
      `INSERT INTO public.permission_templates (name, description, permissions, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, JSON.stringify(permissions), createdBy],
      { agencyDatabase, requestId: req.requestId }
    );
    
    // Parse JSONB if needed
    if (result && typeof result.permissions === 'string') {
      result.permissions = JSON.parse(result.permissions);
    }

    return send(res, success(result, null, { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error creating template', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to create template'));
  }
}));

/**
 * POST /api/permissions/templates/:templateId/apply
 * Apply a template to roles or users
 */
router.post('/templates/:templateId/apply', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { templateId } = req.params;
  const { type, targets } = req.body; // type: 'roles' | 'users', targets: string[]
  const userId = req.user.id;

  if (!['roles', 'users'].includes(type) || !Array.isArray(targets)) {
    return send(res, validationError('Invalid request body'), 400);
  }

  const pool = getAgencyPool(agencyDatabase);

  try {
    // Check if table exists
    const tableCheck = await queryOne(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permission_templates'
      )`,
      [],
      { agencyDatabase, requestId: req.requestId }
    );

    if (!tableCheck.exists) {
      return send(res, notFound('Templates table'), 404);
    }

    // Get template
    const templateResult = await queryOne(
      'SELECT permissions FROM public.permission_templates WHERE id = $1',
      [templateId],
      { agencyDatabase, requestId: req.requestId }
    );

    if (!templateResult) {
      return send(res, notFound('Template', templateId), 404);
    }

    // Parse JSONB if it's a string
    let permissions = templateResult.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (parseError) {
        return send(res, validationError('Invalid template permissions format'), 400);
      }
    }
    if (!Array.isArray(permissions)) {
      permissions = [];
    }

    // Ensure user_permissions table exists if needed
    if (type === 'users') {
      await ensureUserPermissionsTable(agencyDatabase, req.requestId);
    }

    await withTransaction(pool, async (client) => {
      for (const target of targets) {
        for (const perm of permissions) {
          const { permission_id, granted } = perm;

          if (type === 'roles') {
            const existing = await client.query(
              'SELECT id FROM public.role_permissions WHERE role = $1 AND permission_id = $2',
              [target, permission_id]
            );

            if (existing.rows.length > 0) {
              await client.query(
                'UPDATE public.role_permissions SET granted = $1, updated_at = now() WHERE id = $2',
                [granted, existing.rows[0].id]
              );
            } else {
              await client.query(
                'INSERT INTO public.role_permissions (role, permission_id, granted) VALUES ($1, $2, $3)',
                [target, permission_id, granted]
              );
            }
          } else {
            const existing = await client.query(
              'SELECT id FROM public.user_permissions WHERE user_id = $1 AND permission_id = $2',
              [target, permission_id]
            );

            if (existing.rows.length > 0) {
              await client.query(
                'UPDATE public.user_permissions SET granted = $1, granted_at = now() WHERE id = $2',
                [granted, existing.rows[0].id]
              );
            } else {
              await client.query(
                'INSERT INTO public.user_permissions (user_id, permission_id, granted, granted_by) VALUES ($1, $2, $3, $4)',
                [target, permission_id, granted, userId]
              );
            }
          }
        }
      }
    });

    return send(res, success(null, 'Template applied successfully', { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error applying template', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      templateId: req.params.templateId,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to apply template'));
  }
}));

/**
 * POST /api/permissions/export
 * Export current permission configuration
 */
router.post('/export', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;

  try {
    // Check which tables exist
    const tableCheck = await queryMany(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_templates')`,
      [],
      { agencyDatabase, requestId: req.requestId }
    );
    const existingTables = new Set(tableCheck.map(r => r.table_name));

    const queries = [];
    if (existingTables.has('permissions')) {
      queries.push(queryMany('SELECT * FROM public.permissions', [], { agencyDatabase, requestId: req.requestId })
        .then(data => ({ name: 'permissions', data })));
    } else {
      queries.push(Promise.resolve({ name: 'permissions', data: [] }));
    }

    if (existingTables.has('role_permissions')) {
      queries.push(queryMany('SELECT * FROM public.role_permissions', [], { agencyDatabase, requestId: req.requestId })
        .then(data => ({ name: 'role_permissions', data })));
    } else {
      queries.push(Promise.resolve({ name: 'role_permissions', data: [] }));
    }

    if (existingTables.has('user_permissions')) {
      queries.push(queryMany('SELECT * FROM public.user_permissions', [], { agencyDatabase, requestId: req.requestId })
        .then(data => ({ name: 'user_permissions', data })));
    } else {
      queries.push(Promise.resolve({ name: 'user_permissions', data: [] }));
    }

    if (existingTables.has('permission_templates')) {
      queries.push(queryMany('SELECT * FROM public.permission_templates', [], { agencyDatabase, requestId: req.requestId })
        .then(data => ({ name: 'templates', data })));
    } else {
      queries.push(Promise.resolve({ name: 'templates', data: [] }));
    }

    const results = await Promise.all(queries);
    const data = {};
    results.forEach(result => {
      data[result.name === 'templates' ? 'templates' : result.name] = result.data;
    });

    return send(res, success({
      ...data,
      exported_at: new Date().toISOString()
    }, null, { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error exporting permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to export permissions'));
  }
}));

/**
 * POST /api/permissions/import
 * Import permission configuration
 */
router.post('/import', authenticate, requireRole(['super_admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { data } = req.body;
  const userId = req.user.id;

  if (!data || !data.permissions) {
    return send(res, validationError('Invalid import data'), 400);
  }

  const pool = getAgencyPool(agencyDatabase);

  try {
    await withTransaction(pool, async (client) => {
      // Ensure permissions table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT UNIQUE NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        )
      `);

      // Ensure role_permissions table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.role_permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          role TEXT NOT NULL,
          permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
          granted BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(role, permission_id)
        )
      `);

      // Import permissions
      if (data.permissions && Array.isArray(data.permissions)) {
        for (const perm of data.permissions) {
          await client.query(
            `INSERT INTO public.permissions (id, name, category, description, is_active)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (name) DO UPDATE SET
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             is_active = EXCLUDED.is_active,
             updated_at = now()`,
            [perm.id || null, perm.name, perm.category, perm.description || null, perm.is_active !== false]
          );
        }
      }

      // Import role permissions
      if (data.role_permissions && Array.isArray(data.role_permissions)) {
        for (const rp of data.role_permissions) {
          await client.query(
            `INSERT INTO public.role_permissions (role, permission_id, granted)
             VALUES ($1, $2, $3)
             ON CONFLICT (role, permission_id) DO UPDATE SET
             granted = EXCLUDED.granted,
             updated_at = now()`,
            [rp.role, rp.permission_id, rp.granted]
          );
        }
      }
    });

    return send(res, success(null, 'Permissions imported successfully', { requestId: req.requestId }));
  } catch (error) {
    logger.error('Error importing permissions', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Failed to import permissions'));
  }
}));

module.exports = router;
