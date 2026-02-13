const Story = require('../models/Story');
const User = require('../models/User');
const { supabase } = require('../models');

const storyController = {
  // Create a story
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { media_url, media_type = 'image', caption, duration = 24 } = req.body;

      // Validation
      if (!media_url) {
        return res.status(400).json({
          success: false,
          error: 'Media URL is required'
        });
      }

      if (!['image', 'video'].includes(media_type)) {
        return res.status(400).json({
          success: false,
          error: 'Media type must be image or video'
        });
      }

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      const story = await Story.create({
        author_id: userId,
        media_url,
        media_type,
        caption: caption || null,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        data: story
      });
    } catch (error) {
      console.error('Create story error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get stories feed (from followed users)
  async getFeed(req, res) {
    try {
      const userId = req.user.id;

      const stories = await Story.getFeed(userId);

      // Group stories by user
      const groupedStories = stories.reduce((acc, story) => {
        const authorId = story.author_id;
        if (!acc[authorId]) {
          acc[authorId] = {
            user: story.author,
            stories: []
          };
        }
        acc[authorId].stories.push({
          id: story.id,
          media_url: story.media_url,
          media_type: story.media_type,
          caption: story.caption,
          created_at: story.created_at,
          expires_at: story.expires_at,
          is_viewed: story.is_viewed
        });
        return acc;
      }, {});

      res.json({
        success: true,
        data: Object.values(groupedStories)
      });
    } catch (error) {
      console.error('Get stories feed error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user's stories
  async getUserStories(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if blocked
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

      const stories = await Story.getUserStories(userId, currentUserId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified
          },
          stories
        }
      });
    } catch (error) {
      console.error('Get user stories error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get story by ID
  async getById(req, res) {
    try {
      const { storyId } = req.params;
      const currentUserId = req.user?.id;

      const story = await Story.findById(storyId, currentUserId);

      if (!story || story.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Story not found'
        });
      }

      // Check if expired
      if (new Date(story.expires_at) < new Date()) {
        return res.status(404).json({
          success: false,
          error: 'Story has expired'
        });
      }

      // Check if blocked
      if (currentUserId) {
        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('id')
          .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${story.author_id}),and(blocker_id.eq.${story.author_id},blocked_id.eq.${currentUserId})`)
          .single();

        if (blockData) {
          return res.status(404).json({
            success: false,
            error: 'Story not found'
          });
        }
      }

      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      console.error('Get story error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Mark story as viewed
  async markAsViewed(req, res) {
    try {
      const viewerId = req.user.id;
      const { storyId } = req.params;

      // Check if story exists
      const { data: story } = await supabase
        .from('stories')
        .select('author_id, is_deleted, expires_at')
        .eq('id', storyId)
        .single();

      if (!story || story.is_deleted) {
        return res.status(404).json({
          success: false,
          error: 'Story not found'
        });
      }

      if (new Date(story.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Story has expired'
        });
      }

      // Don't mark own story as viewed
      if (story.author_id === viewerId) {
        return res.json({
          success: true,
          message: 'Cannot mark own story as viewed'
        });
      }

      await Story.markAsViewed(storyId, viewerId);

      res.json({
        success: true,
        message: 'Story marked as viewed'
      });
    } catch (error) {
      console.error('Mark story viewed error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get story viewers
  async getViewers(req, res) {
    try {
      const userId = req.user.id;
      const { storyId } = req.params;

      const viewers = await Story.getViewers(storyId, userId);

      res.json({
        success: true,
        data: viewers
      });
    } catch (error) {
      console.error('Get story viewers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete story
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { storyId } = req.params;

      // Check if story exists and belongs to user
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single();

      if (!story) {
        return res.status(404).json({
          success: false,
          error: 'Story not found'
        });
      }

      if (story.author_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete this story'
        });
      }

      await Story.delete(storyId, userId);

      res.json({
        success: true,
        message: 'Story deleted successfully'
      });
    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get story statistics
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const { storyId } = req.params;

      const stats = await Story.getStats(storyId, userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get story stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get my stories with stats
  async getMyStories(req, res) {
    try {
      const userId = req.user.id;

      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          views_count:story_views(count)
        `)
        .eq('author_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique viewers for each story
      const storiesWithStats = await Promise.all(
        stories.map(async (story) => {
          const { data: viewers } = await supabase
            .from('story_views')
            .select('viewer_id')
            .eq('story_id', story.id);

          return {
            ...story,
            unique_viewers: new Set(viewers?.map(v => v.viewer_id) || []).size
          };
        })
      );

      res.json({
        success: true,
        data: storiesWithStats
      });
    } catch (error) {
      console.error('Get my stories error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = storyController;
