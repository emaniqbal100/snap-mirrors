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

// GET available payment methods (public) - shows account numbers for JazzCash/EasyPaisa
export async function getPaymentMethods(req: Request, res: Response) {
  try {
    const { config } = await import('../config/env.js');

    const methods: any[] = [
      { id: 'cod', name: 'Cash on Delivery', enabled: true },
    ];

    if (config.JAZZCASH.ENABLED !== false) {
      methods.push({
        id: 'jazzcash',
        name: 'JazzCash',
        enabled: true,
        account_number: config.JAZZCASH.ACCOUNT,
        instructions: `Send the order total to this JazzCash number: ${config.JAZZCASH.ACCOUNT}. After sending, upload a screenshot and enter the transaction ID.`,
      });
    }

    if (config.EASYPAISA.ENABLED !== false) {
      methods.push({
        id: 'easypaisa',
        name: 'EasyPaisa',
        enabled: true,
        account_number: config.EASYPAISA.ACCOUNT,
        instructions: `Send the order total to this EasyPaisa number: ${config.EASYPAISA.ACCOUNT}. After sending, upload a screenshot and enter the transaction ID.`,
      });
    }

    if (config.BANK_TRANSFER.ENABLED !== false) {
      methods.push({
        id: 'bank_transfer',
        name: 'Bank Transfer',
        enabled: true,
        bank_name: config.BANK_TRANSFER.BANK_NAME,
        account_number: config.BANK_TRANSFER.ACCOUNT_NUMBER,
        account_holder: config.BANK_TRANSFER.ACCOUNT_HOLDER,
        instructions: `Transfer the order total to ${config.BANK_TRANSFER.BANK_NAME}, Account Title: ${config.BANK_TRANSFER.ACCOUNT_HOLDER}, Account Number: ${config.BANK_TRANSFER.ACCOUNT_NUMBER}. After sending, upload a screenshot and enter the transaction/reference ID.`,
      });
    }

    return sendSuccess(res, methods, 'Payment methods fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch payment methods', error);
  }
}

// POST upload payment proof for an order (public - guest checkout)
// multipart/form-data: file field "proof", plus transaction_id in body
export async function uploadPaymentProof(req: Request, res: Response) {
  try {
    const { order_id } = req.params;
    const { transaction_id } = req.body;
    const file = (req as any).file;

    if (!transaction_id) {
      return sendValidationError(res, 'transaction_id is required');
    }
    if (!file) {
      return sendValidationError(res, 'Payment screenshot (proof) is required');
    }

    const { uploadBufferToCloudinary } = await import('../config/cloudinary.js');
    const proofUrl = await uploadBufferToCloudinary(file.buffer, 'payment-proofs');

    const paymentResult = await query(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
      [order_id]
    );

    if (paymentResult.rows.length === 0) {
      return sendNotFound(res, 'No payment record found for this order');
    }

    const result = await query(
      `UPDATE payments
       SET proof_image = $1, transaction_id = $2
       WHERE id = $3
       RETURNING *`,
      [proofUrl, transaction_id, paymentResult.rows[0].id]
    );

    return sendSuccess(res, result.rows[0], 'Payment proof uploaded successfully. We will verify it shortly.');
  } catch (error) {
    return sendServerError(res, 'Failed to upload payment proof', error);
  }
}

export default {
  listPaymentsAdmin,
  getPaymentAdmin,
  initiatePayment,
  verifyPayment,
  deletePayment,
  getPaymentMethods,
  uploadPaymentProof,
};
