import { useQuery, useMutation, useSubscription, type QueryHookOptions, type MutationHookOptions, type SubscriptionHookOptions } from '@apollo/client/react';
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION,
  NOTIFICATION_UNREAD_COUNT,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
  CLEAR_ALL_NOTIFICATIONS,
  NOTIFICATION_RECEIVED,
} from '../graphql/operations/notification';

export const useNotificationsGql = (options?: QueryHookOptions) =>
  useQuery(GET_NOTIFICATIONS, options);

export const useNotification = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_NOTIFICATION, { ...options, variables: { id } });

export const useUnreadNotificationCount = (options?: QueryHookOptions) =>
  useQuery(NOTIFICATION_UNREAD_COUNT, options);

export const useMarkNotificationRead = (options?: MutationHookOptions) =>
  useMutation(MARK_NOTIFICATION_READ, options);

export const useMarkAllNotificationsRead = (options?: MutationHookOptions) =>
  useMutation(MARK_ALL_NOTIFICATIONS_READ, options);

export const useDeleteNotification = (options?: MutationHookOptions) =>
  useMutation(DELETE_NOTIFICATION, options);

export const useClearAllNotifications = (options?: MutationHookOptions) =>
  useMutation(CLEAR_ALL_NOTIFICATIONS, options);

export const useNotificationSubscription = (userId: string, options?: SubscriptionHookOptions) =>
  useSubscription(NOTIFICATION_RECEIVED, { ...options, variables: { userId } });
