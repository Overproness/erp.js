// @ts-nocheck
const { gql } = require('graphql-tag');

const crmUrlsTypeDefs = gql`
  type CrmUrl {
    _id: ID!
    entityType: String!
    entityId: ID!
    url: String!
    shortUrl: String
    type: String
    metadata: JSON
    clickCount: Int
    isActive: Boolean
    expiresAt: DateTime
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CrmUrlCreateInput {
    entityType: String!
    entityId: ID!
    type: String
    metadata: JSON
    expiresAt: DateTime
  }

  extend type Query {
    crmUrlList(page: Int, limit: Int): ListResponse!
    crmUrlRead(id: ID!): MutationResponse!
    crmUrlByEntity(entityType: String!, entityId: ID!): ListResponse!
    crmUrlAnalytics(id: ID!): MutationResponse!
  }

  extend type Mutation {
    crmUrlCreate(input: CrmUrlCreateInput!): MutationResponse!
    crmUrlDelete(id: ID!): MutationResponse!
    crmUrlDeactivate(id: ID!): MutationResponse!
    crmUrlRegenerate(id: ID!): MutationResponse!
  }
`;

module.exports = crmUrlsTypeDefs;
