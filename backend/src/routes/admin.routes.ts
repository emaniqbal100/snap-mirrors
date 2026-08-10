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
  initiatePayment,
  verifyPayment,
  deletePayment,
} from '../controllers/payment.controller.js';
import {
  listReviewsAdmin,
  getReviewAdmin,
  createReview,
  updateReview,
  toggleReviewStatus,
  toggleFeaturedStatus,
  deleteReview,
} from '../controllers/review.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// All routes here require a logged-in admin
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
router.post('/payments/initiate', initiatePayment);
router.patch('/payments/:id/verify', verifyPayment);
router.delete('/payments/:id', deletePayment);

// Reviews
router.get('/reviews', listReviewsAdmin);
router.get('/reviews/:id', getReviewAdmin);
router.post('/reviews', createReview);
router.patch('/reviews/:id', updateReview);
router.patch('/reviews/:id/toggle', toggleReviewStatus);
router.patch('/reviews/:id/featured', toggleFeaturedStatus);
router.delete('/reviews/:id', deleteReview);

export default router;