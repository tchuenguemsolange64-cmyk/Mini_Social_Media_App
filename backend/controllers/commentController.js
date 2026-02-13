const Comment = require('../models/Comment');
const User = require('../models/User');

const commentController = {
  // Create a comment
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { postId } = req.params;
      const { content, parent_id } = req.body;

      // Validation
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be less than 1000 characters'
        });
      }

      // Check if post exists
      const { data: post } = await req.supabase
        .from('posts')
        .select('id, author_id, is_deleted')
        .eq('id', postId)
        .single();

      if (!post || post.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      // If it's a reply, check if parent comment exists
      if (parent_id) {
        const { data: parentComment } = await req.supabase
          .from('comments')
          .select('id')
          .eq('id', parent_id)
          .eq('post_id', postId)
          .eq('is_deleted', false)
          .single();

        if (!parentComment) {
          return res.status(404).json({
            success: false,
            error: 'Parent comment not found'
          });
        }
      }

      // Process mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = [...content.matchAll(mentionRegex)].map(match => match[1]);

      const comment = await Comment.create(req.supabase, {
        post_id: postId,
        author_id: userId,
        content: content.trim(),
        parent_id: parent_id || null,
        created_at: new Date().toISOString()
      });

      // Create notifications for mentions
      if (mentions.length > 0) {
        const { data: mentionedUsers } = await req.supabase
          .from('users')
          .select('id')
          .in('username', mentions);

        for (const mentionedUser of mentionedUsers || []) {
          if (mentionedUser.id !== userId) {
            await User.createNotification(req.supabase, {
              recipient_id: mentionedUser.id,
              sender_id: userId,
              type: 'mention',
              reference_type: 'comment',
              reference_id: comment.id
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: comment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get comments for a post
  async getByPost(req, res) {
    try {
      const { postId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if post exists
      const { data: post } = await req.supabase
        .from('posts')
        .select('id, is_deleted')
        .eq('id', postId)
        .single();

      if (!post || post.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      const comments = await Comment.getByPostId(req.supabase, postId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: comments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get comment by ID
  async getById(req, res) {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findById(req.supabase, commentId);

      if (!comment || comment.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Get comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get replies to a comment
  async getReplies(req, res) {
    try {
      const { commentId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if parent comment exists
      const { data: parentComment } = await req.supabase
        .from('comments')
        .select('id, is_deleted')
        .eq('id', commentId)
        .single();

      if (!parentComment || parentComment.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }

      const replies = await Comment.getReplies(req.supabase, commentId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: replies,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get replies error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update comment
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be less than 1000 characters'
        });
      }

      // Check if comment exists and belongs to user
      const { data: existingComment } = await req.supabase
        .from('comments')
        .select('author_id, is_deleted')
        .eq('id', commentId)
        .single();

      if (!existingComment || existingComment.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }

      if (existingComment.author_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit this comment'
        });
      }

      const comment = await Comment.update(req.supabase, commentId, userId, content.trim());

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: comment
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete comment
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;

      // Check if comment exists and belongs to user
      const { data: existingComment } = await req.supabase
        .from('comments')
        .select('author_id, is_deleted')
        .eq('id', commentId)
        .single();

      if (!existingComment || existingComment.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }

      if (existingComment.author_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete this comment'
        });
      }

      await Comment.delete(req.supabase, commentId, userId);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Like a comment
  async like(req, res) {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;

      // Check if comment exists
      const { data: comment } = await req.supabase
        .from('comments')
        .select('id, is_deleted')
        .eq('id', commentId)
        .single();

      if (!comment || comment.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found'
        });
      }

      await Comment.like(req.supabase, commentId, userId);

      res.json({
        success: true,
        message: 'Comment liked successfully'
      });
    } catch (error) {
      console.error('Like comment error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Unlike a comment
  async unlike(req, res) {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;

      await Comment.unlike(req.supabase, commentId, userId);

      res.json({
        success: true,
        message: 'Comment unliked successfully'
      });
    } catch (error) {
      console.error('Unlike comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get comment likes
  async getLikes(req, res) {
    try {
      const { commentId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const likes = await Comment.getLikes(req.supabase, commentId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: likes,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get comment likes error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user's comments
  async getUserComments(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const comments = await Comment.getUserComments(req.supabase, userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: comments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get user comments error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = commentController;
