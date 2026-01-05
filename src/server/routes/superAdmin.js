/**
 * Super Admin API Routes
 * System-level routes for managing agencies and viewing agency data (read-only)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { pool } = require('../config/database');
const { authenticate, requireSuperAdmin } = require('../middleware/authMiddleware');
const { getAgencyPool } = require('../utils/poolManager');
const { clearMaintenanceCache } = require('../middleware/maintenanceMode');
const logger = require('../utils/logger');

/**
 * GET /api/super-admin/agencies
 * Get all agencies (from main database)
 */
router.get('/agencies', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id, name, domain, database_name, 
        subscription_plan, is_active, 
        maintenance_mode, maintenance_message,
        created_at, updated_at
      FROM public.agencies
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } finally {
    client.release();
  }
}));

/**
 * GET /api/super-admin/agencies/:id
 * Get agency details
 */
router.get('/agencies/:id', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        id, name, domain, database_name, 
        subscription_plan, is_active, 
        maintenance_mode, maintenance_message,
        created_at, updated_at
      FROM public.agencies
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' },
        message: 'Agency not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } finally {
    client.release();
  }
}));

/**
 * GET /api/super-admin/agencies/:id/data
 * Get read-only agency data (users, clients, projects, invoices, inventory)
 */
router.get('/agencies/:id/data', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    // Get agency database name
    const agencyResult = await client.query(
      'SELECT database_name FROM public.agencies WHERE id = $1',
      [id]
    );
    
    if (agencyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' },
        message: 'Agency not found',
      });
    }
    
    const databaseName = agencyResult.rows[0].database_name;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_DATABASE', message: 'Agency database not found' },
        message: 'Agency database not configured',
      });
    }
    
    // Get agency pool for read-only queries
    const agencyPool = getAgencyPool(databaseName);
    const agencyClient = await agencyPool.connect();
    
    try {
      // Fetch all data in parallel (read-only queries)
      const [usersResult, clientsResult, projectsResult, invoicesResult, inventoryResult] = await Promise.all([
        // Users
        agencyClient.query(`
          SELECT 
            u.id, u.email, u.is_active,
            p.full_name, p.phone_number as phone,
            ur.role
          FROM public.users u
          LEFT JOIN public.profiles p ON u.id = p.user_id
          LEFT JOIN public.user_roles ur ON u.id = ur.user_id
          ORDER BY u.created_at DESC
          LIMIT 100
        `).catch(() => ({ rows: [] })),
        
        // Clients
        agencyClient.query(`
          SELECT id, name, email, phone, is_active
          FROM public.clients
          ORDER BY created_at DESC
          LIMIT 100
        `).catch(() => ({ rows: [] })),
        
        // Projects
        agencyClient.query(`
          SELECT id, name, status, budget, progress
          FROM public.projects
          ORDER BY created_at DESC
          LIMIT 100
        `).catch(() => ({ rows: [] })),
        
        // Invoices
        agencyClient.query(`
          SELECT 
            i.id, i.invoice_number, i.total_amount, i.status,
            c.name as client_name
          FROM public.invoices i
          LEFT JOIN public.clients c ON i.client_id = c.id
          ORDER BY i.created_at DESC
          LIMIT 100
        `).catch(() => ({ rows: [] })),
        
        // Inventory
        agencyClient.query(`
          SELECT id, name, sku, quantity, value
          FROM public.inventory_items
          ORDER BY created_at DESC
          LIMIT 100
        `).catch(() => ({ rows: [] })),
      ]);
      
      res.json({
        success: true,
        data: {
          users: usersResult.rows,
          clients: clientsResult.rows,
          projects: projectsResult.rows,
          invoices: invoicesResult.rows,
          inventory: inventoryResult.rows,
        },
      });
    } finally {
      agencyClient.release();
    }
  } finally {
    client.release();
  }
}));

/**
 * GET /api/super-admin/agencies/:id/users
 * Get agency users (read-only)
 */
router.get('/agencies/:id/users', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const agencyResult = await client.query(
      'SELECT database_name FROM public.agencies WHERE id = $1',
      [id]
    );
    
    if (agencyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' },
        message: 'Agency not found',
      });
    }
    
    const databaseName = agencyResult.rows[0].database_name;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_DATABASE', message: 'Agency database not found' },
        message: 'Agency database not configured',
      });
    }
    
    const agencyPool = getAgencyPool(databaseName);
    const agencyClient = await agencyPool.connect();
    
    try {
      const result = await agencyClient.query(`
        SELECT 
          u.id, u.email, u.is_active, u.created_at,
          p.full_name, p.phone_number as phone,
          ur.role
        FROM public.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        ORDER BY u.created_at DESC
      `);
      
      res.json({
        success: true,
        data: result.rows,
      });
    } finally {
      agencyClient.release();
    }
  } finally {
    client.release();
  }
}));

/**
 * GET /api/super-admin/agencies/:id/stats
 * Get agency statistics
 */
router.get('/agencies/:id/stats', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const agencyResult = await client.query(
      'SELECT database_name FROM public.agencies WHERE id = $1',
      [id]
    );
    
    if (agencyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' },
        message: 'Agency not found',
      });
    }
    
    const databaseName = agencyResult.rows[0].database_name;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_DATABASE', message: 'Agency database not found' },
        message: 'Agency database not configured',
      });
    }
    
    const agencyPool = getAgencyPool(databaseName);
    const agencyClient = await agencyPool.connect();
    
    try {
      // Get statistics (read-only queries)
      const [usersCount, clientsCount, projectsCount, invoicesCount] = await Promise.all([
        agencyClient.query('SELECT COUNT(*) as count FROM public.users').catch(() => ({ rows: [{ count: 0 }] })),
        agencyClient.query('SELECT COUNT(*) as count FROM public.clients').catch(() => ({ rows: [{ count: 0 }] })),
        agencyClient.query('SELECT COUNT(*) as count FROM public.projects').catch(() => ({ rows: [{ count: 0 }] })),
        agencyClient.query('SELECT COUNT(*) as count FROM public.invoices').catch(() => ({ rows: [{ count: 0 }] })),
      ]);
      
      res.json({
        success: true,
        data: {
          users: parseInt(usersCount.rows[0].count) || 0,
          clients: parseInt(clientsCount.rows[0].count) || 0,
          projects: parseInt(projectsCount.rows[0].count) || 0,
          invoices: parseInt(invoicesCount.rows[0].count) || 0,
        },
      });
    } finally {
      agencyClient.release();
    }
  } finally {
    client.release();
  }
}));

/**
 * GET /api/super-admin/system/metrics
 * Get system-wide metrics
 */
router.get('/system/metrics', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Get system metrics from main database
    const [agenciesCount, activeAgenciesCount, totalUsersCount] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM public.agencies'),
      client.query('SELECT COUNT(*) as count FROM public.agencies WHERE is_active = true'),
      client.query('SELECT COUNT(*) as count FROM public.users'),
    ]);
    
    res.json({
      success: true,
      data: {
        totalAgencies: parseInt(agenciesCount.rows[0].count) || 0,
        activeAgencies: parseInt(activeAgenciesCount.rows[0].count) || 0,
        totalUsers: parseInt(totalUsersCount.rows[0].count) || 0,
      },
    });
  } finally {
    client.release();
  }
}));

/**
 * PUT /api/super-admin/agencies/:id/maintenance
 * Toggle maintenance mode for any agency (super admin only)
 * Updates agencies table in main database (takes precedence over agency_settings)
 */
router.put('/agencies/:id/maintenance', authenticate, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { maintenance_mode, maintenance_message } = req.body;
  const client = await pool.connect();
  
  try {
    // Validate input
    if (typeof maintenance_mode !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'maintenance_mode must be a boolean',
      });
    }

    // Check if agency exists
    const agencyResult = await client.query(
      'SELECT id, database_name FROM public.agencies WHERE id = $1',
      [id]
    );
    
    if (agencyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' },
        message: 'Agency not found',
      });
    }

    const databaseName = agencyResult.rows[0].database_name;

    // Update agencies table in main database (super admin override)
    await client.query(`
      UPDATE public.agencies
      SET 
        maintenance_mode = $1,
        maintenance_message = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [maintenance_mode, maintenance_message || null, id]);

    // Clear cache
    if (databaseName) {
      clearMaintenanceCache(databaseName);
    }

    logger.info('Super admin updated agency maintenance mode', {
      agencyId: id,
      agencyDatabase: databaseName,
      maintenance_mode,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    res.json({
      success: true,
      data: {
        agency_id: id,
        maintenance_mode,
        maintenance_message: maintenance_message || null,
      },
      message: `Maintenance mode ${maintenance_mode ? 'enabled' : 'disabled'} for agency successfully`,
    });
  } catch (error) {
    logger.error('Error updating agency maintenance mode', {
      error: error.message,
      code: error.code,
      agencyId: id,
      requestId: req.requestId,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update maintenance mode',
      message: 'Failed to update maintenance mode',
    });
  } finally {
    client.release();
  }
}));

module.exports = router;

