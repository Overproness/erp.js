/**
 * Socket.io handlers for real-time notifications
 */

const jwt = require('jsonwebtoken');
const Notification = require('../models/appModels/Notification');

// Store active user connections
const activeConnections = new Map(); // userId -> Set of socketIds

/**
 * Authenticate socket connection using JWT
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id || decoded._id || decoded.userId;
    socket.userEmail = decoded.email;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Initialize notification socket handlers
 */
module.exports = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);

    // Track active connection
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to notification service',
      userId,
      socketId: socket.id,
      timestamp: new Date(),
    });

    /**
     * Client requests to fetch notifications
     */
    socket.on('notifications:fetch', async (data = {}) => {
      try {
        const { limit = 20, skip = 0, unreadOnly = false } = data;

        const notifications = await Notification.getUserNotifications(userId, {
          limit,
          skip,
          unreadOnly,
        });

        const unreadCount = await Notification.getUnreadCount(userId);

        socket.emit('notifications:list', {
          notifications,
          unreadCount,
          total: notifications.length,
          hasMore: notifications.length === limit,
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        socket.emit('notifications:error', {
          message: 'Failed to fetch notifications',
          error: error.message,
        });
      }
    });

    /**
     * Mark notification as read
     */
    socket.on('notifications:markRead', async (data) => {
      try {
        const { notificationId, notificationIds } = data;

        if (notificationId) {
          // Mark single notification as read
          const notification = await Notification.findOne({
            _id: notificationId,
            recipientId: userId,
          });

          if (notification) {
            await notification.markAsRead();
            socket.emit('notifications:marked', {
              notificationId,
              success: true,
            });

            // Update unread count
            const unreadCount = await Notification.getUnreadCount(userId);
            socket.emit('notifications:unreadCount', { count: unreadCount });
          }
        } else if (notificationIds && Array.isArray(notificationIds)) {
          // Mark multiple notifications as read
          await Notification.updateMany(
            {
              _id: { $in: notificationIds },
              recipientId: userId,
            },
            {
              $set: {
                read: true,
                readAt: new Date(),
              },
            }
          );

          socket.emit('notifications:marked', {
            notificationIds,
            success: true,
          });

          // Update unread count
          const unreadCount = await Notification.getUnreadCount(userId);
          socket.emit('notifications:unreadCount', { count: unreadCount });
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('notifications:error', {
          message: 'Failed to mark notification as read',
          error: error.message,
        });
      }
    });

    /**
     * Mark all notifications as read
     */
    socket.on('notifications:markAllRead', async () => {
      try {
        await Notification.markAllAsRead(userId);

        socket.emit('notifications:allMarkedRead', {
          success: true,
          message: 'All notifications marked as read',
        });

        socket.emit('notifications:unreadCount', { count: 0 });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('notifications:error', {
          message: 'Failed to mark all notifications as read',
          error: error.message,
        });
      }
    });

    /**
     * Delete notification
     */
    socket.on('notifications:delete', async (data) => {
      try {
        const { notificationId } = data;

        const notification = await Notification.findOne({
          _id: notificationId,
          recipientId: userId,
        });

        if (notification) {
          await notification.softDelete();

          socket.emit('notifications:deleted', {
            notificationId,
            success: true,
          });

          // Update unread count if it was unread
          if (!notification.read) {
            const unreadCount = await Notification.getUnreadCount(userId);
            socket.emit('notifications:unreadCount', { count: unreadCount });
          }
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        socket.emit('notifications:error', {
          message: 'Failed to delete notification',
          error: error.message,
        });
      }
    });

    /**
     * Get unread count
     */
    socket.on('notifications:getUnreadCount', async () => {
      try {
        const count = await Notification.getUnreadCount(userId);
        socket.emit('notifications:unreadCount', { count });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('notifications:error', {
          message: 'Failed to get unread count',
          error: error.message,
        });
      }
    });

    /**
     * Subscribe to specific notification types
     */
    socket.on('notifications:subscribe', (data) => {
      const { types = [], modules = [] } = data;

      types.forEach((type) => {
        socket.join(`notif-type:${type}`);
      });

      modules.forEach((module) => {
        socket.join(`notif-module:${module}`);
      });

      socket.emit('notifications:subscribed', {
        types,
        modules,
        success: true,
      });
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${userId} (Socket: ${socket.id}) - Reason: ${reason}`);

      // Remove from active connections
      if (activeConnections.has(userId)) {
        activeConnections.get(userId).delete(socket.id);

        // Remove user entry if no more active connections
        if (activeConnections.get(userId).size === 0) {
          activeConnections.delete(userId);
        }
      }
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Return helper functions for emitting notifications
  return {
    /**
     * Emit notification to specific user
     */
    emitToUser: (userId, event, data) => {
      io.to(`user:${userId}`).emit(event, data);
    },

    /**
     * Emit notification to multiple users
     */
    emitToUsers: (userIds, event, data) => {
      userIds.forEach((userId) => {
        io.to(`user:${userId}`).emit(event, data);
      });
    },

    /**
     * Check if user is online
     */
    isUserOnline: (userId) => {
      return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
    },

    /**
     * Get active connections count
     */
    getActiveConnectionsCount: () => {
      return activeConnections.size;
    },

    /**
     * Get all active user IDs
     */
    getActiveUserIds: () => {
      return Array.from(activeConnections.keys());
    },
  };
};
