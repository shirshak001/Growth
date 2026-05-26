import express from 'express';
import { logMood, getMoodLogs } from '../controllers/moodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMoodLogs)
  .post(logMood);

export default router;
