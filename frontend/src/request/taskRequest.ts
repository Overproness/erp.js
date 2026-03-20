import apolloClient from '@/graphql/client';
import {
  GET_TASKS,
  GET_TASK,
  SEARCH_TASKS,
  FILTER_TASKS,
  TASK_SUMMARY,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  AI_PRIORITIZE_TASK,
} from '@/graphql/operations/task';

/**
 * Task API Request Service — bridged to GraphQL
 */

export const taskRequest = {
  create: async (taskData) => {
    const { data } = await apolloClient.mutate({ mutation: CREATE_TASK, variables: { input: taskData } });
    return data.taskCreate;
  },

  read: async (taskId) => {
    const { data } = await apolloClient.query({ query: GET_TASK, variables: { id: taskId } });
    return data.taskRead;
  },

  update: async (taskId, taskData) => {
    const { data } = await apolloClient.mutate({ mutation: UPDATE_TASK, variables: { id: taskId, input: taskData } });
    return data.taskUpdate;
  },

  delete: async (taskId) => {
    const { data } = await apolloClient.mutate({ mutation: DELETE_TASK, variables: { id: taskId } });
    return data.taskDelete;
  },

  list: async () => {
    const { data } = await apolloClient.query({ query: GET_TASKS, variables: { page: 1, limit: 1000 } });
    return data.taskList;
  },

  listPaginated: async (params = {}) => {
    const { data } = await apolloClient.query({ query: GET_TASKS, variables: params });
    return data.taskList;
  },

  search: async (params) => {
    const { data } = await apolloClient.query({ query: SEARCH_TASKS, variables: { q: params.q || '', fields: params.fields } });
    return data.taskSearch;
  },

  filter: async (params) => {
    const { data } = await apolloClient.query({ query: FILTER_TASKS, variables: { filter: params.filter, equal: params.equal } });
    return data.taskFilter;
  },

  summary: async () => {
    const { data } = await apolloClient.query({ query: TASK_SUMMARY });
    return data.taskSummary;
  },

  // statistics — no direct GraphQL query, keep REST
  statistics: async (params = {}) => {
    const axios = (await import('axios')).default;
    const { API_BASE_URL } = await import('@/config/serverApiConfig');
    const token = window.localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}stats/tasks`, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
      params,
    });
    return response.data;
  },

  // addCollaborator — no direct GraphQL mutation, use update
  addCollaborator: async (taskId, userId) => {
    const { data } = await apolloClient.mutate({ mutation: UPDATE_TASK, variables: { id: taskId, input: { collaborators: [userId] } } });
    return data.taskUpdate;
  },

  // updateProgress — use update mutation
  updateProgress: async (taskId, progress) => {
    const { data } = await apolloClient.mutate({ mutation: UPDATE_TASK, variables: { id: taskId, input: { progress } } });
    return data.taskUpdate;
  },

  // addComment — no direct GraphQL mutation, keep REST
  addComment: async (taskId, content) => {
    const axios = (await import('axios')).default;
    const { API_BASE_URL } = await import('@/config/serverApiConfig');
    const token = window.localStorage.getItem('auth_token');
    const response = await axios.post(
      `${API_BASE_URL}task/${taskId}/comments`,
      { content },
      { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
    );
    return response.data;
  },

  // getAIPrioritySuggestions — use AI_PRIORITIZE_TASK or REST fallback
  getAIPrioritySuggestions: async (tasks) => {
    const axios = (await import('axios')).default;
    const { API_BASE_URL } = await import('@/config/serverApiConfig');
    const token = window.localStorage.getItem('auth_token');
    const response = await axios.post(
      `${API_BASE_URL}task/ai/prioritize`,
      { tasks },
      { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
    );
    return response.data;
  },

  // batchUpdatePriorities — no batch mutation, keep REST
  batchUpdatePriorities: async (updates) => {
    const axios = (await import('axios')).default;
    const { API_BASE_URL } = await import('@/config/serverApiConfig');
    const token = window.localStorage.getItem('auth_token');
    const response = await axios.patch(
      `${API_BASE_URL}task/batch/priorities`,
      { updates },
      { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
    );
    return response.data;
  },
};

export default taskRequest;
