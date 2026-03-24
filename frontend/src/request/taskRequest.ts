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
  ADD_TASK_COMMENT,
} from '@/graphql/operations/task';
import { GET_STATISTICS } from '@/graphql/operations/analytics';

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

  // statistics — use GraphQL
  statistics: async (params: { timeframe?: string } = {}) => {
    const { data } = await apolloClient.query({
      query: GET_STATISTICS,
      variables: { entity: 'task', period: params.timeframe },
    });
    return data.statisticsGet;
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

  // addComment — GraphQL mutation
  addComment: async (taskId, content) => {
    const { data } = await apolloClient.mutate({
      mutation: ADD_TASK_COMMENT,
      variables: { id: taskId, content },
    });
    return data.taskAddComment;
  },

  // getAIPrioritySuggestions — use AI_PRIORITIZE_TASK mutation
  getAIPrioritySuggestions: async (tasks) => {
    const results = await Promise.all(
      tasks.map((t) =>
        apolloClient.mutate({ mutation: AI_PRIORITIZE_TASK, variables: { id: t._id || t.id } })
          .then(({ data: d }) => d.taskAiPrioritize)
      )
    );
    return { success: true, result: results };
  },

  // batchUpdatePriorities — use sequential update mutations
  batchUpdatePriorities: async (updates) => {
    const results = await Promise.all(
      updates.map((u) =>
        apolloClient.mutate({ mutation: UPDATE_TASK, variables: { id: u.id, input: { priority: u.priority } } })
          .then(({ data: d }) => d.taskUpdate)
      )
    );
    return { success: true, result: results };
  },
};

export default taskRequest;
