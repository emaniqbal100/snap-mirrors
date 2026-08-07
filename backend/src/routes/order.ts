import { Router } from 'express';
import * as ordersController from '../controllers/order.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// PUBLIC ROUTES
router.post('/', ordersController.createOrder); // Customer creates order
router.post('/track', ordersController.trackOrder); // Customer tracks order

// ADMIN ROUTES
router.get('/', authMiddleware, adminMiddleware, ordersController.getAllOrders);
router.get('/:id', authMiddleware, adminMiddleware, ordersController.getOrderById);
router.put('/:id/status', authMiddleware, adminMiddleware, ordersController.updateOrderStatus);

export default router;