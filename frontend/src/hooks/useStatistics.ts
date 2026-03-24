import { useCallback, useEffect, useRef, useState } from 'react';
import StatisticsService from './services/statisticsService';

/**
 * Custom hook for managing statistics data
 * @param {string} type - Type of statistics to fetch
 * @param {Object} options - Options for the hook
 * @param {string} options.timeframe - Time frame in days
 * @param {boolean} options.autoRefresh - Whether to auto-refresh data
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @returns {Object} Statistics data and control functions
 */
export const useStatistics = (type, options = {}) => {
  const {
    timeframe = '30',
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const initialFetchRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      const params = { timeframe };

      switch (type) {
        case 'dashboard':
          response = await StatisticsService.getDashboardStats(params);
          break;
        case 'clients':
          response = await StatisticsService.getClientStats(params);
          break;
        case 'invoices':
          response = await StatisticsService.getInvoiceStats(params);
          break;
        case 'quotes':
          response = await StatisticsService.getQuoteStats(params);
          break;
        case 'payments':
          response = await StatisticsService.getPaymentStats(params);
          break;
        case 'teams':
          response = await StatisticsService.getTeamStats(params);
          break;
        case 'tasks':
          response = await StatisticsService.getTaskStats(params);
          break;
        case 'documents':
          response = await StatisticsService.getDocumentStats(params);
          break;
        case 'paymentmodes':
          response = await StatisticsService.getPaymentModeStats(params);
          break;
        case 'workflows':
          response = await StatisticsService.getWorkflowStats(params);
          break;
        case 'taxes':
          response = await StatisticsService.getTaxStats(params);
          break;
        default:
          throw new Error(`Unknown statistics type: ${type}`);
      }

      if (response.success) {
        setData(response.result);
        setLastUpdated(new Date());
      } else {
        setError(response.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      // Handle different types of errors
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || err.message;

        if (status === 401) {
          setError('Authentication required. Please log in.');
        } else if (status === 403) {
          setError('Access denied. Insufficient permissions.');
        } else if (status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(message || `Error ${status}: ${err.message}`);
        }
      } else if (err.request) {
        // Network error
        setError('Network error. Please check your connection.');
      } else {
        // Other error
        setError(err.message || 'An error occurred while fetching statistics');
      }
      console.error('Statistics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, timeframe]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    fetchData();
  }, [fetchData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    fetchData,
  };
};

/**
 * Hook for dashboard statistics
 */
export const useDashboardStats = (options = {}) => {
  return useStatistics('dashboard', options);
};

/**
 * Hook for client statistics
 */
export const useClientStats = (options = {}) => {
  return useStatistics('clients', options);
};

/**
 * Hook for invoice statistics
 */
export const useInvoiceStats = (options = {}) => {
  return useStatistics('invoices', options);
};

/**
 * Hook for quote statistics
 */
export const useQuoteStats = (options = {}) => {
  return useStatistics('quotes', options);
};

/**
 * Hook for payment statistics
 */
export const usePaymentStats = (options = {}) => {
  return useStatistics('payments', options);
};

/**
 * Hook for team statistics
 */
export const useTeamStats = (options = {}) => {
  return useStatistics('teams', options);
};

/**
 * Hook for task statistics
 */
export const useTaskStats = (options = {}) => {
  return useStatistics('tasks', options);
};

/**
 * Hook for document statistics
 */
export const useDocumentStats = (options = {}) => {
  return useStatistics('documents', options);
};

/**
 * Hook for payment mode statistics
 */
export const usePaymentModeStats = (options = {}) => {
  return useStatistics('paymentmodes', options);
};

/**
 * Hook for workflow statistics
 */
export const useWorkflowStats = (options = {}) => {
  return useStatistics('workflows', options);
};

/**
 * Hook for tax statistics
 */
export const useTaxStats = (options = {}) => {
  return useStatistics('taxes', options);
};

/**
 * Hook for multiple statistics types
 * @param {Array<string>} types - Array of statistics types to fetch
 * @param {Object} options - Options for the hook
 * @returns {Object} Object with statistics data for each type
 */
export const useMultipleStats = (types = [], options = {}) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = types.map(async (type) => {
        const params = { timeframe: options.timeframe || '30' };

        switch (type) {
          case 'dashboard':
            return { type, data: await StatisticsService.getDashboardStats(params) };
          case 'clients':
            return { type, data: await StatisticsService.getClientStats(params) };
          case 'invoices':
            return { type, data: await StatisticsService.getInvoiceStats(params) };
          case 'quotes':
            return { type, data: await StatisticsService.getQuoteStats(params) };
          case 'payments':
            return { type, data: await StatisticsService.getPaymentStats(params) };
          case 'teams':
            return { type, data: await StatisticsService.getTeamStats(params) };
          case 'tasks':
            return { type, data: await StatisticsService.getTaskStats(params) };
          case 'documents':
            return { type, data: await StatisticsService.getDocumentStats(params) };
          case 'paymentmodes':
            return { type, data: await StatisticsService.getPaymentModeStats(params) };
          case 'workflows':
            return { type, data: await StatisticsService.getWorkflowStats(params) };
          case 'taxes':
            return { type, data: await StatisticsService.getTaxStats(params) };
          default:
            throw new Error(`Unknown statistics type: ${type}`);
        }
      });

      const results = await Promise.all(promises);
      const statsData = {};

      results.forEach(({ type, data }) => {
        if (data.success) {
          statsData[type] = data.result;
        } else {
          console.error(`Failed to fetch ${type} stats:`, data.message);
        }
      });

      setStats(statsData);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching statistics');
      console.error('Multiple statistics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [types, options.timeframe]);

  useEffect(() => {
    if (types.length > 0) {
      fetchAllStats();
    }
  }, [fetchAllStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchAllStats,
  };
};
