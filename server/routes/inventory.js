/**
 * Inventory Management Routes
 * Handles all inventory operations
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAgencyContext } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const inventoryService = require('../services/inventoryService');
const { cacheMiddleware } = require('../services/cacheService');

/**
 * GET /api/inventory/warehouses
 * Get all warehouses for the agency
 */
router.get('/warehouses', authenticate, requireAgencyContext, cacheMiddleware(300), asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  const warehouses = await inventoryService.getWarehouses(agencyDatabase, agencyId);

  res.json({
    success: true,
    data: warehouses,
  });
}));

/**
 * POST /api/inventory/warehouses
 * Create a new warehouse
 */
router.post('/warehouses', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const userId = req.user.id;

  const warehouse = await inventoryService.createWarehouse(
    agencyDatabase,
    { ...req.body, agency_id: agencyId },
    userId
  );

  res.json({
    success: true,
    data: warehouse,
    message: 'Warehouse created successfully',
  });
}));

/**
 * GET /api/inventory/products
 * Get all products with optional filters
 */
router.get('/products', authenticate, requireAgencyContext, cacheMiddleware(300), asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  const filters = {
    category_id: req.query.category_id,
    is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
    search: req.query.search,
    limit: req.query.limit ? parseInt(req.query.limit) : undefined,
  };

  const products = await inventoryService.getProducts(agencyDatabase, agencyId, filters);

  res.json({
    success: true,
    data: products,
  });
}));

/**
 * POST /api/inventory/products
 * Create a new product
 */
router.post('/products', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const userId = req.user.id;

  const product = await inventoryService.createProduct(
    agencyDatabase,
    { ...req.body, agency_id: agencyId },
    userId
  );

  res.json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
}));

/**
 * GET /api/inventory/products/:productId/levels
 * Get inventory levels for a product across all warehouses
 */
router.get('/products/:productId/levels', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const { productId } = req.params;
  const variantId = req.query.variant_id || null;

  const levels = await inventoryService.getInventoryLevels(agencyDatabase, agencyId, productId, variantId);

  res.json({
    success: true,
    data: levels,
  });
}));

/**
 * POST /api/inventory/transactions
 * Create an inventory transaction (stock movement)
 */
router.post('/transactions', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;
  const userId = req.user.id;

  const transaction = await inventoryService.createInventoryTransaction(
    agencyDatabase,
    { ...req.body, agency_id: agencyId },
    userId
  );

  res.json({
    success: true,
    data: transaction,
    message: 'Inventory transaction created successfully',
  });
}));

/**
 * GET /api/inventory/alerts/low-stock
 * Get low stock alerts
 */
router.get('/alerts/low-stock', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const agencyDatabase = req.user.agencyDatabase;

  const alerts = await inventoryService.getLowStockAlerts(agencyDatabase, agencyId);

  res.json({
    success: true,
    data: alerts,
  });
}));

/**
 * POST /api/inventory/products/:productId/generate-code
 * Generate barcode or QR code for a product
 */
router.post('/products/:productId/generate-code', authenticate, requireAgencyContext, asyncHandler(async (req, res) => {
  const agencyDatabase = req.user.agencyDatabase;
  const { productId } = req.params;
  const { codeType } = req.body; // 'barcode' or 'qr'

  const code = await inventoryService.generateProductCode(agencyDatabase, productId, codeType || 'barcode');

  res.json({
    success: true,
    data: { code, codeType: codeType || 'barcode' },
    message: 'Product code generated successfully',
  });
}));

module.exports = router;
