import { db } from '../config/db.js';

// @desc    Log or update daily mood and reflection
// @route   POST /api/mood
// @access  Private
export const logMood = async (req, res) => {
  const { date, mood, reflection } = req.body;
  const userId = req.userId;

  if (!date || !mood) {
    return res.status(400).json({ message: 'Date and mood rating (1-5) are required' });
  }

  const existingLog = db.findOne('moodLogs', log => log.userId === userId && log.date === date);

  let result;
  if (existingLog) {
    const updatedData = {
      mood: Number(mood),
      reflection: reflection || ''
    };
    db.update('moodLogs', log => log.id === existingLog.id, updatedData);
    result = db.findOne('moodLogs', log => log.id === existingLog.id);
  } else {
    result = db.insert('moodLogs', {
      userId,
      date,
      mood: Number(mood),
      reflection: reflection || ''
    });
  }

  res.status(200).json(result);
};

// @desc    Get mood logs history
// @route   GET /api/mood
// @access  Private
export const getMoodLogs = async (req, res) => {
  const userId = req.userId;
  const logs = db.find('moodLogs', log => log.userId === userId);
  // Sort logs by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.status(200).json(logs);
};
