import apolloClient from '@/graphql/client';
import { getDeleteMutation, getListQuery, getUpdateMutation } from '@/graphql/operations/crudFactory';
import { request } from '@/request';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// Behavior events/triggers use REST entities without direct GraphQL resolver matches
// Keep REST for all behavior operations

// Async thunks
export const fetchBehaviorEvents = createAsyncThunk(
  'behavior/fetchBehaviorEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await request.list({ entity: 'marketing/behavior/events', options: params });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch behavior events');
    }
  }
);

export const logBehaviorEvent = createAsyncThunk(
  'behavior/logBehaviorEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'marketing/behavior/events',
        jsonData: eventData
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to log behavior event');
    }
  }
);

export const fetchBehaviorHistory = createAsyncThunk(
  'behavior/fetchBehaviorHistory',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await request.list({
        entity: `marketing/behavior/users/${userId}/history`,
        options: params
      });
      return { userId, history: response.result };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch behavior history');
    }
  }
);

export const createTrigger = createAsyncThunk(
  'behavior/createTrigger',
  async (trigger, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'marketing/behavior/triggers',
        jsonData: trigger
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create trigger');
    }
  }
);

export const updateTrigger = createAsyncThunk(
  'behavior/updateTrigger',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'marketing/behavior/triggers',
        id,
        jsonData: data
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update trigger');
    }
  }
);

export const fetchTriggers = createAsyncThunk(
  'behavior/fetchTriggers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('triggerRule'),
        variables: {
          page: params.page || 1,
          limit: params.items || 50,
        },
        fetchPolicy: 'network-only',
      });
      if (data.triggerRuleList?.success) {
        return data.triggerRuleList.result;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch triggers');
    }
  }
);

export const deleteTrigger = createAsyncThunk(
  'behavior/deleteTrigger',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getDeleteMutation('triggerRule'),
        variables: { id },
      });
      if (data.triggerRuleDelete?.success) {
        return id;
      }
      return rejectWithValue('Failed to delete trigger');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete trigger');
    }
  }
);

export const toggleTriggerStatus = createAsyncThunk(
  'behavior/toggleTriggerStatus',
  async ({ id, active }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getUpdateMutation('triggerRule'),
        variables: { id, input: { active } },
      });
      if (data.triggerRuleUpdate?.success) {
        return data.triggerRuleUpdate.result;
      }
      return rejectWithValue('Failed to toggle trigger status');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to toggle trigger status');
    }
  }
);

export const evaluateTriggers = createAsyncThunk(
  'behavior/evaluateTriggers',
  async ({ userId, eventType, eventData }, { rejectWithValue }) => {
    try {
      const response = await request.create({
        entity: 'marketing/behavior/evaluate',
        jsonData: { userId, eventType, eventData }
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to evaluate triggers');
    }
  }
);

// Initial state
const initialState = {
  events: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0
    }
  },
  userHistory: {
    data: {},  // Keyed by userId
    loading: false,
    error: null
  },
  triggers: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  },
  currentTrigger: {
    data: null,
    loading: false,
    error: null
  },
  evaluation: {
    result: null,
    loading: false,
    error: null
  },
  eventTypes: [
    'page_view', 
    'button_click', 
    'form_submission', 
    'video_watched',
    'file_download',
    'checkout_started',
    'checkout_completed',
    'product_view',
    'cart_add',
    'cart_remove',
    'search',
    'subscription',
    'custom'
  ]
};

const behaviorSlice = createSlice({
  name: 'behavior',
  initialState,
  reducers: {
    // Event tracking related actions
    clearEventsHistory: (state) => {
      state.events.data = [];
    },
    clearUserHistory: (state, action) => {
      if (action.payload) {
        // Clear specific user
        delete state.userHistory.data[action.payload];
      } else {
        // Clear all users
        state.userHistory.data = {};
      }
    },
    
    // Trigger related actions
    setCurrentTrigger: (state, action) => {
      state.currentTrigger.data = action.payload;
    },
    clearCurrentTrigger: (state) => {
      state.currentTrigger.data = null;
      state.currentTrigger.error = null;
    },
    
    // Evaluation related actions
    clearEvaluationResults: (state) => {
      state.evaluation.result = null;
      state.evaluation.error = null;
    },
    
    // Error clearing
    clearEventsError: (state) => {
      state.events.error = null;
    },
    clearUserHistoryError: (state) => {
      state.userHistory.error = null;
    },
    clearTriggersError: (state) => {
      state.triggers.error = null;
    },
    clearCurrentTriggerError: (state) => {
      state.currentTrigger.error = null;
    },
    clearEvaluationError: (state) => {
      state.evaluation.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Behavior Events
    builder
      .addCase(fetchBehaviorEvents.pending, (state) => {
        state.events.loading = true;
        state.events.error = null;
      })
      .addCase(fetchBehaviorEvents.fulfilled, (state, action) => {
        state.events.loading = false;
        state.events.data = action.payload.items || [];
        if (action.payload.pagination) {
          state.events.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchBehaviorEvents.rejected, (state, action) => {
        state.events.loading = false;
        state.events.error = action.payload;
      })
      
    // Log Behavior Event
      .addCase(logBehaviorEvent.fulfilled, (state, action) => {
        // Add to beginning of events list if we're tracking them
        if (state.events.data.length > 0) {
          state.events.data.unshift(action.payload);
        }
        
        // Update user history if we have it for this user
        const userId = action.payload.userId;
        if (state.userHistory.data[userId]) {
          state.userHistory.data[userId].unshift(action.payload);
        }
      })
      
    // Fetch Behavior History
      .addCase(fetchBehaviorHistory.pending, (state) => {
        state.userHistory.loading = true;
        state.userHistory.error = null;
      })
      .addCase(fetchBehaviorHistory.fulfilled, (state, action) => {
        state.userHistory.loading = false;
        state.userHistory.data[action.payload.userId] = action.payload.history.items || [];
      })
      .addCase(fetchBehaviorHistory.rejected, (state, action) => {
        state.userHistory.loading = false;
        state.userHistory.error = action.payload;
      })
      
    // Create Trigger
      .addCase(createTrigger.pending, (state) => {
        state.currentTrigger.loading = true;
        state.currentTrigger.error = null;
      })
      .addCase(createTrigger.fulfilled, (state, action) => {
        state.currentTrigger.loading = false;
        state.currentTrigger.data = action.payload;
        state.triggers.data.unshift(action.payload);
      })
      .addCase(createTrigger.rejected, (state, action) => {
        state.currentTrigger.loading = false;
        state.currentTrigger.error = action.payload;
      })
      
    // Update Trigger
      .addCase(updateTrigger.pending, (state) => {
        state.currentTrigger.loading = true;
        state.currentTrigger.error = null;
      })
      .addCase(updateTrigger.fulfilled, (state, action) => {
        state.currentTrigger.loading = false;
        state.currentTrigger.data = action.payload;
        
        // Update in the triggers list
        const index = state.triggers.data.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.triggers.data[index] = action.payload;
        }
      })
      .addCase(updateTrigger.rejected, (state, action) => {
        state.currentTrigger.loading = false;
        state.currentTrigger.error = action.payload;
      })
      
    // Fetch Triggers
      .addCase(fetchTriggers.pending, (state) => {
        state.triggers.loading = true;
        state.triggers.error = null;
      })
      .addCase(fetchTriggers.fulfilled, (state, action) => {
        state.triggers.loading = false;
        state.triggers.data = action.payload.items || [];
        if (action.payload.pagination) {
          state.triggers.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchTriggers.rejected, (state, action) => {
        state.triggers.loading = false;
        state.triggers.error = action.payload;
      })
      
    // Delete Trigger
      .addCase(deleteTrigger.fulfilled, (state, action) => {
        state.triggers.data = state.triggers.data.filter(t => t._id !== action.payload);
        if (state.currentTrigger.data && state.currentTrigger.data._id === action.payload) {
          state.currentTrigger.data = null;
        }
      })
      
    // Toggle Trigger Status
      .addCase(toggleTriggerStatus.fulfilled, (state, action) => {
        // Update in triggers list
        const index = state.triggers.data.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.triggers.data[index].active = action.payload.active;
        }
        
        // Update current trigger if it's the same one
        if (state.currentTrigger.data && state.currentTrigger.data._id === action.payload._id) {
          state.currentTrigger.data.active = action.payload.active;
        }
      })
      
    // Evaluate Triggers
      .addCase(evaluateTriggers.pending, (state) => {
        state.evaluation.loading = true;
        state.evaluation.error = null;
      })
      .addCase(evaluateTriggers.fulfilled, (state, action) => {
        state.evaluation.loading = false;
        state.evaluation.result = action.payload;
      })
      .addCase(evaluateTriggers.rejected, (state, action) => {
        state.evaluation.loading = false;
        state.evaluation.error = action.payload;
      });
  }
});

export const {
  clearEventsHistory,
  clearUserHistory,
  setCurrentTrigger,
  clearCurrentTrigger,
  clearEvaluationResults,
  clearEventsError,
  clearUserHistoryError,
  clearTriggersError,
  clearCurrentTriggerError,
  clearEvaluationError
} = behaviorSlice.actions;

export default behaviorSlice.reducer;
