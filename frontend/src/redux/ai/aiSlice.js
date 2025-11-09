import { createSlice } from '@reduxjs/toolkit';
import {
  analyzeData,
  createAssistant,
  createConversation,
  createExtractionTemplate,
  createKnowledgeItem,
  deleteAssistant,
  extractData,
  fetchAnalytics,
  fetchAssistant,
  fetchAssistants,
  fetchConversation,
  fetchConversations,
  fetchExtractionTemplates,
  fetchKnowledgeBase,
  fetchProcessingStats,
  fetchSuggestions,
  fetchUsageMetrics,
  fetchUserPreferences,
  generatePredictions,
  processOCR,
  processWorkflow,
  sendChatMessage,
  updateAssistant,
  updateUserPreferences,
} from './aiThunks';

const initialState = {
  // Assistants
  assistants: {
    list: [],
    current: null,
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  },

  // Chat
  chat: {
    messages: [],
    conversations: [],
    currentConversation: null,
    loading: false,
    typing: false,
    error: null,
  },

  // Analytics
  analytics: {
    data: null,
    usageMetrics: null,
    loading: false,
    error: null,
    metrics: {
      usage: {},
      performance: {},
      costs: {},
    },
  },

  // Suggestions
  suggestions: {
    list: [],
    loading: false,
    error: null,
    categories: {
      automation: [],
      optimization: [],
      insights: [],
    },
  },

  // Analysis
  analysis: {
    results: [],
    loading: false,
    error: null,
    currentAnalysis: null,
  },

  // Predictions
  predictions: {
    results: [],
    loading: false,
    error: null,
    currentPrediction: null,
  },

  // Knowledge Base
  knowledgeBase: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  },

  // Settings
  settings: {
    preferences: {},
    modelConfig: {},
    loading: false,
    error: null,
  },

  // UI State
  ui: {
    sidebarCollapsed: false,
    activeModule: 'assistants',
    selectedContext: null,
    notifications: [],
    chatOpen: false,
  },

  // Data Processing
  dataProcessing: {
    ocrResults: [],
    ocrLoading: false,
    ocrError: null,
    extractionResults: [],
    extractionLoading: false,
    extractionError: null,
    templates: [],
    templatesLoading: false,
    templatesError: null,
    workflows: [],
    workflowsLoading: false,
    workflowsError: null,
    currentWorkflow: null,
    processingStats: null,
    processingStatsLoading: false,
    processingStatsError: null,
  },
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    // Chat actions
    addMessage: (state, action) => {
      state.chat.messages.push(action.payload);
    },

    updateMessage: (state, action) => {
      const { id, updates } = action.payload;
      const messageIndex = state.chat.messages.findIndex((msg) => msg.id === id);
      if (messageIndex !== -1) {
        state.chat.messages[messageIndex] = { ...state.chat.messages[messageIndex], ...updates };
      }
    },

    setTyping: (state, action) => {
      state.chat.typing = action.payload;
    },

    resetChat: (state) => {
      state.chat.messages = [];
      state.chat.currentConversation = null;
      state.chat.typing = false;
    },

    loadConversation: (state, action) => {
      state.chat.currentConversation = action.payload.conversation;
      state.chat.messages = action.payload.messages;
    },

    // Assistant actions
    setCurrentAssistant: (state, action) => {
      state.assistants.current = action.payload;
    },

    setChatOpen: (state, action) => {
      state.ui.chatOpen = action.payload;
    },

    // UI actions
    setSidebarCollapsed: (state, action) => {
      state.ui.sidebarCollapsed = action.payload;
    },

    setActiveModule: (state, action) => {
      state.ui.activeModule = action.payload;
    },

    setSelectedContext: (state, action) => {
      state.ui.selectedContext = action.payload;
    },

    addNotification: (state, action) => {
      state.ui.notifications.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
    },

    removeNotification: (state, action) => {
      state.ui.notifications = state.ui.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },

    // Settings actions
    updatePreferences: (state, action) => {
      state.settings.preferences = { ...state.settings.preferences, ...action.payload };
    },

    updateModelConfig: (state, action) => {
      state.settings.modelConfig = { ...state.settings.modelConfig, ...action.payload };
    },

    // Data Processing actions
    clearOCRResults: (state) => {
      state.dataProcessing.ocrResults = [];
    },

    clearExtractionResults: (state) => {
      state.dataProcessing.extractionResults = [];
    },

    setCurrentWorkflow: (state, action) => {
      state.dataProcessing.currentWorkflow = action.payload;
    },

    addOCRResult: (state, action) => {
      state.dataProcessing.ocrResults.push(action.payload);
    },

    removeOCRResult: (state, action) => {
      state.dataProcessing.ocrResults = state.dataProcessing.ocrResults.filter(
        (result) => result.id !== action.payload
      );
    },
  },

  extraReducers: (builder) => {
    // Fetch Assistants
    builder
      .addCase(fetchAssistants.pending, (state) => {
        state.assistants.loading = true;
        state.assistants.error = null;
      })
      .addCase(fetchAssistants.fulfilled, (state, action) => {
        state.assistants.loading = false;
        const responseData = action.payload;
        if (Array.isArray(responseData.result.items)) {
          state.assistants.list = responseData.result.items;
        } else {
          state.assistants.list = [];
        }
        state.assistants.pagination = responseData?.pagination || state.assistants.pagination;
      })
      .addCase(fetchAssistants.rejected, (state, action) => {
        state.assistants.loading = false;
        state.assistants.error = action.payload;
        state.assistants.list = []; // Ensure empty array on error
      });

    // Fetch Single Assistant
    builder
      .addCase(fetchAssistant.pending, (state) => {
        state.assistants.loading = true;
        state.assistants.error = null;
      })
      .addCase(fetchAssistant.fulfilled, (state, action) => {
        state.assistants.loading = false;
        state.assistants.current = action.payload;

        // Update in list if exists
        const index = state.assistants.list.findIndex(
          (assistant) => assistant._id === action.payload._id
        );
        if (index !== -1) {
          state.assistants.list[index] = action.payload;
        }
      })
      .addCase(fetchAssistant.rejected, (state, action) => {
        state.assistants.loading = false;
        state.assistants.error = action.payload;
      });

    // Create Assistant
    builder
      .addCase(createAssistant.pending, (state) => {
        state.assistants.loading = true;
        state.assistants.error = null;
      })
      .addCase(createAssistant.fulfilled, (state, action) => {
        state.assistants.loading = false;
        state.assistants.list.unshift(action.payload);
        state.assistants.current = action.payload;
      })
      .addCase(createAssistant.rejected, (state, action) => {
        state.assistants.loading = false;
        state.assistants.error = action.payload;
      });

    // Update Assistant
    builder
      .addCase(updateAssistant.pending, (state) => {
        state.assistants.loading = true;
        state.assistants.error = null;
      })
      .addCase(updateAssistant.fulfilled, (state, action) => {
        state.assistants.loading = false;
        const index = state.assistants.list.findIndex(
          (assistant) => assistant._id === action.payload._id
        );
        if (index !== -1) {
          state.assistants.list[index] = action.payload;
        }
        if (state.assistants.current?._id === action.payload._id) {
          state.assistants.current = action.payload;
        }
      })
      .addCase(updateAssistant.rejected, (state, action) => {
        state.assistants.loading = false;
        state.assistants.error = action.payload;
      });

    // Delete Assistant
    builder
      .addCase(deleteAssistant.pending, (state) => {
        state.assistants.loading = true;
        state.assistants.error = null;
      })
      .addCase(deleteAssistant.fulfilled, (state, action) => {
        state.assistants.loading = false;
        state.assistants.list = state.assistants.list.filter(
          (assistant) => assistant._id !== action.payload
        );
        if (state.assistants.current?._id === action.payload) {
          state.assistants.current = null;
        }
      })
      .addCase(deleteAssistant.rejected, (state, action) => {
        state.assistants.loading = false;
        state.assistants.error = action.payload;
      });

    // Send Chat Message
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.chat.loading = true;
        state.chat.typing = true;
        state.chat.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.typing = false;
        // Add assistant's response
        state.chat.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: action.payload.message,
          timestamp: new Date().toISOString(),
          metadata: action.payload.usage,
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.typing = false;
        state.chat.error = action.payload;
      });

    // Fetch Conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload;
      });

    // Fetch Single Conversation
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.currentConversation = action.payload.conversation;
        state.chat.messages = action.payload.messages;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload;
      });

    // Create Conversation
    builder
      .addCase(createConversation.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.conversations.unshift(action.payload);
        state.chat.currentConversation = action.payload;
        state.chat.messages = [];
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload;
      });

    // Fetch Analytics
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.data = action.payload;
        state.analytics.metrics = action.payload.metrics || state.analytics.metrics;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      });

    // Fetch Usage Metrics
    builder
      .addCase(fetchUsageMetrics.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchUsageMetrics.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.usageMetrics = action.payload;
      })
      .addCase(fetchUsageMetrics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      });

    // Fetch Suggestions
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestions.loading = true;
        state.suggestions.error = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions.loading = false;
        state.suggestions.list = action.payload.suggestions || action.payload;
        state.suggestions.categories = action.payload.categories || state.suggestions.categories;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestions.loading = false;
        state.suggestions.error = action.payload;
      });

    // Analyze Data
    builder
      .addCase(analyzeData.pending, (state) => {
        state.analysis.loading = true;
        state.analysis.error = null;
      })
      .addCase(analyzeData.fulfilled, (state, action) => {
        state.analysis.loading = false;
        state.analysis.results.unshift(action.payload);
        state.analysis.currentAnalysis = action.payload;
      })
      .addCase(analyzeData.rejected, (state, action) => {
        state.analysis.loading = false;
        state.analysis.error = action.payload;
      });

    // Generate Predictions
    builder
      .addCase(generatePredictions.pending, (state) => {
        state.predictions.loading = true;
        state.predictions.error = null;
      })
      .addCase(generatePredictions.fulfilled, (state, action) => {
        state.predictions.loading = false;
        state.predictions.results.unshift(action.payload);
        state.predictions.currentPrediction = action.payload;
      })
      .addCase(generatePredictions.rejected, (state, action) => {
        state.predictions.loading = false;
        state.predictions.error = action.payload;
      });

    // Fetch Knowledge Base
    builder
      .addCase(fetchKnowledgeBase.pending, (state) => {
        state.knowledgeBase.loading = true;
        state.knowledgeBase.error = null;
      })
      .addCase(fetchKnowledgeBase.fulfilled, (state, action) => {
        state.knowledgeBase.loading = false;
        state.knowledgeBase.items = action.payload.items || action.payload;
        state.knowledgeBase.pagination =
          action.payload.pagination || state.knowledgeBase.pagination;
      })
      .addCase(fetchKnowledgeBase.rejected, (state, action) => {
        state.knowledgeBase.loading = false;
        state.knowledgeBase.error = action.payload;
      });

    // Create Knowledge Item
    builder
      .addCase(createKnowledgeItem.pending, (state) => {
        state.knowledgeBase.loading = true;
        state.knowledgeBase.error = null;
      })
      .addCase(createKnowledgeItem.fulfilled, (state, action) => {
        state.knowledgeBase.loading = false;
        state.knowledgeBase.items.unshift(action.payload);
      })
      .addCase(createKnowledgeItem.rejected, (state, action) => {
        state.knowledgeBase.loading = false;
        state.knowledgeBase.error = action.payload;
      });

    // Fetch User Preferences
    builder
      .addCase(fetchUserPreferences.pending, (state) => {
        state.settings.loading = true;
        state.settings.error = null;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.settings.loading = false;
        state.settings.preferences = action.payload;
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        state.settings.loading = false;
        state.settings.error = action.payload;
      });

    // Update User Preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.settings.loading = true;
        state.settings.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.settings.loading = false;
        state.settings.preferences = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.settings.loading = false;
        state.settings.error = action.payload;
      });

    // Process OCR
    builder
      .addCase(processOCR.pending, (state) => {
        state.dataProcessing.ocrLoading = true;
        state.dataProcessing.ocrError = null;
      })
      .addCase(processOCR.fulfilled, (state, action) => {
        state.dataProcessing.ocrLoading = false;
        state.dataProcessing.ocrResults.push(action.payload);
      })
      .addCase(processOCR.rejected, (state, action) => {
        state.dataProcessing.ocrLoading = false;
        state.dataProcessing.ocrError = action.payload;
      });

    // Extract Data
    builder
      .addCase(extractData.pending, (state) => {
        state.dataProcessing.extractionLoading = true;
        state.dataProcessing.extractionError = null;
      })
      .addCase(extractData.fulfilled, (state, action) => {
        state.dataProcessing.extractionLoading = false;
        state.dataProcessing.extractionResults.push(action.payload);
      })
      .addCase(extractData.rejected, (state, action) => {
        state.dataProcessing.extractionLoading = false;
        state.dataProcessing.extractionError = action.payload;
      });

    // Create Extraction Template
    builder
      .addCase(createExtractionTemplate.pending, (state) => {
        state.dataProcessing.templatesLoading = true;
        state.dataProcessing.templatesError = null;
      })
      .addCase(createExtractionTemplate.fulfilled, (state, action) => {
        state.dataProcessing.templatesLoading = false;
        state.dataProcessing.templates.push(action.payload);
      })
      .addCase(createExtractionTemplate.rejected, (state, action) => {
        state.dataProcessing.templatesLoading = false;
        state.dataProcessing.templatesError = action.payload;
      });

    // Fetch Extraction Templates
    builder
      .addCase(fetchExtractionTemplates.pending, (state) => {
        state.dataProcessing.templatesLoading = true;
        state.dataProcessing.templatesError = null;
      })
      .addCase(fetchExtractionTemplates.fulfilled, (state, action) => {
        state.dataProcessing.templatesLoading = false;
        state.dataProcessing.templates = action.payload.items || action.payload;
      })
      .addCase(fetchExtractionTemplates.rejected, (state, action) => {
        state.dataProcessing.templatesLoading = false;
        state.dataProcessing.templatesError = action.payload;
      });

    // Process Workflow
    builder
      .addCase(processWorkflow.pending, (state) => {
        state.dataProcessing.workflowsLoading = true;
        state.dataProcessing.workflowsError = null;
      })
      .addCase(processWorkflow.fulfilled, (state, action) => {
        state.dataProcessing.workflowsLoading = false;
        // Update workflow execution results
        const workflowIndex = state.dataProcessing.workflows.findIndex(
          (w) => w.id === action.payload.workflowId
        );
        if (workflowIndex !== -1) {
          state.dataProcessing.workflows[workflowIndex].lastExecuted = new Date().toISOString();
          state.dataProcessing.workflows[workflowIndex].executionCount += 1;
        }
      })
      .addCase(processWorkflow.rejected, (state, action) => {
        state.dataProcessing.workflowsLoading = false;
        state.dataProcessing.workflowsError = action.payload;
      });

    // Fetch Processing Stats
    builder
      .addCase(fetchProcessingStats.pending, (state) => {
        state.dataProcessing.processingStatsLoading = true;
        state.dataProcessing.processingStatsError = null;
      })
      .addCase(fetchProcessingStats.fulfilled, (state, action) => {
        state.dataProcessing.processingStatsLoading = false;
        state.dataProcessing.processingStats = action.payload;
      })
      .addCase(fetchProcessingStats.rejected, (state, action) => {
        state.dataProcessing.processingStatsLoading = false;
        state.dataProcessing.processingStatsError = action.payload;
      });
  },
});

export const {
  addMessage,
  updateMessage,
  setTyping,
  resetChat,
  loadConversation,
  setCurrentAssistant,
  setChatOpen,
  setSidebarCollapsed,
  setActiveModule,
  setSelectedContext,
  addNotification,
  removeNotification,
  updatePreferences,
  updateModelConfig,
  clearOCRResults,
  clearExtractionResults,
  setCurrentWorkflow,
  addOCRResult,
  removeOCRResult,
} = aiSlice.actions;

export default aiSlice.reducer;
