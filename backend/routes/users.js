const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Search users (must come before /:username to avoid conflict)
router.get('/search', requireAuth, userController.search);
router.get('/suggestions', requireAuth, userController.getSuggestions);

// Notifications
router.get('/notifications', requireAuth, userController.getNotifications);
router.get('/notifications/unread-count', requireAuth, userController.getUnreadCount);
router.put('/notifications/read-all', requireAuth, userController.markAllNotificationsRead);
router.put('/notifications/:notificationId/read', requireAuth, userController.markNotificationRead);

// Blocked users
router.get('/blocked', requireAuth, userController.getBlockedUsers);
router.post('/:userId/block', requireAuth, userController.blockUser);
router.delete('/:userId/block', requireAuth, userController.unblockUser);

// Follow/Unfollow
router.post('/:userId/follow', requireAuth, userController.follow);
router.delete('/:userId/follow', requireAuth, userController.unfollow);

// Followers/Following
router.get('/:userId/followers', optionalAuth, userController.getFollowers);
router.get('/:userId/following', optionalAuth, userController.getFollowing);

// User profile by ID
router.get('/id/:userId', optionalAuth, userController.getProfileById);

// User profile by username
router.get('/:username', optionalAuth, userController.getProfile);

// Update profile
router.put('/me/profile', requireAuth, userController.updateProfile);
router.put('/me/avatar', requireAuth, userController.updateAvatar);

// Delete account
router.delete('/me', requireAuth, userController.deleteAccount);

module.exports = router;
