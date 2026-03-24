import apolloClient from '@/graphql/client';
import {
  GET_STATISTICS,
  GET_STATISTICS_DOCUMENTS,
  GET_STATISTICS_PAYMENT_MODES,
  GET_STATISTICS_WORKFLOWS,
  GET_STATISTICS_TAXES,
} from '@/graphql/operations/analytics';

/**
 * Statistics API service — GraphQL
 */
class StatisticsService {
  static async getDashboardStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'dashboard', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getClientStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'client', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getInvoiceStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'invoice', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getQuoteStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'quote', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getPaymentStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'payment', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getTeamStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'team', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getTaskStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'task', period: params.timeframe },
    });
    return data.statisticsGet;
  }

  static async getDocumentStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS_DOCUMENTS,
      variables: { period: params.timeframe },
    });
    return data.statisticsDocuments;
  }

  static async getPaymentModeStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS_PAYMENT_MODES,
      variables: { period: params.timeframe },
    });
    return data.statisticsPaymentModes;
  }

  static async getWorkflowStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS_WORKFLOWS,
      variables: { period: params.timeframe },
    });
    return data.statisticsWorkflows;
  }

  static async getTaxStats(params: { timeframe?: string } = {}) {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS_TAXES,
      variables: { period: params.timeframe },
    });
    return data.statisticsTaxes;
  }
}

export default StatisticsService;
