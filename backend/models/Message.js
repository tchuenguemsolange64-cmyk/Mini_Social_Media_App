class Message {
  // Send a message
  static async create(supabase, messageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        recipient:recipient_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // Create notification for recipient
    await supabase.from('notifications').insert({
      recipient_id: messageData.recipient_id,
      sender_id: messageData.sender_id,
      type: 'message',
      reference_type: 'message',
      reference_id: data.id
    });

    return data;
  }

  // Get conversation between two users
  static async getConversation(supabase, userId1, userId2, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Get user's conversations list
  static async getConversations(supabase, userId) {
    const { data, error } = await supabase
      .rpc('get_conversations', { current_user_id: userId });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('recipient_id, created_at, content')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('sender_id, created_at, content, is_read')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (sentError || receivedError) throw (sentError || receivedError);

      // Combine and deduplicate conversations
      const conversations = new Map();

      [...sentMessages, ...receivedMessages].forEach(msg => {
        const otherUserId = msg.recipient_id || msg.sender_id;
        if (!conversations.has(otherUserId)) {
          conversations.set(otherUserId, {
            user_id: otherUserId,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: msg.is_read === false ? 1 : 0
          });
        } else if (msg.is_read === false) {
          const conv = conversations.get(otherUserId);
          conv.unread_count++;
        }
      });

      return Array.from(conversations.values());
    }

    return data;
  }

  // Mark messages as read
  static async markAsRead(supabase, conversationUserId, currentUserId) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('sender_id', conversationUserId)
      .eq('recipient_id', currentUserId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  }

  // Get unread message count
  static async getUnreadCount(supabase, userId) {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count;
  }

  // Delete message
  static async delete(supabase, messageId, userId) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Edit message
  static async edit(supabase, messageId, userId, content) {
    const { data, error } = await supabase
      .from('messages')
      .update({ content, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Search messages
  static async search(supabase, userId, query, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        recipient:recipient_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .ilike('content', `%${query}%`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }
}

module.exports = Message;
