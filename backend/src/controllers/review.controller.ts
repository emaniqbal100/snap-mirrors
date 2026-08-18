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

// GET reviews for public
export async function listReviewsPublic(req: Request, res: Response) {
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

// CREATE review
export async function createReview(req: Request, res: Response) {
  try {
    const { product_id, user_id, rating, comment } = req.body;

    if (!product_id || !user_id || !rating || !comment) {
      return sendValidationError(res, 'Product ID, user ID, rating, and comment required');
    }

    if (rating < 1 || rating > 5) {
      return sendValidationError(res, 'Rating must be between 1 and 5');
    }

    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product_id, user_id, rating, comment]
    );

    return sendSuccess(res, result.rows[0], 'Review created successfully', 201);
  } catch (error) {
    return sendServerError(res, 'Failed to create review', error);
  }
}

// UPDATE review
export async function updateReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const existing = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendNotFound(res, 'Review not found');
    }

    const result = await query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment)
       WHERE id = $3 
       RETURNING *`,
      [rating || null, comment || null, id]
    );

    return sendSuccess(res, result.rows[0], 'Review updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update review', error);
  }
}

// DELETE review
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
  deleteReview,
};