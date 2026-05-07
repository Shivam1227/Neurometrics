import express from 'express';
import { handleChatQuery } from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, handleChatQuery);

export default router;
