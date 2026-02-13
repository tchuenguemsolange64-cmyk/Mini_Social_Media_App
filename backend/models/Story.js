class Story {
  // Create a story
  static async create(supabase, storyData) {
    const { data, error } = await supabase
      .from('stories')
      .insert(storyData)
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Get active stories from followed users
  static async getFeed(supabase, userId) {
    const { data, error } = await supabase
      .rpc('get_stories_feed', { current_user_id: userId });

    if (error) {
      // Fallback query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('stories')
        .select(`
          *,
          author:author_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }

    return data;
  }

  // Get user's stories
  static async getUserStories(supabase, userId, currentUserId = null) {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        views_count:story_views(count)
      `)
      .eq('author_id', userId)
      .gt('expires_at', new Date().toISOString())
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if current user viewed each story
    if (currentUserId && data) {
      for (const story of data) {
        const { data: viewData } = await supabase
          .from('story_views')
          .select('id')
          .eq('story_id', story.id)
          .eq('viewer_id', currentUserId)
          .single();

        story.is_viewed = !!viewData;
      }
    }

    return data;
  }

  // Get story by ID
  static async findById(supabase, storyId, currentUserId = null) {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        views:story_views (
          viewer:viewer_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          viewed_at
        )
      `)
      .eq('id', storyId)
      .single();

    if (error) throw error;

    // Mark as viewed by current user
    if (currentUserId && currentUserId !== data.author_id) {
      await this.markAsViewed(supabase, storyId, currentUserId);
    }

    return data;
  }

  // Mark story as viewed
  static async markAsViewed(supabase, storyId, viewerId) {
    const { error } = await supabase
      .from('story_views')
      .upsert({
        story_id: storyId,
        viewer_id: viewerId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'story_id,viewer_id'
      });

    if (error && error.code !== '23505') {
      console.error('Story view error:', error);
    }

    return { success: true };
  }

  // Get story viewers
  static async getViewers(supabase, storyId, userId) {
    // Verify story belongs to user
    const { data: story } = await supabase
      .from('stories')
      .select('author_id')
      .eq('id', storyId)
      .single();

    if (!story || story.author_id !== userId) {
      throw new Error('Unauthorized to view story viewers');
    }

    const { data, error } = await supabase
      .from('story_views')
      .select(`
        viewer:viewer_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        viewed_at
      `)
      .eq('story_id', storyId)
      .order('viewed_at', { ascending: false });

    if (error) throw error;
    return data.map(v => ({ ...v.viewer, viewed_at: v.viewed_at }));
  }

  // Delete story
  static async delete(supabase, storyId, userId) {
    const { data, error } = await supabase
      .from('stories')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', storyId)
      .eq('author_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get story statistics
  static async getStats(supabase, storyId, userId) {
    const { data: story } = await supabase
      .from('stories')
      .select('author_id')
      .eq('id', storyId)
      .single();

    if (!story || story.author_id !== userId) {
      throw new Error('Unauthorized to view story stats');
    }

    const { count: viewsCount, error: viewsError } = await supabase
      .from('story_views')
      .select('id', { count: 'exact' })
      .eq('story_id', storyId);

    if (viewsError) throw viewsError;

    // Get unique viewers
    const { data: uniqueViewers, error: uniqueError } = await supabase
      .from('story_views')
      .select('viewer_id')
      .eq('story_id', storyId);

    if (uniqueError) throw uniqueError;

    return {
      story_id: storyId,
      total_views: viewsCount,
      unique_viewers: new Set(uniqueViewers.map(v => v.viewer_id)).size
    };
  }

  // Clean up expired stories (should be run by a cron job)
  static async cleanupExpired(supabase) {
    const { error } = await supabase
      .from('stories')
      .update({ is_deleted: true })
      .lt('expires_at', new Date().toISOString())
      .eq('is_deleted', false);

    if (error) throw error;
    return { success: true };
  }
}

module.exports = Story;
