import express from 'express';
import { startAttempt, submitAttempt, getUserAttempts, getAllAttempts } from '../controllers/attemptController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', startAttempt);
router.get('/', authorize('admin', 'tester'), getAllAttempts);
router.post('/:id/submit', submitAttempt);
router.get('/my-attempts', getUserAttempts);

export default router;
