import express from 'express';
import { logFitness, getFitnessLogs } from '../controllers/fitnessController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFitnessLogs)
  .post(logFitness);

export default router;
