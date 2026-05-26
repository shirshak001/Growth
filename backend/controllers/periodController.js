import { db } from '../config/db.js';

// @desc    Log or update a period entry
// @route   POST /api/period
// @access  Private
export const logPeriod = async (req, res) => {
  const { date, duration, cycleLength, symptoms } = req.body;
  const userId = req.userId;

  if (!date) {
    return res.status(400).json({ message: 'Start date is required' });
  }

  // Find if there's already a log for this specific start date
  const existingLog = db.findOne('periodLogs', log => log.userId === userId && log.date === date);

  let result;
  if (existingLog) {
    db.update('periodLogs', log => log.id === existingLog.id, {
      duration: duration ? Number(duration) : 5,
      cycleLength: cycleLength ? Number(cycleLength) : 28,
      symptoms: symptoms || ''
    });
    result = db.findOne('periodLogs', log => log.id === existingLog.id);
  } else {
    result = db.insert('periodLogs', {
      userId,
      date, // YYYY-MM-DD (acts as startDate)
      duration: duration ? Number(duration) : 5,
      cycleLength: cycleLength ? Number(cycleLength) : 28,
      symptoms: symptoms || ''
    });
  }

  res.status(200).json(result);
};

// @desc    Get period history
// @route   GET /api/period
// @access  Private
export const getPeriodLogs = async (req, res) => {
  const userId = req.userId;
  const logs = db.find('periodLogs', log => log.userId === userId);
  // Sort logs by date descending (latest start date first)
  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.status(200).json(logs);
};
