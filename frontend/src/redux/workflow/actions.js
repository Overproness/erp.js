import { request } from '@/request';
import * as types from './types';

// API endpoint
const API_URL = '/api/workflow';

// List workflows
export const listWorkflows =
  (params = {}) =>
  async (dispatch) => {
    dispatch({ type: types.LIST_WORKFLOW_REQUEST });
    try {
      const { page = 1, limit = 10, status, triggerType } = params;
      const queryParams = new URLSearchParams();

      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (status) queryParams.append('status', status);
      if (triggerType) queryParams.append('triggerType', triggerType);

      const response = await request.get(`${API_URL}?${queryParams.toString()}`);
      dispatch({
        type: types.LIST_WORKFLOW_SUCCESS,
        payload: response.data,
      });
      return response;
    } catch (error) {
      dispatch({
        type: types.LIST_WORKFLOW_FAILURE,
        payload: error.response?.data || { message: error.message },
      });
      throw error;
    }
  };

// Get a single workflow
export const readWorkflow = (id) => async (dispatch) => {
  dispatch({ type: types.READ_WORKFLOW_REQUEST });
  try {
    const response = await request.get(`${API_URL}/${id}`);
    dispatch({
      type: types.READ_WORKFLOW_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.READ_WORKFLOW_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Create a new workflow
export const createWorkflow = (data) => async (dispatch) => {
  dispatch({ type: types.CREATE_WORKFLOW_REQUEST });
  try {
    const response = await request.post(API_URL, data);
    dispatch({
      type: types.CREATE_WORKFLOW_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.CREATE_WORKFLOW_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Update a workflow
export const updateWorkflow = (id, data) => async (dispatch) => {
  dispatch({ type: types.UPDATE_WORKFLOW_REQUEST });
  try {
    const response = await request.patch(`${API_URL}/${id}`, data);
    dispatch({
      type: types.UPDATE_WORKFLOW_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.UPDATE_WORKFLOW_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Delete a workflow
export const deleteWorkflow = (id) => async (dispatch) => {
  dispatch({ type: types.DELETE_WORKFLOW_REQUEST });
  try {
    const response = await request.delete(`${API_URL}/${id}`);
    dispatch({
      type: types.DELETE_WORKFLOW_SUCCESS,
      payload: { id, ...response.data },
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.DELETE_WORKFLOW_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Toggle workflow status
export const toggleWorkflowStatus = (id, status) => async (dispatch) => {
  dispatch({ type: types.TOGGLE_WORKFLOW_STATUS_REQUEST });
  try {
    const response = await request.patch(`${API_URL}/${id}/status`, { status });
    dispatch({
      type: types.TOGGLE_WORKFLOW_STATUS_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.TOGGLE_WORKFLOW_STATUS_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Test a condition
export const testCondition = (data) => async (dispatch) => {
  dispatch({ type: types.TEST_CONDITION_REQUEST });
  try {
    const response = await request.post(`${API_URL}/test-condition`, data);
    dispatch({
      type: types.TEST_CONDITION_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.TEST_CONDITION_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Simulate workflow execution
export const simulateWorkflow = (id, context) => async (dispatch) => {
  dispatch({ type: types.SIMULATE_WORKFLOW_REQUEST });
  try {
    const response = await request.post(`${API_URL}/${id}/simulate`, { context });
    dispatch({
      type: types.SIMULATE_WORKFLOW_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.SIMULATE_WORKFLOW_FAILURE,
      payload: error.response?.data || { message: error.message },
    });
    throw error;
  }
};

// Reset workflow state
export const resetWorkflow = () => ({
  type: types.RESET_WORKFLOW,
});
