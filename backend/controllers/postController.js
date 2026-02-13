const Post = require('../models/Post');
const User = require('../models/User');
const { supabase } = require('../models');

const postController = {
  // Create a new post
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { content, media_urls, visibility = 'public', location, tags } = req.body;

      // Validation
      if (!content && (!media_urls || media_urls.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Post must have content or media'
        });
      }

      if (content && content.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Content must be less than 2000 characters'
        });
      }

      // Process tags
      let processedTags = tags || [];
      if (content) {
        const hashtagRegex = /#(\w+)/g;
        const extractedTags = [...content.matchAll(hashtagRegex)].map(match => match[1].toLowerCase());
        processedTags = [...new Set([...processedTags, ...extractedTags])];
      }

      // Process mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = content ? [...content.matchAll(mentionRegex)].map(match => match[1]) : [];

      const post = await Post.create({
        author_id: userId,
        content: content || null,
        media_urls: media_urls || [],
        visibility,
        location: location || null,
        tags: processedTags,
        created_at: new Date().toISOString()
      });

      // Create notifications for mentions
      if (mentions.length > 0) {
        const { data: mentionedUsers } = await supabase
          .from('users')
          .select('id')
          .in('username', mentions);

        for (const mentionedUser of mentionedUsers || []) {
          if (mentionedUser.id !== userId) {
            await User.createNotification({
              recipient_id: mentionedUser.id,
              sender_id: userId,
              type: 'mention',
              reference_type: 'post',
              reference_id: post.id
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get post by ID
  async getById(req, res) {
    try {
      const { postId } = req.params;
      const currentUserId = req.user?.id;

      const post = await Post.findById(postId, currentUserId);

      if (!post || post.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      // Check visibility
      if (post.visibility === 'private' && post.author_id !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if author is blocked
      if (currentUserId) {
        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', post.author_id)
          .single();

        if (blockData) {
          return res.status(404).json({
            success: false,
            error: 'Post not found'
          });
        }
      }

      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user's posts
  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.id;

      // Check if user is blocked
      if (currentUserId) {
        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('id')
          .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${currentUserId})`)
          .single();

        if (blockData) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const posts = await Post.getUserPosts(userId, parseInt(limit), parseInt(offset), currentUserId);

      res.json({
        success: true,
        data: posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get feed posts
  async getFeed(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const posts = await Post.getFeed(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get feed error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get explore posts
  async getExplore(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.id;

      const posts = await Post.getExplore(parseInt(limit), parseInt(offset), currentUserId);

      res.json({
        success: true,
        data: posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get explore error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update post
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;
      const updates = req.body;

      // Check if post exists and belongs to user
      const { data: existingPost } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();

      if (!existingPost) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      if (existingPost.author_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit this post'
        });
      }

      const post = await Post.update(postId, userId, updates);

      res.json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete post
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;

      // Check if post exists and belongs to user
      const { data: existingPost } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();

      if (!existingPost) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      if (existingPost.author_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete this post'
        });
      }

      await Post.delete(postId, userId);

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Like a post
  async like(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;

      await Post.like(postId, userId);

      res.json({
        success: true,
        message: 'Post liked successfully'
      });
    } catch (error) {
      console.error('Like post error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Unlike a post
  async unlike(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;

      await Post.unlike(postId, userId);

      res.json({
        success: true,
        message: 'Post unliked successfully'
      });
    } catch (error) {
      console.error('Unlike post error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get post likes
  async getLikes(req, res) {
    try {
      const { postId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const likes = await Post.getLikes(postId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: likes,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get likes error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Bookmark a post
  async bookmark(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;

      await Post.bookmark(postId, userId);

      res.json({
        success: true,
        message: 'Post bookmarked successfully'
      });
    } catch (error) {
      console.error('Bookmark post error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Remove bookmark
  async removeBookmark(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;

      await Post.removeBookmark(postId, userId);

      res.json({
        success: true,
        message: 'Bookmark removed successfully'
      });
    } catch (error) {
      console.error('Remove bookmark error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user's bookmarks
  async getBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const bookmarks = await Post.getBookmarks(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: bookmarks,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get bookmarks error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Share/Repost a post
  async share(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;
      const { comment } = req.body;

      await Post.share(postId, userId, comment);

      res.json({
        success: true,
        message: 'Post shared successfully'
      });
    } catch (error) {
      console.error('Share post error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Search posts
  async search(req, res) {
    try {
      const { q: query, limit = 20, offset = 0 } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters'
        });
      }

      const posts = await Post.search(query, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Search posts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get posts by hashtag
  async getByHashtag(req, res) {
    try {
      const { hashtag } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const posts = await Post.getByHashtag(hashtag, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get by hashtag error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get trending hashtags
  async getTrendingHashtags(req, res) {
    try {
      const { limit = 10 } = req.query;

      const { data, error } = await supabase
        .rpc('get_trending_hashtags', { limit_count: parseInt(limit) });

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Get trending hashtags error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = postController;
