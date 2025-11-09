import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useDocumentStats,
  usePaymentModeStats,
  useTaxStats,
  useWorkflowStats,
} from '../../hooks/useStatistics';
import StatisticsService from '../../hooks/services/statisticsService';

// Mock the StatisticsService
vi.mock('../../hooks/services/statisticsService', () => ({
  default: {
    getDocumentStats: vi.fn(),
    getPaymentModeStats: vi.fn(),
    getTaxStats: vi.fn(),
    getWorkflowStats: vi.fn(),
  },
}));

describe('Statistics Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('useDocumentStats', () => {
    it('should fetch document statistics successfully', async () => {
      const mockData = {
        success: true,
        result: {
          totalDocuments: 100,
          newThisMonth: 15,
          totalSize: 1024000000, // 1GB in bytes
          byType: [
            { type: 'PDF', count: 50 },
            { type: 'Word', count: 30 },
            { type: 'Excel', count: 20 },
          ],
        },
      };

      StatisticsService.getDocumentStats.mockResolvedValue(mockData);

      const { result } = renderHook(() => useDocumentStats());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.result);
      expect(result.current.error).toBe(null);
      expect(StatisticsService.getDocumentStats).toHaveBeenCalledWith({ timeframe: '30' });
    });

    it('should handle document statistics fetch error', async () => {
      const errorMessage = 'Failed to fetch document statistics';
      StatisticsService.getDocumentStats.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useDocumentStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle API error response', async () => {
      const mockData = {
        success: false,
        message: 'Unauthorized access',
      };

      StatisticsService.getDocumentStats.mockResolvedValue(mockData);

      const { result } = renderHook(() => useDocumentStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Unauthorized access');
    });
  });

  describe('usePaymentModeStats', () => {
    it('should fetch payment mode statistics successfully', async () => {
      const mockData = {
        success: true,
        result: {
          totalPaymentModes: 12,
          activePaymentModes: 8,
          defaultPaymentModes: 3,
          newThisMonth: 2,
        },
      };

      StatisticsService.getPaymentModeStats.mockResolvedValue(mockData);

      const { result } = renderHook(() => usePaymentModeStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.result);
      expect(result.current.error).toBe(null);
    });

    it('should handle payment mode statistics fetch error', async () => {
      const errorMessage = 'Network error';
      StatisticsService.getPaymentModeStats.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePaymentModeStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('useTaxStats', () => {
    it('should fetch tax statistics successfully', async () => {
      const mockData = {
        success: true,
        result: {
          totalTaxes: 8,
          activeTaxes: 6,
          defaultTaxes: 1,
          averageRate: 15.5,
        },
      };

      StatisticsService.getTaxStats.mockResolvedValue(mockData);

      const { result } = renderHook(() => useTaxStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.result);
      expect(result.current.error).toBe(null);
    });
  });

  describe('useWorkflowStats', () => {
    it('should fetch workflow statistics successfully', async () => {
      const mockData = {
        success: true,
        result: {
          totalWorkflows: 15,
          activeWorkflows: 8,
          completedTasks: 142,
          averageExecutionTime: '2.5m',
        },
      };

      StatisticsService.getWorkflowStats.mockResolvedValue(mockData);

      const { result } = renderHook(() => useWorkflowStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.result);
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

    it('should auto-refresh data when enabled', async () => {
      const mockData = {
        success: true,
        result: { totalDocuments: 100 },
      };

      StatisticsService.getDocumentStats.mockResolvedValue(mockData);

      renderHook(() =>
        useDocumentStats({
          autoRefresh: true,
          refreshInterval: 5000,
        })
      );

      // Initial call
      expect(StatisticsService.getDocumentStats).toHaveBeenCalledTimes(1);

      // Fast-forward time to trigger refresh
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(StatisticsService.getDocumentStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should not auto-refresh when disabled', async () => {
      const mockData = {
        success: true,
        result: { totalDocuments: 100 },
      };

      StatisticsService.getDocumentStats.mockResolvedValue(mockData);

      renderHook(() =>
        useDocumentStats({
          autoRefresh: false,
        })
      );

      // Initial call
      expect(StatisticsService.getDocumentStats).toHaveBeenCalledTimes(1);

      // Fast-forward time
      vi.advanceTimersByTime(60000);

      // Should not have made additional calls
      expect(StatisticsService.getDocumentStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom timeframe', () => {
    it('should pass custom timeframe to API', async () => {
      const mockData = {
        success: true,
        result: { totalDocuments: 100 },
      };

      StatisticsService.getDocumentStats.mockResolvedValue(mockData);

      renderHook(() =>
        useDocumentStats({
          timeframe: '7',
        })
      );

      expect(StatisticsService.getDocumentStats).toHaveBeenCalledWith({ timeframe: '7' });
    });
  });
});
