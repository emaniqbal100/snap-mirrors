import { Request, Response } from 'express';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';
import { query } from '../config/database.js';

// GET all reviews (admin)
export async function listReviewsAdmin(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT r.*, p.name as product_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );
    return sendSuccess(res, result.rows, 'Reviews fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch reviews', error);
  }
}

// GET reviews for public (only published)
export async function listReviewsPublic(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT r.*, p.name as product_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       WHERE r.is_published = true
       ORDER BY r.created_at DESC`
    );
    return sendSuccess(res, result.rows, 'Reviews fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch reviews', error);
  }
}

// GET single review (admin)
export async function getReviewAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.*, p.name as product_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Review not found');
    }

    return sendSuccess(res, result.rows[0], 'Review fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch review', error);
  }
}

// CREATE review (customer or admin)
export async function createReview(req: Request, res: Response) {
  try {
    const { product_id, customer_name, rating, content, is_published } = req.body;

    if (!product_id || !customer_name || !rating || !content) {
      return sendValidationError(res, 'Product, name, rating, and content required');
    }

    const result = await query(
      `INSERT INTO reviews (product_id, customer_name, rating, content, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, customer_name, rating, content, is_published || false]
    );

    return sendSuccess(res, result.rows[0], 'Review created successfully', 201);
  } catch (error) {
    return sendServerError(res, 'Failed to create review', error);
  }
}

// UPDATE review (admin)
export async function updateReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rating, content, is_published, is_featured } = req.body;

    const existing = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Review not found');
    }

    const result = await query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           content = COALESCE($2, content),
           is_published = COALESCE($3, is_published),
           is_featured = COALESCE($4, is_featured),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [rating || null, content || null, is_published !== undefined ? is_published : null, 
       is_featured !== undefined ? is_featured : null, id]
    );

    return sendSuccess(res, result.rows[0], 'Review updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update review', error);
  }
}

// TOGGLE published status (admin)
export async function toggleReviewStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Review not found');
    }

    const newStatus = !existing.rows[0].is_published;

    const result = await query(
      `UPDATE reviews 
       SET is_published = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [newStatus, id]
    );

    return sendSuccess(res, result.rows[0], 
      `Review ${newStatus ? 'published' : 'unpublished'} successfully`);
  } catch (error) {
    return sendServerError(res, 'Failed to toggle review status', error);
  }
}

// TOGGLE featured status (admin)
export async function toggleFeaturedStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Review not found');
    }

    const newStatus = !existing.rows[0].is_featured;

    const result = await query(
      `UPDATE reviews 
       SET is_featured = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [newStatus, id]
    );

    return sendSuccess(res, result.rows[0], 
      `Review ${newStatus ? 'featured' : 'unfeatured'} successfully`);
  } catch (error) {
    return sendServerError(res, 'Failed to toggle featured status', error);
  }
}

// DELETE review (admin)
export async function deleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Review not found');
    }

    await query('DELETE FROM reviews WHERE id = $1', [id]);

    return sendSuccess(res, null, 'Review deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete review', error);
  }
}

export default {
  listReviewsAdmin,
  listReviewsPublic,
  getReviewAdmin,
  createReview,
  updateReview,
  toggleReviewStatus,
  toggleFeaturedStatus,
  deleteReview,
};