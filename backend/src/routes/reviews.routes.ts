import { Router } from 'express';
import { listReviewsPublic } from '../controllers/review.controller.js';

const router = Router();

// Public - view reviews only (submission goes through admin for now, since user_id is required)
router.get('/', listReviewsPublic);

export default router;