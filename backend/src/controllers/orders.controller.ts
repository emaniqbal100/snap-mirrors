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
              json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 
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
              json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 
                                        'quantity', oi.quantity, 'unit_price', oi.unit_price)) AS items,
              json_agg(json_build_object('status', osh.status_to, 'message', osh.status_message, 
                                        'created_at', osh.created_at)) AS history
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN order_status_history osh ON o.id = osh.order_id
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
    const { order_status, tracking_number, estimated_delivery_date, status_message } = req.body;

    if (!order_status) {
      return sendValidationError(res, 'Status is required');
    }

    // Update order
    const result = await query(
      `UPDATE orders 
       SET order_status = $1, 
           tracking_number = $2, 
           estimated_delivery_date = $3,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [order_status, tracking_number || null, estimated_delivery_date || null, id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Order not found');
    }

    // Log status change
    await query(
      `INSERT INTO order_status_history 
       (order_id, status_to, status_message, tracking_number, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, order_status, status_message || `Order status updated to ${order_status}`, 
       tracking_number || null, estimated_delivery_date || null]
    );

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

    await query('DELETE FROM order_items WHERE order_id = $1', [id]);
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