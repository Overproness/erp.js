import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  setFilters, 
  resetFilters, 
  setPagination, 
  setSorting, 
  setViewMode, 
  toggleFilters,
  toggleShowArchived,
  selectCampaigns,
  clearSelectedCampaigns
} from '@/redux/marketing/marketingSlice';

// Initial state
const initialState = {
  // UI state
  sideDrawerOpen: false,
  activePanel: null, // 'details', 'edit', 'analytics', etc.
  detailsId: null, // Currently viewed campaign/trigger ID
  
  // Modal states
  modalVisible: {
    createCampaign: false,
    createTrigger: false,
    createSegment: false,
    deleteConfirmation: false,
    exportData: false,
    importData: false,
  },
  
  // Tab and filter states
  activeTab: 'campaigns', // 'campaigns', 'triggers', 'segments', 'retargeting'
  
  // Form states
  formData: {}, // Temporary form data storage
  
  // Bulk action states
  bulkActionType: null, // 'status', 'delete', 'duplicate', etc.
  
  // Toast notification
  notification: null, // { type, message, description }
};

// Action types
const ActionTypes = {
  OPEN_SIDE_DRAWER: 'OPEN_SIDE_DRAWER',
  CLOSE_SIDE_DRAWER: 'CLOSE_SIDE_DRAWER',
  SET_ACTIVE_PANEL: 'SET_ACTIVE_PANEL',
  SET_DETAILS_ID: 'SET_DETAILS_ID',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_FORM_DATA: 'SET_FORM_DATA',
  CLEAR_FORM_DATA: 'CLEAR_FORM_DATA',
  SET_BULK_ACTION_TYPE: 'SET_BULK_ACTION_TYPE',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  RESET_STATE: 'RESET_STATE',
};

// Reducer function
const marketingReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.OPEN_SIDE_DRAWER:
      return { ...state, sideDrawerOpen: true };
      
    case ActionTypes.CLOSE_SIDE_DRAWER:
      return { ...state, sideDrawerOpen: false };
      
    case ActionTypes.SET_ACTIVE_PANEL:
      return { ...state, activePanel: action.payload };
      
    case ActionTypes.SET_DETAILS_ID:
      return { ...state, detailsId: action.payload };
      
    case ActionTypes.OPEN_MODAL:
      return { 
        ...state, 
        modalVisible: { 
          ...state.modalVisible, 
          [action.payload]: true 
        } 
      };
      
    case ActionTypes.CLOSE_MODAL:
      return { 
        ...state, 
        modalVisible: { 
          ...state.modalVisible, 
          [action.payload]: false 
        } 
      };
      
    case ActionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
      
    case ActionTypes.SET_FORM_DATA:
      return { 
        ...state, 
        formData: { ...state.formData, ...action.payload } 
      };
      
    case ActionTypes.CLEAR_FORM_DATA:
      return { ...state, formData: {} };
      
    case ActionTypes.SET_BULK_ACTION_TYPE:
      return { ...state, bulkActionType: action.payload };
      
    case ActionTypes.SHOW_NOTIFICATION:
      return { ...state, notification: action.payload };
      
    case ActionTypes.CLEAR_NOTIFICATION:
      return { ...state, notification: null };
      
    case ActionTypes.RESET_STATE:
      return { ...initialState };
      
    default:
      return state;
  }
};

// Create context
const MarketingContext = createContext();

export const MarketingProvider = ({ children }) => {
  const [state, contextDispatch] = useReducer(marketingReducer, initialState);
  const reduxDispatch = useDispatch();
  
  // Side drawer actions
  const openSideDrawer = useCallback(() => {
    contextDispatch({ type: ActionTypes.OPEN_SIDE_DRAWER });
  }, []);
  
  const closeSideDrawer = useCallback(() => {
    contextDispatch({ type: ActionTypes.CLOSE_SIDE_DRAWER });
  }, []);
  
  // Panel actions
  const setActivePanel = useCallback((panel) => {
    contextDispatch({ 
      type: ActionTypes.SET_ACTIVE_PANEL, 
      payload: panel 
    });
  }, []);
  
  const setDetailsId = useCallback((id) => {
    contextDispatch({ 
      type: ActionTypes.SET_DETAILS_ID, 
      payload: id 
    });
  }, []);
  
  // Modal actions
  const openModal = useCallback((modalName) => {
    contextDispatch({ 
      type: ActionTypes.OPEN_MODAL, 
      payload: modalName 
    });
  }, []);
  
  const closeModal = useCallback((modalName) => {
    contextDispatch({ 
      type: ActionTypes.CLOSE_MODAL, 
      payload: modalName 
    });
  }, []);
  
  // Tab actions
  const setActiveTab = useCallback((tab) => {
    contextDispatch({ 
      type: ActionTypes.SET_ACTIVE_TAB, 
      payload: tab 
    });
  }, []);
  
  // Form actions
  const setFormData = useCallback((data) => {
    contextDispatch({ 
      type: ActionTypes.SET_FORM_DATA, 
      payload: data 
    });
  }, []);
  
  const clearFormData = useCallback(() => {
    contextDispatch({ type: ActionTypes.CLEAR_FORM_DATA });
  }, []);
  
  // Bulk action actions
  const setBulkActionType = useCallback((type) => {
    contextDispatch({ 
      type: ActionTypes.SET_BULK_ACTION_TYPE, 
      payload: type 
    });
  }, []);
  
  // Notification actions
  const showNotification = useCallback((notification) => {
    contextDispatch({ 
      type: ActionTypes.SHOW_NOTIFICATION, 
      payload: notification 
    });
    
    // Auto-clear notification after 5 seconds
    setTimeout(() => {
      contextDispatch({ type: ActionTypes.CLEAR_NOTIFICATION });
    }, 5000);
  }, []);
  
  const clearNotification = useCallback(() => {
    contextDispatch({ type: ActionTypes.CLEAR_NOTIFICATION });
  }, []);
  
  // Reset action
  const resetState = useCallback(() => {
    contextDispatch({ type: ActionTypes.RESET_STATE });
  }, []);
  
  // Redux dispatch wrappers
  const updateFilters = useCallback((filters) => {
    reduxDispatch(setFilters(filters));
  }, [reduxDispatch]);
  
  const clearFilters = useCallback(() => {
    reduxDispatch(resetFilters());
  }, [reduxDispatch]);
  
  const updatePagination = useCallback((pagination) => {
    reduxDispatch(setPagination(pagination));
  }, [reduxDispatch]);
  
  const updateSorting = useCallback((sorting) => {
    reduxDispatch(setSorting(sorting));
  }, [reduxDispatch]);
  
  const updateViewMode = useCallback((mode) => {
    reduxDispatch(setViewMode(mode));
  }, [reduxDispatch]);
  
  const toggleFiltersPanel = useCallback(() => {
    reduxDispatch(toggleFilters());
  }, [reduxDispatch]);
  
  const toggleArchivedItems = useCallback(() => {
    reduxDispatch(toggleShowArchived());
  }, [reduxDispatch]);
  
  const selectItems = useCallback((ids) => {
    reduxDispatch(selectCampaigns(ids));
  }, [reduxDispatch]);
  
  const clearSelection = useCallback(() => {
    reduxDispatch(clearSelectedCampaigns());
  }, [reduxDispatch]);
  
  // Create the value object for the context
  const contextValue = {
    // State
    ...state,
    
    // Context actions
    openSideDrawer,
    closeSideDrawer,
    setActivePanel,
    setDetailsId,
    openModal,
    closeModal,
    setActiveTab,
    setFormData,
    clearFormData,
    setBulkActionType,
    showNotification,
    clearNotification,
    resetState,
    
    // Redux actions
    updateFilters,
    clearFilters,
    updatePagination,
    updateSorting,
    updateViewMode,
    toggleFiltersPanel,
    toggleArchivedItems,
    selectItems,
    clearSelection,
  };
  
  return (
    <MarketingContext.Provider value={contextValue}>
      {children}
    </MarketingContext.Provider>
  );
};

// Custom hook to use the marketing context
export const useMarketing = () => {
  const context = useContext(MarketingContext);
  
  if (!context) {
    throw new Error('useMarketing must be used within a MarketingProvider');
  }
  
  return context;
};
