/**
 * Notification Bell Component
 * Displays notification icon with unread count badge
 */

import { BellOutlined, CheckOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, List, Popover, Spin, Typography } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationBell.css';

const { Text } = Typography;

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState([]);

  useEffect(() => {
    // Show only first 10 notifications in dropdown
    setDisplayNotifications(notifications.slice(0, 10));
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    // Close popover
    setOpen(false);
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
      case 'negative_review':
        return '❌';
      case 'task_assigned':
        return '📝';
      case 'new_review':
        return '⭐';
      case 'ai_response':
        return '🤖';
      default:
        return 'ℹ️';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const notificationContent = (
    <div className="notification-panel">
      <div className="notification-header">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead} icon={<CheckOutlined />}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="notification-loading">
          <Spin />
        </div>
      ) : displayNotifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No notifications"
          style={{ padding: '20px 0' }}
        />
      ) : (
        <List
          className="notification-list"
          dataSource={displayNotifications}
          renderItem={(notification) => (
            <List.Item
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
              key={notification._id}
              actions={[
                !notification.read && (
                  <Button
                    key="mark-read"
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => handleMarkAsRead(e, notification._id)}
                    title="Mark as read"
                  />
                ),
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(e, notification._id)}
                  title="Delete"
                  danger
                />,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <span className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </span>
                }
                title={
                  <div className="notification-title">
                    {notification.title}
                    {!notification.read && <span className="unread-dot" />}
                  </div>
                }
                description={
                  <div className="notification-description">
                    <Text className="notification-message">{notification.message}</Text>
                    <Text type="secondary" className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      {displayNotifications.length > 0 && (
        <div className="notification-footer">
          <Button type="link" onClick={handleViewAll} block>
            View all notifications
          </Button>
        </div>
      )}

      {!connected && (
        <div className="notification-status">
          <Text type="warning" style={{ fontSize: 12 }}>
            ⚠️ Real-time notifications disconnected
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={notificationContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="notification-popover"
      overlayStyle={{ width: 400 }}
    >
      <Badge count={unreadCount} overflowCount={99} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
          className="notification-bell-button"
        />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
