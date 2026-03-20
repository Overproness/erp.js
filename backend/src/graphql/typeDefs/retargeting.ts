// @ts-nocheck
const { gql } = require('graphql-tag');

const retargetingTypeDefs = gql`
  type RetargetingCampaign {
    _id: ID!
    name: String!
    description: String
    status: String
    targetAudience: JSON
    triggers: [JSON]
    content: JSON
    channels: [String]
    budget: Float
    spent: Float
    metrics: JSON
    startDate: DateTime
    endDate: DateTime
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input RetargetingCampaignCreateInput {
    name: String!
    description: String
    targetAudience: JSON
    triggers: [JSON]
    content: JSON
    channels: [String]
    budget: Float
    startDate: DateTime
    endDate: DateTime
  }

  input RetargetingCampaignUpdateInput {
    name: String
    description: String
    status: String
    targetAudience: JSON
    triggers: [JSON]
    content: JSON
    channels: [String]
    budget: Float
    startDate: DateTime
    endDate: DateTime
  }

  extend type Query {
    retargetingList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    retargetingRead(id: ID!): MutationResponse!
    retargetingFilter(filter: String, equal: String): ListResponse!
    retargetingAnalytics(id: ID!): MutationResponse!
  }

  extend type Mutation {
    retargetingCreate(input: RetargetingCampaignCreateInput!): MutationResponse!
    retargetingUpdate(id: ID!, input: RetargetingCampaignUpdateInput!): MutationResponse!
    retargetingDelete(id: ID!): MutationResponse!
    retargetingLaunch(id: ID!): MutationResponse!
    retargetingPause(id: ID!): MutationResponse!
    retargetingStop(id: ID!): MutationResponse!
  }
`;

module.exports = retargetingTypeDefs;
