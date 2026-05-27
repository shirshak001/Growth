import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  addFriend,
  getLeaderboard,
  pokeFriend,
  getNotifications,
  clearNotifications
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/friends/add', protect, addFriend);
router.get('/friends/leaderboard', protect, getLeaderboard);
router.post('/friends/poke', protect, pokeFriend);
router.get('/notifications', protect, getNotifications);
router.post('/notifications/clear', protect, clearNotifications);

export default router;
