import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_ANALYTICS_OVERVIEW,
  GET_ANALYTICS_REVENUE,
  GET_ANALYTICS_CLIENTS,
  GET_ANALYTICS_PIPELINE,
  GET_ANALYTICS_TEAM_PERFORMANCE,
  GENERATE_ANALYTICS_REPORT,
  AI_ANALYTICS_INSIGHTS,
  GET_STATISTICS,
  GET_STATISTICS_COMPARISON,
  GET_STATISTICS_TRENDS,
  GET_REPUTATION_OVERVIEW,
  GET_REPUTATION_TREND,
  GET_REPUTATION_PLATFORM_BREAKDOWN,
  GET_REPUTATION_SENTIMENT,
  GET_REPUTATION_COMPETITOR,
  GENERATE_REPUTATION_REPORT,
  GET_GLOBAL_ANALYTICS_DASHBOARD,
  GET_CUSTOMER_JOURNEY,
  GET_GLOBAL_ANALYTICS_FUNNEL,
  GET_GLOBAL_ANALYTICS_COHORT,
  AI_GLOBAL_ANALYTICS_FORECAST,
} from '../graphql/operations/analytics';

// General Analytics
export const useAnalyticsOverview = (options?: QueryHookOptions) =>
  useQuery(GET_ANALYTICS_OVERVIEW, options);

export const useAnalyticsRevenue = (options?: QueryHookOptions) =>
  useQuery(GET_ANALYTICS_REVENUE, options);

export const useAnalyticsClients = (options?: QueryHookOptions) =>
  useQuery(GET_ANALYTICS_CLIENTS, options);

export const useAnalyticsPipeline = (options?: QueryHookOptions) =>
  useQuery(GET_ANALYTICS_PIPELINE, options);

export const useAnalyticsTeamPerformance = (options?: QueryHookOptions) =>
  useQuery(GET_ANALYTICS_TEAM_PERFORMANCE, options);

export const useGenerateAnalyticsReport = (options?: MutationHookOptions) =>
  useMutation(GENERATE_ANALYTICS_REPORT, options);

export const useAiAnalyticsInsights = (options?: QueryHookOptions) =>
  useQuery(AI_ANALYTICS_INSIGHTS, options);

// Statistics
export const useStatisticsGql = (entity: string, options?: QueryHookOptions) =>
  useQuery(GET_STATISTICS, { ...options, variables: { entity } });

export const useStatisticsComparison = (entity: string, period1: string, period2: string, options?: QueryHookOptions) =>
  useQuery(GET_STATISTICS_COMPARISON, { ...options, variables: { entity, period1, period2 } });

export const useStatisticsTrends = (entity: string, metric: string, options?: QueryHookOptions) =>
  useQuery(GET_STATISTICS_TRENDS, { ...options, variables: { entity, metric } });

// Reputation Analytics
export const useReputationOverview = (options?: QueryHookOptions) =>
  useQuery(GET_REPUTATION_OVERVIEW, options);

export const useReputationTrend = (period: string, options?: QueryHookOptions) =>
  useQuery(GET_REPUTATION_TREND, { ...options, variables: { period } });

export const useReputationPlatformBreakdown = (options?: QueryHookOptions) =>
  useQuery(GET_REPUTATION_PLATFORM_BREAKDOWN, options);

export const useReputationSentiment = (options?: QueryHookOptions) =>
  useQuery(GET_REPUTATION_SENTIMENT, options);

export const useReputationCompetitor = (options?: QueryHookOptions) =>
  useQuery(GET_REPUTATION_COMPETITOR, options);

export const useGenerateReputationReport = (options?: MutationHookOptions) =>
  useMutation(GENERATE_REPUTATION_REPORT, options);

// Global Analytics
export const useGlobalAnalyticsDashboard = (options?: QueryHookOptions) =>
  useQuery(GET_GLOBAL_ANALYTICS_DASHBOARD, options);

export const useCustomerJourney = (clientId: string, options?: QueryHookOptions) =>
  useQuery(GET_CUSTOMER_JOURNEY, { ...options, variables: { clientId } });

export const useGlobalAnalyticsFunnel = (options?: QueryHookOptions) =>
  useQuery(GET_GLOBAL_ANALYTICS_FUNNEL, options);

export const useGlobalAnalyticsCohort = (metric: string, options?: QueryHookOptions) =>
  useQuery(GET_GLOBAL_ANALYTICS_COHORT, { ...options, variables: { metric } });

export const useAiGlobalAnalyticsForecast = (metric: string, options?: QueryHookOptions) =>
  useQuery(AI_GLOBAL_ANALYTICS_FORECAST, { ...options, variables: { metric } });
