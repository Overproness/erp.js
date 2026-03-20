// @ts-nocheck
const { gql } = require('graphql-tag');

const marketingTypeDefs = gql`
  type CustomerBehavior {
    _id: ID!
    client: ID
    eventType: String
    eventData: JSON
    page: String
    referrer: String
    sessionId: String
    deviceInfo: JSON
    location: JSON
    timestamp: DateTime
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type CustomerFollowUp {
    _id: ID!
    client: ID
    type: String
    status: String
    scheduledDate: DateTime
    completedDate: DateTime
    notes: String
    assignedTo: ID
    priority: String
    outcome: String
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type CustomerJourney {
    _id: ID!
    client: ID
    currentStage: String
    stages: [JSON]
    transitions: [JSON]
    score: Float
    lastActivity: DateTime
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type CustomerSegment {
    _id: ID!
    name: String!
    description: String
    criteria: JSON
    memberCount: Int
    isAutomatic: Boolean
    status: String
    tags: [String]
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CustomerFollowUpCreateInput {
    client: ID!
    type: String
    scheduledDate: DateTime
    notes: String
    assignedTo: ID
    priority: String
  }

  input CustomerSegmentCreateInput {
    name: String!
    description: String
    criteria: JSON
    isAutomatic: Boolean
    tags: [String]
  }

  extend type Query {
    customerBehaviorList(clientId: ID, page: Int, limit: Int): ListResponse!
    customerBehaviorAnalytics(clientId: ID, period: String): MutationResponse!
    customerFollowUpList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    customerFollowUpRead(id: ID!): MutationResponse!
    customerFollowUpByClient(clientId: ID!): ListResponse!
    customerJourney(clientId: ID!): MutationResponse!
    customerJourneyAnalytics: MutationResponse!
    customerSegmentList(page: Int, limit: Int): ListResponse!
    customerSegmentRead(id: ID!): MutationResponse!
    customerSegmentMembers(id: ID!, page: Int, limit: Int): ListResponse!
  }

  extend type Mutation {
    customerFollowUpCreate(input: CustomerFollowUpCreateInput!): MutationResponse!
    customerFollowUpUpdate(id: ID!, input: JSON!): MutationResponse!
    customerFollowUpDelete(id: ID!): MutationResponse!
    customerFollowUpComplete(id: ID!, outcome: String): MutationResponse!
    customerJourneyInitialize(clientId: ID!): MutationResponse!
    customerJourneyTransition(clientId: ID!, input: JSON!): MutationResponse!
    customerSegmentCreate(input: CustomerSegmentCreateInput!): MutationResponse!
    customerSegmentUpdate(id: ID!, input: JSON!): MutationResponse!
    customerSegmentDelete(id: ID!): MutationResponse!
    customerSegmentRefresh(id: ID!): MutationResponse!
  }
`;

module.exports = marketingTypeDefs;
