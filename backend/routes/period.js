import express from 'express';
import { logPeriod, getPeriodLogs } from '../controllers/periodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPeriodLogs)
  .post(logPeriod);

export default router;
