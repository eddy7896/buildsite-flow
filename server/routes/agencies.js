/**
 * Agency Routes
 * Handles agency management endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const {
  checkDomainAvailability,
  checkSetupStatus,
  getSetupProgress,
  createAgency,
  repairAgencyDatabase,
  completeAgencySetup,
} = require('../services/agencyService');

/**
 * GET /api/agencies/check-domain
 * Check if domain is available
 */
router.get('/check-domain', asyncHandler(async (req, res) => {
  const { domain } = req.query;

  if (!domain || typeof domain !== 'string') {
    return res.json({ available: false, error: 'Domain is required' });
  }

  try {
    const available = await checkDomainAvailability(domain);
    res.json({
      available,
      domain: domain.toLowerCase().trim(),
    });
  } catch (error) {
    console.error('[API] Domain check error:', error);
    res.status(500).json({
      available: false,
      error: 'Error checking domain availability',
    });
  }
}));

/**
 * GET /api/agencies/check-setup
 * Check agency setup status
 */
router.get('/check-setup', asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] ||
      req.query.database ||
      null;

    if (!agencyDatabase) {
      return res.json({ setupComplete: false });
    }

    // If detailed progress is requested
    if (req.query.detailed === 'true') {
      try {
        const progress = await getSetupProgress(agencyDatabase);
        // Ensure response has all required fields
        return res.json({
          setupComplete: progress.setupComplete || false,
          progress: progress.progress || 0,
          completedSteps: Array.isArray(progress.completedSteps) ? progress.completedSteps : [],
          totalSteps: progress.totalSteps || 7,
          lastUpdated: progress.lastUpdated || null,
          agencyName: progress.agencyName || null,
        });
      } catch (progressError) {
        console.error('[API] Get setup progress error:', progressError);
        // Return default structure on error
        return res.json({
          setupComplete: false,
          progress: 0,
          completedSteps: [],
          totalSteps: 7,
          lastUpdated: null,
          agencyName: null,
        });
      }
    }

    const setupComplete = await checkSetupStatus(agencyDatabase);
    res.json({ setupComplete });
  } catch (error) {
    console.error('[API] Check setup error:', error);
    res.json({ setupComplete: false });
  }
}));

/**
 * POST /api/agencies/complete-setup
 * Complete agency setup with extended settings
 */
router.post('/complete-setup', asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] ||
      req.body.database;

    if (!agencyDatabase) {
      return res.status(400).json({ error: 'Agency database not specified' });
    }

    await completeAgencySetup(agencyDatabase, req.body);

    res.json({
      success: true,
      message: 'Agency setup completed successfully',
    });
  } catch (error) {
    console.error('[API] Complete setup error:', error);
    res.status(500).json({
      error: error.message || 'Failed to complete setup',
      detail: error.detail,
      code: error.code,
    });
  }
}));

/**
 * POST /api/agencies/create
 * Create a new agency with isolated database
 */
router.post('/create', asyncHandler(async (req, res) => {
  try {
    const {
      agencyName,
      domain,
      industry,
      companySize,
      address,
      phone,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionPlan,
    } = req.body;

    if (!agencyName || !domain || !adminName || !adminEmail || !adminPassword || !subscriptionPlan) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['agencyName', 'domain', 'adminName', 'adminEmail', 'adminPassword', 'subscriptionPlan'],
      });
    }

    const result = await createAgency({
      agencyName,
      domain,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionPlan,
      phone,
    });

    res.json({
      success: true,
      ...result,
      message: 'Agency created successfully with separate database',
    });
  } catch (error) {
    console.error('[API] Agency creation failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to create agency',
      detail: error.detail,
      code: error.code,
    });
  }
}));

/**
 * POST /api/agencies/repair-database
 * Repair agency database by adding missing tables
 */
router.post('/repair-database', asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] || req.body.database;

    if (!agencyDatabase) {
      return res.status(400).json({
        error: 'Agency database name is required',
        message: 'Provide database name in header: x-agency-database or in body: { database: "agency_name" }',
      });
    }

    console.log(`[API] Starting database repair for: ${agencyDatabase}`);

    const result = await repairAgencyDatabase(agencyDatabase);

    res.json({
      success: true,
      message: 'Database repair completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('[API] Database repair failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to repair database',
      detail: error.detail,
      code: error.code,
    });
  }
}));

module.exports = router;
