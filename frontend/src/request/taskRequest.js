import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

// Get auth token from Redux store (same as main request module)
const getAuthToken = () => {
  const authData = storePersist.get('auth');
  if (authData && authData.current && authData.current.token) {
    return authData.current.token;
  }
  // Fallback to localStorage
  return window.localStorage.getItem('auth_token');
};

// Get config with auth header
const getConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  };
};

/**
 * Task API Request Service
 * Provides methods for task CRUD operations
 */

export const taskRequest = {
  /**
   * Create a new task
   * @param {Object} taskData - Task data to create
   * @returns {Promise} API response
   */
  create: async (taskData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}task/create`, taskData, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  /**
   * Get a single task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise} API response
   */
  read: async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}task/read/${taskId}`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error reading task:', error);
      throw error;
    }
  },

  /**
   * Update an existing task
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise} API response
   */
  update: async (taskId, taskData) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}task/update/${taskId}`,
        taskData,
        getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   * @returns {Promise} API response
   */
  delete: async (taskId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}task/delete/${taskId}`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  /**
   * List all tasks
   * @returns {Promise} API response
   */
  list: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}task/listAll`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error listing tasks:', error);
      throw error;
    }
  },

  /**
   * List all tasks (paginated)
   * @param {Object} params - Query parameters like page, limit
   * @returns {Promise} API response
   */
  listPaginated: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}task/list`, {
        ...getConfig(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error listing tasks:', error);
      throw error;
    }
  },

  /**
   * Search tasks
   * @param {Object} params - Search parameters
   * @returns {Promise} API response
   */
  search: async (params) => {
    try {
      const response = await axios.get(`${API_BASE_URL}task/search`, {
        ...getConfig(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw error;
    }
  },

  /**
   * Filter tasks
   * @param {Object} params - Filter parameters
   * @returns {Promise} API response
   */
  filter: async (params) => {
    try {
      const response = await axios.get(`${API_BASE_URL}task/filter`, {
        ...getConfig(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error filtering tasks:', error);
      throw error;
    }
  },

  /**
   * Get task summary/statistics
   * @returns {Promise} API response
   */
  summary: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}task/summary`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error getting task summary:', error);
      throw error;
    }
  },

  /**
   * Get task statistics (more detailed)
   * @param {Object} params - Query parameters like timeframe
   * @returns {Promise} API response
   */
  statistics: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}stats/tasks`, {
        ...getConfig(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting task statistics:', error);
      throw error;
    }
  },

  /**
   * Add a collaborator to a task
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID to add as collaborator
   * @returns {Promise} API response
   */
  addCollaborator: async (taskId, userId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}task/${taskId}/collaborator`,
        { userId },
        getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  },

  /**
   * Update task progress
   * @param {string} taskId - Task ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise} API response
   */
  updateProgress: async (taskId, progress) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}task/${taskId}/progress`,
        { progress },
        getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  /**
   * Add a comment to a task
   * @param {string} taskId - Task ID
   * @param {string} content - Comment content
   * @returns {Promise} API response
   */
  addComment: async (taskId, content) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}task/${taskId}/comments`,
        { content },
        getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Get AI-powered priority suggestions for tasks
   * @param {Array} tasks - Array of task objects
   * @returns {Promise} API response with priority suggestions
   */
  getAIPrioritySuggestions: async (tasks) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}task/ai/prioritize`,
        { tasks },
        getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error getting AI priority suggestions:', error);
      throw error;
    }
  },

  /**
   * Batch update task priorities
   * @param {Array} updates - Array of {taskId, priority} objects
   * @returns {Promise} API response
   */
  batchUpdatePriorities: async (updates) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}task/batch/priorities`,
        { updates },
        getConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error batch updating priorities:', error);
      throw error;
    }
  },
};

export default taskRequest;
