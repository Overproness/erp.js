import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAnalytics,
  fetchSentimentAnalysis,
  fetchReviewTrends,
  exportReviews
} from '../../redux/reputation/reputationActions';
import {
  selectAnalytics,
  selectAnalyticsOverview,
  selectAnalyticsTrends,
  selectAnalyticsMetrics,
  selectSentimentDistribution,
  selectAverageRating,
  selectResponseRate
} from '../../redux/reputation/reputationSelectors';
import { calculateReviewTrends, calculateAverageRating } from '../../utils/reputation/reviewUtils';

/**
 * Custom hook for review analytics data management
 */
export const useReviewAnalytics = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = 300000, // 5 minutes
    dateRange = '30d',
    includeComparisons = true
  } = options;

  const dispatch = useDispatch();
  const analytics = useSelector(selectAnalytics);
  const overview = useSelector(selectAnalyticsOverview);
  const trends = useSelector(selectAnalyticsTrends);
  const metrics = useSelector(selectAnalyticsMetrics);
  const sentimentDistribution = useSelector(selectSentimentDistribution);
  const averageRating = useSelector(selectAverageRating);
  const responseRate = useSelector(selectResponseRate);

  const [dateRangeFilter, setDateRangeFilter] = useState(dateRange);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch analytics on mount or when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAnalyticsData();
    }
    setLastRefresh(new Date());
  }, [autoFetch, dateRangeFilter]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshAnalytics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchAnalytics({ dateRange: dateRangeFilter })).unwrap(),
        dispatch(fetchSentimentAnalysis({ dateRange: dateRangeFilter })).unwrap(),
        dispatch(fetchReviewTrends({ dateRange: dateRangeFilter })).unwrap()
      ]);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, [dispatch, dateRangeFilter]);

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAnalyticsData();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnalyticsData]);

  // Update date range
  const updateDateRange = useCallback((newRange) => {
    setDateRangeFilter(newRange);
  }, []);

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (!includeComparisons || !trends || !trends.reviewTrends || trends.reviewTrends.length < 2) {
      return null;
    }

    const currentPeriod = trends.reviewTrends[trends.reviewTrends.length - 1];
    const previousPeriod = trends.reviewTrends[trends.reviewTrends.length - 2];

    const reviewsChange = currentPeriod.count - previousPeriod.count;
    const reviewsChangePercent = previousPeriod.count > 0 
      ? ((reviewsChange / previousPeriod.count) * 100).toFixed(1)
      : 0;

    const ratingChange = currentPeriod.averageRating - previousPeriod.averageRating;
    const sentimentChange = currentPeriod.sentimentScore - previousPeriod.sentimentScore;

    return {
      reviewsChange: {
        absolute: reviewsChange,
        percentage: reviewsChangePercent,
        trend: reviewsChange > 0 ? 'up' : reviewsChange < 0 ? 'down' : 'stable'
      },
      ratingChange: {
        absolute: ratingChange.toFixed(2),
        trend: ratingChange > 0 ? 'up' : ratingChange < 0 ? 'down' : 'stable'
      },
      sentimentChange: {
        absolute: sentimentChange.toFixed(2),
        trend: sentimentChange > 0 ? 'up' : sentimentChange < 0 ? 'down' : 'stable'
      }
    };
  }, [trends, includeComparisons]);

  // Calculate platform performance
  const platformPerformance = useMemo(() => {
    if (!metrics || !metrics.platformBreakdown) return [];

    return metrics.platformBreakdown.map(platform => ({
      ...platform,
      conversionRate: platform.clicks > 0 ? (platform.reviews / platform.clicks * 100).toFixed(1) : 0,
      engagementRate: platform.views > 0 ? (platform.clicks / platform.views * 100).toFixed(1) : 0
    }));
  }, [metrics]);

  // Calculate sentiment trends
  const sentimentTrends = useMemo(() => {
    if (!trends || !trends.sentimentTrends) return [];

    return trends.sentimentTrends.map(item => ({
      ...item,
      positivePercent: ((item.positive / item.total) * 100).toFixed(1),
      neutralPercent: ((item.neutral / item.total) * 100).toFixed(1),
      negativePercent: ((item.negative / item.total) * 100).toFixed(1)
    }));
  }, [trends]);

  // Calculate rating distribution percentages
  const ratingDistributionPercent = useMemo(() => {
    if (!metrics || !metrics.ratingDistribution) return {};

    const total = Object.values(metrics.ratingDistribution).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(metrics.ratingDistribution).reduce((acc, [rating, count]) => {
      acc[rating] = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      return acc;
    }, {});
  }, [metrics]);

  // Get top performing periods
  const getTopPerformingPeriods = useCallback((metric = 'averageRating', limit = 5) => {
    if (!trends || !trends.reviewTrends) return [];

    return [...trends.reviewTrends]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }, [trends]);

  // Get periods needing attention
  const getPeriodsNeedingAttention = useCallback(() => {
    if (!trends || !trends.reviewTrends) return [];

    return trends.reviewTrends.filter(period => 
      period.averageRating < 3 || 
      period.sentimentScore < -0.5 ||
      (period.sentimentDistribution && period.sentimentDistribution.negative / period.count) > 0.3
    );
  }, [trends]);

  // Export analytics data
  const exportAnalyticsData = useCallback(async (format = 'csv', customFilters = {}) => {
    try {
      const result = await dispatch(exportReviews({
        format,
        filters: {
          dateRange: dateRangeFilter,
          ...customFilters
        }
      })).unwrap();
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch, dateRangeFilter]);

  // Calculate key performance indicators
  const kpis = useMemo(() => {
    const totalReviews = overview?.totalReviews || 0;
    const avgRating = overview?.averageRating || 0;
    const respRate = overview?.responseRate || 0;
    
    // Calculate review velocity (reviews per day)
    const reviewVelocity = trends && trends.reviewTrends && trends.reviewTrends.length > 0
      ? trends.reviewTrends[trends.reviewTrends.length - 1].count / 30 // Assuming 30-day periods
      : 0;

    // Calculate sentiment health score (0-100)
    const sentimentHealthScore = sentimentDistribution ? 
      ((sentimentDistribution.positive * 2 + sentimentDistribution.neutral - sentimentDistribution.negative) / 
       (sentimentDistribution.positive + sentimentDistribution.neutral + sentimentDistribution.negative)) * 50 + 50
      : 50;

    return {
      totalReviews,
      averageRating: avgRating,
      responseRate: respRate,
      reviewVelocity: reviewVelocity.toFixed(1),
      sentimentHealthScore: Math.max(0, Math.min(100, sentimentHealthScore.toFixed(1))),
      customerSatisfaction: avgRating >= 4 ? 'High' : avgRating >= 3 ? 'Medium' : 'Low'
    };
  }, [overview, trends, sentimentDistribution]);

  return {
    // Raw data
    analytics,
    overview,
    trends,
    metrics,
    
    // Processed data
    sentimentDistribution,
    averageRating,
    responseRate,
    comparisonMetrics,
    platformPerformance,
    sentimentTrends,
    ratingDistributionPercent,
    kpis,
    
    // State
    loading: analytics.loading,
    error: analytics.error,
    refreshing,
    lastRefresh,
    dateRange: dateRangeFilter,
    
    // Actions
    refreshAnalytics,
    updateDateRange,
    exportAnalyticsData,
    
    // Utility functions
    getTopPerformingPeriods,
    getPeriodsNeedingAttention
  };
};

export default useReviewAnalytics;