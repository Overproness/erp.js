/**
 * Notification Controller
 * Handles HTTP requests for notification management
 */

const Notification = require('@/models/appModels/Notification');
const { notificationService } = require('@/services/notificationService');

const notificationController = {
  /**
   * Get user notifications
   */
  list: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const {
        limit = 20,
        skip = 0,
        unreadOnly = false,
        type,
        priority,
        startDate,
        endDate,
      } = req.query;

      const notifications = await Notification.getUserNotifications(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true',
        type,
        priority,
        startDate,
        endDate,
      });

      const unreadCount = await Notification.getUnreadCount(userId);
      const total = await Notification.countDocuments({
        recipientId: userId,
        deleted: false,
      });

      return res.status(200).json({
        success: true,
        result: notifications,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
          total,
          hasMore: parseInt(skip) + notifications.length < total,
        },
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  },

  /**
   * Get single notification by ID
   */
  read: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId,
        deleted: false,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      return res.status(200).json({
        success: true,
        result: notification,
      });
    } catch (error) {
      console.error('Error reading notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to read notification',
        error: error.message,
      });
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      await notification.markAsRead();

      // Emit update via Socket.io
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notification:updated', {
          notificationId: id,
          read: true,
          readAt: notification.readAt,
        });

        // Update unread count
        const unreadCount = await Notification.getUnreadCount(userId);
        io.to(`user:${userId}`).emit('notifications:unreadCount', { count: unreadCount });
      }

      return res.status(200).json({
        success: true,
        result: notification,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  },

  /**
   * Mark multiple notifications as read
   */
  markManyAsRead: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request: ids array required',
        });
      }

      await Notification.updateMany(
        {
          _id: { $in: ids },
          recipientId: userId,
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        }
      );

      // Emit update via Socket.io
      const io = global.io;
      if (io) {
        const unreadCount = await Notification.getUnreadCount(userId);
        io.to(`user:${userId}`).emit('notifications:unreadCount', { count: unreadCount });
      }

      return res.status(200).json({
        success: true,
        message: `${ids.length} notifications marked as read`,
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: error.message,
      });
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;

      await Notification.markAllAsRead(userId);

      // Emit update via Socket.io
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notifications:allMarkedRead', {
          success: true,
        });
        io.to(`user:${userId}`).emit('notifications:unreadCount', { count: 0 });
      }

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message,
      });
    }
  },

  /**
   * Delete notification (soft delete)
   */
  remove: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      await notification.softDelete();

      // Emit update via Socket.io
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notification:deleted', {
          notificationId: id,
        });

        // Update unread count if it was unread
        if (!notification.read) {
          const unreadCount = await Notification.getUnreadCount(userId);
          io.to(`user:${userId}`).emit('notifications:unreadCount', { count: unreadCount });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;

      const count = await Notification.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message,
      });
    }
  },

  /**
   * Get notification statistics
   */
  getStats: async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id || req.admin?._id;

      const [total, unread, byType, byPriority] = await Promise.all([
        Notification.countDocuments({ recipientId: userId, deleted: false }),
        Notification.countDocuments({ recipientId: userId, read: false, deleted: false }),
        Notification.aggregate([
          { $match: { recipientId: userId, deleted: false } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Notification.aggregate([
          { $match: { recipientId: userId, deleted: false } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

      return res.status(200).json({
        success: true,
        result: {
          total,
          unread,
          read: total - unread,
          byType: byType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byPriority: byPriority.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics',
        error: error.message,
      });
    }
  },

  /**
   * Get aggregated notifications (for team collaboration)
   */
  getAggregated: notificationService.getAggregatedNotifications,
};

module.exports = notificationController;
