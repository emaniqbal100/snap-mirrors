import { Request, Response } from 'express';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';
import { query } from '../config/database.js';

// GET all orders (admin)
export async function listOrdersAdmin(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'product_variant_id', oi.product_variant_id, 
                                        'quantity', oi.quantity, 'unit_price', oi.unit_price)) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    return sendSuccess(res, result.rows, 'Orders fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch orders', error);
  }
}

// GET single order (admin)
export async function getOrderAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'product_variant_id', oi.product_variant_id, 
                                        'quantity', oi.quantity, 'unit_price', oi.unit_price)) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    return sendSuccess(res, result.rows[0], 'Order fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch order', error);
  }
}

// UPDATE order status (admin)
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return sendValidationError(res, 'Status is required');
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendValidationError(res, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Update order
    const result = await query(
      `UPDATE orders 
       SET status = $1, 
           notes = $2,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, notes || null, id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    return sendSuccess(res, result.rows[0], 'Order status updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update order', error);
  }
}

// DELETE order (admin)
export async function deleteOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    // Delete order items first (foreign key constraint)
    await query('DELETE FROM order_items WHERE order_id = $1', [id]);
    
    // Then delete order
    await query('DELETE FROM orders WHERE id = $1', [id]);

    return sendSuccess(res, null, 'Order deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete order', error);
  }
}

export default {
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatus,
  deleteOrder,
};