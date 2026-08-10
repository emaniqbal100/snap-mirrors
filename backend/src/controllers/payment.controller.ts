import { Request, Response } from 'express';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';
import { query } from '../config/database.js';

// GET all payments (admin)
export async function listPaymentsAdmin(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT p.*, o.order_number, o.customer_name, pm.method_name
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN payment_methods pm ON p.payment_method_id = pm.id
       ORDER BY p.created_at DESC`
    );
    return sendSuccess(res, result.rows, 'Payments fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch payments', error);
  }
}

// GET single payment (admin)
export async function getPaymentAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.*, o.order_number, o.customer_name, pm.method_name
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN payment_methods pm ON p.payment_method_id = pm.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Payment not found');
    }

    return sendSuccess(res, result.rows[0], 'Payment fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch payment', error);
  }
}

// Initiate payment (customer or admin)
export async function initiatePayment(req: Request, res: Response) {
  try {
    const { order_id, payment_method_id, amount } = req.body;

    if (!order_id || !payment_method_id || !amount) {
      return sendValidationError(res, 'Order ID, payment method, and amount required');
    }

    const result = await query(
      `INSERT INTO payments (order_id, payment_method_id, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [order_id, payment_method_id, amount]
    );

    return sendSuccess(res, result.rows[0], 'Payment initiated successfully', 201);
  } catch (error) {
    return sendServerError(res, 'Failed to initiate payment', error);
  }
}

// Verify/Process payment (admin)
export async function verifyPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, transaction_id, notes } = req.body;

    if (!status) {
      return sendValidationError(res, 'Status is required');
    }

    const result = await query(
      `UPDATE payments 
       SET status = $1, 
           transaction_id = $2, 
           notes = $3,
           verified_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING *`,
      [status, transaction_id || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Payment not found');
    }

    // Update order payment status
    if (status === 'completed') {
      await query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2',
        ['completed', result.rows[0].order_id]
      );
    }

    return sendSuccess(res, result.rows[0], 'Payment verified successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to verify payment', error);
  }
}

// Delete payment (admin)
export async function deletePayment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM payments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Payment not found');
    }

    await query('DELETE FROM payments WHERE id = $1', [id]);

    return sendSuccess(res, null, 'Payment deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete payment', error);
  }
}

export default {
  listPaymentsAdmin,
  getPaymentAdmin,
  initiatePayment,
  verifyPayment,
  deletePayment,
};