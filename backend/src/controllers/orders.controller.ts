import { Request, Response } from 'express';
import { query } from '../config/database.js';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';
import { generateOrderNumber } from '../utils/helpers.js';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// ============================================
// PUBLIC (Customer - guest checkout, no login)
// ============================================

// POST /api/orders
export async function createOrder(req: Request, res: Response) {
  try {
    const {
      customer_email,
      customer_phone,
      customer_name,
      customer_address,
      customer_city,
      postal_code,
      payment_method, // 'online' | 'cod'
      notes,
      items, // [{ product_variant_id, quantity }]
    } = req.body;

    if (!customer_phone || !customer_name || !customer_address) {
      return sendValidationError(res, 'Name, phone and address are required');
    }
    if (!payment_method || !['online', 'cod'].includes(payment_method)) {
      return sendValidationError(res, 'payment_method must be "online" or "cod"');
    }
    if (!Array.isArray(items) || items.length === 0) {
      return sendValidationError(res, 'At least one item is required');
    }

    const variantIds = items.map((i: any) => i.product_variant_id);
    const variantsResult = await query(
      `SELECT pv.id, COALESCE(pv.price, p.base_price) as price
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.id = ANY($1::int[])`,
      [variantIds]
    );

    if (variantsResult.rows.length !== variantIds.length) {
      return sendError(res, 'NOT_FOUND', 'One or more products not found', 404);
    }

    const priceMap: Record<number, number> = {};
    for (const v of variantsResult.rows) {
      priceMap[v.id] = parseFloat(v.price);
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += priceMap[item.product_variant_id] * item.quantity;
    }

    const shipping_fee = 415;
    const total_amount = subtotal + shipping_fee;
    const order_number = generateOrderNumber();

    const orderResult = await query(
      `INSERT INTO orders
        (order_number, customer_email, customer_phone, customer_name,
         customer_address, customer_city, postal_code, payment_method,
         subtotal, shipping_fee, total_amount, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
       RETURNING *`,
      [
        order_number,
        customer_email || null,
        customer_phone,
        customer_name,
        customer_address,
        customer_city || null,
        postal_code || null,
        payment_method,
        subtotal,
        shipping_fee,
        total_amount,
        notes || null,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_variant_id, item.quantity, priceMap[item.product_variant_id]]
      );
    }

    await query(
      `INSERT INTO payments (order_id, method, status, amount)
       VALUES ($1, $2, 'pending', $3)`,
      [order.id, payment_method, total_amount]
    );

    return sendSuccess(res, order, 'Order placed successfully', 201);
  } catch (error: any) {
    console.error('Error creating order:', error);
    return sendServerError(res, 'Failed to create order', error);
  }
}

// POST /api/orders/track
export async function trackOrder(req: Request, res: Response) {
  try {
    const { order_id, contact } = req.body;

    if (!order_id || !contact) {
      return sendValidationError(res, 'Order ID and phone/email required');
    }

    const result = await query(
      `SELECT * FROM orders WHERE id = $1 AND (customer_email = $2 OR customer_phone = $2)`,
      [order_id, contact]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    const itemsResult = await query(
      `SELECT oi.*, pv.size, pv.color, p.name as product_name
       FROM order_items oi
       JOIN product_variants pv ON oi.product_variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = $1`,
      [order_id]
    );

    return sendSuccess(
      res,
      { order: result.rows[0], items: itemsResult.rows },
      'Order fetched successfully'
    );
  } catch (error) {
    return sendServerError(res, 'Failed to track order', error);
  }
}

// ============================================
// ADMIN (requires login)
// ============================================

// GET /api/admin/orders
export async function listOrdersAdmin(req: Request, res: Response) {
  try {
    const { status, payment_method, search } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(status);
    }
    if (payment_method) {
      conditions.push(`o.payment_method = $${idx++}`);
      params.push(payment_method);
    }
    if (search) {
      conditions.push(`(o.customer_name ILIKE $${idx} OR o.customer_phone ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT o.*,
              json_agg(json_build_object(
                'id', oi.id, 'product_variant_id', oi.product_variant_id,
                'quantity', oi.quantity, 'unit_price', oi.unit_price
              )) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      params
    );

    return sendSuccess(res, result.rows, 'Orders fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch orders', error);
  }
}

// GET /api/admin/orders/:id
export async function getOrderAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT o.*,
              json_agg(json_build_object(
                'id', oi.id, 'product_variant_id', oi.product_variant_id,
                'quantity', oi.quantity, 'unit_price', oi.unit_price
              )) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    const paymentResult = await query('SELECT * FROM payments WHERE order_id = $1', [id]);

    return sendSuccess(
      res,
      { ...result.rows[0], payment: paymentResult.rows[0] || null },
      'Order fetched successfully'
    );
  } catch (error) {
    return sendServerError(res, 'Failed to fetch order', error);
  }
}

// PATCH /api/admin/orders/:id/status
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, tracking_number, estimated_delivery_date } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return sendValidationError(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const result = await query(
      `UPDATE orders
       SET status = $1,
           tracking_number = COALESCE($2, tracking_number),
           estimated_delivery_date = COALESCE($3, estimated_delivery_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, tracking_number || null, estimated_delivery_date || null, id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    return sendSuccess(res, result.rows[0], 'Order status updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update order', error);
  }
}

// DELETE /api/admin/orders/:id
export async function deleteOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    await query('DELETE FROM order_items WHERE order_id = $1', [id]);
    await query('DELETE FROM payments WHERE order_id = $1', [id]);
    await query('DELETE FROM orders WHERE id = $1', [id]);

    return sendSuccess(res, null, 'Order deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete order', error);
  }
}

export default {
  createOrder,
  trackOrder,
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatus,
  deleteOrder,
};