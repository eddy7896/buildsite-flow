/**
 * Procurement Management Service
 * Handles all procurement operations: requisitions, purchase orders, GRN, RFQ
 */

const { parseDatabaseUrl } = require('../utils/poolManager');
const { Pool } = require('pg');
const crypto = require('crypto');

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
 * Generate requisition number
 */
async function generateRequisitionNumber(agencyDatabase, agencyId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const year = new Date().getFullYear();
    const result = await client.query(
      `SELECT COUNT(*) as count 
       FROM public.purchase_requisitions 
       WHERE agency_id = $1 
       AND requisition_number LIKE $2`,
      [agencyId, `PR-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `PR-${year}-${String(count).padStart(5, '0')}`;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Generate PO number
 */
async function generatePONumber(agencyDatabase, agencyId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const year = new Date().getFullYear();
    const result = await client.query(
      `SELECT COUNT(*) as count 
       FROM public.purchase_orders 
       WHERE agency_id = $1 
       AND po_number LIKE $2`,
      [agencyId, `PO-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `PO-${year}-${String(count).padStart(5, '0')}`;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Generate GRN number
 */
async function generateGRNNumber(agencyDatabase, agencyId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    const year = new Date().getFullYear();
    const result = await client.query(
      `SELECT COUNT(*) as count 
       FROM public.goods_receipts 
       WHERE agency_id = $1 
       AND grn_number LIKE $2`,
      [agencyId, `GRN-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `GRN-${year}-${String(count).padStart(5, '0')}`;
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Create purchase requisition
 */
async function createPurchaseRequisition(agencyDatabase, requisitionData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    await client.query('BEGIN');

    // Generate requisition number
    const requisitionNumber = await generateRequisitionNumber(agencyDatabase, requisitionData.agency_id);

    // Create requisition
    const requisitionResult = await client.query(
      `INSERT INTO public.purchase_requisitions (
        id, agency_id, requisition_number, requested_by, department_id,
        status, priority, required_date, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        generateUUID(),
        requisitionData.agency_id,
        requisitionNumber,
        userId,
        requisitionData.department_id || null,
        requisitionData.status || 'draft',
        requisitionData.priority || 'normal',
        requisitionData.required_date || null,
        requisitionData.notes || null,
      ]
    );

    const requisition = requisitionResult.rows[0];
    let totalAmount = 0;

    // Create requisition items
    if (requisitionData.items && requisitionData.items.length > 0) {
      for (const item of requisitionData.items) {
        const itemResult = await client.query(
          `INSERT INTO public.purchase_requisition_items (
            id, requisition_id, product_id, description, quantity,
            unit_price, unit_of_measure, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *`,
          [
            generateUUID(),
            requisition.id,
            item.product_id || null,
            item.description,
            item.quantity,
            item.unit_price || null,
            item.unit_of_measure || 'pcs',
            item.notes || null,
          ]
        );
        // Calculate total for this item (total_price is a generated column, calculate manually)
        const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
        totalAmount += itemTotal;
      }

      // Update requisition total
      await client.query(
        'UPDATE public.purchase_requisitions SET total_amount = $1 WHERE id = $2',
        [totalAmount, requisition.id]
      );
      requisition.total_amount = totalAmount;
    }

    await client.query('COMMIT');
    return requisition;
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
 * Create purchase order from requisition
 */
async function createPurchaseOrder(agencyDatabase, poData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    await client.query('BEGIN');

    // Generate PO number
    const poNumber = await generatePONumber(agencyDatabase, poData.agency_id);

    // Calculate totals
    let subtotal = 0;
    if (poData.items && poData.items.length > 0) {
      for (const item of poData.items) {
        subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price || 0);
      }
    }

    const taxAmount = poData.tax_amount || 0;
    const shippingCost = poData.shipping_cost || 0;
    const discountAmount = poData.discount_amount || 0;
    const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;

    // Create PO
    const poResult = await client.query(
      `INSERT INTO public.purchase_orders (
        id, agency_id, po_number, requisition_id, supplier_id, status,
        order_date, expected_delivery_date, delivery_address, payment_terms,
        currency, exchange_rate, subtotal, tax_amount, shipping_cost,
        discount_amount, total_amount, notes, terms_conditions,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *`,
      [
        generateUUID(),
        poData.agency_id,
        poNumber,
        poData.requisition_id || null,
        poData.supplier_id,
        poData.status || 'draft',
        poData.order_date || new Date().toISOString().split('T')[0],
        poData.expected_delivery_date || null,
        poData.delivery_address || null,
        poData.payment_terms || null,
        poData.currency || 'INR',
        poData.exchange_rate || 1,
        subtotal,
        taxAmount,
        shippingCost,
        discountAmount,
        totalAmount,
        poData.notes || null,
        poData.terms_conditions || null,
        userId,
      ]
    );

    const po = poResult.rows[0];

    // Create PO items
    if (poData.items && poData.items.length > 0) {
      for (const item of poData.items) {
        await client.query(
          `INSERT INTO public.purchase_order_items (
            id, po_id, requisition_item_id, product_id, description,
            quantity, unit_price, unit_of_measure, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            generateUUID(),
            po.id,
            item.requisition_item_id || null,
            item.product_id || null,
            item.description,
            item.quantity,
            item.unit_price,
            item.unit_of_measure || 'pcs',
            item.notes || null,
          ]
        );
      }
    }

    await client.query('COMMIT');
    return po;
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
 * Create goods receipt (GRN)
 */
async function createGoodsReceipt(agencyDatabase, grnData, userId) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    await client.query('BEGIN');

    // Generate GRN number
    const grnNumber = await generateGRNNumber(agencyDatabase, grnData.agency_id);

    // Create GRN
    const grnResult = await client.query(
      `INSERT INTO public.goods_receipts (
        id, agency_id, grn_number, po_id, warehouse_id,
        received_date, received_by, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        generateUUID(),
        grnData.agency_id,
        grnNumber,
        grnData.po_id,
        grnData.warehouse_id,
        grnData.received_date || new Date().toISOString().split('T')[0],
        userId,
        grnData.status || 'pending',
        grnData.notes || null,
      ]
    );

    const grn = grnResult.rows[0];

    // Create GRN items
    if (grnData.items && grnData.items.length > 0) {
      for (const item of grnData.items) {
        await client.query(
          `INSERT INTO public.grn_items (
            id, grn_id, po_item_id, product_id, ordered_quantity,
            received_quantity, accepted_quantity, rejected_quantity,
            unit_price, batch_number, expiry_date, serial_numbers,
            quality_status, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
          [
            generateUUID(),
            grn.id,
            item.po_item_id,
            item.product_id || null,
            item.ordered_quantity,
            item.received_quantity,
            item.accepted_quantity || item.received_quantity,
            item.rejected_quantity || 0,
            item.unit_price || null,
            item.batch_number || null,
            item.expiry_date || null,
            item.serial_numbers || null,
            item.quality_status || 'passed',
            item.notes || null,
          ]
        );

        // Update PO item received quantity
        await client.query(
          `UPDATE public.purchase_order_items 
           SET received_quantity = received_quantity + $1 
           WHERE id = $2`,
          [item.accepted_quantity || item.received_quantity, item.po_item_id]
        );

        // Create inventory transaction for accepted quantity
        if (item.accepted_quantity > 0 && item.product_id) {
          const inventoryService = require('./inventoryService');
          await inventoryService.createInventoryTransaction(
            agencyDatabase,
            {
              agency_id: grnData.agency_id,
              product_id: item.product_id,
              warehouse_id: grnData.warehouse_id,
              transaction_type: 'IN',
              quantity: item.accepted_quantity,
              unit_cost: item.unit_price,
              reference_type: 'GOODS_RECEIPT',
              reference_id: grn.id,
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              serial_numbers: item.serial_numbers,
            },
            userId
          );
        }
      }

      // Update PO status based on received quantities
      const poItemsCheck = await client.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN received_quantity >= quantity THEN 1 ELSE 0 END) as completed
        FROM public.purchase_order_items
        WHERE po_id = $1`,
        [grnData.po_id]
      );

      const total = parseInt(poItemsCheck.rows[0].total);
      const completed = parseInt(poItemsCheck.rows[0].completed);

      let poStatus = 'partial';
      if (completed === total) {
        poStatus = 'received';
      } else if (completed > 0) {
        poStatus = 'partial';
      }

      await client.query(
        'UPDATE public.purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2',
        [poStatus, grnData.po_id]
      );
    }

    await client.query('COMMIT');
    return grn;
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
 * Get purchase requisitions
 */
async function getPurchaseRequisitions(agencyDatabase, agencyId, filters = {}) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    let query = `
      SELECT 
        pr.*,
        u.email as requested_by_email,
        p.full_name as requested_by_name
      FROM public.purchase_requisitions pr
      LEFT JOIN public.users u ON pr.requested_by = u.id
      LEFT JOIN public.profiles p ON pr.requested_by = p.user_id
      WHERE pr.agency_id = $1
    `;
    const params = [agencyId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND pr.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY pr.created_at DESC';

    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    // If table doesn't exist or other error, return empty array
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      // Table doesn't exist, return empty array
      console.log('Purchase requisitions table does not exist yet');
      return [];
    }
    console.error('Error fetching purchase requisitions:', error.message);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Get purchase orders
 */
async function getPurchaseOrders(agencyDatabase, agencyId, filters = {}) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    let query = `
      SELECT 
        po.*,
        s.name as supplier_name,
        s.code as supplier_code
      FROM public.purchase_orders po
      LEFT JOIN public.suppliers s ON po.supplier_id = s.id
      WHERE po.agency_id = $1
    `;
    const params = [agencyId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND po.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.supplier_id) {
      query += ` AND po.supplier_id = $${paramIndex}`;
      params.push(filters.supplier_id);
      paramIndex++;
    }

    query += ' ORDER BY po.created_at DESC';

    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    // If table doesn't exist or other error, return empty array
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      // Table doesn't exist, return empty array
      console.log('Purchase orders table does not exist yet');
      return [];
    }
    console.error('Error fetching purchase orders:', error.message);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

/**
 * Get goods receipts
 */
async function getGoodsReceipts(agencyDatabase, agencyId, filters = {}) {
  const client = await getAgencyConnection(agencyDatabase);
  try {
    let query = `
      SELECT 
        gr.*,
        po.po_number,
        w.name as warehouse_name,
        w.code as warehouse_code
      FROM public.goods_receipts gr
      LEFT JOIN public.purchase_orders po ON gr.po_id = po.id
      LEFT JOIN public.warehouses w ON gr.warehouse_id = w.id
      WHERE gr.agency_id = $1
    `;
    const params = [agencyId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND gr.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY gr.created_at DESC';

    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    // If table doesn't exist or other error, return empty array
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      // Table doesn't exist, return empty array
      console.log('Goods receipts table does not exist yet');
      return [];
    }
    console.error('Error fetching goods receipts:', error.message);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  } finally {
    client.release();
    if (client.pool) {
      await client.pool.end();
    }
  }
}

module.exports = {
  createPurchaseRequisition,
  createPurchaseOrder,
  createGoodsReceipt,
  getPurchaseRequisitions,
  getPurchaseOrders,
  getGoodsReceipts,
  generateRequisitionNumber,
  generatePONumber,
  generateGRNNumber,
};
