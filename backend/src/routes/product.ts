import { Router } from 'express';
import * as productsController from '../controllers/product.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// PUBLIC ROUTES (Frontend can access)
router.get('/', productsController.getAllProducts);
router.get('/:id', productsController.getProductById);

// ADMIN ROUTES (Only admin can access)
router.post('/', authMiddleware, adminMiddleware, productsController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, productsController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, productsController.deleteProduct);

export default router;