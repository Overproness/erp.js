import { useQuery, useMutation, useSubscription, type QueryHookOptions, type MutationHookOptions, type SubscriptionHookOptions } from '@apollo/client/react';
import {
  GET_CHAT_ROOMS,
  GET_CHAT_ROOM,
  GET_CHAT_MESSAGES,
  GET_CHAT_QUEUE,
  CREATE_CHAT_ROOM,
  SEND_CHAT_MESSAGE,
  EDIT_CHAT_MESSAGE,
  DELETE_CHAT_MESSAGE,
  MARK_CHAT_READ,
  ASSIGN_CHAT_QUEUE,
  CHAT_MESSAGE_RECEIVED,
  CHAT_TYPING,
} from '../graphql/operations/chat';

export const useChatRooms = (options?: QueryHookOptions) =>
  useQuery(GET_CHAT_ROOMS, options);

export const useChatRoom = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_CHAT_ROOM, { ...options, variables: { id } });

export const useChatMessages = (roomId: string, options?: QueryHookOptions) =>
  useQuery(GET_CHAT_MESSAGES, { ...options, variables: { roomId } });

export const useChatQueue = (options?: QueryHookOptions) =>
  useQuery(GET_CHAT_QUEUE, options);

export const useCreateChatRoom = (options?: MutationHookOptions) =>
  useMutation(CREATE_CHAT_ROOM, options);

export const useSendChatMessage = (options?: MutationHookOptions) =>
  useMutation(SEND_CHAT_MESSAGE, options);

export const useEditChatMessage = (options?: MutationHookOptions) =>
  useMutation(EDIT_CHAT_MESSAGE, options);

export const useDeleteChatMessage = (options?: MutationHookOptions) =>
  useMutation(DELETE_CHAT_MESSAGE, options);

export const useMarkChatRead = (options?: MutationHookOptions) =>
  useMutation(MARK_CHAT_READ, options);

export const useAssignChatQueue = (options?: MutationHookOptions) =>
  useMutation(ASSIGN_CHAT_QUEUE, options);

export const useChatMessageSubscription = (roomId: string, options?: SubscriptionHookOptions) =>
  useSubscription(CHAT_MESSAGE_RECEIVED, { ...options, variables: { roomId } });

export const useChatTypingSubscription = (roomId: string, options?: SubscriptionHookOptions) =>
  useSubscription(CHAT_TYPING, { ...options, variables: { roomId } });
