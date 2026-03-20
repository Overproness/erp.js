import { gql } from '@apollo/client';

export const GET_CHAT_ROOMS = gql`
  query GetChatRooms($page: Int, $limit: Int) {
    chatRoomList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_CHAT_ROOM = gql`
  query GetChatRoom($id: ID!) { chatRoomRead(id: $id) { success result message } }
`;

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($roomId: ID!, $page: Int, $limit: Int) {
    chatMessageList(roomId: $roomId, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_CHAT_QUEUE = gql`
  query GetChatQueue($page: Int, $limit: Int) {
    chatQueueList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_CHAT_ROOM = gql`
  mutation CreateChatRoom($input: ChatRoomCreateInput!) {
    chatRoomCreate(input: $input) { success result message }
  }
`;

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($input: ChatMessageInput!) {
    chatMessageSend(input: $input) { success result message }
  }
`;

export const EDIT_CHAT_MESSAGE = gql`
  mutation EditChatMessage($id: ID!, $content: String!) {
    chatMessageEdit(id: $id, content: $content) { success result message }
  }
`;

export const DELETE_CHAT_MESSAGE = gql`
  mutation DeleteChatMessage($id: ID!) {
    chatMessageDelete(id: $id) { success result message }
  }
`;

export const MARK_CHAT_READ = gql`
  mutation MarkChatRead($id: ID!) {
    chatRoomMarkRead(id: $id) { success result message }
  }
`;

export const ASSIGN_CHAT_QUEUE = gql`
  mutation AssignChatQueue($id: ID!, $agentId: ID!) {
    chatQueueAssign(id: $id, agentId: $agentId) { success result message }
  }
`;

// Subscriptions
export const CHAT_MESSAGE_RECEIVED = gql`
  subscription ChatMessageReceived($roomId: ID!) {
    chatMessageReceived(roomId: $roomId) {
      _id room sender senderType content messageType attachments createdAt
    }
  }
`;

export const CHAT_TYPING = gql`
  subscription ChatTyping($roomId: ID!) {
    chatTyping(roomId: $roomId)
  }
`;
