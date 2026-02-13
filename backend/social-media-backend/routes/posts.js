const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Feed and explore
router.get('/feed', requireAuth, postController.getFeed);
router.get('/explore', optionalAuth, postController.getExplore);
router.get('/trending-hashtags', postController.getTrendingHashtags);

// Search posts
router.get('/search', postController.search);
router.get('/hashtag/:hashtag', postController.getByHashtag);

// User's posts
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

// Bookmarks
router.get('/bookmarks', requireAuth, postController.getBookmarks);

// Post CRUD
router.post('/', requireAuth, postController.create);
router.get('/:postId', optionalAuth, postController.getById);
router.put('/:postId', requireAuth, postController.update);
router.delete('/:postId', requireAuth, postController.delete);

// Like/Unlike
router.post('/:postId/like', requireAuth, postController.like);
router.delete('/:postId/like', requireAuth, postController.unlike);
router.get('/:postId/likes', postController.getLikes);

// Bookmark
router.post('/:postId/bookmark', requireAuth, postController.bookmark);
router.delete('/:postId/bookmark', requireAuth, postController.removeBookmark);

// Share
router.post('/:postId/share', requireAuth, postController.share);

// Comments
router.get('/:postId/comments', commentController.getByPost);
router.post('/:postId/comments', requireAuth, commentController.create);

// Comment replies
router.get('/:postId/comments/:commentId/replies', commentController.getReplies);

module.exports = router;
