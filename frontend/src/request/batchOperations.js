import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import axios from 'axios';
import errorHandler from './errorHandler';

/**
 * Includes authentication token in requests
 * @private
 */
const includeToken = () => {
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.withCredentials = true;

  // Get auth data from localStorage
  const authData = storePersist.get('auth');

  // Check if auth data exists and has the expected structure
  if (authData && authData.current && authData.current.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authData.current.token}`;
  } else {
    // If token is missing, remove Authorization header to avoid issues with expired tokens
    delete axios.defaults.headers.common['Authorization'];
  }
};

/**
 * Process a batch of documents with AI analysis
 * @param {Array} documentIds - Array of document IDs to process
 * @returns {Promise} - Promise resolving to batch processing results
 */
export const batchAnalyzeDocuments = async (documentIds) => {
  try {
    includeToken();

    const response = await axios.post('document/batch-analyze', { documentIds });

    if (response.data && response.data.success) {
      return {
        success: true,
        result: response.data.result,
      };
    } else {
      throw new Error(response.data?.message || 'Failed to process documents');
    }
  } catch (error) {
    return errorHandler(error);
  }
};

/**
 * Apply AI suggestions to a batch of documents
 * @param {Array} documents - Array of document objects with suggestions to apply
 * @returns {Promise} - Promise resolving to batch update results
 */
export const batchApplySuggestions = async (documents) => {
  try {
    includeToken();

    const response = await axios.post('document/batch-update', { documents });

    if (response.data && response.data.success) {
      return {
        success: true,
        result: response.data.result,
      };
    } else {
      throw new Error(response.data?.message || 'Failed to apply suggestions');
    }
  } catch (error) {
    return errorHandler(error);
  }
};

/**
 * Get document content for batch preview
 * @param {string} id - Document ID
 * @returns {Promise} - Promise resolving to document content
 */
export const getDocumentContent = async (id) => {
  try {
    includeToken();

    const response = await axios.get(`document/${id}/content`);

    if (response.data && response.data.success) {
      return {
        success: true,
        result: response.data.result,
      };
    } else {
      throw new Error(response.data?.message || 'Failed to get document content');
    }
  } catch (error) {
    return errorHandler(error);
  }
};

/**
 * Get document audit trail
 * @param {string} documentId - Document ID
 * @param {Object} options - Options for pagination and filtering
 * @returns {Promise} - Promise resolving to document audit trail
 */
export const getDocumentAuditTrail = async (documentId, options = {}) => {
  try {
    includeToken();

    const { page = 1, limit = 20, filter = {} } = options;
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filter,
    }).toString();

    const response = await axios.get(`document/${documentId}/audit-trail?${queryParams}`);

    if (response.data && response.data.success) {
      return {
        success: true,
        result: response.data.result,
        pagination: response.data.pagination || {},
      };
    } else {
      throw new Error(response.data?.message || 'Failed to get document audit trail');
    }
  } catch (error) {
    return errorHandler(error);
  }
};

export default {
  batchAnalyzeDocuments,
  batchApplySuggestions,
  getDocumentContent,
  getDocumentAuditTrail,
};
