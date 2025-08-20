import { Router } from 'express';
import { authenticateAccessToken } from '../middleware/auth.js';
import * as tradeController from '../controllers/tradeController.js';

const router = Router();

// All trade routes require authentication
router.use(authenticateAccessToken);

// List trades for current user
router.get('/', tradeController.list);

// Create a trade
router.post('/', tradeController.create);

// Upload proof for manual fiat payments
router.post('/:id/proof', tradeController.upload.single('proof'), tradeController.uploadProof);

export default router;