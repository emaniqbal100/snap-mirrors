import { Request, Response } from 'express';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';
import { query } from '../config/database.js';

// GET all reviews (admin)
// GET all reviews (admin)
export async function listReviewsAdmin(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT r.*, 
              p.name as product_name,
              r.customer_name as reviewer_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );

    return sendSuccess(
      res,
      result.rows,
      'Reviews fetched successfully'
    );
  } catch (error) {
    console.error('Error fetching admin reviews:', error);

    return sendServerError(
      res,
      'Failed to fetch reviews',
      error
    );
  }
}


// GET reviews for public
export async function listReviewsPublic(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT r.*, 
              p.name as product_name,
              r.customer_name as reviewer_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );

    return sendSuccess(
      res,
      result.rows,
      'Reviews fetched successfully'
    );
  } catch (error) {
    console.error('Error fetching public reviews:', error);

    return sendServerError(
      res,
      'Failed to fetch reviews',
      error
    );
  }
}
// GET single review (admin)
export async function getReviewAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.*, p.name as product_name,
              u.name as reviewer_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       LEFT JOIN users u ON r.user_id = u.id
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
    const {
      product_id,
      customer_name,
      rating,
      comment,
    } = req.body;

    console.log('\n========== CREATE REVIEW ==========');
    console.log('Request body:', req.body);
    console.log('product_id:', product_id);
    console.log('customer_name:', customer_name);
    console.log('rating:', rating);
    console.log('comment:', comment);

    if (!product_id || !customer_name || !rating || !comment) {
      console.error('VALIDATION ERROR: Missing required field');

      return sendValidationError(
        res,
        'Product ID, customer name, rating, and comment are required'
      );
    }

    if (rating < 1 || rating > 5) {
      console.error('VALIDATION ERROR: Invalid rating:', rating);

      return sendValidationError(
        res,
        'Rating must be between 1 and 5'
      );
    }

    console.log('Executing INSERT...');

    const result = await query(
      `INSERT INTO reviews
        (product_id, customer_name, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        product_id,
        customer_name,
        rating,
        comment,
      ]
    );

    console.log('REVIEW CREATED SUCCESSFULLY:');
    console.log(result.rows[0]);
    console.log('===================================\n');

    return sendSuccess(
      res,
      result.rows[0],
      'Review created successfully',
      201
    );

  } catch (error: any) {
    console.error(
      '🔥 REVIEW ERROR:',
      JSON.stringify(
        {
          message: error?.message ?? null,
          code: error?.code ?? null,
          detail: error?.detail ?? null,
          hint: error?.hint ?? null,
          table: error?.table ?? null,
          column: error?.column ?? null,
          constraint: error?.constraint ?? null,
          dataType: error?.dataType ?? null,
          stack: error?.stack ?? null,
        },
        null,
        2
      )
    );

    return sendServerError(
      res,
      'Failed to create review',
      error
    );
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
    console.error('Error updating review:', error);
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
