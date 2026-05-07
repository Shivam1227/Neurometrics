import express from 'express';
import { createTest, getTests, getTestById, deleteTest } from '../controllers/testController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .get(getTests)
  .post(protect, authorize('admin', 'tester'), createTest);

router.route('/:id')
  .get(getTestById)
  .delete(protect, authorize('admin', 'tester'), deleteTest);

export default router;
