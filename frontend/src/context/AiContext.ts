import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAssistantsList, selectCurrentAssistant } from '@/redux/ai/aiSelectors';

const AiContext = createContext();

const initialState = {
  currentModule: null,
  contextData: {},
  activeAssistant: null,
  isInitialized: false,
  globalSettings: {
    autoSuggestions: true,
    contextAware: true,
    realTimeInsights: false,
    voiceInput: false
  }
};

const aiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MODULE':
      return {
        ...state,
        currentModule: action.payload
      };
    
    case 'SET_CONTEXT_DATA':
      return {
        ...state,
        contextData: { ...state.contextData, ...action.payload }
      };
    
    case 'SET_ACTIVE_ASSISTANT':
      return {
        ...state,
        activeAssistant: action.payload
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        globalSettings: { ...state.globalSettings, ...action.payload }
      };
    
    case 'RESET_CONTEXT':
      return {
        ...state,
        contextData: {},
        currentModule: null
      };
    
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload
      };
    
    default:
      return state;
  }
};

export const AiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const assistants = useSelector(selectAssistantsList);
  const currentAssistant = useSelector(selectCurrentAssistant);

  useEffect(() => {
    if (currentAssistant && !state.activeAssistant) {
      dispatch({ type: 'SET_ACTIVE_ASSISTANT', payload: currentAssistant });
    }
  }, [currentAssistant, state.activeAssistant]);

  useEffect(() => {
    if (assistants.length > 0 && !state.isInitialized) {
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  }, [assistants, state.isInitialized]);

  const setModule = (module) => {
    dispatch({ type: 'SET_MODULE', payload: module });
  };

  const setContextData = (data) => {
    dispatch({ type: 'SET_CONTEXT_DATA', payload: data });
  };

  const setActiveAssistant = (assistant) => {
    dispatch({ type: 'SET_ACTIVE_ASSISTANT', payload: assistant });
  };

  const updateSettings = (settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const resetContext = () => {
    dispatch({ type: 'RESET_CONTEXT' });
  };

  const buildContext = (entityType, entityData) => {
    const context = {
      module: state.currentModule,
      entityType,
      entityData,
      timestamp: new Date().toISOString(),
      settings: state.globalSettings
    };
    
    setContextData(context);
    return context;
  };

  const getContextualAssistant = (taskType) => {
    if (!assistants.length) return null;
    
    // Find assistant best suited for the task
    const taskTypeMapping = {
      document: 'document',
      analysis: 'analytics',
      workflow: 'workflow',
      customer: 'customer',
      financial: 'financial'
    };
    
    const preferredType = taskTypeMapping[taskType] || 'general';
    const assistant = assistants.find(a => a.type === preferredType && a.enabled);
    
    return assistant || assistants.find(a => a.enabled) || assistants[0];
  };

  const value = {
    ...state,
    actions: {
      setModule,
      setContextData,
      setActiveAssistant,
      updateSettings,
      resetContext,
      buildContext,
      getContextualAssistant
    }
  };

  return (
    <AiContext.Provider value={value}>
      {children}
    </AiContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};

export default AiContext;
