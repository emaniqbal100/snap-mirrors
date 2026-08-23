import { Router } from 'express';
import { listAdmins, createAdmin, toggleAdminStatus } from '../controllers/admin.controller.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import {
  listProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import {
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orders.controller.js';
import {
  listPaymentsAdmin,
  getPaymentAdmin,
  verifyPayment,
  deletePayment,
} from '../controllers/payment.controller.js';
import {
  listReviewsAdmin,
  getReviewAdmin,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Manage Admins
router.get('/users', listAdmins);
router.post('/users', createAdmin);
router.patch('/users/:id', toggleAdminStatus);

// Categories
router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Products
router.get('/products', listProductsAdmin);
router.get('/products/:id', getProductById);
router.post('/products', upload.single('image'), createProduct);
router.patch('/products/:id', upload.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', listOrdersAdmin);
router.get('/orders/:id', getOrderAdmin);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

// Payments
router.get('/payments', listPaymentsAdmin);
router.get('/payments/:id', getPaymentAdmin);
router.patch('/payments/:id', verifyPayment);
router.delete('/payments/:id', deletePayment);

// Reviews
router.get('/reviews', listReviewsAdmin);
router.get('/reviews/:id', getReviewAdmin);
router.post('/reviews', createReview);
router.patch('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

export default router;