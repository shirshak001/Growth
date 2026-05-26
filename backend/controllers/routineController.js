import { db } from '../config/db.js';

// Calculate duration between sleep and wake times
// Format of sleepTime, wakeTime: "HH:MM"
const calculateSleepDuration = (sleep, wake) => {
  try {
    const [sHour, sMin] = sleep.split(':').map(Number);
    const [wHour, wMin] = wake.split(':').map(Number);

    let sleepDate = new Date(2020, 0, 1, sHour, sMin);
    let wakeDate = new Date(2020, 0, 1, wHour, wMin);

    if (wakeDate < sleepDate) {
      // Wake time is next day
      wakeDate = new Date(2020, 0, 2, wHour, wMin);
    }

    const diffMs = wakeDate - sleepDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Error calculating sleep duration:', error);
    return 8; // default fallback
  }
};

// ==========================================
// SLEEP LOGS CONTROLLERS
// ==========================================

export const logSleep = async (req, res) => {
  const { date, sleepTime, wakeTime, quality } = req.body;
  const userId = req.userId;

  if (!date || !sleepTime || !wakeTime || !quality) {
    return res.status(400).json({ message: 'All fields (date, sleepTime, wakeTime, quality) are required' });
  }

  const duration = calculateSleepDuration(sleepTime, wakeTime);

  // Check if sleep log exists for this date
  const existingLog = db.findOne('sleepLogs', log => log.userId === userId && log.date === date);

  let result;
  if (existingLog) {
    db.update('sleepLogs', log => log.id === existingLog.id, {
      sleepTime,
      wakeTime,
      duration,
      quality: Number(quality)
    });
    result = db.findOne('sleepLogs', log => log.id === existingLog.id);
  } else {
    result = db.insert('sleepLogs', {
      userId,
      date,
      sleepTime,
      wakeTime,
      duration,
      quality: Number(quality)
    });
  }

  res.status(200).json(result);
};

export const getSleepLogs = async (req, res) => {
  const userId = req.userId;
  const logs = db.find('sleepLogs', log => log.userId === userId);
  // Sort logs by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.status(200).json(logs);
};

// ==========================================
// TASKS & ROUTINES CONTROLLERS
// ==========================================

export const getTasks = async (req, res) => {
  const userId = req.userId;
  const tasks = db.find('tasks', t => t.userId === userId && t.isActive !== false);
  res.status(200).json(tasks);
};

export const addTask = async (req, res) => {
  const { title, isMandatory, category } = req.body;
  const userId = req.userId;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const task = db.insert('tasks', {
    userId,
    title,
    isMandatory: !!isMandatory,
    category: category || 'custom',
    completedDates: [],
    isActive: true,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(task);
};

export const toggleTaskCompletion = async (req, res) => {
  const { id } = req.params;
  const { date } = req.body; // format: "YYYY-MM-DD"
  const userId = req.userId;

  if (!date) {
    return res.status(400).json({ message: 'Date is required to toggle task completion' });
  }

  const task = db.findOne('tasks', t => t.id === id && t.userId === userId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  let completedDates = [...(task.completedDates || [])];
  const dateIndex = completedDates.indexOf(date);

  if (dateIndex > -1) {
    // Already completed on this date, so un-complete it
    completedDates.splice(dateIndex, 1);
  } else {
    // Complete it on this date
    completedDates.push(date);
  }

  db.update('tasks', t => t.id === id, { completedDates });
  const updatedTask = db.findOne('tasks', t => t.id === id);

  res.status(200).json(updatedTask);
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const task = db.findOne('tasks', t => t.id === id && t.userId === userId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Soft delete
  db.update('tasks', t => t.id === id, { isActive: false });

  res.status(200).json({ message: 'Task removed successfully' });
};
