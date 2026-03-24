import apolloClient from '@/graphql/client';
import {
    AI_PREDICT,
    CREATE_AI_KNOWLEDGE_BASE,
    GET_AI_KNOWLEDGE_BASES,
    GET_AI_PREFERENCES,
    UPDATE_AI_PREFERENCES
} from '@/graphql/operations/ai';
import {
    getCreateMutation,
    getDeleteMutation,
    getListQuery,
    getReadQuery,
    getUpdateMutation,
} from '@/graphql/operations/crudFactory';
import { gql } from '@apollo/client';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { addMessage, setTyping } from './aiSlice';

// Assistant Management
export const fetchAssistants = createAsyncThunk(
  'ai/fetchAssistants',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('aiAssistant'),
        variables: {
          page: params.page || 1,
          limit: params.limit || 10,
          sortBy: 'createdAt',
          sortValue: 'desc',
        },
        fetchPolicy: 'cache-first',
      });
      return data.aiAssistantList;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistants');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.assistants?.loading;
    },
  }
);

export const createAssistant = createAsyncThunk(
  'ai/createAssistant',
  async (assistantData, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getCreateMutation('aiAssistant'),
        variables: { input: assistantData },
      });
      return data.aiAssistantCreate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create assistant');
    }
  }
);

export const updateAssistant = createAsyncThunk(
  'ai/updateAssistant',
  async ({ id, data: updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getUpdateMutation('aiAssistant'),
        variables: { id, input: updateData },
      });
      return data.aiAssistantUpdate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update assistant');
    }
  }
);

export const deleteAssistant = createAsyncThunk(
  'ai/deleteAssistant',
  async (id, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: getDeleteMutation('aiAssistant'),
        variables: { id },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete assistant');
    }
  }
);

export const fetchAssistant = createAsyncThunk(
  'ai/fetchAssistant',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getReadQuery('aiAssistant'),
        variables: { id },
        fetchPolicy: 'cache-first',
      });
      return data.aiAssistantRead?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistant');
    }
  }
);

// Chat Operations
export const sendChatMessage = createAsyncThunk(
  'ai/sendChatMessage',
  async ({ assistantId, message, context = {} }, { dispatch, rejectWithValue }) => {
    try {
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(userMessage));
      dispatch(setTyping(true));

      const { data } = await apolloClient.mutate({
        mutation: gql`mutation AiConversationSendMessage($id: ID!, $input: AIMessageInput!) { aiConversationSendMessage(id: $id, input: $input) { success result message } }`,
        variables: { id: assistantId, input: { content: message, context } },
      });
      return data.aiConversationSendMessage?.result;
    } catch (error) {
      dispatch(setTyping(false));
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

// Conversation Management
export const fetchConversations = createAsyncThunk(
  'ai/fetchConversations',
  async (assistantId, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query AiConversationList($page: Int, $limit: Int) { aiConversationList(page: $page, limit: $limit) { success result message } }`,
        variables: { page: 1, limit: 50 },
        fetchPolicy: 'cache-first',
      });
      return data.aiConversationList?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.chat?.loading;
    },
  }
);

export const fetchConversation = createAsyncThunk(
  'ai/fetchConversation',
  async ({ assistantId, conversationId }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query AiConversationHistory($id: ID!) { aiConversationHistory(id: $id) { success result message } }`,
        variables: { id: conversationId },
        fetchPolicy: 'cache-first',
      });
      return data.aiConversationHistory?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversation');
    }
  }
);

export const createConversation = createAsyncThunk(
  'ai/createConversation',
  async ({ assistantId, title, context = {} }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation AiConversationCreate($input: JSON) { aiConversationCreate(input: $input) { success result message } }`,
        variables: { input: { aiAssistant: assistantId, title, context, status: 'active' } },
      });
      return data.aiConversationCreate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

// Analytics
export const fetchAnalytics = createAsyncThunk(
  'ai/fetchAnalytics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query AiSuggestions($context: String!, $type: String) { aiSuggestions(context: $context, type: $type) { success result message } }`,
        variables: { context: 'analytics', type: 'summary' },
        fetchPolicy: 'cache-first',
      });
      return data.aiSuggestions?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.analytics?.loading;
    },
  }
);

export const fetchUsageMetrics = createAsyncThunk(
  'ai/fetchUsageMetrics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('aiAnalytics'),
        variables: { page: params.page || 1, limit: params.limit || 50 },
        fetchPolicy: 'cache-first',
      });
      return data.aiAnalyticsList?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch usage metrics');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.analytics?.loading;
    },
  }
);

// Suggestions & Analysis
export const fetchSuggestions = createAsyncThunk(
  'ai/fetchSuggestions',
  async ({ module, data: inputData, assistantId }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query AiSuggestions($context: String!, $type: String) { aiSuggestions(context: $context, type: $type) { success result message } }`,
        variables: { context: JSON.stringify({ module, data: inputData, assistantId }), type: module },
        fetchPolicy: 'cache-first',
      });
      return data.aiSuggestions?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch suggestions');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.suggestions?.loading;
    },
  }
);

export const analyzeData = createAsyncThunk(
  'ai/analyzeData',
  async ({ assistantId, module, data: inputData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation AiAnalyzeText($input: JSON!) { aiAnalyzeText(input: $input) { success result message } }`,
        variables: { input: { assistantId, module, data: inputData } },
      });
      return data.aiAnalyzeText?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to analyze data');
    }
  }
);

export const generatePredictions = createAsyncThunk(
  'ai/generatePredictions',
  async ({ assistantId, module, data: inputData, timeframe }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: AI_PREDICT,
        variables: { input: { assistantId, module, data: inputData, timeframe } },
      });
      return data.aiPredict?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate predictions');
    }
  }
);

// Knowledge Base
export const fetchKnowledgeBase = createAsyncThunk(
  'ai/fetchKnowledgeBase',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_AI_KNOWLEDGE_BASES,
        variables: {
          page: params.page || 1,
          limit: params.limit || 20,
        },
        fetchPolicy: 'cache-first',
      });
      return data.aiKnowledgeBaseList?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch knowledge base');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.knowledgeBase?.loading;
    },
  }
);

export const createKnowledgeItem = createAsyncThunk(
  'ai/createKnowledgeItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_AI_KNOWLEDGE_BASE,
        variables: { input: itemData },
      });
      return data.aiKnowledgeBaseCreate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create knowledge item');
    }
  }
);

// User Preferences
export const fetchUserPreferences = createAsyncThunk(
  'ai/fetchUserPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_AI_PREFERENCES,
        fetchPolicy: 'cache-first',
      });
      return data.aiPreferencesRead?.result || {};
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user preferences');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.settings?.loading;
    },
  }
);

export const updateUserPreferences = createAsyncThunk(
  'ai/updateUserPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_AI_PREFERENCES,
        variables: { input: preferences },
      });
      return data.aiPreferencesUpdate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update user preferences');
    }
  }
);

// Data Processing Thunks
export const processOCR = createAsyncThunk(
  'ai/processOCR',
  async ({ file, options = {} }, { rejectWithValue }) => {
    try {
      // Keep REST — file upload
      const { request } = await import('@/request');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', options.language || 'en');
      formData.append('mode', options.mode || 'automatic');

      const response = await request.post({
        entity: 'ai/ocr/process',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OCR processing failed');
    }
  }
);

export const extractData = createAsyncThunk(
  'ai/extractData',
  async ({ text, template, fields }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation AiGenerateContent($input: JSON!) { aiGenerateContent(input: $input) { success result message } }`,
        variables: { input: { text, template, fields, action: 'extract' } },
      });
      return data.aiGenerateContent;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Data extraction failed');
    }
  }
);

export const createExtractionTemplate = createAsyncThunk(
  'ai/createExtractionTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getCreateMutation('aiTemplate'),
        variables: { input: templateData },
      });
      return data.aiTemplateCreate;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Template creation failed');
    }
  }
);

export const fetchExtractionTemplates = createAsyncThunk(
  'ai/fetchExtractionTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('aiTemplate'),
        variables: { page: 1, limit: 100 },
        fetchPolicy: 'cache-first',
      });
      return data.aiTemplateList;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.dataProcessor?.loading;
    },
  }
);

export const processWorkflow = createAsyncThunk(
  'ai/processWorkflow',
  async ({ workflowId, data: inputData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation AiProcessData($input: AiDataProcessInput!) { aiProcessData(input: $input) { success result message } }`,
        variables: { input: { type: 'workflow', workflowId, data: inputData } },
      });
      return data.aiProcessData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Workflow processing failed');
    }
  }
);

export const fetchProcessingStats = createAsyncThunk(
  'ai/fetchProcessingStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query AiQueueStatistics { aiEnhancedQueueStatistics { success result message } }`,
        fetchPolicy: 'cache-first',
      });
      return data.aiEnhancedQueueStatistics;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch processing statistics'
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { aiUi } = getState();
      const ai = aiUi || getState().ai;
      return !ai?.dataProcessor?.loading;
    },
  }
);
