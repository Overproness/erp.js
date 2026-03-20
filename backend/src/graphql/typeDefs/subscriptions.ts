// @ts-nocheck
const { gql } = require('graphql-tag');

const subscriptionTypeDefs = gql`
  extend type Subscription {
    notificationReceived(userId: ID!): Notification!
    chatMessageReceived(roomId: ID!): ChatMessage!
    chatTyping(roomId: ID!): JSON
  }
`;

module.exports = subscriptionTypeDefs;
