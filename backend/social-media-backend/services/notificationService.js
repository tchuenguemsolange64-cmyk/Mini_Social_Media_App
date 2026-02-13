const { supabase } = require('../models');

class NotificationService {
  // Create a notification
  static async create({
    recipient_id,
    sender_id,
    type,
    reference_type,
    reference_id,
    metadata = {}
  }) {
    // Don't notify yourself
    if (recipient_id === sender_id) {
      return null;
    }

    // Check if recipient has blocked sender
    const { data: blockData } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', recipient_id)
      .eq('blocked_id', sender_id)
      .single();

    if (blockData) {
      return null;
    }

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select(type)
      .eq('user_id', recipient_id)
      .single();

    if (prefs && prefs[type] === false) {
      return null;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id,
        sender_id,
        type,
        reference_type,
        reference_id,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Notification creation error:', error);
      return null;
    }

    // TODO: Send real-time notification via WebSocket
    // this.sendRealtimeNotification(recipient_id, data);

    return data;
  }

  // Bulk create notifications
  static async createBulk(notifications) {
    const validNotifications = [];

    for (const notif of notifications) {
      if (notif.recipient_id !== notif.sender_id) {
        validNotifications.push({
          ...notif,
          created_at: new Date().toISOString()
        });
      }
    }

    if (validNotifications.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(validNotifications)
      .select();

    if (error) {
      console.error('Bulk notification error:', error);
      return [];
    }

    return data;
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Unread count error:', error);
      return 0;
    }

    return count;
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all read error:', error);
      return false;
    }

    return true;
  }

  // Delete old notifications (for cleanup)
  static async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('is_read', true);

    if (error) {
      console.error('Cleanup notifications error:', error);
      return false;
    }

    return true;
  }

  // Send real-time notification (placeholder for WebSocket implementation)
  static sendRealtimeNotification(userId, notification) {
    // This would integrate with your WebSocket/Socket.io server
    // io.to(`user:${userId}`).emit('notification', notification);
  }
}

module.exports = NotificationService;
