import { Router } from 'express';
import { listAdmins, createAdmin, toggleAdminStatus } from '../controllers/admin.controllers.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

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

export default router;