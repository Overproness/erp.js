import * as actionTypes from './types';

export const initialState = {
  create: {
    isOpen: false,
  },
  update: {
    isOpen: false,
  },
  read: {
    isOpen: false,
  },
  recordPayment: {
    isOpen: false,
  },
  deleteModal: {
    isOpen: false,
  },
  dataTableList: {
    isOpen: true,
  },
  panel: {
    isOpen: false,
    config: {
      entity: null,
      mode: null,
      recordId: null,
      memberId: null
    }
  },
  last: null,
};

export function contextReducer(state, action) {
  const { keyState = null } = action;
  switch (action.type) {
    case actionTypes.OPEN_MODAL:
      return {
        ...state,
        deleteModal: { isOpen: true },
      };
    case actionTypes.CLOSE_MODAL:
      return {
        ...state,
        deleteModal: { isOpen: false },
      };
    case actionTypes.OPEN_PANEL:
      return {
        ...initialState,
        dataTableList: {
          isOpen: false,
        },
        [keyState]: { isOpen: true },
      };    case actionTypes.CLOSE_PANEL:
      return {
        ...initialState,
      };
      
    case actionTypes.OPEN_CUSTOM_PANEL:
      return {
        ...state,
        panel: action.payload
      };
      
    case actionTypes.CLOSE_CUSTOM_PANEL:
      return {
        ...state,
        panel: action.payload
      };

    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}
