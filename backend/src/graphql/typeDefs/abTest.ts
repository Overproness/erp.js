// @ts-nocheck
const { gql } = require('graphql-tag');

const abTestTypeDefs = gql`
  type ABTestVariant {
    name: String
    url: ID
    weight: Float
    clicks: Int
    conversions: Int
    conversionRate: Float
  }

  type ABTest {
    _id: ID!
    name: String!
    description: String
    status: String
    variants: [ABTestVariant]
    winnerVariant: String
    winningCriteria: String
    startDate: DateTime
    endDate: DateTime
    sampleSize: Int
    confidenceLevel: Float
    totalClicks: Int
    totalConversions: Int
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ABTestVariantInput {
    name: String!
    url: ID!
    weight: Float
  }

  input ABTestCreateInput {
    name: String!
    description: String
    variants: [ABTestVariantInput!]!
    winningCriteria: String
    startDate: DateTime
    endDate: DateTime
    sampleSize: Int
    confidenceLevel: Float
  }

  input ABTestUpdateInput {
    name: String
    description: String
    status: String
    variants: [ABTestVariantInput]
    winningCriteria: String
    startDate: DateTime
    endDate: DateTime
    sampleSize: Int
    confidenceLevel: Float
  }

  extend type Query {
    abTestRead(id: ID!): MutationResponse!
    abTestList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    abTestListAll: ListResponse!
    abTestSearch(q: String!, fields: String): ListResponse!
    abTestFilter(filter: String, equal: String): ListResponse!
    abTestResults(id: ID!): MutationResponse!
  }

  extend type Mutation {
    abTestCreate(input: ABTestCreateInput!): MutationResponse!
    abTestUpdate(id: ID!, input: ABTestUpdateInput!): MutationResponse!
    abTestDelete(id: ID!): MutationResponse!
    abTestStart(id: ID!): MutationResponse!
    abTestStop(id: ID!): MutationResponse!
    abTestDeclareWinner(id: ID!, variant: String!): MutationResponse!
  }
`;

module.exports = abTestTypeDefs;
