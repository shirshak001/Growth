import express from 'express';
import { getAISuggestions, breakTaskWithAI, generateStudyRoadmap, getAICompanionResponse } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/suggestions', getAISuggestions);
router.post('/break-task', breakTaskWithAI);
router.post('/roadmap', generateStudyRoadmap);
router.post('/companion', getAICompanionResponse);

export default router;
