import express from 'express';
import { getAISuggestions, breakTaskWithAI } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/suggestions', getAISuggestions);
router.post('/break-task', breakTaskWithAI);

export default router;
