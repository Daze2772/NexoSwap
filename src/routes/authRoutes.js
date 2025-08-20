import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import apiLimiter from '../middleware/rateLimit.js';

const router = Router();

// Registration and login routes with rate limiting to prevent brute force
router.post('/register', apiLimiter, authController.register);
router.post('/login', apiLimiter, authController.login);
router.post('/refresh', apiLimiter, authController.refresh);

export default router;