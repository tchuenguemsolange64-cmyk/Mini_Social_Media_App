const Message = require('../models/Message');
const User = require('../models/User');
const { supabase } = require('../models');

const messageController = {
  // Send a message
  async send(req, res) {
    try {
      const senderId = req.user.id;
      const { recipientId } = req.params;
      const { content } = req.body;

      // Validation
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Message must be less than 5000 characters'
        });
      }

      if (senderId === recipientId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send message to yourself'
        });
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          error: 'Recipient not found'
        });
      }

      // Check if blocked
      const { data: blockData } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${senderId})`)
        .single();

      if (blockData) {
        return res.status(403).json({
          success: false,
          error: 'Cannot send message to this user'
        });
      }

      const message = await Message.create({
        sender_id: senderId,
        recipient_id: recipientId,
        content: content.trim(),
        created_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get conversation
  async getConversation(req, res) {
    try {
      const currentUserId = req.user.id;
      const { userId } = req.params;
      const { limit = 50, offset = 0, before } = req.query;

      // Check if user exists
      const user = await User.findById(userId);
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
        .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${currentUserId})`)
        .single();

      if (blockData) {
        return res.status(403).json({
          success: false,
          error: 'Cannot view this conversation'
        });
      }

      let query = supabase
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
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      // Mark messages as read
      await Message.markAsRead(userId, currentUserId);

      res.json({
        success: true,
        data: messages.reverse(), // Return in chronological order
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: messages.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get conversations list
  async getConversations(req, res) {
    try {
      const userId = req.user.id;

      const { data: conversations, error } = await supabase
        .rpc('get_conversations', { current_user_id: userId });

      if (error) {
        // Fallback query
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            recipient_id,
            content,
            created_at,
            is_read,
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
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (msgError) throw msgError;

        // Group by conversation
        const conversationMap = new Map();

        for (const msg of messages) {
          const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
          const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;

          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              user: otherUser,
              last_message: {
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                is_read: msg.is_read,
                is_sent_by_me: msg.sender_id === userId
              },
              unread_count: msg.recipient_id === userId && !msg.is_read ? 1 : 0
            });
          } else if (msg.recipient_id === userId && !msg.is_read) {
            conversationMap.get(otherUserId).unread_count++;
          }
        }

        return res.json({
          success: true,
          data: Array.from(conversationMap.values())
        });
      }

      res.json({
        success: true,
        data: conversations || []
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const currentUserId = req.user.id;
      const { userId } = req.params;

      await Message.markAsRead(userId, currentUserId);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Message.getUnreadCount(userId);

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

  // Delete message
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      // Check if message exists and belongs to user
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete this message'
        });
      }

      await Message.delete(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Edit message
  async edit(req, res) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      // Check if message exists and belongs to user
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id, created_at')
        .eq('id', messageId)
        .single();

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit this message'
        });
      }

      // Check if message is too old to edit (e.g., 15 minutes)
      const messageAge = Date.now() - new Date(message.created_at).getTime();
      const maxEditTime = 15 * 60 * 1000; // 15 minutes

      if (messageAge > maxEditTime) {
        return res.status(400).json({
          success: false,
          error: 'Message can only be edited within 15 minutes'
        });
      }

      const updatedMessage = await Message.edit(messageId, userId, content.trim());

      res.json({
        success: true,
        message: 'Message edited successfully',
        data: updatedMessage
      });
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Search messages
  async search(req, res) {
    try {
      const userId = req.user.id;
      const { q: query, limit = 20, offset = 0 } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters'
        });
      }

      const messages = await Message.search(userId, query, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = messageController;
