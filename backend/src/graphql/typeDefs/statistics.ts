// @ts-nocheck
const { gql } = require('graphql-tag');

const statisticsTypeDefs = gql`
  extend type Query {
    statisticsGet(entity: String!, period: String, startDate: DateTime, endDate: DateTime): MutationResponse!
    statisticsDashboard: MutationResponse!
    statisticsOverview(period: String): MutationResponse!
    statisticsRevenue(period: String, startDate: DateTime, endDate: DateTime): MutationResponse!
    statisticsClients(period: String): MutationResponse!
    statisticsInvoices(period: String): MutationResponse!
    statisticsQuotes(period: String): MutationResponse!
    statisticsPayments(period: String): MutationResponse!
    statisticsTasks(period: String): MutationResponse!
    statisticsTeam(period: String): MutationResponse!
    statisticsDocuments(period: String): MutationResponse!
    statisticsPaymentModes(period: String): MutationResponse!
    statisticsWorkflows(period: String): MutationResponse!
    statisticsTaxes(period: String): MutationResponse!
  }
`;

module.exports = statisticsTypeDefs;
