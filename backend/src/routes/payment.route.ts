import { Router } from 'express';
import { getPaymentMethods, uploadPaymentProof } from '../controllers/payment.controller.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public routes (no login required - guest checkout)
router.get('/methods', getPaymentMethods);
router.post('/:order_id/proof', upload.single('proof'), uploadPaymentProof);

export default router;
