import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage } from '@/redux/ai/aiThunks';
import { selectChatMessages, selectChatLoading, selectChatTyping } from '@/redux/ai/aiSelectors';
import { addMessage, setTyping } from '@/redux/ai/aiSlice';

const AiChatContext = createContext();

const initialState = {
  currentConversation: null,
  quickReplies: [],
  suggestions: [],
  isRecording: false,
  lastActivity: null,
  typingUsers: [],
  messageHistory: []
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload
      };
    
    case 'SET_QUICK_REPLIES':
      return {
        ...state,
        quickReplies: action.payload
      };
    
    case 'ADD_SUGGESTION':
      return {
        ...state,
        suggestions: [...state.suggestions, action.payload]
      };
    
    case 'CLEAR_SUGGESTIONS':
      return {
        ...state,
        suggestions: []
      };
    
    case 'SET_RECORDING':
      return {
        ...state,
        isRecording: action.payload
      };
    
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date().toISOString()
      };
    
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        messageHistory: [action.payload, ...state.messageHistory.slice(0, 49)] // Keep last 50
      };
    
    default:
      return state;
  }
};

export const AiChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const reduxDispatch = useDispatch();
  
  const messages = useSelector(selectChatMessages);
  const loading = useSelector(selectChatLoading);
  const typing = useSelector(selectChatTyping);

  const sendMessage = useCallback(async (assistantId, message, context = {}) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Add to local history
    dispatch({ type: 'ADD_TO_HISTORY', payload: userMessage });
    dispatch({ type: 'UPDATE_ACTIVITY' });

    // Send to Redux
    try {
      await reduxDispatch(sendChatMessage({
        assistantId,
        message,
        context
      })).unwrap();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [reduxDispatch]);

  const addQuickReply = useCallback((reply) => {
    dispatch({ 
      type: 'SET_QUICK_REPLIES', 
      payload: [...state.quickReplies, reply] 
    });
  }, [state.quickReplies]);

  const clearQuickReplies = useCallback(() => {
    dispatch({ type: 'SET_QUICK_REPLIES', payload: [] });
  }, []);

  const addSuggestion = useCallback((suggestion) => {
    dispatch({ type: 'ADD_SUGGESTION', payload: suggestion });
  }, []);

  const clearSuggestions = useCallback(() => {
    dispatch({ type: 'CLEAR_SUGGESTIONS' });
  }, []);

  const startRecording = useCallback(() => {
    dispatch({ type: 'SET_RECORDING', payload: true });
  }, []);

  const stopRecording = useCallback(() => {
    dispatch({ type: 'SET_RECORDING', payload: false });
  }, []);

  const setCurrentConversation = useCallback((conversation) => {
    dispatch({ type: 'SET_CONVERSATION', payload: conversation });
  }, []);

  const generateQuickReplies = useCallback((lastMessage, assistantType) => {
    const commonReplies = [
      'Can you explain more?',
      'That helps, thank you!',
      'What else should I know?',
      'Can you give me an example?'
    ];

    const typeSpecificReplies = {
      analytics: [
        'Show me the data',
        'What are the trends?',
        'Create a report',
        'Compare with last period'
      ],
      document: [
        'Analyze this document',
        'Extract key points',
        'Summarize the content',
        'Check for errors'
      ],
      workflow: [
        'Optimize this process',
        'Find bottlenecks',
        'Suggest improvements',
        'Automate this task'
      ]
    };

    const replies = [
      ...commonReplies,
      ...(typeSpecificReplies[assistantType] || [])
    ];

    dispatch({ type: 'SET_QUICK_REPLIES', payload: replies.slice(0, 4) });
  }, []);

  const value = {
    ...state,
    messages,
    loading,
    typing,
    actions: {
      sendMessage,
      addQuickReply,
      clearQuickReplies,
      addSuggestion,
      clearSuggestions,
      startRecording,
      stopRecording,
      setCurrentConversation,
      generateQuickReplies
    }
  };

  return (
    <AiChatContext.Provider value={value}>
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChat = () => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChat must be used within an AiChatProvider');
  }
  return context;
};

export default AiChatContext;
