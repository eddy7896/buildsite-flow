/**
 * Reports Routes
 * Handles permission report generation
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireRole, requireAgencyContext } = require('../middleware/authMiddleware');
const { parseDatabaseUrl } = require('../utils/poolManager');
const { Pool } = require('pg');

// Helper to get agency database connection
async function getAgencyDb(agencyDatabase) {
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  return new Pool({ connectionString: agencyDbUrl, max: 1 });
}

/**
 * GET /api/reports/permission-distribution
 * Generate permission distribution report
 */
router.get('/permission-distribution', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const pool = await getAgencyDb(agencyDatabase);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 
        rp.role,
        p.category,
        COUNT(*) as permission_count,
        SUM(CASE WHEN rp.granted THEN 1 ELSE 0 END) as granted_count
       FROM public.role_permissions rp
       INNER JOIN public.permissions p ON rp.permission_id = p.id
       WHERE p.is_active = true
       GROUP BY rp.role, p.category
       ORDER BY rp.role, p.category`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } finally {
    client.release();
    await pool.end();
  }
}));

/**
 * GET /api/reports/user-permissions
 * Generate user permissions report
 */
router.get('/user-permissions', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const pool = await getAgencyDb(agencyDatabase);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 
        u.id as user_id,
        p.full_name,
        p.email,
        ur.role,
        COUNT(DISTINCT rp.permission_id) as role_permission_count,
        COUNT(DISTINCT up.permission_id) as override_count
       FROM public.users u
       LEFT JOIN public.profiles p ON u.id = p.user_id
       LEFT JOIN public.user_roles ur ON u.id = ur.user_id
       LEFT JOIN public.role_permissions rp ON ur.role = rp.role AND rp.granted = true
       LEFT JOIN public.user_permissions up ON u.id = up.user_id
       GROUP BY u.id, p.full_name, p.email, ur.role
       ORDER BY p.full_name`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } finally {
    client.release();
    await pool.end();
  }
}));

/**
 * GET /api/reports/unused-permissions
 * Find permissions that are never granted
 */
router.get('/unused-permissions', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const pool = await getAgencyDb(agencyDatabase);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT p.*
       FROM public.permissions p
       LEFT JOIN public.role_permissions rp ON p.id = rp.permission_id AND rp.granted = true
       LEFT JOIN public.user_permissions up ON p.id = up.permission_id AND up.granted = true
       WHERE p.is_active = true
       AND rp.id IS NULL
       AND up.id IS NULL
       ORDER BY p.category, p.name`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } finally {
    client.release();
    await pool.end();
  }
}));

/**
 * GET /api/reports/compliance
 * Generate compliance report
 */
router.get('/compliance', authenticate, requireRole(['super_admin', 'ceo', 'admin']), requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const pool = await getAgencyDb(agencyDatabase);
  const client = await pool.connect();

  try {
    // Check for users with excessive permissions
    const excessivePerms = await client.query(
      `SELECT 
        u.id,
        p.full_name,
        p.email,
        COUNT(DISTINCT up.permission_id) as override_count
       FROM public.users u
       LEFT JOIN public.profiles p ON u.id = p.user_id
       LEFT JOIN public.user_permissions up ON u.id = up.user_id
       GROUP BY u.id, p.full_name, p.email
       HAVING COUNT(DISTINCT up.permission_id) > 20
       ORDER BY override_count DESC`
    );

    // Check for expired permissions
    const expiredPerms = await client.query(
      `SELECT 
        up.*,
        p.name as permission_name,
        pr.full_name as user_name
       FROM public.user_permissions up
       INNER JOIN public.permissions p ON up.permission_id = p.id
       LEFT JOIN public.profiles pr ON up.user_id = pr.user_id
       WHERE up.expires_at IS NOT NULL
       AND up.expires_at < now()
       AND up.granted = true`
    );

    res.json({
      success: true,
      data: {
        excessive_permissions: excessivePerms.rows,
        expired_permissions: expiredPerms.rows
      }
    });
  } finally {
    client.release();
    await pool.end();
  }
}));

module.exports = router;
