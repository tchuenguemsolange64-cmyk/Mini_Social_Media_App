const User = require('../models/User');
const { supabase } = require('../models');

const userController = {
  // Get user profile by username
  async getProfile(req, res) {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.id;

      const user = await User.findByUsername(username);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if current user is following
      let isFollowing = false;
      let isBlocked = false;

      if (currentUserId && currentUserId !== user.id) {
        isFollowing = await User.isFollowing(currentUserId, user.id);
        
        // Check if blocked
        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', currentUserId)
          .single();
        
        isBlocked = !!blockData;
      }

      // Remove sensitive data
      delete user.email;

      res.json({
        success: true,
        data: {
          ...user,
          is_following: isFollowing,
          is_blocked: isBlocked
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user profile by ID
  async getProfileById(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      let isFollowing = false;
      if (currentUserId && currentUserId !== userId) {
        isFollowing = await User.isFollowing(currentUserId, userId);
      }

      delete user.email;

      res.json({
        success: true,
        data: {
          ...user,
          is_following: isFollowing
        }
      });
    } catch (error) {
      console.error('Get profile by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Validate updates
      const allowedFields = ['display_name', 'bio', 'location', 'website', 'is_private'];
      const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid fields: ${invalidFields.join(', ')}`
        });
      }

      // Validate bio length
      if (updates.bio && updates.bio.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Bio must be less than 500 characters'
        });
      }

      // Validate display name
      if (updates.display_name && updates.display_name.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Display name must be less than 50 characters'
        });
      }

      // Validate website URL
      if (updates.website) {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(updates.website)) {
          updates.website = `https://${updates.website}`;
        }
      }

      const user = await User.update(userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update avatar
  async updateAvatar(req, res) {
    try {
      const userId = req.user.id;
      const { avatar_url } = req.body;

      if (!avatar_url) {
        return res.status(400).json({
          success: false,
          error: 'Avatar URL is required'
        });
      }

      const user = await User.update(userId, { avatar_url });

      res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update avatar error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Follow a user
  async follow(req, res) {
    try {
      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      if (followerId === followingId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot follow yourself'
        });
      }

      // Check if user exists
      const user = await User.findById(followingId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if blocked
      const { data: blockData } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${followerId},blocked_id.eq.${followingId}),and(blocker_id.eq.${followingId},blocked_id.eq.${followerId})`)
        .single();

      if (blockData) {
        return res.status(403).json({
          success: false,
          error: 'Cannot follow this user'
        });
      }

      await User.follow(followerId, followingId);

      res.json({
        success: true,
        message: `You are now following ${user.username}`
      });
    } catch (error) {
      console.error('Follow error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Unfollow a user
  async unfollow(req, res) {
    try {
      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      await User.unfollow(followerId, followingId);

      res.json({
        success: true,
        message: 'Unfollowed successfully'
      });
    } catch (error) {
      console.error('Unfollow error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user followers
  async getFollowers(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.id;

      const followers = await User.getFollowers(userId, parseInt(limit), parseInt(offset));

      // Check if current user follows each follower
      if (currentUserId) {
        for (const follower of followers) {
          follower.is_following = await User.isFollowing(currentUserId, follower.id);
        }
      }

      res.json({
        success: true,
        data: followers,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get user following
  async getFollowing(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.id;

      const following = await User.getFollowing(userId, parseInt(limit), parseInt(offset));

      // Check if current user follows each user
      if (currentUserId) {
        for (const user of following) {
          user.is_following = await User.isFollowing(currentUserId, user.id);
        }
      }

      res.json({
        success: true,
        data: following,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Search users
  async search(req, res) {
    try {
      const { q: query, limit = 20, offset = 0 } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters'
        });
      }

      const users = await User.search(query, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: users,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get suggested users
  async getSuggestions(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const suggestions = await User.getSuggestions(userId, parseInt(limit));

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const notifications = await User.getNotifications(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: notifications,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Mark notification as read
  async markNotificationRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await User.markNotificationRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Mark all notifications as read
  async markAllNotificationsRead(req, res) {
    try {
      const userId = req.user.id;

      await User.markAllNotificationsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get unread notification count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await User.getUnreadNotificationCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Block user
  async blockUser(req, res) {
    try {
      const blockerId = req.user.id;
      const { userId: blockedId } = req.params;

      if (blockerId === blockedId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot block yourself'
        });
      }

      await User.blockUser(blockerId, blockedId);

      res.json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Unblock user
  async unblockUser(req, res) {
    try {
      const blockerId = req.user.id;
      const { userId: blockedId } = req.params;

      await User.unblockUser(blockerId, blockedId);

      res.json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get blocked users
  async getBlockedUsers(req, res) {
    try {
      const userId = req.user.id;

      const blockedUsers = await User.getBlockedUsers(userId);

      res.json({
        success: true,
        data: blockedUsers
      });
    } catch (error) {
      console.error('Get blocked users error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Verify password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: req.user.email,
        password
      });

      if (authError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password'
        });
      }

      // Soft delete user data
      await supabase
        .from('users')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          username: `deleted_${userId}`,
          email: `deleted_${userId}@deleted.com`
        })
        .eq('id', userId);

      // Delete auth user
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = userController;
