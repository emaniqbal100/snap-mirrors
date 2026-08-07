import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controllers.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

export default router;