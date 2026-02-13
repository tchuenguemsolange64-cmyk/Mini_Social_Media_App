const { supabaseAdmin } = require('./index');

class User {
  // Get user by ID
  static async findById(supabase, userId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        avatar_url,
        bio,
        location,
        website,
        is_verified,
        is_private,
        created_at,
        updated_at,
        followers_count:followers!followers_following_id_fkey(count),
        following_count:followers!followers_follower_id_fkey(count),
        posts_count:posts(count)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get user by username
  static async findByUsername(supabase, username) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        avatar_url,
        bio,
        location,
        website,
        is_verified,
        is_private,
        created_at,
        followers_count:followers!followers_following_id_fkey(count),
        following_count:followers!followers_follower_id_fkey(count),
        posts_count:posts(count)
      `)
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  }

  // Search users
  static async search(supabase, query, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, is_verified')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .eq('is_active', true)
      .order('followers_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Update user profile
  static async update(supabase, userId, updates) {
    const allowedFields = ['display_name', 'bio', 'avatar_url', 'location', 'website', 'is_private'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get user followers
  static async getFollowers(supabase, userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        follower:follower_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        created_at
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.map(f => ({ ...f.follower, followed_at: f.created_at }));
  }

  // Get user following
  static async getFollowing(supabase, userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        following:following_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        created_at
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.map(f => ({ ...f.following, followed_at: f.created_at }));
  }

  // Follow a user
  static async follow(supabase, followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const { data, error } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: followingId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Already following this user');
      }
      throw error;
    }

    // Create notification
    await this.createNotification(supabase, {
      recipient_id: followingId,
      sender_id: followerId,
      type: 'follow',
      reference_type: 'user',
      reference_id: followerId
    });

    return data;
  }

  // Unfollow a user
  static async unfollow(supabase, followerId, followingId) {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return { success: true };
  }

  // Check if user is following another user
  static async isFollowing(supabase, followerId, followingId) {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Get suggested users to follow
  static async getSuggestions(supabase, userId, limit = 10) {
    // Get users that the current user is not following
    const { data, error } = await supabase
      .rpc('get_suggested_users', {
        current_user_id: userId,
        limit_count: limit
      });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, is_verified')
        .neq('id', userId)
        .eq('is_active', true)
        .limit(limit);

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }

    return data;
  }

  // Create notification
  static async createNotification(supabase, notification) {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) console.error('Notification creation error:', error);
  }

  // Get user notifications
  static async getNotifications(supabase, userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Mark notification as read
  static async markNotificationRead(supabase, notificationId, userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mark all notifications as read
  static async markAllNotificationsRead(supabase, userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  }

  // Get unread notification count
  static async getUnreadNotificationCount(supabase, userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count;
  }

  // Block user
  static async blockUser(supabase, blockerId, blockedId) {
    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('User already blocked');
      }
      throw error;
    }

    // Remove follow relationship if exists
    await supabase
      .from('followers')
      .delete()
      .or(`follower_id.eq.${blockerId},following_id.eq.${blockerId}`)
      .or(`follower_id.eq.${blockedId},following_id.eq.${blockedId}`);

    return data;
  }

  // Unblock user
  static async unblockUser(supabase, blockerId, blockedId) {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;
    return { success: true };
  }

  // Get blocked users
  static async getBlockedUsers(supabase, userId) {
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        blocked:blocked_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('blocker_id', userId);

    if (error) throw error;
    return data.map(b => b.blocked);
  }
}

module.exports = User;
