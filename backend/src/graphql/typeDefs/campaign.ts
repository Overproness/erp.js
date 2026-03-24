// @ts-nocheck
const { gql } = require('graphql-tag');

const campaignTypeDefs = gql`
  type Campaign {
    _id: ID!
    name: String!
    description: String
    type: String
    status: String
    startDate: DateTime
    endDate: DateTime
    budget: Float
    spent: Float
    target: JSON
    audience: JSON
    content: JSON
    channels: [String]
    metrics: JSON
    goals: JSON
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CampaignCreateInput {
    name: String!
    description: String
    type: String
    startDate: DateTime
    endDate: DateTime
    budget: Float
    target: JSON
    audience: JSON
    content: JSON
    channels: [String]
    goals: JSON
  }

  input CampaignUpdateInput {
    name: String
    description: String
    type: String
    status: String
    startDate: DateTime
    endDate: DateTime
    budget: Float
    target: JSON
    audience: JSON
    content: JSON
    channels: [String]
    goals: JSON
  }

  extend type Query {
    campaignRead(id: ID!): MutationResponse!
    campaignList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    campaignListAll: ListResponse!
    campaignSearch(q: String!, fields: String): ListResponse!
    campaignFilter(filter: String, equal: String): ListResponse!
    campaignSummary: MutationResponse!
    campaignAnalytics(id: ID!): MutationResponse!
    campaignAbTestResults(id: ID!): MutationResponse!
  }

  extend type Mutation {
    campaignCreate(input: CampaignCreateInput!): MutationResponse!
    campaignUpdate(id: ID!, input: CampaignUpdateInput!): MutationResponse!
    campaignDelete(id: ID!): MutationResponse!
    campaignBulkDelete(ids: [ID!]!): MutationResponse!
    campaignLaunch(id: ID!): MutationResponse!
    campaignPause(id: ID!): MutationResponse!
    campaignResume(id: ID!): MutationResponse!
    campaignStop(id: ID!): MutationResponse!
    campaignDuplicate(id: ID!): MutationResponse!
    campaignSchedule(id: ID!, input: JSON!): MutationResponse!
    campaignOptimize(id: ID!, input: JSON): MutationResponse!
    campaignBulkUpdate(input: JSON!): MutationResponse!
    campaignGenerateReport(id: ID!, input: JSON): MutationResponse!
    campaignUpdateAbTestMetrics(id: ID!, input: JSON!): MutationResponse!
  }
`;

module.exports = campaignTypeDefs;
