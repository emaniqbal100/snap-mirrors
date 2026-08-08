import { Router } from 'express';
import { listProductsPublic, getProductBySlug } from '../controllers/product.controller.js';

const router = Router();

router.get('/', listProductsPublic);
router.get('/:slug', getProductBySlug);

export default router;