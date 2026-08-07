import { Request, Response } from 'express';
import { query } from '../config/database.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

// GET all products (Frontend + Admin)
export async function getAllProducts(req: Request, res: Response) {
  try {
    const result = await query(
      'SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC'
    );
    return sendSuccess(res, result.rows, 'Products fetched successfully');
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return sendError(res, error.message, 'Failed to fetch products', 500);
  }
}

// GET product by ID (Frontend + Admin)
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendValidationError(res, 'Product ID is required');
    }

    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'NOT_FOUND', 'Product not found', 404);
    }

    return sendSuccess(res, result.rows[0], 'Product fetched successfully');
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return sendError(res, error.message, 'Failed to fetch product', 500);
  }
}

// CREATE product (Admin only)
export async function createProduct(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      category,
      base_price,
      has_led,
      has_touch_sensor,
      has_dimming,
      has_anti_fog,
      led_colors,
      glass_type,
      stock_quantity,
      main_image_url,
    } = req.body;

    // Validation
    if (!name || !base_price) {
      return sendValidationError(res, 'Name and price are required');
    }

    const result = await query(
      `INSERT INTO products 
       (name, description, category, base_price, has_led, has_touch_sensor, 
        has_dimming, has_anti_fog, led_colors, glass_type, stock_quantity, main_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        description || null,
        category || 'Smart Mirror',
        base_price,
        has_led !== false,
        has_touch_sensor !== false,
        has_dimming !== false,
        has_anti_fog !== false,
        led_colors || 'Daylight, Warm, Golden',
        glass_type || '4-5mm Copper-Free Silver',
        stock_quantity || 0,
        main_image_url || null,
      ]
    );

    return sendSuccess(res, result.rows[0], 'Product created successfully', 201);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return sendError(res, error.message, 'Failed to create product', 500);
  }
}

// UPDATE product (Admin only)
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return sendValidationError(res, 'Product ID is required');
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'description', 'category', 'base_price',
      'has_led', 'has_touch_sensor', 'has_dimming', 'has_anti_fog',
      'led_colors', 'glass_type', 'stock_quantity', 'main_image_url', 'is_active'
    ];

    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    if (fields.length === 0) {
      return sendValidationError(res, 'No valid fields to update');
    }

    let setClause = '';
    let values = [];
    fields.forEach((field, idx) => {
      setClause += `${field} = $${idx + 1}${idx < fields.length - 1 ? ', ' : ''}`;
      values.push(updates[field]);
    });

    values.push(id);
    const result = await query(
      `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return sendError(res, 'NOT_FOUND', 'Product not found', 404);
    }

    return sendSuccess(res, result.rows[0], 'Product updated successfully');
  } catch (error: any) {
    console.error('Error updating product:', error);
    return sendError(res, error.message, 'Failed to update product', 500);
  }
}

// DELETE product (Admin only)
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendValidationError(res, 'Product ID is required');
    }

    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'NOT_FOUND', 'Product not found', 404);
    }

    return sendSuccess(res, result.rows[0], 'Product deleted successfully');
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return sendError(res, error.message, 'Failed to delete product', 500);
  }
}

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};