const { supabase } = require('../models');

class FeedService {
  // Generate personalized feed for user
  static async generateFeed(userId, options = {}) {
    const { limit = 20, offset = 0, includeAds = false } = options;

    try {
      // Get posts from followed users + own posts
      const { data: posts, error } = await supabase
        .rpc('get_personalized_feed', {
          current_user_id: userId,
          limit_count: limit,
          offset_count: offset
        });

      if (error) throw error;

      // If RPC doesn't exist, use fallback query
      if (!posts) {
        return this.fallbackFeed(userId, limit, offset);
      }

      return {
        posts: posts || [],
        hasMore: posts?.length === limit
      };
    } catch (error) {
      console.error('Feed generation error:', error);
      return this.fallbackFeed(userId, limit, offset);
    }
  }

  // Fallback feed query
  static async fallbackFeed(userId, limit, offset) {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes_count:likes(count),
        comments_count:comments(count),
        shares_count:shares(count)
      `)
      .eq('is_deleted', false)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      posts: posts || [],
      hasMore: posts?.length === limit
    };
  }

  // Get trending content
  static async getTrending(options = {}) {
    const { limit = 20, timeframe = '24h' } = options;

    const timeframeMap = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };

    const hours = timeframeMap[timeframe] || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .eq('is_deleted', false)
      .eq('visibility', 'public')
      .gte('created_at', since)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return posts || [];
  }

  // Get recommended content based on user interests
  static async getRecommendations(userId, options = {}) {
    const { limit = 20 } = options;

    // Get user's liked posts tags
    const { data: likedPosts } = await supabase
      .from('likes')
      .select('post:post_id(tags)')
      .eq('user_id', userId)
      .limit(50);

    const userTags = likedPosts?.flatMap(like => like.post?.tags || []) || [];
    const uniqueTags = [...new Set(userTags)];

    if (uniqueTags.length === 0) {
      // Return popular posts if no user preferences
      return this.getTrending({ limit });
    }

    // Find posts with similar tags
    const { data: recommended, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .overlaps('tags', uniqueTags)
      .neq('author_id', userId)
      .eq('is_deleted', false)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return recommended || [];
  }
}

module.exports = FeedService;
