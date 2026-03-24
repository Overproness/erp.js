import apolloClient from '@/graphql/client';
import {
    CAMPAIGN_ANALYTICS,
    CREATE_CAMPAIGN,
    DELETE_CAMPAIGN,
    DUPLICATE_CAMPAIGN,
    GET_CAMPAIGN,
    GET_CAMPAIGNS,
    UPDATE_CAMPAIGN,
} from '@/graphql/operations/campaign';
import {
    CREATE_CUSTOMER_SEGMENT,
    GET_CUSTOMER_SEGMENTS,
} from '@/graphql/operations/marketing';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunks
export const fetchCampaigns = createAsyncThunk(
  'marketing/fetchCampaigns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CAMPAIGNS,
        variables: {
          page: params.page || 1,
          limit: params.items || 10,
          sortBy: params.sortBy || 'createdAt',
          sortValue: params.sortValue || 'desc',
        },
        fetchPolicy: 'network-only',
      });
      return data.campaignList;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch campaigns');
    }
  }
);

export const createCampaign = createAsyncThunk(
  'marketing/createCampaign',
  async (campaign, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CAMPAIGN,
        variables: { input: campaign },
      });
      return data.campaignCreate;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create campaign');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'marketing/updateCampaign',
  async ({ id, data: updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CAMPAIGN,
        variables: { id, input: updateData },
      });
      return data.campaignUpdate;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update campaign');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'marketing/deleteCampaign',
  async (id, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_CAMPAIGN,
        variables: { id },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete campaign');
    }
  }
);

export const fetchCampaignDetails = createAsyncThunk(
  'marketing/fetchCampaignDetails',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CAMPAIGN,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      return data.campaignRead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch campaign details');
    }
  }
);

export const updateCampaignStatus = createAsyncThunk(
  'marketing/updateCampaignStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CAMPAIGN,
        variables: { id, input: { status } },
      });
      return data.campaignUpdate;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update campaign status');
    }
  }
);

export const fetchSegments = createAsyncThunk(
  'marketing/fetchSegments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CUSTOMER_SEGMENTS,
        variables: {
          page: params.page || 1,
          limit: params.items || 20,
        },
        fetchPolicy: 'network-only',
      });
      return data.customerSegmentList;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch segments');
    }
  }
);

export const createSegment = createAsyncThunk(
  'marketing/createSegment',
  async (segment, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CUSTOMER_SEGMENT,
        variables: { input: segment },
      });
      return data.customerSegmentCreate;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create segment');
    }
  }
);

export const bulkUpdateCampaigns = createAsyncThunk(
  'marketing/bulkUpdateCampaigns',
  async ({ ids, data: updateData }, { rejectWithValue }) => {
    try {
      // Keep REST — no GraphQL bulk update mutation
      const { request } = await import('@/request');
      const response = await request.create({
        entity: 'marketing/campaigns/bulk',
        jsonData: { ids, data: updateData },
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update campaigns');
    }
  }
);

export const duplicateCampaign = createAsyncThunk(
  'marketing/duplicateCampaign',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DUPLICATE_CAMPAIGN,
        variables: { id },
      });
      return data.campaignDuplicate;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to duplicate campaign');
    }
  }
);

// Analytics-related action creators
export const fetchCampaignAnalytics = createAsyncThunk(
  'marketing/fetchCampaignAnalytics',
  async ({ campaignId }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: CAMPAIGN_ANALYTICS,
        variables: { id: campaignId },
        fetchPolicy: 'network-only',
      });
      return data.campaignAnalytics;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch campaign analytics');
    }
  }
);

// Initial state
const initialState = {
  campaigns: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
    filters: {},
    sorting: { field: 'createdAt', order: 'desc' },
  },
  currentCampaign: {
    data: null,
    loading: false,
    error: null,
  },
  segments: {
    data: [],
    loading: false,
    error: null,
  },
  bulkOperations: {
    loading: false,
    error: null,
    success: false,
  },
  ui: {
    selectedCampaignIds: [],
    viewMode: 'list', // 'list' or 'grid'
    showFilters: false,
    showArchived: false,
  },
  analytics: {
    data: null,
    loading: false,
    error: null,
  },
  currentCampaignDetails: null,
};

const marketingSlice = createSlice({
  name: 'marketing',
  initialState,
  reducers: {
    // UI state actions
    selectCampaigns: (state, action) => {
      state.ui.selectedCampaignIds = action.payload;
    },
    clearSelectedCampaigns: (state) => {
      state.ui.selectedCampaignIds = [];
    },
    setViewMode: (state, action) => {
      state.ui.viewMode = action.payload;
    },
    toggleFilters: (state) => {
      state.ui.showFilters = !state.ui.showFilters;
    },
    toggleShowArchived: (state) => {
      state.ui.showArchived = !state.ui.showArchived;
    },

    // Campaigns data actions
    setFilters: (state, action) => {
      state.campaigns.filters = action.payload;
      state.campaigns.pagination.page = 1; // Reset to first page on filter change
    },
    resetFilters: (state) => {
      state.campaigns.filters = {};
    },
    setSorting: (state, action) => {
      state.campaigns.sorting = action.payload;
    },
    setPagination: (state, action) => {
      state.campaigns.pagination = {
        ...state.campaigns.pagination,
        ...action.payload,
      };
    },

    // Clear states
    clearCurrentCampaign: (state) => {
      state.currentCampaign = {
        data: null,
        loading: false,
        error: null,
      };
    },
    clearCampaignsError: (state) => {
      state.campaigns.error = null;
    },
    clearSegmentsError: (state) => {
      state.segments.error = null;
    },
    clearBulkOperationsState: (state) => {
      state.bulkOperations = {
        loading: false,
        error: null,
        success: false,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch Campaigns
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.campaigns.loading = true;
        state.campaigns.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.data = action.payload?.result || [];
        if (action.payload?.pagination) {
          state.campaigns.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.error = action.payload;
      })

      // Create Campaign
      .addCase(createCampaign.pending, (state) => {
        state.currentCampaign.loading = true;
        state.currentCampaign.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.data = action.payload?.result;
        if (action.payload?.result) {
          state.campaigns.data = [action.payload.result, ...state.campaigns.data];
        }
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.error = action.payload;
      })

      // Update Campaign
      .addCase(updateCampaign.pending, (state) => {
        state.currentCampaign.loading = true;
        state.currentCampaign.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.data = action.payload?.result;

        // Update in the campaigns list
        if (action.payload?.result) {
          const index = state.campaigns.data.findIndex((c) => c._id === action.payload.result._id);
          if (index !== -1) {
            state.campaigns.data[index] = action.payload.result;
          }
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.error = action.payload;
      })

      // Delete Campaign
      .addCase(deleteCampaign.pending, (state) => {
        state.campaigns.loading = true;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.data = state.campaigns.data.filter((c) => c._id !== action.payload);

        // Remove from selected if present
        state.ui.selectedCampaignIds = state.ui.selectedCampaignIds.filter(
          (id) => id !== action.payload
        );

        // Clear current campaign if it was deleted
        if (state.currentCampaign.data && state.currentCampaign.data._id === action.payload) {
          state.currentCampaign.data = null;
        }
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.error = action.payload;
      })

      // Fetch Campaign Details
      .addCase(fetchCampaignDetails.pending, (state) => {
        state.currentCampaign.loading = true;
        state.currentCampaign.error = null;
      })
      .addCase(fetchCampaignDetails.fulfilled, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.data = action.payload?.result;
        state.currentCampaignDetails = action.payload?.result; // Store in both places for compatibility
      })
      .addCase(fetchCampaignDetails.rejected, (state, action) => {
        state.currentCampaign.loading = false;
        state.currentCampaign.error = action.payload;
      })

      // Update Campaign Status
      .addCase(updateCampaignStatus.fulfilled, (state, action) => {
        const updated = action.payload?.result;
        if (updated) {
          // Update in the campaigns list
          const index = state.campaigns.data.findIndex((c) => c._id === updated._id);
          if (index !== -1) {
            state.campaigns.data[index].status = updated.status;
          }

          // Update current campaign if it's the one being updated
          if (state.currentCampaign.data && state.currentCampaign.data._id === updated._id) {
            state.currentCampaign.data.status = updated.status;
          }
        }
      })

      // Fetch Segments
      .addCase(fetchSegments.pending, (state) => {
        state.segments.loading = true;
        state.segments.error = null;
      })
      .addCase(fetchSegments.fulfilled, (state, action) => {
        state.segments.loading = false;
        state.segments.data = action.payload.result || [];
        if (action.payload.pagination) {
          state.segments.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchSegments.rejected, (state, action) => {
        state.segments.loading = false;
        state.segments.error = action.payload;
      })

      // Create Segment
      .addCase(createSegment.fulfilled, (state, action) => {
        state.segments.data.unshift(action.payload.result);
      })

      // Bulk Update Campaigns
      .addCase(bulkUpdateCampaigns.pending, (state) => {
        state.bulkOperations.loading = true;
        state.bulkOperations.error = null;
        state.bulkOperations.success = false;
      })
      .addCase(bulkUpdateCampaigns.fulfilled, (state, action) => {
        state.bulkOperations.loading = false;
        state.bulkOperations.success = true;

        // Update campaigns in the list
        action.payload.forEach((updatedCampaign) => {
          const index = state.campaigns.data.findIndex((c) => c._id === updatedCampaign._id);
          if (index !== -1) {
            state.campaigns.data[index] = {
              ...state.campaigns.data[index],
              ...updatedCampaign,
            };
          }
        });
      })
      .addCase(bulkUpdateCampaigns.rejected, (state, action) => {
        state.bulkOperations.loading = false;
        state.bulkOperations.error = action.payload;
      })

      // Duplicate Campaign
      .addCase(duplicateCampaign.fulfilled, (state, action) => {
        if (action.payload?.result) {
          state.campaigns.data.unshift(action.payload.result);
        }
      })

      // Handle analytics actions
      .addCase(fetchCampaignAnalytics.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.data = action.payload;
      })
      .addCase(fetchCampaignAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload || 'Failed to fetch analytics';
      });
  },
});

export const {
  selectCampaigns,
  clearSelectedCampaigns,
  setViewMode,
  toggleFilters,
  toggleShowArchived,
  setFilters,
  resetFilters,
  setSorting,
  setPagination,
  clearCurrentCampaign,
  clearCampaignsError,
  clearSegmentsError,
  clearBulkOperationsState,
} = marketingSlice.actions;

export default marketingSlice.reducer;
