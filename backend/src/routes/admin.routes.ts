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
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';  // 👈 ADD THIS

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
router.post('/products', upload.single('image'), createProduct);  // 👈 ADD upload
router.patch('/products/:id', upload.single('image'), updateProduct);  // 👈 ADD upload
router.delete('/products/:id', deleteProduct);

export default router;