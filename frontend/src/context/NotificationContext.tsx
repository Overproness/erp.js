/**
 * Notification Context
 * Provides notification state and functions throughout the app
 */

import { createContext, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { selectCurrentAdmin } from '../redux/auth/selectors';
import apolloClient from '@/graphql/client';
import {
  GET_NOTIFICATIONS,
  NOTIFICATION_UNREAD_COUNT,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
} from '@/graphql/operations/notification';
import socketService from '../services/socketService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const currentAdmin = useSelector(selectCurrentAdmin);

  /**
   * Initialize socket connection and event listeners
   */
  const initializeSocket = useCallback((token) => {
    if (!token) {
      console.warn('No token provided for socket connection');
      return;
    }

    try {
      socketService.connect(token);

      // Socket connection events
      socketService.on('socket:connected', () => {
        setConnected(true);
        setError(null);
        // Fetch initial notifications
        socketService.fetchNotifications({ limit: 20 });
        socketService.getUnreadCount();
      });

      socketService.on('socket:disconnected', (reason) => {
        setConnected(false);
        console.log('Disconnected:', reason);
      });

      socketService.on('socket:error', (error) => {
        setError(error);
        console.error('Socket error:', error);
      });

      // Notification events
      socketService.on('notification:new', (data) => {
        const { notification } = data;

        // Add to notifications list
        setNotifications((prev) => [notification, ...prev]);

        // Update unread count
        setUnreadCount((prev) => prev + 1);

        // Show toast notification
        showToast(notification);
      });

      socketService.on('notification:updated', (data) => {
        const { notificationId, read, readAt } = data;

        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read, readAt } : n))
        );
      });

      socketService.on('notification:deleted', (data) => {
        const { notificationId } = data;

        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      });

      socketService.on('notifications:list', (data) => {
        const { notifications: notifList, unreadCount: count } = data;
        setNotifications(notifList);
        setUnreadCount(count);
      });

      socketService.on('notifications:unreadCount', (data) => {
        setUnreadCount(data.count);
      });

      socketService.on('notifications:allMarkedRead', () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date() })));
        setUnreadCount(0);
      });

      socketService.on('notifications:error', (error) => {
        console.error('Notification error:', error);
        toast.error(error.message || 'Notification error occurred');
      });
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Auto-connect socket if user is already logged in
   */
  useEffect(() => {
    if (currentAdmin?.token && !connected && !socketService.isConnected()) {
      console.log('Auto-connecting socket with existing token');
      initializeSocket(currentAdmin.token);
    }
  }, [currentAdmin?.token, connected, initializeSocket]);

  /**
   * Disconnect socket
   */
  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    setConnected(false);
  }, []);

  /**
   * Show toast notification
   */
  const showToast = useCallback((notification) => {
    const { type, title, message, actionUrl } = notification;

    const toastContent = (
      <div className="notification-toast">
        <div className="notification-toast-title">{title}</div>
        <div className="notification-toast-message">{message}</div>
        {actionUrl && (
          <button
            className="notification-toast-action"
            onClick={() => (window.location.href = actionUrl)}
          >
            View
          </button>
        )}
      </div>
    );

    const toastOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case 'success':
        toast.success(toastContent, toastOptions);
        break;
      case 'warning':
        toast.warning(toastContent, toastOptions);
        break;
      case 'error':
        toast.error(toastContent, toastOptions);
        break;
      case 'negative_review':
      case 'urgent':
        toast.error(toastContent, { ...toastOptions, autoClose: false });
        break;
      default:
        toast.info(toastContent, toastOptions);
    }
  }, []);

  /**
   * Fetch notifications via REST API
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_NOTIFICATIONS,
        variables: {
          page: 1,
          limit: options.limit || 20,
          sortBy: 'createdAt',
          sortValue: 'desc',
        },
      });

      if (data.notificationList?.success) {
        setNotifications(data.notificationList.result);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        // Optimistic update
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Update via socket or API
        if (socketService.isConnected()) {
          socketService.markAsRead(notificationId);
        } else {
          await apolloClient.mutate({
            mutation: MARK_NOTIFICATION_READ,
            variables: { id: notificationId },
          });
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Revert optimistic update
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date() })));
      setUnreadCount(0);

      // Update via socket or API
      if (socketService.isConnected()) {
        socketService.markAllAsRead();
      } else {
        await apolloClient.mutate({
          mutation: MARK_ALL_NOTIFICATIONS_READ,
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        // Optimistic update
        const deletedNotif = notifications.find((n) => n._id === notificationId);
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));

        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Delete via socket or API
        if (socketService.isConnected()) {
          socketService.deleteNotification(notificationId);
        } else {
          await apolloClient.mutate({
            mutation: DELETE_NOTIFICATION,
            variables: { id: notificationId },
          });
        }
      } catch (error) {
        console.error('Failed to delete notification:', error);
        fetchNotifications();
      }
    },
    [notifications, fetchNotifications]
  );

  /**
   * Get unread count via API
   */
  const getUnreadCount = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: NOTIFICATION_UNREAD_COUNT,
      });

      if (data.notificationUnreadCount?.success) {
        setUnreadCount(data.notificationUnreadCount.result);
      }
    } catch (error) {
      console.error('Failed to get unread count:', error);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    connected,
    error,
    initializeSocket,
    disconnectSocket,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    showToast,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
