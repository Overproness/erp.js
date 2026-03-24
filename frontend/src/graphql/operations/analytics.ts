import { gql } from '@apollo/client';

// General Analytics
export const GET_ANALYTICS_OVERVIEW = gql`
  query GetAnalyticsOverview($period: String, $startDate: DateTime, $endDate: DateTime) {
    analyticsOverview(period: $period, startDate: $startDate, endDate: $endDate) {
      success result message
    }
  }
`;

export const GET_ANALYTICS_REVENUE = gql`
  query GetAnalyticsRevenue($period: String, $startDate: DateTime, $endDate: DateTime) {
    analyticsRevenue(period: $period, startDate: $startDate, endDate: $endDate) {
      success result message
    }
  }
`;

export const GET_ANALYTICS_CLIENTS = gql`
  query GetAnalyticsClients($period: String, $startDate: DateTime, $endDate: DateTime) {
    analyticsClients(period: $period, startDate: $startDate, endDate: $endDate) {
      success result message
    }
  }
`;

export const GET_ANALYTICS_PIPELINE = gql`
  query GetAnalyticsPipeline($period: String) {
    analyticsPipeline(period: $period) { success result message }
  }
`;

export const GET_ANALYTICS_TEAM_PERFORMANCE = gql`
  query GetAnalyticsTeamPerformance($period: String) {
    analyticsTeamPerformance(period: $period) { success result message }
  }
`;

export const GENERATE_ANALYTICS_REPORT = gql`
  mutation GenerateAnalyticsReport($input: AnalyticsReportInput!) {
    analyticsGenerateReport(input: $input) { success result message }
  }
`;

export const AI_ANALYTICS_INSIGHTS = gql`
  query AiAnalyticsInsights($period: String) {
    analyticsAiInsights(period: $period) { success result message }
  }
`;

// Statistics
export const GET_STATISTICS = gql`
  query GetStatistics($entity: String!, $period: String, $startDate: DateTime, $endDate: DateTime) {
    statisticsGet(entity: $entity, period: $period, startDate: $startDate, endDate: $endDate) {
      success result message
    }
  }
`;

export const GET_STATISTICS_DOCUMENTS = gql`
  query GetStatisticsDocuments($period: String) {
    statisticsDocuments(period: $period) { success result message }
  }
`;

export const GET_STATISTICS_PAYMENT_MODES = gql`
  query GetStatisticsPaymentModes($period: String) {
    statisticsPaymentModes(period: $period) { success result message }
  }
`;

export const GET_STATISTICS_WORKFLOWS = gql`
  query GetStatisticsWorkflows($period: String) {
    statisticsWorkflows(period: $period) { success result message }
  }
`;

export const GET_STATISTICS_TAXES = gql`
  query GetStatisticsTaxes($period: String) {
    statisticsTaxes(period: $period) { success result message }
  }
`;

export const GET_REALTIME_ANALYTICS = gql`
  query GetRealtimeAnalytics {
    globalAnalyticsRealtime { success result message }
  }
`;

export const GET_MODULE_ANALYTICS = gql`
  query GetModuleAnalytics($module: String!, $period: String) {
    globalAnalyticsModule(module: $module, period: $period) { success result message }
  }
`;

export const GET_STATISTICS_COMPARISON = gql`
  query GetStatisticsComparison($entity: String!, $period1: String!, $period2: String!) {
    statisticsComparison(entity: $entity, period1: $period1, period2: $period2) {
      success result message
    }
  }
`;

export const GET_STATISTICS_TRENDS = gql`
  query GetStatisticsTrends($entity: String!, $metric: String!, $period: String) {
    statisticsTrends(entity: $entity, metric: $metric, period: $period) {
      success result message
    }
  }
`;

// Reputation Analytics
export const GET_REPUTATION_OVERVIEW = gql`
  query GetReputationOverview($period: String) {
    reputationAnalyticsOverview(period: $period) { success result message }
  }
`;

export const GET_REPUTATION_TREND = gql`
  query GetReputationTrend($period: String!, $platform: String) {
    reputationAnalyticsTrend(period: $period, platform: $platform) {
      success result message
    }
  }
`;

export const GET_REPUTATION_PLATFORM_BREAKDOWN = gql`
  query GetReputationPlatformBreakdown {
    reputationAnalyticsPlatformBreakdown { success result message }
  }
`;

export const GET_REPUTATION_SENTIMENT = gql`
  query GetReputationSentiment($period: String) {
    reputationAnalyticsSentiment(period: $period) { success result message }
  }
`;

export const GET_REPUTATION_COMPETITOR = gql`
  query GetReputationCompetitor {
    reputationAnalyticsCompetitor { success result message }
  }
`;

export const GENERATE_REPUTATION_REPORT = gql`
  mutation GenerateReputationReport($input: JSON) {
    reputationAnalyticsGenerateReport(input: $input) { success result message }
  }
`;

// Global Analytics
export const GET_GLOBAL_ANALYTICS_DASHBOARD = gql`
  query GetGlobalAnalyticsDashboard($period: String) {
    globalAnalyticsDashboard(period: $period) { success result message }
  }
`;

export const GET_CUSTOMER_JOURNEY = gql`
  query GetCustomerJourney($clientId: ID!) {
    globalAnalyticsCustomerJourney(clientId: $clientId) { success result message }
  }
`;

export const GET_GLOBAL_ANALYTICS_FUNNEL = gql`
  query GetGlobalAnalyticsFunnel($period: String) {
    globalAnalyticsFunnel(period: $period) { success result message }
  }
`;

export const GET_GLOBAL_ANALYTICS_COHORT = gql`
  query GetGlobalAnalyticsCohort($metric: String!, $period: String) {
    globalAnalyticsCohort(metric: $metric, period: $period) { success result message }
  }
`;

export const AI_GLOBAL_ANALYTICS_FORECAST = gql`
  query AiGlobalAnalyticsForecast($metric: String!, $horizon: Int) {
    globalAnalyticsAiForecast(metric: $metric, horizon: $horizon) {
      success result message
    }
  }
`;
