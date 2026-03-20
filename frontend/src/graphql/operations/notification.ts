import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    notificationList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_NOTIFICATION = gql`
  query GetNotification($id: ID!) {
    notificationRead(id: $id) { success result message }
  }
`;

export const NOTIFICATION_UNREAD_COUNT = gql`
  query NotificationUnreadCount {
    notificationUnreadCount { success result message }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    notificationMarkRead(id: $id) { success result message }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    notificationMarkAllRead { success result message }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    notificationDelete(id: $id) { success result message }
  }
`;

export const CLEAR_ALL_NOTIFICATIONS = gql`
  mutation ClearAllNotifications {
    notificationClearAll { success result message }
  }
`;

// Subscription
export const NOTIFICATION_RECEIVED = gql`
  subscription NotificationReceived($userId: ID!) {
    notificationReceived(userId: $userId) {
      _id title message type category priority isRead actionUrl createdAt
    }
  }
`;
