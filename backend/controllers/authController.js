import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_growth_jwt_secret_key_12345';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, gender } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  // Check if user exists
  const userExists = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = db.insert('users', {
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    height: 170, // Default 170cm
    targetWeight: 70, // Default 70kg
    gender: gender || 'other', // male, female, other
    ultimateGoal: { title: '', targetDate: '', description: '' },
    createdAt: new Date().toISOString()
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      height: user.height,
      targetWeight: user.targetWeight,
      gender: user.gender,
      ultimateGoal: user.ultimateGoal,
      token: generateToken(user.id)
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      height: user.height,
      targetWeight: user.targetWeight,
      gender: user.gender || 'other',
      ultimateGoal: user.ultimateGoal || { title: '', targetDate: '', description: '' },
      geminiApiKey: user.geminiApiKey || '',
      token: generateToken(user.id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = db.findOne('users', u => u.id === req.userId);

  if (user) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      height: user.height,
      targetWeight: user.targetWeight,
      gender: user.gender || 'other',
      ultimateGoal: user.ultimateGoal || { title: '', targetDate: '', description: '' },
      geminiApiKey: user.geminiApiKey || '',
      createdAt: user.createdAt
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const user = db.findOne('users', u => u.id === req.userId);

  if (user) {
    const { name, height, targetWeight, gender, ultimateGoal, geminiApiKey } = req.body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (height !== undefined) updatedData.height = Number(height);
    if (targetWeight !== undefined) updatedData.targetWeight = Number(targetWeight);
    if (gender) updatedData.gender = gender;
    if (ultimateGoal !== undefined) updatedData.ultimateGoal = ultimateGoal;
    if (geminiApiKey !== undefined) updatedData.geminiApiKey = geminiApiKey;

    db.update('users', u => u.id === req.userId, updatedData);

    const updatedUser = db.findOne('users', u => u.id === req.userId);

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      height: updatedUser.height,
      targetWeight: updatedUser.targetWeight,
      gender: updatedUser.gender || 'other',
      ultimateGoal: updatedUser.ultimateGoal || { title: '', targetDate: '', description: '' },
      geminiApiKey: updatedUser.geminiApiKey || '',
      friends: updatedUser.friends || [],
      notifications: updatedUser.notifications || [],
      message: 'Profile updated successfully'
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// ==========================================
// COMPETITIVE ARENA HELPERS & CONTROLLERS
// ==========================================

const getTodayStatsForUser = (userId) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const user = db.findOne('users', u => u.id === userId);
  if (!user) return null;

  const sleepLogs = db.find('sleepLogs', log => log.userId === userId);
  const tasks = db.find('tasks', t => t.userId === userId && t.isActive !== false);
  const fitnessLogs = db.find('fitnessLogs', log => log.userId === userId);
  const moodLogs = db.find('moodLogs', log => log.userId === userId);
  const dopamineLogs = db.find('dopamineLogs', log => log.userId === userId);

  const todaySleepLog = sleepLogs.find(l => l.date === todayStr);
  const todayFitnessLog = fitnessLogs.find(l => l.date === todayStr);
  const todayMoodLog = moodLogs.find(l => l.date === todayStr);
  const todayDopamineLog = dopamineLogs.find(l => l.date === todayStr);

  // 1. Sleep Component
  const sleepComponent = todaySleepLog ? (todaySleepLog.sleepScore || todaySleepLog.quality * 20) : 70;
  
  // 2. Tasks Component
  const completedToday = tasks.filter(t => t.completedDates?.includes(todayStr)).length;
  const taskComponent = tasks.length > 0 ? (completedToday / tasks.length) * 100 : 80;
  
  // 3. Water Component
  const waterComponent = todayFitnessLog ? Math.min(100, ((todayFitnessLog.waterIntake || 0) / 2000) * 100) : 50;
  
  // 4. Dopamine Component
  const dopamineComponent = todayDopamineLog ? (todayDopamineLog.dopamineScore || 100) : 100;
  
  // 5. Mood Component
  const moodComponent = todayMoodLog ? (todayMoodLog.mood * 20) : 60;

  const lifeScore = Math.round(
    (sleepComponent * 0.20) +
    (taskComponent * 0.35) +
    (waterComponent * 0.15) +
    (dopamineComponent * 0.20) +
    (moodComponent * 0.10)
  );

  // Today study hours
  let studyHours = 0;
  tasks.forEach(t => {
    if (t.completedDates?.includes(todayStr)) {
      studyHours += t.actualHoursLogs?.[todayStr] !== undefined 
        ? Number(t.actualHoursLogs[todayStr]) 
        : (t.plannedHours ? Number(t.plannedHours) : 0);
    }
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender || 'other',
    todayTasksCompleted: completedToday,
    todayTasksTotal: tasks.length,
    todayStudyHours: Math.round(studyHours * 10) / 10,
    todaySleepScore: todaySleepLog ? (todaySleepLog.sleepScore || todaySleepLog.quality * 20) : 70,
    todayFocusScore: todayDopamineLog ? (todayDopamineLog.dopamineScore || 100) : 100,
    lifeScore
  };
};

export const addFriend = async (req, res) => {
  const { email } = req.body;
  const userId = req.userId;

  if (!email) {
    return res.status(400).json({ message: 'Friend email is required' });
  }

  const currentUser = db.findOne('users', u => u.id === userId);
  const friendUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!friendUser) {
    return res.status(404).json({ message: 'User with this email not found' });
  }

  if (friendUser.id === userId) {
    return res.status(400).json({ message: 'You cannot add yourself as a friend' });
  }

  const currentFriends = currentUser.friends || [];
  const friendFriends = friendUser.friends || [];

  if (currentFriends.includes(friendUser.id)) {
    return res.status(400).json({ message: 'You are already friends with this user' });
  }

  // Bidirectional link
  db.update('users', u => u.id === userId, { friends: [...currentFriends, friendUser.id] });
  db.update('users', u => u.id === friendUser.id, { friends: [...friendFriends, userId] });

  // Add notification to the friend
  const friendNotifications = friendUser.notifications || [];
  db.update('users', u => u.id === friendUser.id, {
    notifications: [
      ...friendNotifications,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderName: currentUser.name,
        message: 'added you as a friend!',
        createdAt: new Date().toISOString(),
        isRead: false
      }
    ]
  });

  res.status(200).json({ message: `Successfully added ${friendUser.name} as a friend!` });
};

export const getLeaderboard = async (req, res) => {
  const userId = req.userId;
  const currentUser = db.findOne('users', u => u.id === userId);
  
  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const friendsList = currentUser.friends || [];
  
  // Calculate stats for current user
  const userStats = getTodayStatsForUser(userId);
  const leaderboard = [];
  if (userStats) leaderboard.push(userStats);

  // Calculate stats for friends
  friendsList.forEach(friendId => {
    const stats = getTodayStatsForUser(friendId);
    if (stats) {
      leaderboard.push(stats);
    }
  });

  // Sort by lifeScore descending
  leaderboard.sort((a, b) => b.lifeScore - a.lifeScore);

  res.status(200).json(leaderboard);
};

export const pokeFriend = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.userId;

  if (!friendId) {
    return res.status(400).json({ message: 'Friend ID is required' });
  }

  const currentUser = db.findOne('users', u => u.id === userId);
  const friendUser = db.findOne('users', u => u.id === friendId);

  if (!friendUser) {
    return res.status(404).json({ message: 'Friend not found' });
  }

  // Insert notification into friend's notifications
  const friendNotifications = friendUser.notifications || [];
  db.update('users', u => u.id === friendId, {
    notifications: [
      ...friendNotifications,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderName: currentUser.name,
        message: 'nudged you to stay focused and hit your study blocks today!',
        createdAt: new Date().toISOString(),
        isRead: false
      }
    ]
  });

  res.status(200).json({ message: `Successfully nudged ${friendUser.name}!` });
};

export const getNotifications = async (req, res) => {
  const userId = req.userId;
  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json(user.notifications || []);
};

export const clearNotifications = async (req, res) => {
  const userId = req.userId;
  db.update('users', u => u.id === userId, { notifications: [] });
  
  // Send back updated empty array
  res.status(200).json([]);
};
