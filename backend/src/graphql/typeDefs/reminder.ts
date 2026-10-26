// @ts-nocheck
const { gql } = require('graphql-tag');

const reminderTypeDefs = gql`
  type Reminder {
    _id: ID!
    title: String
    message: String
    type: String
    triggerType: String
    triggerDate: DateTime
    isRecurring: Boolean
    recurringInterval: String
    status: String
    relatedEntity: ID
    relatedEntityType: String
    recipient: ID
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ReminderCreateInput {
    title: String!
    message: String
    type: String
    triggerType: String
    triggerDate: DateTime
    isRecurring: Boolean
    recurringInterval: String
    relatedEntity: ID
    relatedEntityType: String
    recipient: ID
  }

  input ReminderUpdateInput {
    title: String
    message: String
    type: String
    triggerType: String
    triggerDate: DateTime
    isRecurring: Boolean
    recurringInterval: String
    status: String
    relatedEntity: ID
    relatedEntityType: String
    recipient: ID
  }

  extend type Query {
    reminderRead(id: ID!): MutationResponse!
    reminderList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    reminderListAll: ListResponse!
    reminderSearch(q: String!, fields: String): ListResponse!
    reminderFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    reminderCreate(input: JSON!): MutationResponse!
    reminderUpdate(id: ID!, input: JSON!): MutationResponse!
    reminderDelete(id: ID!): MutationResponse!
  }
`;

module.exports = reminderTypeDefs;
