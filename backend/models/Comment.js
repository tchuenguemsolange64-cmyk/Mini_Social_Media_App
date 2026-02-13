class Comment {
  // Create a comment
  static async create(supabase, commentData) {
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
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

    // Get post author for notification
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', commentData.post_id)
      .single();

    if (post && post.author_id !== commentData.author_id) {
      await supabase.from('notifications').insert({
        recipient_id: post.author_id,
        sender_id: commentData.author_id,
        type: 'comment',
        reference_type: 'post',
        reference_id: commentData.post_id
      });
    }

    return data;
  }

  // Get comments for a post
  static async getByPostId(supabase, postId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes_count:comment_likes(count),
        replies_count:comments!parent_id(count)
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Get replies to a comment
  static async getReplies(supabase, parentId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes_count:comment_likes(count)
      `)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Get comment by ID
  static async findById(supabase, commentId) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes_count:comment_likes(count),
        replies_count:comments!parent_id(count)
      `)
      .eq('id', commentId)
      .single();

    if (error) throw error;
    return data;
  }

  // Update comment
  static async update(supabase, commentId, userId, content) {
    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete comment (soft delete)
  static async delete(supabase, commentId, userId) {
    const { data, error } = await supabase
      .from('comments')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Like a comment
  static async like(supabase, commentId, userId) {
    const { data, error } = await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Comment already liked');
      }
      throw error;
    }

    // Get comment author for notification
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id, post_id')
      .eq('id', commentId)
      .single();

    if (comment && comment.author_id !== userId) {
      await supabase.from('notifications').insert({
        recipient_id: comment.author_id,
        sender_id: userId,
        type: 'comment_like',
        reference_type: 'comment',
        reference_id: commentId
      });
    }

    return data;
  }

  // Unlike a comment
  static async unlike(supabase, commentId, userId) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Get comment likes
  static async getLikes(supabase, commentId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('comment_likes')
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
      .eq('comment_id', commentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.map(l => ({ ...l.user, liked_at: l.created_at }));
  }

  // Get user's comments
  static async getUserComments(supabase, userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        post:post_id (
          id,
          content,
          media_urls,
          author:author_id (
            id,
            username,
            display_name,
            avatar_url
          )
        ),
        likes_count:comment_likes(count)
      `)
      .eq('author_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }
}

module.exports = Comment;
