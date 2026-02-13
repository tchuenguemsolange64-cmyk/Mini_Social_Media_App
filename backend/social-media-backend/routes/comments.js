const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Get comment by ID
router.get('/:commentId', commentController.getById);

// Update comment
router.put('/:commentId', requireAuth, commentController.update);

// Delete comment
router.delete('/:commentId', requireAuth, commentController.delete);

// Like/Unlike comment
router.post('/:commentId/like', requireAuth, commentController.like);
router.delete('/:commentId/like', requireAuth, commentController.unlike);
router.get('/:commentId/likes', commentController.getLikes);

// Get user's comments
router.get('/user/:userId', commentController.getUserComments);

module.exports = router;
