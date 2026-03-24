import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import campaignApi from '../../services/campaignApi';

// Async thunks for API integration
export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await campaignApi.getCampaigns(params);
      return { campaigns: response?.result || [], pagination: response?.pagination };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch campaigns');
    }
  },
  {
    condition: (_, { getState }) => {
      return !getState().campaigns?.loading;
    },
  }
);

export const fetchCampaignById = createAsyncThunk(
  'campaigns/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await campaignApi.getCampaignById(id);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch campaign');
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await campaignApi.createCampaign(data);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create campaign');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.updateCampaign(id, data);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update campaign');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/delete',
  async (id, { rejectWithValue }) => {
    try {
      await campaignApi.deleteCampaign(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const startCampaign = createAsyncThunk(
  'campaigns/start',
  async (id, { rejectWithValue }) => {
    try {
      const response = await campaignApi.startCampaign(id);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to start campaign');
    }
  }
);

export const pauseCampaign = createAsyncThunk(
  'campaigns/pause',
  async (id, { rejectWithValue }) => {
    try {
      const response = await campaignApi.pauseCampaign(id);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to pause campaign');
    }
  }
);

export const scheduleCampaign = createAsyncThunk(
  'campaigns/schedule',
  async ({ id, schedule }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.scheduleCampaign(id, schedule);
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const optimizeCampaign = createAsyncThunk(
  'campaigns/optimize',
  async (id, { rejectWithValue }) => {
    try {
      const response = await campaignApi.optimizeCampaign(id);
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const duplicateCampaign = createAsyncThunk(
  'campaigns/duplicate',
  async ({ id, name, modifications }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.duplicateCampaign({ id, name, modifications });
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to duplicate campaign');
    }
  }
);

export const bulkUpdateCampaigns = createAsyncThunk(
  'campaigns/bulkUpdate',
  async (bulkData, { rejectWithValue }) => {
    try {
      const response = await campaignApi.bulkUpdateCampaigns(bulkData);
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchCampaignAnalytics = createAsyncThunk(
  'campaigns/fetchAnalytics',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.getCampaignAnalytics(id, params);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch analytics');
    }
  }
);

export const generateCampaignReport = createAsyncThunk(
  'campaigns/generateReport',
  async ({ id, reportData }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.generateCampaignReport(id, reportData);
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createABTest = createAsyncThunk(
  'campaigns/createABTest',
  async ({ id, abTestData }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.createABTest(id, abTestData);
      return response?.result;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create A/B test');
    }
  }
);

export const fetchABTestResults = createAsyncThunk(
  'campaigns/fetchABTestResults',
  async (id, { rejectWithValue }) => {
    try {
      const response = await campaignApi.getABTestResults(id);
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateABTestMetrics = createAsyncThunk(
  'campaigns/updateABTestMetrics',
  async ({ id, metrics }, { rejectWithValue }) => {
    try {
      const response = await campaignApi.updateABTestMetrics(id, metrics);
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  campaigns: [],
  campaign: null,
  analytics: null,
  abTestResults: null,
  pagination: null,
  loading: false,
  error: null,
};

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload?.campaigns || [];
        state.pagination = action.payload?.pagination;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCampaignById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.loading = false;
        state.campaign = action.payload;
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns.unshift(action.payload);
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = state.campaigns.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = state.campaigns.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(scheduleCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(optimizeCampaign.fulfilled, (state, action) => {
        state.campaign.optimization = action.payload.optimization;
      })
      .addCase(duplicateCampaign.fulfilled, (state, action) => {
        state.campaigns.unshift(action.payload);
      })
      .addCase(bulkUpdateCampaigns.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.map((c) =>
          action.payload.updatedIds.includes(c._id) ? { ...c, ...action.payload.data } : c
        );
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(generateCampaignReport.fulfilled, (state, action) => {
        state.campaign.report = action.payload.report;
      })
      .addCase(createABTest.fulfilled, (state, action) => {
        state.campaign.abTesting = action.payload.abTesting;
      })
      .addCase(fetchABTestResults.fulfilled, (state, action) => {
        state.abTestResults = action.payload;
      })
      .addCase(updateABTestMetrics.fulfilled, (state, action) => {
        state.campaign.abTesting = action.payload.abTesting;
      });
  },
});

export default campaignSlice.reducer;
