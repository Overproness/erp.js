import { request } from '@/request';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { addMessage, setTyping } from './aiSlice';

// Assistant Management
export const fetchAssistants = createAsyncThunk(
  'ai/fetchAssistants',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await request.list({
        entity: 'aiAssistant',
        options: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...params,
        },
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistants');
    }
  }
);

export const createAssistant = createAsyncThunk(
  'ai/createAssistant',
  async (assistantData, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'aiAssistant',
        jsonData: assistantData,
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create assistant');
    }
  }
);

export const updateAssistant = createAsyncThunk(
  'ai/updateAssistant',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'aiAssistant',
        id,
        jsonData: data,
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update assistant');
    }
  }
);

export const deleteAssistant = createAsyncThunk(
  'ai/deleteAssistant',
  async (id, { rejectWithValue }) => {
    try {
      await request.delete({
        entity: 'aiAssistant',
        id,
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
      const response = await request.read({
        entity: 'aiAssistant',
        id,
      });
      return response.result;
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
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(userMessage));

      // Set typing indicator
      dispatch(setTyping(true));

      // Get auth token
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      // Send message to backend
      const response = await fetch(`/api/aiAssistant/${assistantId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Chat request failed');
      }

      const data = await response.json();
      return data.result;
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
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      const response = await fetch(`/api/aiAssistant/${assistantId}/conversations`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch conversations');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'ai/fetchConversation',
  async ({ assistantId, conversationId }, { rejectWithValue }) => {
    try {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      const response = await fetch(
        `/api/aiAssistant/${assistantId}/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch conversation');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversation');
    }
  }
);

export const createConversation = createAsyncThunk(
  'ai/createConversation',
  async ({ assistantId, title, context = {} }, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'aiConversation',
        jsonData: {
          aiAssistant: assistantId,
          title,
          context,
          status: 'active',
        },
      });
      return response.result;
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
      const response = await request.summary({
        entity: 'aianalytics',
        options: params,
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchUsageMetrics = createAsyncThunk(
  'ai/fetchUsageMetrics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      const response = await fetch('/api/aiAssistant/analytics/usage', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage metrics');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch usage metrics');
    }
  }
);

// Suggestions & Analysis
export const fetchSuggestions = createAsyncThunk(
  'ai/fetchSuggestions',
  async ({ module, data, assistantId }, { rejectWithValue }) => {
    try {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      const response = await fetch(`/api/aiAssistant/${assistantId}/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch suggestions');
    }
  }
);

export const analyzeData = createAsyncThunk(
  'ai/analyzeData',
  async ({ assistantId, module, data }, { rejectWithValue }) => {
    try {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      const response = await fetch(`/api/aiAssistant/${assistantId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze data');
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to analyze data');
    }
  }
);

export const generatePredictions = createAsyncThunk(
  'ai/generatePredictions',
  async ({ assistantId, module, data, timeframe }, { rejectWithValue }) => {
    try {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.current?.token || '';

      const response = await fetch(`/api/aiAssistant/${assistantId}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module, data, timeframe }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate predictions');
      }

      const result = await response.json();
      return result.result;
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
      const response = await request.list({
        entity: 'aiKnowledgeBase',
        options: params,
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch knowledge base');
    }
  }
);

export const createKnowledgeItem = createAsyncThunk(
  'ai/createKnowledgeItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'aiKnowledgeBase',
        jsonData: itemData,
      });
      return response.result;
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
      const response = await request.list({
        entity: 'aiUserPreference',
        options: { limit: 1 },
      });
      return response.result?.[0] || {};
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user preferences');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'ai/updateUserPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'aiUserPreference',
        jsonData: preferences,
      });
      return response.result;
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', options.language || 'en');
      formData.append('mode', options.mode || 'automatic');

      const response = await request.post({
        entity: 'ai/ocr/process',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      const response = await request.post({
        entity: 'ai/data/extract',
        data: {
          text,
          template,
          fields,
        },
      });

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Data extraction failed');
    }
  }
);

export const createExtractionTemplate = createAsyncThunk(
  'ai/createExtractionTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'ai/templates',
        data: templateData,
      });

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Template creation failed');
    }
  }
);

export const fetchExtractionTemplates = createAsyncThunk(
  'ai/fetchExtractionTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await request.list({
        entity: 'ai/templates',
      });

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  }
);

export const processWorkflow = createAsyncThunk(
  'ai/processWorkflow',
  async ({ workflowId, data }, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'ai/workflows/process',
        data: {
          workflowId,
          data,
        },
      });

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Workflow processing failed');
    }
  }
);

export const fetchProcessingStats = createAsyncThunk(
  'ai/fetchProcessingStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await request.get({
        entity: 'ai/processing/stats',
      });

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch processing statistics'
      );
    }
  }
);
