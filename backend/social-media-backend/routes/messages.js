const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

// Conversations list
router.get('/conversations', requireAuth, messageController.getConversations);

// Unread count
router.get('/unread-count', requireAuth, messageController.getUnreadCount);

// Search messages
router.get('/search', requireAuth, messageController.search);

// Get conversation with user
router.get('/:userId', requireAuth, messageController.getConversation);

// Send message
router.post('/:recipientId', requireAuth, messageController.send);

// Mark as read
router.put('/:userId/read', requireAuth, messageController.markAsRead);

// Edit message
router.put('/:messageId', requireAuth, messageController.edit);

// Delete message
router.delete('/:messageId', requireAuth, messageController.delete);

module.exports = router;
