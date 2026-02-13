const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Feed (stories from followed users)
router.get('/feed', requireAuth, storyController.getFeed);

// My stories
router.get('/me', requireAuth, storyController.getMyStories);

// Create story
router.post('/', requireAuth, storyController.create);

// Get user's stories
router.get('/user/:userId', optionalAuth, storyController.getUserStories);

// Get story by ID
router.get('/:storyId', optionalAuth, storyController.getById);

// Mark as viewed
router.post('/:storyId/view', requireAuth, storyController.markAsViewed);

// Get viewers
router.get('/:storyId/viewers', requireAuth, storyController.getViewers);

// Get stats
router.get('/:storyId/stats', requireAuth, storyController.getStats);

// Delete story
router.delete('/:storyId', requireAuth, storyController.delete);

module.exports = router;
