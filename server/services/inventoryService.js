/**
 * Inventory Management Service
 * Handles all inventory operations: products, warehouses, stock management
 */

const { parseDatabaseUrl } = require('../utils/poolManager');
const { Pool } = require('pg');
const crypto = require('crypto');
const { ensureInventorySchema } = require('../utils/schema/inventorySchema');

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Get agency database connection
 */
async function getAgencyConnection(agencyDatabase) {
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
  const client = await agencyPool.connect();
  // Attach pool to client for cleanup
  client.pool = agencyPool;
  return client;
}

/**
 * Create a new warehouse
 */
async function createWarehouse(agencyDatabase, warehouseData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const result = await client.query(
      `INSERT INTO public.warehouses (
        id, agency_id, code, name, address, city, state, postal_code, country,
        contact_person, phone, email, is_active, is_primary, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        generateUUID(),
        warehouseData.agency_id,
        warehouseData.code,
        warehouseData.name,
        warehouseData.address || null,
        warehouseData.city || null,
        warehouseData.state || null,
        warehouseData.postal_code || null,
        warehouseData.country || 'India',
        warehouseData.contact_person || null,
        warehouseData.phone || null,
        warehouseData.email || null,
        warehouseData.is_active !== false,
        warehouseData.is_primary || false,
      ]
    );
    return result.rows[0];
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Get all warehouses for an agency
 */
async function getWarehouses(agencyDatabase, agencyId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const result = await client.query(
      'SELECT * FROM public.warehouses WHERE agency_id = $1 ORDER BY is_primary DESC, name ASC',
      [agencyId]
    );
    return result.rows;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Create a new product
 */
async function createProduct(agencyDatabase, productData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const result = await client.query(
      `INSERT INTO public.products (
        id, agency_id, sku, name, description, category_id, brand, unit_of_measure,
        barcode, qr_code, weight, dimensions, image_url, is_active, is_trackable,
        track_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        generateUUID(),
        productData.agency_id,
        productData.sku,
        productData.name,
        productData.description || null,
        productData.category_id || null,
        productData.brand || null,
        productData.unit_of_measure || 'pcs',
        productData.barcode || null,
        productData.qr_code || null,
        productData.weight || null,
        productData.dimensions || null,
        productData.image_url || null,
        productData.is_active !== false,
        productData.is_trackable || false,
        productData.track_by || 'none',
      ]
    );
    return result.rows[0];
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Get all products for an agency
 */
async function getProducts(agencyDatabase, agencyId, filters = {}) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    let query = 'SELECT * FROM public.products WHERE agency_id = $1';
    const params = [agencyId];
    let paramIndex = 2;

    if (filters.category_id) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.is_active);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR barcode ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Get inventory levels for a product across all warehouses
 */
async function getInventoryLevels(agencyDatabase, agencyId, productId, variantId = null) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    let query = `
      SELECT 
        i.*,
        p.name as product_name,
        p.sku as product_sku,
        w.name as warehouse_name,
        w.code as warehouse_code
      FROM public.inventory i
      JOIN public.products p ON i.product_id = p.id
      JOIN public.warehouses w ON i.warehouse_id = w.id
      WHERE i.agency_id = $1 AND i.product_id = $2
    `;
    const params = [agencyId, productId];

    if (variantId) {
      query += ' AND i.variant_id = $3';
      params.push(variantId);
    } else {
      query += ' AND i.variant_id IS NULL';
    }

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Create inventory transaction (stock movement)
 */
async function createInventoryTransaction(agencyDatabase, transactionData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    await client.query('BEGIN');

    // Get or create inventory record
    let inventoryResult = await client.query(
      `SELECT * FROM public.inventory 
       WHERE product_id = $1 
       AND COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($2, '00000000-0000-0000-0000-000000000000'::uuid)
       AND warehouse_id = $3`,
      [transactionData.product_id, transactionData.variant_id || null, transactionData.warehouse_id]
    );

    let inventoryId;
    if (inventoryResult.rows.length === 0) {
      // Create inventory record
      const newInventory = await client.query(
        `INSERT INTO public.inventory (
          id, agency_id, product_id, variant_id, warehouse_id, quantity, 
          reserved_quantity, reorder_point, reorder_quantity, valuation_method,
          average_cost, last_cost, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, $8, 0, 0, NOW(), NOW())
        RETURNING id`,
        [
          generateUUID(),
          transactionData.agency_id,
          transactionData.product_id,
          transactionData.variant_id || null,
          transactionData.warehouse_id,
          transactionData.reorder_point || 0,
          transactionData.reorder_quantity || 0,
          transactionData.valuation_method || 'weighted_average',
        ]
      );
      inventoryId = newInventory.rows[0].id;
    } else {
      inventoryId = inventoryResult.rows[0].id;
    }

    // Calculate new quantity based on transaction type
    const currentInventory = inventoryResult.rows[0] || { quantity: 0, reserved_quantity: 0 };
    let newQuantity = parseFloat(currentInventory.quantity) || 0;
    
    if (transactionData.transaction_type === 'IN' || transactionData.transaction_type === 'RETURN') {
      newQuantity += parseFloat(transactionData.quantity);
    } else if (transactionData.transaction_type === 'OUT') {
      newQuantity -= parseFloat(transactionData.quantity);
      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }
    } else if (transactionData.transaction_type === 'ADJUSTMENT') {
      newQuantity = parseFloat(transactionData.quantity);
    }

    // Update inventory quantity
    await client.query(
      `UPDATE public.inventory 
       SET quantity = $1, 
           last_movement_date = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [newQuantity, inventoryId]
    );

    // Update average cost for weighted average method
    if (transactionData.unit_cost && transactionData.transaction_type === 'IN') {
      const currentCost = parseFloat(currentInventory.average_cost) || 0;
      const currentQty = parseFloat(currentInventory.quantity) || 0;
      const newCost = parseFloat(transactionData.unit_cost);
      const newQty = parseFloat(transactionData.quantity);

      if (currentQty + newQty > 0) {
        const weightedAverage = ((currentCost * currentQty) + (newCost * newQty)) / (currentQty + newQty);
        await client.query(
          'UPDATE public.inventory SET average_cost = $1, last_cost = $2 WHERE id = $3',
          [weightedAverage, newCost, inventoryId]
        );
      }
    }

    // Create transaction record
    const transactionResult = await client.query(
      `INSERT INTO public.inventory_transactions (
        id, agency_id, inventory_id, transaction_type, quantity, unit_cost,
        reference_type, reference_id, from_warehouse_id, to_warehouse_id,
        serial_numbers, batch_number, expiry_date, notes, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *`,
      [
        generateUUID(),
        transactionData.agency_id,
        inventoryId,
        transactionData.transaction_type,
        transactionData.quantity,
        transactionData.unit_cost || null,
        transactionData.reference_type || null,
        transactionData.reference_id || null,
        transactionData.from_warehouse_id || null,
        transactionData.to_warehouse_id || null,
        transactionData.serial_numbers || null,
        transactionData.batch_number || null,
        transactionData.expiry_date || null,
        transactionData.notes || null,
        userId,
      ]
    );

    await client.query('COMMIT');
    return transactionResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Get low stock alerts (products below reorder point)
 */
async function getLowStockAlerts(agencyDatabase, agencyId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    // Ensure inventory schema exists before querying
    await ensureInventorySchema(client);
    
    const result = await client.query(
      `SELECT 
        i.*,
        p.name as product_name,
        p.sku as product_sku,
        w.name as warehouse_name,
        (i.reorder_point - i.available_quantity) as shortage
      FROM public.inventory i
      JOIN public.products p ON i.product_id = p.id
      JOIN public.warehouses w ON i.warehouse_id = w.id
      WHERE i.agency_id = $1 
      AND i.available_quantity <= i.reorder_point
      AND i.reorder_point > 0
      ORDER BY shortage DESC`,
      [agencyId]
    );
    return result.rows;
  } catch (error) {
    // If table doesn't exist yet, return empty array
    if (error.message && error.message.includes('does not exist')) {
      console.warn(`[Inventory] Table not found, returning empty alerts: ${error.message}`);
      return [];
    }
    throw error;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Generate barcode/QR code for product
 */
async function generateProductCode(agencyDatabase, productId, codeType = 'barcode') {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    // Get product
    const productResult = await client.query(
      'SELECT * FROM public.products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    const product = productResult.rows[0];
    
    // Generate code (in production, use a barcode library)
    const code = product.barcode || `PROD-${product.sku}-${Date.now()}`;
    
    // Update product with code
    if (codeType === 'barcode') {
      await client.query(
        'UPDATE public.products SET barcode = $1, updated_at = NOW() WHERE id = $2',
        [code, productId]
      );
    } else {
      await client.query(
        'UPDATE public.products SET qr_code = $1, updated_at = NOW() WHERE id = $2',
        [code, productId]
      );
    }

    return code;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

module.exports = {
  createWarehouse,
  getWarehouses,
  createProduct,
  getProducts,
  getInventoryLevels,
  createInventoryTransaction,
  getLowStockAlerts,
  generateProductCode,
};
