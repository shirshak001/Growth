import express from 'express';
import {
  logSleep,
  getSleepLogs,
  getTasks,
  addTask,
  toggleTaskCompletion,
  deleteTask,
  logDopamine,
  getDopamineLogs,
  saveStudyPlan,
  getStudyPlan,
  logMockTest,
  getMockTests
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

router.route('/dopamine')
  .get(getDopamineLogs)
  .post(logDopamine);

router.route('/strategist')
  .get(getStudyPlan)
  .post(saveStudyPlan);

router.route('/mock-tests')
  .get(getMockTests)
  .post(logMockTest);

export default router;
