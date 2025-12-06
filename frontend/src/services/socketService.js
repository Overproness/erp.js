/**
 * Socket.io Client Service
 * Manages real-time WebSocket connection for notifications
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize socket connection
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888';

    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      autoConnect: true
    });

    this.setupEventHandlers();

    return this.socket;
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('socket:connected');
    });

    this.socket.on('connected', (data) => {
      console.log('Server confirmation:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.connected = false;
      this.emit('socket:disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('socket:error', { 
          message: 'Failed to connect to notification service',
          error 
        });
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket:error', error);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      console.log('📬 New notification received:', data);
      this.emit('notification:new', data);
    });

    this.socket.on('notification:updated', (data) => {
      this.emit('notification:updated', data);
    });

    this.socket.on('notification:deleted', (data) => {
      this.emit('notification:deleted', data);
    });

    this.socket.on('notifications:list', (data) => {
      this.emit('notifications:list', data);
    });

    this.socket.on('notifications:unreadCount', (data) => {
      this.emit('notifications:unreadCount', data);
    });

    this.socket.on('notifications:marked', (data) => {
      this.emit('notifications:marked', data);
    });

    this.socket.on('notifications:allMarkedRead', (data) => {
      this.emit('notifications:allMarkedRead', data);
    });

    this.socket.on('notifications:error', (data) => {
      console.error('Notification error:', data);
      this.emit('notifications:error', data);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const listeners = this.listeners.get(event);
    const index = listeners.indexOf(callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Fetch notifications
   * @param {object} options - Fetch options
   */
  fetchNotifications(options = {}) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:fetch', options);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:markRead', { notificationId });
  }

  /**
   * Mark multiple notifications as read
   * @param {array} notificationIds - Array of notification IDs
   */
  markManyAsRead(notificationIds) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:markRead', { notificationIds });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:markAllRead');
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  deleteNotification(notificationId) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:delete', { notificationId });
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:getUnreadCount');
  }

  /**
   * Subscribe to notification types
   * @param {array} types - Notification types
   * @param {array} modules - Module names
   */
  subscribeToTypes(types = [], modules = []) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('notifications:subscribe', { types, modules });
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * Get socket instance
   * @returns {Socket}
   */
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
