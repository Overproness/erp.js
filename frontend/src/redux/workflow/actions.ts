import apolloClient from '@/graphql/client';
import {
    CREATE_WORKFLOW,
    DELETE_WORKFLOW,
    GET_WORKFLOW,
    GET_WORKFLOWS,
    SIMULATE_WORKFLOW,
    TEST_WORKFLOW_CONDITION,
    TOGGLE_WORKFLOW_STATUS,
    UPDATE_WORKFLOW,
} from '@/graphql/operations/workflow';
import * as types from './types';

// List workflows
export const listWorkflows =
  (params = {}) =>
  async (dispatch) => {
    dispatch({ type: types.LIST_WORKFLOW_REQUEST });
    try {
      const { page = 1, limit = 10, status, triggerType } = params;
      const { data } = await apolloClient.query({
        query: GET_WORKFLOWS,
        variables: { page, limit, sortBy: 'createdAt', sortValue: 'desc' },
        fetchPolicy: 'cache-first',
      });
      const response = data.workflowList;
      dispatch({
        type: types.LIST_WORKFLOW_SUCCESS,
        payload: response,
      });
      return response;
    } catch (error) {
      dispatch({
        type: types.LIST_WORKFLOW_FAILURE,
        payload: { message: error.message },
      });
      throw error;
    }
  };

// Get a single workflow
export const readWorkflow = (id) => async (dispatch) => {
  dispatch({ type: types.READ_WORKFLOW_REQUEST });
  try {
    const { data } = await apolloClient.query({
      query: GET_WORKFLOW,
      variables: { id },
      fetchPolicy: 'cache-first',
    });
    const response = data.workflowRead;
    dispatch({
      type: types.READ_WORKFLOW_SUCCESS,
      payload: response,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.READ_WORKFLOW_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Create a new workflow
export const createWorkflow = (workflowData) => async (dispatch) => {
  dispatch({ type: types.CREATE_WORKFLOW_REQUEST });
  try {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_WORKFLOW,
      variables: { input: workflowData },
    });
    const response = data.workflowCreate;
    dispatch({
      type: types.CREATE_WORKFLOW_SUCCESS,
      payload: response,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.CREATE_WORKFLOW_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Update a workflow
export const updateWorkflow = (id, workflowData) => async (dispatch) => {
  dispatch({ type: types.UPDATE_WORKFLOW_REQUEST });
  try {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_WORKFLOW,
      variables: { id, input: workflowData },
    });
    const response = data.workflowUpdate;
    dispatch({
      type: types.UPDATE_WORKFLOW_SUCCESS,
      payload: response,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.UPDATE_WORKFLOW_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Delete a workflow
export const deleteWorkflow = (id) => async (dispatch) => {
  dispatch({ type: types.DELETE_WORKFLOW_REQUEST });
  try {
    const { data } = await apolloClient.mutate({
      mutation: DELETE_WORKFLOW,
      variables: { id },
    });
    const response = data.workflowDelete;
    dispatch({
      type: types.DELETE_WORKFLOW_SUCCESS,
      payload: { id, ...response },
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.DELETE_WORKFLOW_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Toggle workflow status
export const toggleWorkflowStatus = (id, status) => async (dispatch) => {
  dispatch({ type: types.TOGGLE_WORKFLOW_STATUS_REQUEST });
  try {
    const { data } = await apolloClient.mutate({
      mutation: TOGGLE_WORKFLOW_STATUS,
      variables: { id, input: { status } },
    });
    const response = data.workflowUpdate;
    dispatch({
      type: types.TOGGLE_WORKFLOW_STATUS_SUCCESS,
      payload: response,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.TOGGLE_WORKFLOW_STATUS_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Test a condition
export const testCondition = (conditionData) => async (dispatch) => {
  dispatch({ type: types.TEST_CONDITION_REQUEST });
  try {
    const { data } = await apolloClient.mutate({
      mutation: TEST_WORKFLOW_CONDITION,
      variables: { input: conditionData },
    });
    const response = data.workflowTestCondition;
    dispatch({
      type: types.TEST_CONDITION_SUCCESS,
      payload: response,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.TEST_CONDITION_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Simulate workflow execution
export const simulateWorkflow = (id, context) => async (dispatch) => {
  dispatch({ type: types.SIMULATE_WORKFLOW_REQUEST });
  try {
    const { data } = await apolloClient.mutate({
      mutation: SIMULATE_WORKFLOW,
      variables: { id, input: { context } },
    });
    const response = data.workflowExecute;
    dispatch({
      type: types.SIMULATE_WORKFLOW_SUCCESS,
      payload: response,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.SIMULATE_WORKFLOW_FAILURE,
      payload: { message: error.message },
    });
    throw error;
  }
};

// Reset workflow state
export const resetWorkflow = () => ({
  type: types.RESET_WORKFLOW,
});
