/**
 * Schema Diagnostics Routes
 * Provides read-only insight into the core PostgreSQL schema used by BuildFlow.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/schema/overview
 * Returns table, column, and constraint information for core auth/agency tables.
 *
 * NOTE: This endpoint is intended for development and diagnostics only.
 * In production you should protect or disable it at the proxy level.
 */
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    // List of tables we care most about for auth + agencies
    const coreTables = [
      'agencies',
      'agency_settings',
      'users',
      'profiles',
      'user_roles',
      'departments',
      'team_assignments',
    ];

    const client = await pool.connect();

    try {
      const tablesResult = await client.query(
        `
        SELECT
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
        `
      );

      const columnsResult = await client.query(
        `
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name, ordinal_position
        `,
        [coreTables]
      );

      const constraintsResult = await client.query(
        `
        SELECT
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        LEFT JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = ANY($1::text[])
        ORDER BY tc.table_name, tc.constraint_name, kcu.position_in_unique_constraint
        `,
        [coreTables]
      );

      res.json({
        success: true,
        message: 'Schema overview fetched successfully',
        data: {
          tables: tablesResult.rows,
          columns: columnsResult.rows,
          constraints: constraintsResult.rows,
        },
      });
    } catch (error) {
      console.error('[Schema Diagnostics] Error fetching schema overview:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch schema overview',
      });
    } finally {
      client.release();
    }
  })
);

module.exports = router;

