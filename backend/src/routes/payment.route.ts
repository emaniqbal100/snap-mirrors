import { Router } from 'express';
import {
  listPaymentsAdmin,
  getPaymentAdmin,
  verifyPayment,
  deletePayment,
} from '../controllers/payment.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listPaymentsAdmin);
router.get('/:id', getPaymentAdmin);
router.patch('/:id', verifyPayment);
router.delete('/:id', deletePayment);

export default router;