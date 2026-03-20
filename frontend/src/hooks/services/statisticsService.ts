import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

// Lazy-initialized axios instance for statistics
let _statisticsApi = null;

const getStatisticsApi = async () => {
  if (!_statisticsApi) {
    const axios = (await import('axios')).default;
    _statisticsApi = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
    });

    // Add request interceptor to include auth token
    _statisticsApi.interceptors.request.use((config) => {
      const authData = storePersist.get('auth');
      if (authData && authData.current && authData.current.token) {
        config.headers.Authorization = `Bearer ${authData.current.token}`;
      }

      return config;
    });
  }
  return _statisticsApi;
};

/**
 * Statistics API service
 */
class StatisticsService {
  /**
   * Get dashboard statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Dashboard statistics
   */
  static async getDashboardStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get client statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Client statistics
   */
  static async getClientStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/clients', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching client stats:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Invoice statistics
   */
  static async getInvoiceStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/invoices', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw error;
    }
  }

  /**
   * Get quote statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Quote statistics
   */
  static async getQuoteStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/quotes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching quote stats:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Payment statistics
   */
  static async getPaymentStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  /**
   * Get team statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Team statistics
   */
  static async getTeamStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/teams', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching team stats:', error);
      throw error;
    }
  }

  /**
   * Get task statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Task statistics
   */
  static async getTaskStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/tasks', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching task stats:', error);
      throw error;
    }
  }

  /**
   * Get document statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Document statistics
   */
  static async getDocumentStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  /**
   * Get payment mode statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Payment mode statistics
   */
  static async getPaymentModeStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/paymentmodes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment mode stats:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Workflow statistics
   */
  static async getWorkflowStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/workflows', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  }

  /**
   * Get tax statistics
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time frame in days (default: 30)
   * @returns {Promise<Object>} Tax statistics
   */
  static async getTaxStats(params = {}) {
    try {
      const statisticsApi = await getStatisticsApi();
      const response = await statisticsApi.get('/stats/taxes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching tax stats:', error);
      throw error;
    }
  }
}

export default StatisticsService;
