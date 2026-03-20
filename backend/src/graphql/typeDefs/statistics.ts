// @ts-nocheck
const { gql } = require('graphql-tag');

const statisticsTypeDefs = gql`
  extend type Query {
    statisticsDashboard: MutationResponse!
    statisticsOverview(period: String): MutationResponse!
    statisticsRevenue(period: String, startDate: DateTime, endDate: DateTime): MutationResponse!
    statisticsClients(period: String): MutationResponse!
    statisticsInvoices(period: String): MutationResponse!
    statisticsQuotes(period: String): MutationResponse!
    statisticsPayments(period: String): MutationResponse!
    statisticsTasks(period: String): MutationResponse!
    statisticsTeam(period: String): MutationResponse!
  }
`;

module.exports = statisticsTypeDefs;
