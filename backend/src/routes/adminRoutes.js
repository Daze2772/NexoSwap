import { Router } from 'express';
import { listUsers, listTrades, markReceived } from '../controllers/adminController.js';
import { authenticateAccessToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply auth and admin middleware for all admin routes
router.use(authenticateAccessToken, requireAdmin);

router.get('/users', listUsers);
router.get('/trades', listTrades);
router.post('/trades/:id/mark-received', markReceived);

export default router;