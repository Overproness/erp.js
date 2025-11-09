import request from '@/request/request';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Review actions
export const fetchReviews = createAsyncThunk(
  'reputation/fetchReviews',
  async (params, { rejectWithValue }) => {
    try {
      const response = await request.list({ entity: 'reputation/reviews', options: params });
      return response.result?.reviews || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch reviews');
    }
  }
);

export const submitReview = createAsyncThunk(
  'reputation/submitReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'reputation/reviews/submit',
        jsonData: reviewData,
      });
      return response.result?.review;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to submit review');
    }
  }
);

export const updateReview = createAsyncThunk(
  'reputation/updateReview',
  async ({ reviewId, updateData }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'reputation/reviews',
        id: reviewId,
        jsonData: updateData,
      });
      return response.result?.review;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update review');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reputation/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await request.delete({ entity: 'reputation/reviews', id: reviewId });
      return reviewId;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to delete review');
    }
  }
);

export const bulkUpdateReviews = createAsyncThunk(
  'reputation/bulkUpdateReviews',
  async ({ reviewIds, action, data }, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'reputation/reviews/bulk',
        jsonData: { reviewIds, operation: action, data },
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to bulk update reviews');
    }
  }
);

// Review link actions
export const createReviewLink = createAsyncThunk(
  'reputation/createReviewLink',
  async (linkData, { rejectWithValue }) => {
    try {
      const response = await request.post({ entity: 'reputation/links', jsonData: linkData });
      return response.result?.link;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to create review link');
    }
  }
);

export const fetchReviewLinks = createAsyncThunk(
  'reputation/fetchReviewLinks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await request.list({ entity: 'reputation/links', options: params });
      return response.result?.links || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch review links');
    }
  }
);

export const updateReviewLink = createAsyncThunk(
  'reputation/updateReviewLink',
  async ({ linkId, updateData }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'reputation/links',
        id: linkId,
        jsonData: updateData,
      });
      return response.result?.link;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update review link');
    }
  }
);

export const deleteReviewLink = createAsyncThunk(
  'reputation/deleteReviewLink',
  async (linkId, { rejectWithValue }) => {
    try {
      await request.delete({ entity: 'reputation/links', id: linkId });
      return linkId;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to delete review link');
    }
  }
);

export const getReviewLinkAnalytics = createAsyncThunk(
  'reputation/getReviewLinkAnalytics',
  async (linkId, { rejectWithValue }) => {
    try {
      const response = await request.get({ entity: `reputation/links/analytics/${linkId}` });
      return response.result?.analytics;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch link analytics');
    }
  }
);

// Response actions
export const createResponse = createAsyncThunk(
  'reputation/createResponse',
  async (responseData, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'reputation/responses',
        jsonData: responseData,
      });
      return response.result?.response;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to create response');
    }
  }
);

export const updateResponse = createAsyncThunk(
  'reputation/updateResponse',
  async ({ responseId, updateData }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'reputation/responses',
        id: responseId,
        jsonData: updateData,
      });
      return response.result?.response;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update response');
    }
  }
);

export const deleteResponse = createAsyncThunk(
  'reputation/deleteResponse',
  async (responseId, { rejectWithValue }) => {
    try {
      await request.delete({ entity: 'reputation/responses', id: responseId });
      return responseId;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to delete response');
    }
  }
);

export const fetchResponseTemplates = createAsyncThunk(
  'reputation/fetchResponseTemplates',
  async (params, { rejectWithValue }) => {
    try {
      const response = await request.list({ entity: 'reputation/templates', options: params });
      return response.result?.templates || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch response templates');
    }
  }
);

export const createResponseTemplate = createAsyncThunk(
  'reputation/createResponseTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'reputation/templates',
        jsonData: templateData,
      });
      return response.result?.template;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to create response template');
    }
  }
);

export const updateResponseTemplate = createAsyncThunk(
  'reputation/updateResponseTemplate',
  async ({ templateId, updateData }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'reputation/templates',
        id: templateId,
        jsonData: updateData,
      });
      return response.result?.template;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update response template');
    }
  }
);

export const deleteResponseTemplate = createAsyncThunk(
  'reputation/deleteResponseTemplate',
  async (templateId, { rejectWithValue }) => {
    try {
      await request.delete({ entity: 'reputation/templates', id: templateId });
      return templateId;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to delete response template');
    }
  }
);

// Analytics actions
export const fetchAnalytics = createAsyncThunk(
  'reputation/fetchAnalytics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await request.get({ entity: 'reputation/analytics/overview' });
      return response.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchSentimentAnalysis = createAsyncThunk(
  'reputation/fetchSentimentAnalysis',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await request.get({ entity: 'reputation/analytics/sentiment' });
      return response.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch sentiment analysis');
    }
  }
);

export const fetchReviewTrends = createAsyncThunk(
  'reputation/fetchReviewTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await request.get({ entity: 'reputation/analytics/trends' });
      return response.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch review trends');
    }
  }
);

// Export reviews
export const exportReviews = createAsyncThunk(
  'reputation/exportReviews',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Implement export functionality
      return { success: true, url: 'example-download-url.csv' };
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to export reviews');
    }
  }
);

// Export analytics data in various formats
export const exportAnalytics = createAsyncThunk(
  'reputation/exportAnalytics',
  async ({ format = 'csv', timeframe = '30_days', filters = {} }, { rejectWithValue }) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        format,
        timeframe,
        ...filters,
      }).toString();

      const response = await axios.get(`reputation/analytics/export?${queryParams}`, {
        responseType: 'blob', // Important for file downloads
      });

      // Generate filename based on format and current date
      const date = new Date().toISOString().split('T')[0];
      let filename = `review_analytics_${date}.${format}`;

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, format };
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to export analytics data');
    }
  }
);

// Platform integration actions
export const fetchPlatforms = createAsyncThunk(
  'reputation/fetchPlatforms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await request.get({ entity: 'reputation/platforms/connections' });
      return response.result?.connections || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch platforms');
    }
  }
);

export const connectPlatform = createAsyncThunk(
  'reputation/connectPlatform',
  async ({ platformId, credentials }, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: 'reputation/platforms/connections',
        jsonData: { platformId, credentials },
      });
      return response.result?.connection;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to connect platform');
    }
  }
);

export const disconnectPlatform = createAsyncThunk(
  'reputation/disconnectPlatform',
  async (platformId, { rejectWithValue }) => {
    try {
      await request.delete({ entity: 'reputation/platforms/connections', id: platformId });
      return platformId;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to disconnect platform');
    }
  }
);

export const updatePlatformIntegration = createAsyncThunk(
  'reputation/updatePlatformIntegration',
  async ({ platformId, config }, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: 'reputation/platforms/connections',
        id: platformId,
        jsonData: config,
      });
      return response.result?.connection;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update platform integration');
    }
  }
);

export const syncPlatforms = createAsyncThunk(
  'reputation/syncPlatforms',
  async (platformIds, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: '/api/reputation/platforms/sync/all',
        jsonData: { platformIds },
      });
      return response.result?.syncResults;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to sync platforms');
    }
  }
);

export const testPlatformConnection = createAsyncThunk(
  'reputation/testPlatformConnection',
  async ({ platformId, credentials }, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: `/api/reputation/platforms/connections/${platformId}/test`,
        jsonData: { credentials },
      });
      return response.result?.testResult;
    } catch (error) {
      return rejectWithValue(error?.message || 'Platform connection test failed');
    }
  }
);

// Auto response actions
export const updateAutoResponseSettings = createAsyncThunk(
  'reputation/updateAutoResponseSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await request.update({
        entity: '/api/reputation/auto-response',
        id: '',
        jsonData: settings,
      });
      return response.result?.settings;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update auto response settings');
    }
  }
);

export const triggerAutoResponse = createAsyncThunk(
  'reputation/triggerAutoResponse',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await request.post({
        entity: `/api/reputation/auto-response/trigger/${reviewId}`,
        jsonData: {},
      });
      return response.result?.response;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to trigger auto response');
    }
  }
);

// Add to reducers if needed
export const reputationReducer = (state = initialState, action) => {
  switch (action.type) {
    // ...existing code...
    case exportAnalytics.pending.type:
      return {
        ...state,
        exportLoading: true,
        exportError: null,
      };
    case exportAnalytics.fulfilled.type:
      return {
        ...state,
        exportLoading: false,
      };
    case exportAnalytics.rejected.type:
      return {
        ...state,
        exportLoading: false,
        exportError: action.payload,
      };
    // ...existing code...
    default:
      return state;
  }
};
