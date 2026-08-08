import { Router } from 'express';
import { listAdmins, createAdmin, toggleAdminStatus } from '../controllers/admin.controllers.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes here require a logged-in admin
router.use(authMiddleware, adminMiddleware);

router.get('/users', listAdmins);
router.post('/users', createAdmin);
router.patch('/users/:id', toggleAdminStatus);

export default router;