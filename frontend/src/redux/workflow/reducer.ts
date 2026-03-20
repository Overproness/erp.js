import * as types from './types';

const initialState = {
  list: {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
    isLoading: false,
    error: null,
  },
  current: {
    item: null,
    isLoading: false,
    error: null,
  },
  create: {
    isLoading: false,
    success: false,
    error: null,
  },
  update: {
    isLoading: false,
    success: false,
    error: null,
  },
  delete: {
    isLoading: false,
    success: false,
    error: null,
  },
  toggle: {
    isLoading: false,
    success: false,
    error: null,
  },
  testCondition: {
    result: null,
    isLoading: false,
    error: null,
  },
  simulation: {
    result: null,
    isLoading: false,
    error: null,
  },
};

export default function workflowReducer(state = initialState, action) {
  switch (action.type) {
    // List actions
    case types.LIST_WORKFLOW_REQUEST:
      return {
        ...state,
        list: {
          ...state.list,
          isLoading: true,
          error: null,
        },
      };
    case types.LIST_WORKFLOW_SUCCESS:
      return {
        ...state,
        list: {
          items: action.payload.result,
          pagination: {
            page: action.payload.page,
            limit: action.payload.limit,
            total: action.payload.total,
          },
          isLoading: false,
          error: null,
        },
      };
    case types.LIST_WORKFLOW_FAILURE:
      return {
        ...state,
        list: {
          ...state.list,
          isLoading: false,
          error: action.payload,
        },
      };

    // Read actions
    case types.READ_WORKFLOW_REQUEST:
      return {
        ...state,
        current: {
          ...state.current,
          isLoading: true,
          error: null,
        },
      };
    case types.READ_WORKFLOW_SUCCESS:
      return {
        ...state,
        current: {
          item: action.payload.result,
          isLoading: false,
          error: null,
        },
      };
    case types.READ_WORKFLOW_FAILURE:
      return {
        ...state,
        current: {
          ...state.current,
          isLoading: false,
          error: action.payload,
        },
      };

    // Create actions
    case types.CREATE_WORKFLOW_REQUEST:
      return {
        ...state,
        create: {
          isLoading: true,
          success: false,
          error: null,
        },
      };
    case types.CREATE_WORKFLOW_SUCCESS:
      return {
        ...state,
        create: {
          isLoading: false,
          success: true,
          error: null,
        },
      };
    case types.CREATE_WORKFLOW_FAILURE:
      return {
        ...state,
        create: {
          isLoading: false,
          success: false,
          error: action.payload,
        },
      };

    // Update actions
    case types.UPDATE_WORKFLOW_REQUEST:
      return {
        ...state,
        update: {
          isLoading: true,
          success: false,
          error: null,
        },
      };
    case types.UPDATE_WORKFLOW_SUCCESS:
      return {
        ...state,
        update: {
          isLoading: false,
          success: true,
          error: null,
        },
      };
    case types.UPDATE_WORKFLOW_FAILURE:
      return {
        ...state,
        update: {
          isLoading: false,
          success: false,
          error: action.payload,
        },
      };

    // Delete actions
    case types.DELETE_WORKFLOW_REQUEST:
      return {
        ...state,
        delete: {
          isLoading: true,
          success: false,
          error: null,
        },
      };
    case types.DELETE_WORKFLOW_SUCCESS:
      return {
        ...state,
        delete: {
          isLoading: false,
          success: true,
          error: null,
        },
      };
    case types.DELETE_WORKFLOW_FAILURE:
      return {
        ...state,
        delete: {
          isLoading: false,
          success: false,
          error: action.payload,
        },
      };

    // Toggle status actions
    case types.TOGGLE_WORKFLOW_STATUS_REQUEST:
      return {
        ...state,
        toggle: {
          isLoading: true,
          success: false,
          error: null,
        },
      };
    case types.TOGGLE_WORKFLOW_STATUS_SUCCESS:
      return {
        ...state,
        toggle: {
          isLoading: false,
          success: true,
          error: null,
        },
      };
    case types.TOGGLE_WORKFLOW_STATUS_FAILURE:
      return {
        ...state,
        toggle: {
          isLoading: false,
          success: false,
          error: action.payload,
        },
      };

    // Test condition actions
    case types.TEST_CONDITION_REQUEST:
      return {
        ...state,
        testCondition: {
          result: null,
          isLoading: true,
          error: null,
        },
      };
    case types.TEST_CONDITION_SUCCESS:
      return {
        ...state,
        testCondition: {
          result: action.payload.result,
          isLoading: false,
          error: null,
        },
      };
    case types.TEST_CONDITION_FAILURE:
      return {
        ...state,
        testCondition: {
          result: null,
          isLoading: false,
          error: action.payload,
        },
      };

    // Simulate workflow actions
    case types.SIMULATE_WORKFLOW_REQUEST:
      return {
        ...state,
        simulation: {
          result: null,
          isLoading: true,
          error: null,
        },
      };
    case types.SIMULATE_WORKFLOW_SUCCESS:
      return {
        ...state,
        simulation: {
          result: action.payload.result,
          isLoading: false,
          error: null,
        },
      };
    case types.SIMULATE_WORKFLOW_FAILURE:
      return {
        ...state,
        simulation: {
          result: null,
          isLoading: false,
          error: action.payload,
        },
      };

    // Reset action
    case types.RESET_WORKFLOW:
      return initialState;

    default:
      return state;
  }
}
