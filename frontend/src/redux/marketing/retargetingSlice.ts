import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apolloClient from '@/graphql/client';
import {
  GET_RETARGETING_CAMPAIGNS,
  CREATE_RETARGETING_CAMPAIGN,
  UPDATE_RETARGETING_CAMPAIGN,
  DELETE_RETARGETING_CAMPAIGN,
  LAUNCH_RETARGETING_CAMPAIGN,
  PAUSE_RETARGETING_CAMPAIGN,
  RETARGETING_ANALYTICS,
} from '@/graphql/operations/reputation';
import {
  getListQuery,
  getCreateMutation,
  getUpdateMutation,
  getDeleteMutation,
} from '@/graphql/operations/crudFactory';

// Async thunks
export const fetchRetargetingLists = createAsyncThunk(
  'retargeting/fetchRetargetingLists',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_RETARGETING_CAMPAIGNS,
        variables: {
          page: params.page || 1,
          limit: params.items || 10,
          sortBy: params.sortBy || 'createdAt',
          sortValue: params.sortValue || 'desc',
        },
        fetchPolicy: 'cache-first',
      });
      return data.retargetingList?.result || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch retargeting lists');
    }
  },
  {
    condition: (_, { getState }) => {
      return !getState().retargeting?.lists?.loading;
    },
  }
);

export const createRetargetingList = createAsyncThunk(
  'retargeting/createRetargetingList',
  async (list, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_RETARGETING_CAMPAIGN,
        variables: { input: list },
      });
      return data.retargetingCreate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create retargeting list');
    }
  }
);

export const updateRetargetingList = createAsyncThunk(
  'retargeting/updateRetargetingList',
  async ({ id, data: updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_RETARGETING_CAMPAIGN,
        variables: { id, input: updateData },
      });
      return data.retargetingUpdate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update retargeting list');
    }
  }
);

export const deleteRetargetingList = createAsyncThunk(
  'retargeting/deleteRetargetingList',
  async (id, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_RETARGETING_CAMPAIGN,
        variables: { id },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete retargeting list');
    }
  }
);

export const fetchRetargetingCampaigns = createAsyncThunk(
  'retargeting/fetchRetargetingCampaigns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_RETARGETING_CAMPAIGNS,
        variables: {
          page: params.page || 1,
          limit: params.items || 10,
          sortBy: params.sortBy || 'createdAt',
          sortValue: params.sortValue || 'desc',
        },
        fetchPolicy: 'cache-first',
      });
      return data.retargetingList?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch retargeting campaigns');
    }
  },
  {
    condition: (_, { getState }) => {
      return !getState().retargeting?.campaigns?.loading;
    },
  }
);

export const createRetargetingCampaign = createAsyncThunk(
  'retargeting/createRetargetingCampaign',
  async (campaign, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_RETARGETING_CAMPAIGN,
        variables: { input: campaign },
      });
      return data.retargetingCreate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create retargeting campaign');
    }
  }
);

export const updateRetargetingCampaign = createAsyncThunk(
  'retargeting/updateRetargetingCampaign',
  async ({ id, data: updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_RETARGETING_CAMPAIGN,
        variables: { id, input: updateData },
      });
      return data.retargetingUpdate?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update retargeting campaign');
    }
  }
);

export const deleteRetargetingCampaign = createAsyncThunk(
  'retargeting/deleteRetargetingCampaign',
  async (id, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_RETARGETING_CAMPAIGN,
        variables: { id },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete retargeting campaign');
    }
  }
);

export const launchRetargetingCampaign = createAsyncThunk(
  'retargeting/launchRetargetingCampaign',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: LAUNCH_RETARGETING_CAMPAIGN,
        variables: { id },
      });
      return data.retargetingLaunch?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to launch retargeting campaign');
    }
  }
);

export const pauseRetargetingCampaign = createAsyncThunk(
  'retargeting/pauseRetargetingCampaign',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: PAUSE_RETARGETING_CAMPAIGN,
        variables: { id },
      });
      return data.retargetingPause?.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to pause retargeting campaign');
    }
  }
);

export const fetchRetargetingStatistics = createAsyncThunk(
  'retargeting/fetchRetargetingStatistics',
  async ({ id, params = {} }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: RETARGETING_ANALYTICS,
        variables: { id },
        fetchPolicy: 'cache-first',
      });
      return { id, statistics: data.retargetingAnalytics?.result };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch retargeting statistics');
    }
  }
);

export const syncPlatformAudiences = createAsyncThunk(
  'retargeting/syncPlatformAudiences',
  async (platform, { rejectWithValue }) => {
    try {
      // Keep REST — no GraphQL sync mutation for platforms
      const { request } = await import('@/request');
      const response = await request.create({
        entity: `marketing/retargeting/platforms/${platform}/sync`,
        jsonData: {}
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to sync platform audiences');
    }
  }
);

// Initial state
const initialState = {
  lists: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  },
  currentList: {
    data: null,
    loading: false,
    error: null
  },
  campaigns: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  },
  currentCampaign: {
    data: null,
    loading: false,
    error: null
  },
  statistics: {
    data: {},  // Keyed by campaign ID
    loading: false,
    error: null
  },
  platforms: {
    syncing: false,
    error: null,
    lastSyncTime: null,
    connections: {
      facebook: { connected: false, name: 'Facebook' },
      google: { connected: false, name: 'Google Ads' },
      linkedin: { connected: false, name: 'LinkedIn' },
      twitter: { connected: false, name: 'Twitter' }
    }
  }
};

const retargetingSlice = createSlice({
  name: 'retargeting',
  initialState,
  reducers: {
    // Lists related actions
    setCurrentList: (state, action) => {
      state.currentList.data = action.payload;
    },
    clearCurrentList: (state) => {
      state.currentList.data = null;
      state.currentList.error = null;
    },
    
    // Campaigns related actions
    setCurrentCampaign: (state, action) => {
      state.currentCampaign.data = action.payload;
    },
    clearCurrentCampaign: (state) => {
      state.currentCampaign.data = null;
      state.currentCampaign.error = null;
    },
    
    // Statistics related actions
    clearAllStatistics: (state) => {
      state.statistics.data = {};
    },
    clearCampaignStatistics: (state, action) => {
      const campaignId = action.payload;
      if (campaignId && state.statistics.data[campaignId]) {
        delete state.statistics.data[campaignId];
      }
    },
    
    // Platform related actions
    setPlatformConnection: (state, action) => {
      const { platform, connected, data = {} } = action.payload;
      if (state.platforms.connections[platform]) {
        state.platforms.connections[platform] = {
          ...state.platforms.connections[platform],
          connected,
          ...data
        };
      }
    },
    
    // Error clearing actions
    clearListsError: (state) => {
      state.lists.error = null;
    },
    clearCurrentListError: (state) => {
      state.currentList.error = null;
    },
    clearCampaignsError: (state) => {
      state.campaigns.error = null;
    },
    clearCurrentCampaignError: (state) => {
      state.currentCampaign.error = null;
    },
    clearStatisticsError: (state) => {
      state.statistics.error = null;
    },
    clearPlatformsError: (state) => {
      state.platforms.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Retargeting Lists
    builder
      .addCase(fetchRetargetingLists.pending, (state) => {
        state.lists.loading = true;
        state.lists.error = null;
      })
      .addCase(fetchRetargetingLists.fulfilled, (state, action) => {
        state.lists.loading = false;
        state.lists.data = action.payload.items || [];
        if (action.payload.pagination) {
          state.lists.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchRetargetingLists.rejected, (state, action) => {
        state.lists.loading = false;
        state.lists.error = action.payload;
      })
      
    // Create Retargeting List
      .addCase(createRetargetingList.pending, (state) => {
        state.currentList.loading = true;
        state.currentList.error = null;
      })
      .addCase(createRetargetingList.fulfilled, (state, action) => {
        state.currentList.loading = false;
        state.currentList.data = action.payload;
        state.lists.data.unshift(action.payload);
      })
      .addCase(createRetargetingList.rejected, (state, action) => {
        state.currentList.loading = false;
        state.currentList.error = action.payload;
      })
      
    // Update Retargeting List
      .addCase(updateRetargetingList.pending, (state) => {
        state.currentList.loading = true;
        state.currentList.error = null;
      })
      .addCase(updateRetargetingList.fulfilled, (state, action) => {
        state.currentList.loading = false;
        state.currentList.data = action.payload;
        
        // Update in lists array
        const index = state.lists.data.findIndex(list => list._id === action.payload._id);
        if (index !== -1) {
          state.lists.data[index] = action.payload;
        }
      })
      .addCase(updateRetargetingList.rejected, (state, action) => {
        state.currentList.loading = false;
        state.currentList.error = action.payload;
      })
      
    // Delete Retargeting List
      .addCase(deleteRetargetingList.fulfilled, (state, action) => {
        state.lists.data = state.lists.data.filter(list => list._id !== action.payload);
        if (state.currentList.data && state.currentList.data._id === action.payload) {
          state.currentList.data = null;
        }
      })
      
    // Fetch Retargeting Campaigns
      .addCase(fetchRetargetingCampaigns.pending, (state) => {
        state.campaigns.loading = true;
        state.campaigns.error = null;
      })
      .addCase(fetchRetargetingCampaigns.fulfilled, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.data = action.payload.items || [];
        if (action.payload.pagination) {
          state.campaigns.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchRetargetingCampaigns.rejected, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.error = action.payload;
      })
      
    // Create Retargeting Campaign
      .addCase(createRetargetingCampaign.pending, (state) => {
        state.currentCampaign.loading = true;
        state.currentCampaign.error = null;
      })
      .addCase(createRetargetingCampaign.fulfilled, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.data = action.payload;
        state.campaigns.data.unshift(action.payload);
      })
      .addCase(createRetargetingCampaign.rejected, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.error = action.payload;
      })
      
    // Update Retargeting Campaign
      .addCase(updateRetargetingCampaign.pending, (state) => {
        state.currentCampaign.loading = true;
        state.currentCampaign.error = null;
      })
      .addCase(updateRetargetingCampaign.fulfilled, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.data = action.payload;
        
        // Update in campaigns array
        const index = state.campaigns.data.findIndex(campaign => campaign._id === action.payload._id);
        if (index !== -1) {
          state.campaigns.data[index] = action.payload;
        }
      })
      .addCase(updateRetargetingCampaign.rejected, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.error = action.payload;
      })
      
    // Delete Retargeting Campaign
      .addCase(deleteRetargetingCampaign.fulfilled, (state, action) => {
        state.campaigns.data = state.campaigns.data.filter(campaign => campaign._id !== action.payload);
        if (state.currentCampaign.data && state.currentCampaign.data._id === action.payload) {
          state.currentCampaign.data = null;
        }
        
        // Remove statistics if they exist
        if (state.statistics.data[action.payload]) {
          delete state.statistics.data[action.payload];
        }
      })
      
    // Launch Retargeting Campaign
      .addCase(launchRetargetingCampaign.fulfilled, (state, action) => {
        // Update status in campaigns array
        const index = state.campaigns.data.findIndex(campaign => campaign._id === action.payload._id);
        if (index !== -1) {
          state.campaigns.data[index].status = action.payload.status;
          state.campaigns.data[index].startDate = action.payload.startDate;
        }
        
        // Update current campaign if it's the same one
        if (state.currentCampaign.data && state.currentCampaign.data._id === action.payload._id) {
          state.currentCampaign.data.status = action.payload.status;
          state.currentCampaign.data.startDate = action.payload.startDate;
        }
      })
      
    // Pause Retargeting Campaign
      .addCase(pauseRetargetingCampaign.fulfilled, (state, action) => {
        // Update status in campaigns array
        const index = state.campaigns.data.findIndex(campaign => campaign._id === action.payload._id);
        if (index !== -1) {
          state.campaigns.data[index].status = action.payload.status;
          state.campaigns.data[index].pausedDate = action.payload.pausedDate;
        }
        
        // Update current campaign if it's the same one
        if (state.currentCampaign.data && state.currentCampaign.data._id === action.payload._id) {
          state.currentCampaign.data.status = action.payload.status;
          state.currentCampaign.data.pausedDate = action.payload.pausedDate;
        }
      })
      
    // Fetch Retargeting Statistics
      .addCase(fetchRetargetingStatistics.pending, (state) => {
        state.statistics.loading = true;
        state.statistics.error = null;
      })
      .addCase(fetchRetargetingStatistics.fulfilled, (state, action) => {
        state.statistics.loading = false;
        state.statistics.data[action.payload.id] = action.payload.statistics;
      })
      .addCase(fetchRetargetingStatistics.rejected, (state, action) => {
        state.statistics.loading = false;
        state.statistics.error = action.payload;
      })
      
    // Sync Platform Audiences
      .addCase(syncPlatformAudiences.pending, (state) => {
        state.platforms.syncing = true;
        state.platforms.error = null;
      })
      .addCase(syncPlatformAudiences.fulfilled, (state, action) => {
        state.platforms.syncing = false;
        state.platforms.lastSyncTime = new Date().toISOString();
        
        // Update platform connections if returned in response
        if (action.payload.platforms) {
          Object.entries(action.payload.platforms).forEach(([platform, data]) => {
            if (state.platforms.connections[platform]) {
              state.platforms.connections[platform] = {
                ...state.platforms.connections[platform],
                ...data
              };
            }
          });
        }
      })
      .addCase(syncPlatformAudiences.rejected, (state, action) => {
        state.platforms.syncing = false;
        state.platforms.error = action.payload;
      });
  }
});

export const {
  setCurrentList,
  clearCurrentList,
  setCurrentCampaign,
  clearCurrentCampaign,
  clearAllStatistics,
  clearCampaignStatistics,
  setPlatformConnection,
  clearListsError,
  clearCurrentListError,
  clearCampaignsError,
  clearCurrentCampaignError,
  clearStatisticsError,
  clearPlatformsError
} = retargetingSlice.actions;

export default retargetingSlice.reducer;
