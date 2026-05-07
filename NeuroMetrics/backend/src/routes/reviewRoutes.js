import express from 'express';
import { submitReview, getReviews } from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Allow normal users to submit reviews
router.post('/', protect, submitReview);

// Allow admins/testers to view all reviews
router.get('/', protect, authorize('admin', 'tester'), getReviews);

export default router;
