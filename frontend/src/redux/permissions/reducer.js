import * as actionTypes from './types';

const INITIAL_STATE = {
  permissions: {},
  isOwner: false,
  isLoading: false,
  isSuccess: false,
  error: null,
  role: null,
  email: null,
  name: null,
  userId: null,
  hasInitialized: false
};

const permissionsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case actionTypes.FETCH_PERMISSIONS_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
        isSuccess: false
      };

    case actionTypes.FETCH_PERMISSIONS_SUCCESS:
      return {
        ...state,
        permissions: action.payload.permissions || {},
        isOwner: action.payload.isOwner || false,
        role: action.payload.role,
        email: action.payload.email,
        name: action.payload.name,
        userId: action.payload.userId,
        isLoading: false,
        isSuccess: true,
        error: null,
        hasInitialized: true
      };

    case actionTypes.FETCH_PERMISSIONS_FAILURE:
      return {
        ...state,
        isLoading: false,
        isSuccess: false,
        error: action.payload,
        hasInitialized: true
      };

    case actionTypes.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload.permissions || {},
        isOwner: action.payload.isOwner || false,
        role: action.payload.role,
        email: action.payload.email,
        name: action.payload.name,
        userId: action.payload.userId,
        isLoading: false,
        isSuccess: true,
        error: null,
        hasInitialized: true
      };

    case actionTypes.CLEAR_PERMISSIONS:
      return {
        ...INITIAL_STATE,
        hasInitialized: false
      };

    default:
      return state;
  }
};

export default permissionsReducer;
