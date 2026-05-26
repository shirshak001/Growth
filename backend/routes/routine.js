import express from 'express';
import {
  logSleep,
  getSleepLogs,
  getTasks,
  addTask,
  toggleTaskCompletion,
  deleteTask
} from '../controllers/routineController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/sleep')
  .get(getSleepLogs)
  .post(logSleep);

router.route('/tasks')
  .get(getTasks)
  .post(addTask);

router.put('/tasks/:id/toggle', toggleTaskCompletion);
router.delete('/tasks/:id', deleteTask);

export default router;
