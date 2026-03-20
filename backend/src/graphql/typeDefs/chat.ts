// @ts-nocheck
const { gql } = require('graphql-tag');

const chatTypeDefs = gql`
  type ChatMessage {
    _id: ID!
    room: ID
    sender: ID
    senderType: String
    content: String
    messageType: String
    attachments: [JSON]
    readBy: [JSON]
    isEdited: Boolean
    editedAt: DateTime
    replyTo: ID
    metadata: JSON
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type ChatRoom {
    _id: ID!
    name: String
    type: String
    participants: [JSON]
    lastMessage: ID
    lastActivity: DateTime
    isActive: Boolean
    metadata: JSON
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type ChatQueue {
    _id: ID!
    visitor: JSON
    status: String
    assignedAgent: ID
    priority: Int
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ChatMessageInput {
    room: ID!
    content: String!
    messageType: String
    replyTo: ID
    attachments: [JSON]
  }

  input ChatRoomCreateInput {
    name: String
    type: String
    participants: [ID!]
  }

  extend type Query {
    chatRoomRead(id: ID!): MutationResponse!
    chatRoomList(page: Int, limit: Int): ListResponse!
    chatMessageList(roomId: ID!, page: Int, limit: Int): ListResponse!
    chatQueueList(page: Int, limit: Int): ListResponse!
  }

  extend type Mutation {
    chatRoomCreate(input: ChatRoomCreateInput!): MutationResponse!
    chatMessageSend(input: ChatMessageInput!): MutationResponse!
    chatMessageEdit(id: ID!, content: String!): MutationResponse!
    chatMessageDelete(id: ID!): MutationResponse!
    chatRoomMarkRead(id: ID!): MutationResponse!
    chatQueueAssign(id: ID!, agentId: ID!): MutationResponse!
    chatQueueClose(id: ID!): MutationResponse!
  }
`;

module.exports = chatTypeDefs;
