import { Router } from 'express';
import { listCategories, getCategoryBySlug } from '../controllers/category.controller.js';

const router = Router();

router.get('/', listCategories);
router.get('/:slug', getCategoryBySlug);

export default router;
