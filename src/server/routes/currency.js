/**
 * Currency Management Routes
 * Handles currency and exchange rate operations
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAgencyContext } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const currencyService = require('../services/currencyService');
const { success, databaseError, send, validationError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * GET /api/currency/currencies
 * Get all currencies with exchange rates
 */
router.get('/currencies', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;

  try {
    const currencies = await currencyService.getCurrencies(agencyDatabase);

    return send(res, success(
      currencies,
      'Currencies fetched successfully',
      { requestId: req.requestId }
    ));
  } catch (error) {
    logger.error('Error fetching currencies', {
      agencyDatabase,
      error: error.message,
      code: error.code,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Fetch currencies'));
  }
}));

/**
 * POST /api/currency/update-rates
 * Update exchange rates from external API
 */
router.post('/update-rates', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  try {
    const rates = await currencyService.updateExchangeRates(agencyDatabase, agencyId);

    return send(res, success(
      rates,
      'Exchange rates updated successfully',
      { requestId: req.requestId }
    ));
  } catch (error) {
    logger.error('Error updating exchange rates', {
      agencyId,
      agencyDatabase,
      error: error.message,
      code: error.code,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Update exchange rates'));
  }
}));

/**
 * POST /api/currency/convert
 * Convert amount between currencies
 */
router.post('/convert', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { amount, from_currency, to_currency } = req.body;

  if (!amount || !from_currency || !to_currency) {
    return send(res, validationError(
      'Amount, from_currency, and to_currency are required',
      { missing: ['amount', 'from_currency', 'to_currency'].filter(f => !req.body[f]) }
    ));
  }

  try {
    const converted = await currencyService.convertCurrency(
      agencyDatabase,
      amount,
      from_currency,
      to_currency
    );

    return send(res, success(
      {
        original_amount: parseFloat(amount),
        from_currency,
        to_currency,
        converted_amount: converted,
        exchange_rate: converted / parseFloat(amount),
      },
      'Currency converted successfully',
      { requestId: req.requestId }
    ));
  } catch (error) {
    logger.error('Error converting currency', {
      agencyDatabase,
      amount,
      from_currency,
      to_currency,
      error: error.message,
      requestId: req.requestId,
    });
    return send(res, databaseError(error, 'Convert currency'));
  }
}));

module.exports = router;
