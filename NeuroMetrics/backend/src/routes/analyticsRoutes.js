import express from 'express';
import { getAggregateStats } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Only admin and testers can view aggregate analytics
router.get('/stats', protect, authorize('admin', 'tester'), getAggregateStats);

export default router;
