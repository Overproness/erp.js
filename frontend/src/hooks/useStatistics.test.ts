import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { mockErrorResponse, mockStatisticsData, mockSuccessResponse } from '../test/utils.jsx';
import {
  useClientStats,
  useDashboardStats,
  useInvoiceStats,
  usePaymentStats,
  useQuoteStats,
  useTaskStats,
} from './useStatistics';

// Mock the statistics service
vi.mock('./services/statisticsService', () => ({
  default: {
    getDashboardStats: vi.fn(),
    getInvoiceStats: vi.fn(),
    getQuoteStats: vi.fn(),
    getPaymentStats: vi.fn(),
    getClientStats: vi.fn(),
    getTaskStats: vi.fn(),
  },
}));

// Import the mocked module
import StatisticsService from './services/statisticsService';

describe('Statistics Hooks', () => {
  const mockStatisticsService = StatisticsService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockStatisticsService = require('../services/statisticsService').default;
    vi.clearAllMocks();
  });

  describe('useDashboardStats', () => {
    it('fetches dashboard statistics successfully', async () => {
      mockStatisticsService.getDashboardStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.dashboard)
      );

      const { result } = renderHook(() => useDashboardStats());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatisticsData.dashboard);
      expect(result.current.error).toBe(null);
      expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('handles dashboard statistics error', async () => {
      const errorMessage = 'Failed to fetch dashboard stats';
      mockStatisticsService.getDashboardStats.mockResolvedValue(mockErrorResponse(errorMessage));

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });

    it('accepts custom options', async () => {
      mockStatisticsService.getDashboardStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.dashboard)
      );

      const options = { timeframe: '7', autoRefresh: false };
      renderHook(() => useDashboardStats(options));

      await waitFor(() => {
        expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledWith(options);
      });
    });

    it('refreshes data when refresh function is called', async () => {
      mockStatisticsService.getDashboardStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.dashboard)
      );

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call refresh
      result.current.refresh();

      expect(result.current.loading).toBe(true);
      expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('useInvoiceStats', () => {
    it('fetches invoice statistics successfully', async () => {
      mockStatisticsService.getInvoiceStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.invoices)
      );

      const { result } = renderHook(() => useInvoiceStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatisticsData.invoices);
      expect(result.current.error).toBe(null);
    });

    it('handles invoice statistics error', async () => {
      const errorMessage = 'Failed to fetch invoice stats';
      mockStatisticsService.getInvoiceStats.mockResolvedValue(mockErrorResponse(errorMessage));

      const { result } = renderHook(() => useInvoiceStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('useQuoteStats', () => {
    it('fetches quote statistics successfully', async () => {
      mockStatisticsService.getQuoteStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.quotes)
      );

      const { result } = renderHook(() => useQuoteStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatisticsData.quotes);
      expect(result.current.error).toBe(null);
    });

    it('handles quote statistics error', async () => {
      const errorMessage = 'Failed to fetch quote stats';
      mockStatisticsService.getQuoteStats.mockResolvedValue(mockErrorResponse(errorMessage));

      const { result } = renderHook(() => useQuoteStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('usePaymentStats', () => {
    it('fetches payment statistics successfully', async () => {
      mockStatisticsService.getPaymentStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.payments)
      );

      const { result } = renderHook(() => usePaymentStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatisticsData.payments);
      expect(result.current.error).toBe(null);
    });
  });

  describe('useClientStats', () => {
    it('fetches client statistics successfully', async () => {
      mockStatisticsService.getClientStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.clients)
      );

      const { result } = renderHook(() => useClientStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatisticsData.clients);
      expect(result.current.error).toBe(null);
    });
  });

  describe('useTaskStats', () => {
    it('fetches task statistics successfully', async () => {
      mockStatisticsService.getTaskStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.tasks)
      );

      const { result } = renderHook(() => useTaskStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatisticsData.tasks);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Auto-refresh functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-refreshes data at specified interval', async () => {
      mockStatisticsService.getDashboardStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.dashboard)
      );

      renderHook(() =>
        useDashboardStats({
          autoRefresh: true,
          refreshInterval: 5000,
        })
      );

      // Initial call
      expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(1);

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(2);
      });

      // Fast-forward again
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(3);
      });
    });

    it('does not auto-refresh when disabled', async () => {
      mockStatisticsService.getDashboardStats.mockResolvedValue(
        mockSuccessResponse(mockStatisticsData.dashboard)
      );

      renderHook(() => useDashboardStats({ autoRefresh: false }));

      // Initial call
      expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(1);

      // Fast-forward time
      vi.advanceTimersByTime(60000);

      // Should still be only the initial call
      expect(mockStatisticsService.getDashboardStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('handles network errors gracefully', async () => {
      mockStatisticsService.getDashboardStats.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Network error');
    });

    it('handles API errors gracefully', async () => {
      mockStatisticsService.getDashboardStats.mockResolvedValue({
        success: false,
        message: 'Unauthorized access',
      });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Unauthorized access');
    });
  });
});
