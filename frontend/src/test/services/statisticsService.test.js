import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StatisticsService from '../../hooks/services/statisticsService';

// Mock axios
vi.mock('axios');
const mockedAxios = axios;

describe('StatisticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDocumentStats', () => {
    it('should fetch document statistics successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: {
            totalDocuments: 100,
            newThisMonth: 15,
            totalSize: 1024000000,
            byType: [
              { type: 'PDF', count: 50 },
              { type: 'Word', count: 30 },
              { type: 'Excel', count: 20 },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await StatisticsService.getDocumentStats({ timeframe: '30' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/documents', {
        params: { timeframe: '30' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API error responses', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Internal server error',
          },
        },
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(StatisticsService.getDocumentStats()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(StatisticsService.getDocumentStats()).rejects.toThrow('Network Error');
    });
  });

  describe('getPaymentModeStats', () => {
    it('should fetch payment mode statistics successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: {
            totalPaymentModes: 12,
            activePaymentModes: 8,
            defaultPaymentModes: 3,
            newThisMonth: 2,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await StatisticsService.getPaymentModeStats({ timeframe: '7' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/payment-modes', {
        params: { timeframe: '7' },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTaxStats', () => {
    it('should fetch tax statistics successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: {
            totalTaxes: 8,
            activeTaxes: 6,
            defaultTaxes: 1,
            averageRate: 15.5,
            newThisMonth: 1,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await StatisticsService.getTaxStats();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/taxes', {
        params: {},
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getWorkflowStats', () => {
    it('should fetch workflow statistics successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: {
            totalWorkflows: 15,
            activeWorkflows: 8,
            completedTasks: 142,
            averageExecutionTime: '2.5m',
            newThisMonth: 3,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await StatisticsService.getWorkflowStats({ timeframe: '90' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/workflows', {
        params: { timeframe: '90' },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Unauthorized',
          },
        },
      };

      mockedAxios.get.mockRejectedValue(unauthorizedError);

      await expect(StatisticsService.getDocumentStats()).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });
    });

    it('should handle 403 Forbidden errors', async () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: {
            success: false,
            message: 'Forbidden',
          },
        },
      };

      mockedAxios.get.mockRejectedValue(forbiddenError);

      await expect(StatisticsService.getPaymentModeStats()).rejects.toMatchObject({
        response: {
          status: 403,
        },
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Internal Server Error',
          },
        },
      };

      mockedAxios.get.mockRejectedValue(serverError);

      await expect(StatisticsService.getTaxStats()).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'Request timeout',
      };

      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect(StatisticsService.getWorkflowStats()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });
  });

  describe('Parameter Validation', () => {
    it('should handle missing parameters gracefully', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: { totalDocuments: 0 },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await StatisticsService.getDocumentStats();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/documents', {
        params: {},
      });
    });

    it('should pass through valid parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: { totalTaxes: 5 },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await StatisticsService.getTaxStats({
        timeframe: '30',
        includeInactive: true,
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/taxes', {
        params: {
          timeframe: '30',
          includeInactive: true,
        },
      });
    });
  });

  describe('Response Validation', () => {
    it('should handle malformed response data', async () => {
      const malformedResponse = {
        data: null,
      };

      mockedAxios.get.mockResolvedValue(malformedResponse);

      const result = await StatisticsService.getDocumentStats();

      expect(result).toBeNull();
    });

    it('should handle missing result field in response', async () => {
      const incompleteResponse = {
        data: {
          success: true,
          // Missing result field
        },
      };

      mockedAxios.get.mockResolvedValue(incompleteResponse);

      const result = await StatisticsService.getPaymentModeStats();

      expect(result).toEqual({
        success: true,
      });
    });

    it('should handle unsuccessful API responses', async () => {
      const unsuccessfulResponse = {
        data: {
          success: false,
          message: 'Data not found',
        },
      };

      mockedAxios.get.mockResolvedValue(unsuccessfulResponse);

      const result = await StatisticsService.getWorkflowStats();

      expect(result).toEqual({
        success: false,
        message: 'Data not found',
      });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponses = [
        { data: { success: true, result: { totalDocuments: 100 } } },
        { data: { success: true, result: { totalPaymentModes: 10 } } },
        { data: { success: true, result: { totalTaxes: 5 } } },
        { data: { success: true, result: { totalWorkflows: 15 } } },
      ];

      mockedAxios.get
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2])
        .mockResolvedValueOnce(mockResponses[3]);

      const promises = [
        StatisticsService.getDocumentStats(),
        StatisticsService.getPaymentModeStats(),
        StatisticsService.getTaxStats(),
        StatisticsService.getWorkflowStats(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual(mockResponses[0].data);
      expect(results[1]).toEqual(mockResponses[1].data);
      expect(results[2]).toEqual(mockResponses[2].data);
      expect(results[3]).toEqual(mockResponses[3].data);
    });

    it('should handle partial failures in concurrent requests', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { success: true, result: { totalDocuments: 100 } } })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true, result: { totalTaxes: 5 } } });

      const promises = [
        StatisticsService.getDocumentStats(),
        StatisticsService.getPaymentModeStats(),
        StatisticsService.getTaxStats(),
      ];

      const results = await Promise.allSettled(promises);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });
});
