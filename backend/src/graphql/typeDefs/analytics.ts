// @ts-nocheck
const { gql } = require('graphql-tag');

const analyticsTypeDefs = gql`
  extend type Query {
    analyticsOverview(period: String, startDate: DateTime, endDate: DateTime): MutationResponse!
    analyticsDashboard: MutationResponse!
    analyticsRevenue(period: String, startDate: DateTime, endDate: DateTime): MutationResponse!
    analyticsClients(period: String): MutationResponse!
    analyticsConversion(period: String): MutationResponse!
    analyticsEngagement(period: String): MutationResponse!
    analyticsTrends(metric: String!, period: String): MutationResponse!
  }
`;

module.exports = analyticsTypeDefs;
