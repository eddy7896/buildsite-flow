/**
 * Validation API Routes
 * Provides centralized validation endpoints for existence checks
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireAgencyContext } = require('../middleware/authMiddleware');
const validationService = require('../services/validationService');

/**
 * GET /api/validation/email-exists
 * Check if email exists
 * Query params: email, excludeUserId (optional)
 */
router.get('/email-exists', authenticate, asyncHandler(async (req, res) => {
  const { email, excludeUserId } = req.query;
  const agencyDatabase = req.user?.agencyDatabase || req.agencyDatabase;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required',
      message: 'Email parameter is required',
    });
  }

  const exists = await validationService.checkEmailExists(
    email,
    agencyDatabase || null,
    excludeUserId || null,
    req
  );

  res.json({
    success: true,
    exists,
    message: exists ? 'Email already exists' : 'Email is available',
  });
}));

/**
 * GET /api/validation/employee-id-exists
 * Check if employee ID exists
 * Query params: employeeId, excludeUserId (optional)
 * Requires agency context
 */
router.get('/employee-id-exists', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const { employeeId, excludeUserId } = req.query;
  const agencyDatabase = req.user?.agencyDatabase || req.agencyDatabase;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      error: 'Employee ID parameter is required',
      message: 'Employee ID parameter is required',
    });
  }

  if (!agencyDatabase) {
    return res.status(400).json({
      success: false,
      error: 'Agency context is required',
      message: 'Agency context is required',
    });
  }

  const exists = await validationService.checkEmployeeIdExists(
    employeeId,
    agencyDatabase,
    excludeUserId || null,
    req
  );

  res.json({
    success: true,
    exists,
    message: exists ? 'Employee ID already exists' : 'Employee ID is available',
  });
}));

/**
 * GET /api/validation/holiday-exists
 * Check if holiday exists on date
 * Query params: date (YYYY-MM-DD), excludeHolidayId (optional)
 * Requires agency context
 */
router.get('/holiday-exists', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const { date, excludeHolidayId } = req.query;
  const agencyDatabase = req.user?.agencyDatabase || req.agencyDatabase;

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date parameter is required',
      message: 'Date parameter is required',
    });
  }

  if (!agencyDatabase) {
    return res.status(400).json({
      success: false,
      error: 'Agency context is required',
      message: 'Agency context is required',
    });
  }

  const exists = await validationService.checkHolidayExists(
    date,
    agencyDatabase,
    excludeHolidayId || null,
    req
  );

  res.json({
    success: true,
    exists,
    message: exists ? 'Holiday already exists on this date' : 'Date is available',
  });
}));

module.exports = router;

