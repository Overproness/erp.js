// @ts-nocheck
const { gql } = require('graphql-tag');

const reputationAnalyticsTypeDefs = gql`
  type Review {
    _id: ID!
    source: String
    sourceId: String
    rating: Float
    title: String
    content: String
    author: String
    authorEmail: String
    status: String
    response: String
    respondedAt: DateTime
    respondedBy: ID
    sentiment: String
    sentimentScore: Float
    tags: [String]
    platform: String
    verified: Boolean
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type ReviewLink {
    _id: ID!
    platform: String!
    url: String!
    shortCode: String
    label: String
    clickCount: Int
    isActive: Boolean
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type ReviewTemplate {
    _id: ID!
    name: String!
    content: String!
    type: String
    platform: String
    variables: [String]
    isDefault: Boolean
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ReviewResponseInput {
    content: String!
    isPublic: Boolean
  }

  extend type Query {
    reviewList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    reviewRead(id: ID!): MutationResponse!
    reviewFilter(filter: String, equal: String): ListResponse!
    reviewSearch(q: String!, fields: String): ListResponse!
    reviewAnalyticsSummary(period: String): MutationResponse!
    reviewAnalyticsByPlatform: MutationResponse!
    reviewAnalyticsSentiment(period: String): MutationResponse!
    reviewLinkList(page: Int, limit: Int): ListResponse!
    reviewLinkRead(id: ID!): MutationResponse!
    reviewTemplateList(page: Int, limit: Int): ListResponse!
    reviewTemplateRead(id: ID!): MutationResponse!
    reviewPortalPublicLink: MutationResponse!
  }

  extend type Mutation {
    reviewRespond(id: ID!, input: ReviewResponseInput!): MutationResponse!
    reviewUpdateStatus(id: ID!, status: String!): MutationResponse!
    reviewBulkUpdateStatus(ids: [ID!]!, status: String!): MutationResponse!
    reviewDelete(id: ID!): MutationResponse!
    reviewLinkCreate(input: JSON!): MutationResponse!
    reviewLinkUpdate(id: ID!, input: JSON!): MutationResponse!
    reviewLinkDelete(id: ID!): MutationResponse!
    reviewTemplateCreate(input: JSON!): MutationResponse!
    reviewTemplateUpdate(id: ID!, input: JSON!): MutationResponse!
    reviewTemplateDelete(id: ID!): MutationResponse!
    reviewRequestSend(input: JSON!): MutationResponse!
  }
`;

module.exports = reputationAnalyticsTypeDefs;
