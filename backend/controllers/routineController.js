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
  const { date, sleepTime, wakeTime, quality, sleepLatency, restlessness, wakeEnergy } = req.body;
  const userId = req.userId;

  if (!date || !sleepTime || !wakeTime || !quality) {
    return res.status(400).json({ message: 'All fields (date, sleepTime, wakeTime, quality) are required' });
  }

  const duration = calculateSleepDuration(sleepTime, wakeTime);
  
  // Calculate sleepScore
  const latencyVal = Number(sleepLatency !== undefined ? sleepLatency : 15);
  const restlessnessVal = Number(restlessness !== undefined ? restlessness : 1);
  const energyVal = Number(wakeEnergy !== undefined ? wakeEnergy : 3);
  const qualityVal = Number(quality);

  // Duration score component (out of 40 points, ideal is 7-9 hours)
  let durationScore = 0;
  if (duration >= 7 && duration <= 9) durationScore = 40;
  else if (duration > 9) durationScore = 40 - (duration - 9) * 10;
  else durationScore = (duration / 7) * 40;
  durationScore = Math.max(0, durationScore);

  // Quality score component (out of 30 points)
  const qualityScore = (qualityVal / 5) * 30;

  // Energy score component (out of 30 points)
  const energyScore = (energyVal / 5) * 30;

  // Penalties
  const latencyPenalty = latencyVal > 30 ? Math.min(10, (latencyVal - 30) / 3) : 0;
  const restlessnessPenalty = (restlessnessVal - 1) * 3;

  const sleepScore = Math.max(10, Math.round(durationScore + qualityScore + energyScore - latencyPenalty - restlessnessPenalty));

  // Check if sleep log exists for this date
  const existingLog = db.findOne('sleepLogs', log => log.userId === userId && log.date === date);

  let result;
  if (existingLog) {
    db.update('sleepLogs', log => log.id === existingLog.id, {
      sleepTime,
      wakeTime,
      duration,
      quality: qualityVal,
      sleepLatency: latencyVal,
      restlessness: restlessnessVal,
      wakeEnergy: energyVal,
      sleepScore
    });
    result = db.findOne('sleepLogs', log => log.id === existingLog.id);
  } else {
    result = db.insert('sleepLogs', {
      userId,
      date,
      sleepTime,
      wakeTime,
      duration,
      quality: qualityVal,
      sleepLatency: latencyVal,
      restlessness: restlessnessVal,
      wakeEnergy: energyVal,
      sleepScore
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
  const { title, isMandatory, category, dueTime, plannedHours } = req.body;
  const userId = req.userId;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const task = db.insert('tasks', {
    userId,
    title,
    isMandatory: !!isMandatory,
    category: category || 'custom',
    dueTime: dueTime || null, // HH:MM
    plannedHours: plannedHours ? Number(plannedHours) : null,
    completedDates: [],
    actualHoursLogs: {},
    isActive: true,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(task);
};

export const toggleTaskCompletion = async (req, res) => {
  const { id } = req.params;
  const { date, actualHours } = req.body; // format: "YYYY-MM-DD"
  const userId = req.userId;

  if (!date) {
    return res.status(400).json({ message: 'Date is required to toggle task completion' });
  }

  const task = db.findOne('tasks', t => t.id === id && t.userId === userId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  let completedDates = [...(task.completedDates || [])];
  let actualHoursLogs = { ...(task.actualHoursLogs || {}) };
  const dateIndex = completedDates.indexOf(date);

  if (dateIndex > -1) {
    // Already completed on this date, so un-complete it
    completedDates.splice(dateIndex, 1);
    delete actualHoursLogs[date];
  } else {
    // Complete it on this date
    completedDates.push(date);
    if (actualHours !== undefined) {
      actualHoursLogs[date] = Number(actualHours);
    }
  }

  db.update('tasks', t => t.id === id, { completedDates, actualHoursLogs });
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

// ==========================================
// DOPAMINE LOGS CONTROLLERS
// ==========================================
export const logDopamine = async (req, res) => {
  const { date, instagramMins, youtubeMins, scrollingMins } = req.body;
  const userId = req.userId;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const instaVal = Number(instagramMins || 0);
  const ytVal = Number(youtubeMins || 0);
  const scrollVal = Number(scrollingMins || 0);
  const totalMins = instaVal + ytVal + scrollVal;

  // Calculate Dopamine Score out of 100
  let score = 100 - (totalMins / 3);
  score = Math.max(10, Math.round(score));

  const existingLog = db.findOne('dopamineLogs', log => log.userId === userId && log.date === date);

  let result;
  if (existingLog) {
    db.update('dopamineLogs', log => log.id === existingLog.id, {
      instagramMins: instaVal,
      youtubeMins: ytVal,
      scrollingMins: scrollVal,
      totalMinutes: totalMins,
      dopamineScore: score
    });
    result = db.findOne('dopamineLogs', log => log.id === existingLog.id);
  } else {
    result = db.insert('dopamineLogs', {
      userId,
      date,
      instagramMins: instaVal,
      youtubeMins: ytVal,
      scrollingMins: scrollVal,
      totalMinutes: totalMins,
      dopamineScore: score
    });
  }

  res.status(200).json(result);
};

export const getDopamineLogs = async (req, res) => {
  const userId = req.userId;
  const logs = db.find('dopamineLogs', log => log.userId === userId);
  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.status(200).json(logs);
};

// ==========================================
// STUDY STRATEGIST CONTROLLERS
// ==========================================
export const saveStudyPlan = async (req, res) => {
  const { targetExam, examDate, weakSubjects, availableHours, aiRoadmap } = req.body;
  const userId = req.userId;

  const existingPlan = db.findOne('studyPlans', plan => plan.userId === userId);

  let result;
  if (existingPlan) {
    db.update('studyPlans', plan => plan.id === existingPlan.id, {
      targetExam,
      examDate,
      weakSubjects,
      availableHours: Number(availableHours || 4),
      aiRoadmap: aiRoadmap || existingPlan.aiRoadmap
    });
    result = db.findOne('studyPlans', plan => plan.id === existingPlan.id);
  } else {
    result = db.insert('studyPlans', {
      userId,
      targetExam,
      examDate,
      weakSubjects,
      availableHours: Number(availableHours || 4),
      aiRoadmap: aiRoadmap || ''
    });
  }

  res.status(200).json(result);
};

export const getStudyPlan = async (req, res) => {
  const userId = req.userId;
  const plan = db.findOne('studyPlans', p => p.userId === userId);
  res.status(200).json(plan || {});
};

// ==========================================
// MOCK TEST CONTROLLERS
// ==========================================
export const logMockTest = async (req, res) => {
  const { date, testName, score, totalMarks, analysis } = req.body;
  const userId = req.userId;

  if (!date || !testName || score === undefined || !totalMarks) {
    return res.status(400).json({ message: 'Missing required mock test parameters' });
  }

  const log = db.insert('mockTests', {
    userId,
    date,
    testName,
    score: Number(score),
    totalMarks: Number(totalMarks),
    percentage: Math.round((Number(score) / Number(totalMarks)) * 100),
    analysis: analysis || ''
  });

  res.status(201).json(log);
};

export const getMockTests = async (req, res) => {
  const userId = req.userId;
  const logs = db.find('mockTests', log => log.userId === userId);
  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.status(200).json(logs);
};
