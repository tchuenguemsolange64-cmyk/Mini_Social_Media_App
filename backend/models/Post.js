const { supabaseAdmin } = require('./index');

class Post {
  // Create a new post
  static async create(supabase, postData) {
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
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

  // Get post by ID
  static async findById(supabase, postId, currentUserId = null) {
    let query = supabase
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
        shares_count:shares(count),
        bookmarks_count:bookmarks(count)
      `)
      .eq('id', postId)
      .single();

    const { data, error } = await query;

    if (error) throw error;

    // Check if current user liked/bookmarked
    if (currentUserId) {
      const [{ data: likeData }, { data: bookmarkData }] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', currentUserId).single(),
        supabase.from('bookmarks').select('id').eq('post_id', postId).eq('user_id', currentUserId).single()
      ]);

      data.is_liked = !!likeData;
      data.is_bookmarked = !!bookmarkData;
    }

    return data;
  }

  // Get user's posts
  static async getUserPosts(supabase, userId, limit = 20, offset = 0, currentUserId = null) {
    let query = supabase
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
      .eq('author_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Get feed posts (posts from followed users + own posts)
  static async getFeed(supabase, userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .rpc('get_feed_posts', {
        current_user_id: userId,
        limit_count: limit,
        offset_count: offset
      });

    if (error) {
      // Fallback query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }

    return data;
  }

  // Get explore posts (trending/discover)
  static async getExplore(supabase, limit = 20, offset = 0, currentUserId = null) {
    const { data, error } = await supabase
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
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Update post
  static async update(supabase, postId, userId, updates) {
    const allowedFields = ['content', 'media_urls', 'visibility', 'location', 'tags'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('posts')
      .update(filteredUpdates)
      .eq('id', postId)
      .eq('author_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete post (soft delete)
  static async delete(supabase, postId, userId) {
    const { data, error } = await supabase
      .from('posts')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('author_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Like a post
  static async like(supabase, postId, userId) {
    const { data, error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Post already liked');
      }
      throw error;
    }

    // Get post author for notification
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (post && post.author_id !== userId) {
      await supabase.from('notifications').insert({
        recipient_id: post.author_id,
        sender_id: userId,
        type: 'like',
        reference_type: 'post',
        reference_id: postId
      });
    }

    return data;
  }

  // Unlike a post
  static async unlike(supabase, postId, userId) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Get post likes
  static async getLikes(supabase, postId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('likes')
      .select(`
        user:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        created_at
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.map(l => ({ ...l.user, liked_at: l.created_at }));
  }

  // Bookmark a post
  static async bookmark(supabase, postId, userId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ post_id: postId, user_id: userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Post already bookmarked');
      }
      throw error;
    }

    return data;
  }

  // Remove bookmark
  static async removeBookmark(supabase, postId, userId) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Get user's bookmarked posts
  static async getBookmarks(supabase, userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        post:post_id (
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
        ),
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.map(b => ({ ...b.post, bookmarked_at: b.created_at }));
  }

  // Share/Repost a post
  static async share(supabase, postId, userId, comment = null) {
    const { data, error } = await supabase
      .from('shares')
      .insert({
        post_id: postId,
        user_id: userId,
        comment
      })
      .select()
      .single();

    if (error) throw error;

    // Get post author for notification
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (post && post.author_id !== userId) {
      await supabase.from('notifications').insert({
        recipient_id: post.author_id,
        sender_id: userId,
        type: 'share',
        reference_type: 'post',
        reference_id: postId
      });
    }

    return data;
  }

  // Search posts
  static async search(supabase, query, limit = 20, offset = 0) {
    const { data, error } = await supabase
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
      .textSearch('content', query)
      .eq('is_deleted', false)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Get posts by hashtag
  static async getByHashtag(supabase, hashtag, limit = 20, offset = 0) {
    const { data, error } = await supabase
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
      .contains('tags', [hashtag])
      .eq('is_deleted', false)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }
}

module.exports = Post;
