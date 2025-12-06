import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import axios from 'axios';
import errorHandler from './errorHandler';
import successHandler from './successHandler';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Add request interceptor to handle public vs authenticated endpoints
axios.interceptors.request.use((config) => {
  // Check if this is a public endpoint that doesn't need authentication
  const isPublicEndpoint =
    config.url.includes('team/invitation') ||
    config.url.includes('/invitation/') ||
    config.url.includes('/login') ||
    config.url.includes('/register') ||
    config.url.includes('/verify') ||
    config.url.includes('/resetpassword') ||
    config.url.includes('/api/public/') || // Explicit /api/public/ pattern
    config.url.includes('/public/') || // Legacy /public/ pattern
    config.url.includes('/logout') || // Treat logout as a public endpoint
    // Check for explicit header indicating this is a public request
    config.headers?.['X-Public-Request'] === 'true';

  if (!isPublicEndpoint) {
    // If it's an authenticated endpoint, include the auth token
    const authData = storePersist.get('auth');
    if (authData && authData.current && authData.current.token) {
      config.headers.Authorization = `Bearer ${authData.current.token}`;
    }
  } else {
    // For public endpoints, don't include auth headers
    // Explicitly remove any Authorization header that might be present
    if (config.headers) {
      delete config.headers.Authorization;
    }
    // Add the X-Public-Request header to all public endpoints
    config.headers['X-Public-Request'] = 'true';
    console.log('Public endpoint detected, not including auth token:', config.url);
  }

  return config;
});

class Request {
  constructor() {
    // Initialize any properties if needed
  }

  // Helper method to validate entity parameter
  validateEntity(entity, methodName) {
    if (!entity || entity === 'undefined') {
      const error = new Error(
        `Entity parameter is required for ${methodName} request. Got: ${entity}`
      );
      console.error(error.message);
      throw error;
    }
  }

  // Backward compatibility for old-style request calls
  async makeRequest(method, url, data = null, options = {}) {
    try {
      if (!url) {
        console.error(`${method.toUpperCase()} request failed: URL is required`);
        return this.handleError(new Error('URL is required for request'));
      }
      this.includeToken();
      console.log(`${method.toUpperCase()} request to ${url}`, data);

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await axios.get(url, { params: options });
          break;
        case 'post':
          response = await axios.post(url, data);
          break;
        case 'patch':
          response = await axios.patch(url, data);
          break;
        case 'delete':
          response = await axios.delete(url);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return response.data;
    } catch (error) {
      console.error(`${method.toUpperCase()} request failed for ${url}:`, error);
      return this.handleError(error);
    }
  }

  getOptionsQuery(options) {
    // Convert options object to query string
    const query = new URLSearchParams(options).toString();
    return query ? `?${query}` : '';
  }
  handleError(error) {
    // Handle errors
    errorHandler(error);
    throw error;
  }
  async post(entityOrUrl, jsonDataOrOptional) {
    try {
      // Handle both old (string, data) and new ({ entity, jsonData }) calling patterns
      let entity, jsonData;

      if (typeof entityOrUrl === 'string') {
        // Old pattern: post('url', data)
        entity = entityOrUrl;
        jsonData = jsonDataOrOptional;
      } else {
        // New pattern: post({ entity: 'url', jsonData: data })
        ({ entity, jsonData } = entityOrUrl);
      }

      this.validateEntity(entity, 'post');
      this.includeToken();
      console.log(`POST request to ${entity}`, jsonData);
      const response = await axios.post(`${entity}`, jsonData);
      return response.data;
    } catch (error) {
      console.error(`POST request failed for ${entity}:`, error);
      return this.handleError(error);
    }
  }

  async get(entityOrConfig, optionsOrNothing = {}) {
    try {
      // Handle both old (string) and new (object) calling patterns
      let entity, id, options, endpoint;

      if (typeof entityOrConfig === 'string') {
        // Old pattern: get('url', { params: options })
        entity = entityOrConfig;
        options = optionsOrNothing.params || optionsOrNothing || {};
        id = null;
        endpoint = null;
      } else {
        // New pattern: get({ entity: 'url', options: {...} })
        ({ entity, id = null, options = {}, endpoint = null } = entityOrConfig);
      }

      this.validateEntity(entity, 'get');
      this.includeToken();
      const optionsQuery = this.getOptionsQuery(options);
      let url;

      // For string-based calls (old pattern), check if it's a complete path
      if (typeof entityOrConfig === 'string') {
        // If the entity contains slashes and looks like a complete API path, use it directly
        if (entity.includes('/') && !entity.endsWith('/')) {
          url = `${entity}${optionsQuery}`;
        } else {
          // Otherwise, add /list for simple entities
          url = `${entity}/list${optionsQuery}`;
        }
      } else {
        // New pattern logic
        if (endpoint) {
          // Check if endpoint already contains the id to avoid duplicate ids in URL
          if (endpoint.includes(id)) {
            url = `${entity}/${endpoint}${optionsQuery}`;
          } else if (id) {
            url = `${entity}/${endpoint}/${id}${optionsQuery}`;
          } else {
            url = `${entity}/${endpoint}${optionsQuery}`;
          }
        } else if (id) {
          url = `${entity}/read/${id}${optionsQuery}`;
        } else {
          url = `${entity}/list${optionsQuery}`;
        }
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  // Add the list method that was missing
  async list({ entity, options = {} }) {
    try {
      this.validateEntity(entity, 'list');
      this.includeToken();
      const optionsQuery = this.getOptionsQuery(options);

      // Special case for team entity which uses root path for list
      let url;
      if (entity === 'team') {
        url = `${entity}${optionsQuery}`;
      } else {
        url = `${entity}/list${optionsQuery}`;
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Add summary method - this was missing and causing the error
  async summary({ entity, options = {} }) {
    try {
      this.includeToken();
      const optionsQuery = this.getOptionsQuery(options);
      const url = `${entity}/summary${optionsQuery}`;

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Add other request methods that are used in the application
  async create({ entity, jsonData }) {
    try {
      this.validateEntity(entity, 'create');
      this.includeToken();
      console.log(`CREATE request to ${entity}`, jsonData);
      // Use just the entity endpoint for standard create operations
      const response = await axios.post(`${entity}`, jsonData);
      return response.data;
    } catch (error) {
      console.error(`CREATE request failed for ${entity}:`, error);
      return this.handleError(error);
    }
  }

  async read({ entity, id }) {
    try {
      this.validateEntity(entity, 'read');
      this.includeToken();
      const url = `${entity}/${id}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update({ entity, id, jsonData }) {
    try {
      this.includeToken();
      const response = await axios.patch(`${entity}/update/${id}`, jsonData);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(entityOrUrl, idOrOptional) {
    try {
      // Handle both old (string) and new ({ entity, id }) calling patterns
      let entity, id, url;

      if (typeof entityOrUrl === 'string') {
        // Old pattern: delete('url/path') - use the URL directly
        url = entityOrUrl;
        entity = entityOrUrl; // for validation
      } else if (entityOrUrl && typeof entityOrUrl === 'object') {
        // New pattern: delete({ entity: 'url', id: 'id' })
        ({ entity, id } = entityOrUrl);
        url = `${entity}/${id}`;
      } else {
        throw new Error('Invalid parameters for delete request');
      }

      // Only validate if it's not a direct URL path
      if (typeof entityOrUrl === 'string' && !entityOrUrl.includes('/')) {
        this.validateEntity(entity, 'delete');
      } else if (typeof entityOrUrl === 'object') {
        this.validateEntity(entity, 'delete');
      }

      this.includeToken();
      console.log(`DELETE request to ${url}`);
      const response = await axios.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed:`, error);
      return this.handleError(error);
    }
  }

  async search({ entity, options = {} }) {
    try {
      this.includeToken();
      const optionsQuery = this.getOptionsQuery(options);
      const response = await axios.get(`${entity}/search${optionsQuery}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async advancedSearch({ entity, options = {} }) {
    try {
      this.includeToken();

      // Use POST for advanced search to support complex query parameters
      const response = await axios.post(`${entity}/advanced-search`, options);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async filter({ entity, options = {} }) {
    try {
      this.includeToken();
      const response = await axios.get(`${entity}/filter`, { params: options });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(entityOrUrl, jsonDataOrOptional) {
    try {
      // Handle both old (string, data) and new ({ entity, jsonData }) calling patterns
      let entity, jsonData;

      if (typeof entityOrUrl === 'string') {
        // Old pattern: patch('url', data)
        entity = entityOrUrl;
        jsonData = jsonDataOrOptional;
      } else {
        // New pattern: patch({ entity: 'url', jsonData: data })
        ({ entity, jsonData } = entityOrUrl);
      }

      this.validateEntity(entity, 'patch');
      this.includeToken();
      const response = await axios.patch(entity, jsonData);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async upload({ entity, id, jsonData }) {
    try {
      this.validateEntity(entity, 'upload');
      this.includeToken();
      const response = await axios.patch(`${entity}/upload/${id}`, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async downloadDocument({ entity, id }) {
    try {
      this.includeToken();
      return axios.get(`${entity}/download/${id}`, {
        responseType: 'blob',
        headers: {
          Accept: '*/*',
        },
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async revertToOriginal({ entity, id }) {
    try {
      this.includeToken();
      const response = await axios.post(`${entity}/${id}/revert/original`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async revertToVersion({ entity, id, versionNumber }) {
    try {
      this.includeToken();
      const response = await axios.post(`${entity}/${id}/revert/${versionNumber}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Workflow endpoints
  async workflowCreate(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}workflow`, data);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowList(options = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}workflow`, { params: options });
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowRead(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}workflow/${id}`);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowUpdate(id, data) {
    try {
      const response = await axios.patch(`${API_BASE_URL}workflow/${id}`, data);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowDelete(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}workflow/${id}`);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowToggleStatus(id, status) {
    try {
      const response = await axios.patch(`${API_BASE_URL}workflow/${id}/status`, { status });
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowTestCondition(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}workflow/test-condition`, data);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowSimulate(id, context) {
    try {
      const response = await axios.post(`${API_BASE_URL}workflow/${id}/simulate`, { context });
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async createAndUpload({ entity, jsonData }) {
    try {
      this.includeToken();
      const response = await axios.post(`${entity}/create`, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  }

  async updateAndUpload({ entity, id, jsonData }) {
    try {
      this.includeToken();
      const response = await axios.patch(`${entity}/update/${id}`, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  }

  async listAll({ entity, options = {} }) {
    try {
      this.includeToken();
      const optionsQuery = this.getOptionsQuery(options);
      const url = `${entity}/listAll${optionsQuery}`;
      const response = await axios.get(url);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  }

  source() {
    const CancelToken = axios.CancelToken;
    return CancelToken.source();
  }

  async mail({ entity, jsonData }) {
    try {
      this.includeToken();
      const response = await axios.post(`${entity}/mail/`, jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  }

  async convert({ entity, id }) {
    try {
      this.includeToken();
      const response = await axios.get(`${entity}/convert/${id}`);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  }

  async workflowGetAvailableActions() {
    try {
      const response = await axios.get(`${API_BASE_URL}workflow/actions`);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  async getUrlAnalytics({ urlId, start, end }) {
    if (!urlId) throw new Error('urlId is required for getUrlAnalytics');
    let url = `url/${urlId}/analytics`;
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    if (Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString();
    }
    this.includeToken();
    console.log('getUrlAnalytics request:', url);
    const response = await axios.get(url);
    return response.data;
  }

  /**
   * Download analytics export file for a URL.
   * @param {Object} params
   * @param {string} params.urlId
   * @param {string} params.format
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {boolean} [params.includeRawClicks]
   * @returns {Promise<{blob: Blob, filename: string, format: string}>}
   */
  async getAnalyticsExport({
    urlId,
    format = 'csv',
    startDate,
    endDate,
    includeRawClicks = false,
  }) {
    if (!urlId) throw new Error('urlId is required for getAnalyticsExport');
    const params = new URLSearchParams();
    if (format) params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (includeRawClicks) params.append('includeRawClicks', 'true');
    const url = `${API_BASE_URL}url/${urlId}/analytics/export?${params.toString()}`;

    // Always include the Authorization header for protected endpoints
    const authData = storePersist.get('auth');
    const headers = {};
    if (authData && authData.current && authData.current.token) {
      headers['Authorization'] = `Bearer ${authData.current.token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Export failed');
    }
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'analytics-export';
    if (disposition && disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].replace(/["']/g, '');
    }
    const blob = await response.blob();
    return { blob, filename, format };
  }

  includeToken() {
    // This is now handled by the axios interceptor
    // We keep this method for backward compatibility with existing code
  }

  // Custom method for fetching abtest summary
  async getAbTestSummary() {
    try {
      this.includeToken();
      const response = await axios.get('abtest/summary');
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const request = new Request();
export { default as checkImage } from './checkImage';
export { default as downloadDocument } from './downloadDocument';
export { default as errorHandler } from './errorHandler';
export { default as successHandler } from './successHandler';
