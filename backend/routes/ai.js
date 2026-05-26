import express from 'express';
import { getAISuggestions } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/suggestions', getAISuggestions);

export default router;
