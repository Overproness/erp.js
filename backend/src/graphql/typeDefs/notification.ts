// @ts-nocheck
const { gql } = require('graphql-tag');

const notificationTypeDefs = gql`
  type Notification {
    _id: ID!
    title: String
    message: String
    type: String
    category: String
    priority: String
    isRead: Boolean
    readAt: DateTime
    actionUrl: String
    actionType: String
    relatedEntity: ID
    relatedEntityType: String
    sender: ID
    recipient: ID
    metadata: JSON
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input NotificationCreateInput {
    title: String!
    message: String
    type: String
    category: String
    priority: String
    actionUrl: String
    actionType: String
    relatedEntity: ID
    relatedEntityType: String
    recipient: ID
    metadata: JSON
  }

  extend type Query {
    notificationRead(id: ID!): MutationResponse!
    notificationList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    notificationListAll: ListResponse!
    notificationFilter(filter: String, equal: String): ListResponse!
    notificationUnreadCount: MutationResponse!
  }

  extend type Mutation {
    notificationCreate(input: NotificationCreateInput!): MutationResponse!
    notificationMarkRead(id: ID!): MutationResponse!
    notificationMarkAllRead: MutationResponse!
    notificationDelete(id: ID!): MutationResponse!
    notificationBulkDelete(ids: [ID!]!): MutationResponse!
    notificationClearAll: MutationResponse!
  }
`;

module.exports = notificationTypeDefs;
