import * as actionTypes from './types';

const INITIAL_SETTINGS_STATE = {
  crm_settings: {},
  finance_settings: {},
  company_settings: {},
  app_settings: {},
  money_format_settings: {},
};

// Don't load from localStorage - always fetch fresh from backend
const getInitialSettingsFromStorage = () => {
  // Always start with empty state and require fresh data from backend
  return {
    result: INITIAL_SETTINGS_STATE,
    isLoading: false,
    isSuccess: false, // Always start as false to force fresh fetch
  };
};

const INITIAL_STATE = getInitialSettingsFromStorage();

const settingsReducer = (state = INITIAL_STATE, action) => {
  const { payload = null } = action;
  switch (action.type) {
    case actionTypes.RESET_STATE:
      return INITIAL_STATE;
    case actionTypes.REQUEST_LOADING:
      return {
        ...state,
        isLoading: true,
      };
    case actionTypes.REQUEST_FAILED:
      return {
        ...state,
        isLoading: false,
        isSuccess: false,
      };

    case actionTypes.UPDATE_CURRENCY:
      return {
        result: {
          ...state.result,
          money_format_settings: payload,
        },
        isLoading: false,
        isSuccess: true,
      };

    case actionTypes.REQUEST_SUCCESS:
      return {
        result: payload,
        isLoading: false,
        isSuccess: true,
      };
    default:
      return state;
  }
};

export default settingsReducer;
