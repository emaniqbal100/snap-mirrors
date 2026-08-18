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
      `SELECT p.*, o.id as order_id
       FROM payments p
       JOIN orders o ON p.order_id = o.id
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
      `SELECT p.*, o.id as order_id
       FROM payments p
       JOIN orders o ON p.order_id = o.id
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
    const { order_id, method, amount } = req.body;

    if (!order_id || !method || !amount) {
      return sendValidationError(res, 'Order ID, method, and amount required');
    }

    // Validate method
    const validMethods = ['online', 'cod'];
    if (!validMethods.includes(method)) {
      return sendValidationError(res, `Method must be one of: ${validMethods.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO payments (order_id, method, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [order_id, method, amount]
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
    const { status, transaction_id } = req.body;

    if (!status) {
      return sendValidationError(res, 'Status is required');
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return sendValidationError(res, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await query(
      `UPDATE payments 
       SET status = $1, 
           transaction_id = $2,
           paid_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [status, transaction_id || null, id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Payment not found');
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