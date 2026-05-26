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
    const { name, height, targetWeight, gender, geminiApiKey } = req.body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (height !== undefined) updatedData.height = Number(height);
    if (targetWeight !== undefined) updatedData.targetWeight = Number(targetWeight);
    if (gender) updatedData.gender = gender;
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
      geminiApiKey: updatedUser.geminiApiKey || '',
      message: 'Profile updated successfully'
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
