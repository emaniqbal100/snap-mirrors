import { Request, Response } from 'express';
import { query } from '../config/database.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';
import { generateOrderNumber } from '../utils/helpers.js';

// CREATE order (Customer/Frontend)
export async function createOrder(req: Request, res: Response) {
  try {
    const {
      customer_email,
      customer_phone,
      customer_name,
      delivery_address,
      city,
      postal_code,
      product_variant_id,
      quantity,
      payment_method_id,
    } = req.body;

    // Validation
    if (!customer_phone || !customer_name || !delivery_address || !city) {
      return sendValidationError(res, 'Missing required fields');
    }

    if (!product_variant_id || !quantity) {
      return sendValidationError(res, 'Product and quantity required');
    }

    // Generate order number
    const order_number = generateOrderNumber();

    // Get product price
    const productResult = await query(
      'SELECT variant_price FROM product_variants WHERE id = $1',
      [product_variant_id]
    );

    if (productResult.rows.length === 0) {
      return sendError(res, 'NOT_FOUND', 'Product not found', 404);
    }

    const unit_price = productResult.rows[0].variant_price;
    const subtotal = unit_price * quantity;
    const shipping_charges = 415; // Standard shipping
    const total_amount = subtotal + shipping_charges;

    // Create order
    const orderResult = await query(
      `INSERT INTO orders 
       (order_number, customer_email, customer_phone, customer_name, 
        delivery_address, city, postal_code, subtotal, shipping_charges, 
        total_amount, payment_method_id, order_status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        order_number,
        customer_email || null,
        customer_phone,
        customer_name,
        delivery_address,
        city,
        postal_code || null,
        subtotal,
        shipping_charges,
        total_amount,
        payment_method_id || 4, // Default to COD
        'pending',
        'pending',
      ]
    );

    const order_id = orderResult.rows[0].id;

    // Create order item
    await query(
      `INSERT INTO order_items 
       (order_id, product_variant_id, quantity, unit_price, line_total)
       VALUES ($1, $2, $3, $4, $5)`,
      [order_id, product_variant_id, quantity, unit_price, subtotal]
    );

    return sendSuccess(res, orderResult.rows[0], 'Order created successfully', 201);
  } catch (error: any) {
    console.error('Error creating order:', error);
    return sendError(res, error.message, 'Failed to create order', 500);
  }
}

// GET order by ID (Customer + Admin)
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendValidationError(res, 'Order ID is required');
    }

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
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }

    return sendSuccess(res, result.rows[0], 'Order fetched successfully');
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return sendError(res, error.message, 'Failed to fetch order', 500);
  }
}

// GET all orders (Admin only)
export async function getAllOrders(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'quantity', oi.quantity)) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );

    return sendSuccess(res, result.rows, 'Orders fetched successfully');
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return sendError(res, error.message, 'Failed to fetch orders', 500);
  }
}

// UPDATE order status (Admin only)
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { order_status, tracking_number, estimated_delivery_date } = req.body;

    if (!id) {
      return sendValidationError(res, 'Order ID is required');
    }

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
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }

    // Log status change
    await query(
      `INSERT INTO order_status_history 
       (order_id, status_from, status_to, status_message, tracking_number, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, null, order_status, `Order status updated to ${order_status}`, tracking_number || null, estimated_delivery_date || null]
    );

    return sendSuccess(res, result.rows[0], 'Order status updated successfully');
  } catch (error: any) {
    console.error('Error updating order:', error);
    return sendError(res, error.message, 'Failed to update order', 500);
  }
}

// TRACK order (Customer)
export async function trackOrder(req: Request, res: Response) {
  try {
    const { order_id, email } = req.body;

    if (!order_id || !email) {
      return sendValidationError(res, 'Order ID and email required');
    }

    const result = await query(
      'SELECT * FROM orders WHERE id = $1 AND (customer_email = $2 OR customer_phone = $2)',
      [order_id, email]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }

    // Get status history
    const history = await query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      [order_id]
    );

    return sendSuccess(
      res,
      {
        order: result.rows[0],
        history: history.rows,
      },
      'Order tracking fetched successfully'
    );
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return sendError(res, error.message, 'Failed to track order', 500);
  }
}

export default {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
};