// @ts-nocheck
const { gql } = require('graphql-tag');

const globalAnalyticsTypeDefs = gql`
  extend type Query {
    globalAnalyticsOverview(period: String, startDate: DateTime, endDate: DateTime): MutationResponse!
    globalAnalyticsDashboard: MutationResponse!
    globalAnalyticsKPI(period: String): MutationResponse!
    globalAnalyticsComparison(periods: [String!]!): MutationResponse!
    globalAnalyticsExport(format: String!, period: String): MutationResponse!
  }
`;

module.exports = globalAnalyticsTypeDefs;
