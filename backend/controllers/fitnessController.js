import { db } from '../config/db.js';

// @desc    Log or update fitness metrics (weight, waterIntake, activeMinutes)
// @route   POST /api/fitness
// @access  Private
export const logFitness = async (req, res) => {
  const { date, weight, waterIntake, activeMinutes } = req.body;
  const userId = req.userId;

  if (!date) {
    return res.status(400).json({ message: 'Date is required to log fitness metrics' });
  }

  // Find existing log for the user and date
  const existingLog = db.findOne('fitnessLogs', log => log.userId === userId && log.date === date);

  let result;
  if (existingLog) {
    const updatedData = {};
    if (weight !== undefined) updatedData.weight = weight === '' ? null : Number(weight);
    if (waterIntake !== undefined) updatedData.waterIntake = Number(waterIntake);
    if (activeMinutes !== undefined) updatedData.activeMinutes = Number(activeMinutes);

    db.update('fitnessLogs', log => log.id === existingLog.id, updatedData);
    result = db.findOne('fitnessLogs', log => log.id === existingLog.id);
  } else {
    result = db.insert('fitnessLogs', {
      userId,
      date,
      weight: weight ? Number(weight) : null,
      waterIntake: waterIntake ? Number(waterIntake) : 0,
      activeMinutes: activeMinutes ? Number(activeMinutes) : 0
    });
  }

  res.status(200).json(result);
};

// @desc    Get fitness history
// @route   GET /api/fitness
// @access  Private
export const getFitnessLogs = async (req, res) => {
  const userId = req.userId;
  const logs = db.find('fitnessLogs', log => log.userId === userId);
  // Sort logs by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.status(200).json(logs);
};
