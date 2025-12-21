/**
 * Procurement Management Routes
 * Handles all procurement operations
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAgencyContext } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const procurementService = require('../services/procurementService');
const { cacheMiddleware } = require('../services/cacheService');

/**
 * GET /api/procurement/requisitions
 * Get all purchase requisitions
 */
router.get('/requisitions', authenticate, requireAgencyContext, cacheMiddleware(300), asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  const filters = {
    status: req.query.status,
  };

  const requisitions = await procurementService.getPurchaseRequisitions(agencyDatabase, agencyId, filters);

  res.json({
    success: true,
    data: requisitions,
  });
}));

/**
 * POST /api/procurement/requisitions
 * Create a new purchase requisition
 */
router.post('/requisitions', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const userId = req.user.id;

  const requisition = await procurementService.createPurchaseRequisition(
    agencyDatabase,
    { ...req.body, agency_id: agencyId },
    userId
  );

  res.json({
    success: true,
    data: requisition,
    message: 'Purchase requisition created successfully',
  });
}));

/**
 * GET /api/procurement/purchase-orders
 * Get all purchase orders
 */
router.get('/purchase-orders', authenticate, requireAgencyContext, cacheMiddleware(300), asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  const filters = {
    status: req.query.status,
    supplier_id: req.query.supplier_id,
  };

  const purchaseOrders = await procurementService.getPurchaseOrders(agencyDatabase, agencyId, filters);

  res.json({
    success: true,
    data: purchaseOrders,
  });
}));

/**
 * POST /api/procurement/purchase-orders
 * Create a new purchase order
 */
router.post('/purchase-orders', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const userId = req.user.id;

  const purchaseOrder = await procurementService.createPurchaseOrder(
    agencyDatabase,
    { ...req.body, agency_id: agencyId },
    userId
  );

  res.json({
    success: true,
    data: purchaseOrder,
    message: 'Purchase order created successfully',
  });
}));

/**
 * GET /api/procurement/goods-receipts
 * Get all goods receipts
 */
router.get('/goods-receipts', authenticate, requireAgencyContext, cacheMiddleware(300), asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  const filters = {
    status: req.query.status,
  };

  const goodsReceipts = await procurementService.getGoodsReceipts(agencyDatabase, agencyId, filters);

  res.json({
    success: true,
    data: goodsReceipts,
  });
}));

/**
 * POST /api/procurement/goods-receipts
 * Create a new goods receipt (GRN)
 */
router.post('/goods-receipts', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const userId = req.user.id;

  const goodsReceipt = await procurementService.createGoodsReceipt(
    agencyDatabase,
    { ...req.body, agency_id: agencyId },
    userId
  );

  res.json({
    success: true,
    data: goodsReceipt,
    message: 'Goods receipt created successfully',
  });
}));

module.exports = router;
