import { API_BASE_URL } from '@/config/serverApiConfig';
import axios from 'axios';

import store from '@/redux/store';
import errorHandler from './errorHandler';
import successHandler from './successHandler';

function findKeyByPrefix(object, prefix) {
  for (var property in object) {
    if (object.hasOwnProperty(property) && property.toString().startsWith(prefix)) {
      return property;
    }
  }
}

// Updated to properly include the token in requests
function includeToken() {
  // Get the auth token from Redux store
  const state = store.getState();
  const tokenKey = findKeyByPrefix(state, 'auth.token');

  if (tokenKey) {
    const token = state[tokenKey];
    if (token) {
      // Set the Authorization header for all subsequent requests
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      return true;
    }
  }

  // If we reach this point, we couldn't find a valid token
  return false;
}

// Special function for URL shortening endpoints that don't require auth
function skipAuthForPublicEndpoints(entity) {
  // We want to always include auth for URL endpoints now
  // No URLs should bypass auth
  return false;
}

const request = {
  post: async ({ entity, jsonData, options = {} }) => {
    try {
      // Don't include token for authentication routes or public URL endpoints
      const isAuthRoute = ['login', 'register', 'forgetpassword', 'resetpassword'].includes(entity);
      const isPublicEndpoint = skipAuthForPublicEndpoints(entity);

      if (!isAuthRoute && !isPublicEndpoint) {
        includeToken();
      }

      const response = await axios.post(API_BASE_URL + entity, jsonData);
      return successHandler(response, options);
    } catch (error) {
      return errorHandler(error);
    }
  },
  create: async ({ entity, jsonData }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }
      const response = await axios.post(entity + '/create', jsonData);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  },
  createAndUpload: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity + '/create', jsonData, {
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
  },
  read: async ({ entity, id }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }
      const endpoint = `${entity}/${id}`;
      const response = await axios.get(endpoint);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  },
  update: async ({ entity, id, jsonData }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }
      const response = await axios.patch(`${entity}/update/${id}`, jsonData);

      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });

      return response.data;
    } catch (error) {
      console.error('Update error:', error);
      return errorHandler(error);
    }
  },
  updateAndUpload: async ({ entity, id, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity + '/update/' + id, jsonData, {
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
  },

  delete: async ({ entity, id }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }
      const response = await axios.delete(entity + '/delete/' + id);
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  },

  filter: async ({ entity, options = {} }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }
      const response = await axios.get(entity + '/filter', { params: options });
      return successHandler(response);
    } catch (error) {
      return errorHandler(error);
    }
  },

  search: async ({ entity, options = {} }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }

      // Convert options object to query string
      let query = '?';
      for (var key in options) {
        if (Array.isArray(options[key])) {
          // Handle arrays like tags
          query += key + '=' + options[key].join(',') + '&';
        } else {
          query += key + '=' + options[key] + '&';
        }
      }
      query = query.slice(0, -1);

      // headersInstance.cancelToken = source.token;
      const response = await axios.get(entity + '/search' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  advancedSearch: async ({ entity, options = {} }) => {
    try {
      includeToken();

      // Add advanced search flag
      options.advanced = 'true';

      // Convert options object to query string
      let query = '?';
      for (var key in options) {
        // Handle special cases
        if (key === 'customFields' && typeof options[key] === 'object') {
          query += key + '=' + encodeURIComponent(JSON.stringify(options[key])) + '&';
        } else if (Array.isArray(options[key])) {
          // Handle arrays like tags
          if (options[key].length > 0) {
            query += key + '=' + encodeURIComponent(options[key].join(',')) + '&';
          }
        } else if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
          query += key + '=' + encodeURIComponent(options[key]) + '&';
        }
      }
      query = query.slice(0, -1);

      // The issue could be here - using the proper endpoint based on entity
      // Ensure we use the same endpoint format as regular search
      const response = await axios.get(`${entity}/list${query}`);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  list: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);

      const response = await axios.get(`${entity}/list${query}`);

      const result = successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return result;
    } catch (error) {
      return errorHandler(error);
    }
  },
  listAll: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);

      const response = await axios.get(entity + '/listAll' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  get: async ({ entity }) => {
    try {
      if (!skipAuthForPublicEndpoints(entity)) {
        includeToken();
      }
      const response = await axios.get(entity);
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  patch: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity, jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  upload: async ({ entity, id, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity + '/upload/' + id, jsonData, {
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
  },

  // Enhanced file upload functionality for documents
  uploadDocument: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity + '/create', jsonData, {
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
  },

  // Download functionality for documents
  downloadDocument: ({ entity, id }) => {
    try {
      includeToken(); // Ensure token is included before making request
      return axios.get(`${entity}/download/${id}`, {
        responseType: 'blob',
        headers: {
          Accept: '*/*', // Accept any content type
        },
      });
    } catch (error) {
      return errorHandler(error);
    }
  },

  // Get document audit trail with optional filtering
  getAuditTrail: async ({ entity, id, page = 1, limit = 20, filter = {} }) => {
    try {
      includeToken();
      const params = { page, limit, ...filter };

      const response = await axios.get(`${entity}/${id}/audit-trail`, {
        params,
      });

      return successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      });
    } catch (error) {
      return errorHandler(error);
    }
  },

  source: () => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    return source;
  },

  summary: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);
      const response = await axios.get(entity + '/summary' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });

      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  mail: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity + '/mail/', jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  convert: async ({ entity, id }) => {
    try {
      includeToken();
      const response = await axios.get(`${entity}/convert/${id}`);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  // Fixed method for reverting to original version
  revertToOriginal: async ({ entity, id }) => {
    try {
      includeToken();
      // Make sure the endpoint is correctly constructed with the right order
      const response = await axios.post(`${entity}/${id}/revert/original`);

      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });

      // After successful reversion, fetch the updated document
      if (response.data.success) {
        try {
          const updatedDoc = await axios.get(`${entity}/read/${id}`);
          return { ...response.data, result: updatedDoc.data.result };
        } catch (contentError) {
          console.error('Error fetching updated document after reversion:', contentError);
          return response.data;
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error reverting to original version:', error);
      return errorHandler(error);
    }
  },

  // Method for reverting to specific version
  revertToVersion: async ({ entity, id, versionNumber }) => {
    try {
      includeToken();

      // Special case for version 0 (original)
      if (versionNumber === 0) {
        return request.revertToOriginal({ entity, id });
      }

      // For regular versions
      const numVersion = parseInt(versionNumber, 10);
      if (isNaN(numVersion) || numVersion < 1) {
        throw new Error('Invalid version number. Version number must be a positive integer.');
      }

      const response = await axios.post(`${entity}/${id}/revert/${numVersion}`);

      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });

      // After successful reversion, fetch the updated document
      if (response.data.success) {
        // Get updated document content
        try {
          const updatedDoc = await axios.get(`${entity}/read/${id}`);
          return { ...response.data, result: updatedDoc.data.result };
        } catch (contentError) {
          console.error('Error fetching updated document after reversion:', contentError);
          return response.data;
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error reverting to version:', error);
      return errorHandler(error);
    }
  },
};
export default request;
