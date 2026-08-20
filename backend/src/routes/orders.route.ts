import { Router } from 'express';
import { createOrder, trackOrder } from '../controllers/orders.controller.js';

const router = Router();

router.post('/', createOrder);
router.post('/track', trackOrder);

export default router;