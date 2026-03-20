import apolloClient from '@/graphql/client';
import { gql } from '@apollo/client';
import {
  GET_REVIEWS,
  DELETE_REVIEW,
  GET_REVIEW_LINKS,
  CREATE_REVIEW_LINK,
  UPDATE_REVIEW_LINK,
  DELETE_REVIEW_LINK,
  GET_REVIEW_TEMPLATES,
  CREATE_REVIEW_TEMPLATE,
  UPDATE_REVIEW_TEMPLATE,
  DELETE_REVIEW_TEMPLATE,
  RESPOND_TO_REVIEW,
} from '@/graphql/operations/reputation';
import { createAsyncThunk } from '@reduxjs/toolkit';

// Review actions
export const fetchReviews = createAsyncThunk(
  'reputation/fetchReviews',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_REVIEWS,
        variables: {
          page: params?.page || 1,
          limit: params?.items || 20,
          sortBy: params?.sortBy || 'createdAt',
          sortValue: params?.sortValue || 'desc',
        },
        fetchPolicy: 'network-only',
      });
      return data.reviewList?.result || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch reviews');
    }
  }
);

export const submitReview = createAsyncThunk(
  'reputation/submitReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      // Keep REST — no reviewCreate mutation matching submit flow
      const { default: request } = await import('@/request/request');
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
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation UpdateReviewStatus($id: ID!, $status: String!) { reviewUpdateStatus(id: $id, status: $status) { success result message } }`,
        variables: { id: reviewId, status: updateData.status || 'updated' },
      });
      return data.reviewUpdateStatus?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update review');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reputation/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_REVIEW,
        variables: { id: reviewId },
      });
      return reviewId;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to delete review');
    }
  }
);

export const bulkUpdateReviews = createAsyncThunk(
  'reputation/bulkUpdateReviews',
  async ({ reviewIds, action, data: updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation BulkUpdateReviewStatus($ids: [ID!]!, $status: String!) { reviewBulkUpdateStatus(ids: $ids, status: $status) { success result message } }`,
        variables: { ids: reviewIds, status: action },
      });
      return data.reviewBulkUpdateStatus?.result;
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
      const { data } = await apolloClient.mutate({
        mutation: CREATE_REVIEW_LINK,
        variables: { input: linkData },
      });
      return data.reviewLinkCreate?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to create review link');
    }
  }
);

export const fetchReviewLinks = createAsyncThunk(
  'reputation/fetchReviewLinks',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_REVIEW_LINKS,
        variables: {
          page: params?.page || 1,
          limit: params?.items || 20,
        },
        fetchPolicy: 'network-only',
      });
      return data.reviewLinkList?.result || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch review links');
    }
  }
);

export const updateReviewLink = createAsyncThunk(
  'reputation/updateReviewLink',
  async ({ linkId, updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_REVIEW_LINK,
        variables: { id: linkId, input: updateData },
      });
      return data.reviewLinkUpdate?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update review link');
    }
  }
);

export const deleteReviewLink = createAsyncThunk(
  'reputation/deleteReviewLink',
  async (linkId, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_REVIEW_LINK,
        variables: { id: linkId },
      });
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
      // Keep REST — no dedicated link analytics query in GraphQL
      const { default: request } = await import('@/request/request');
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
      const { data } = await apolloClient.mutate({
        mutation: RESPOND_TO_REVIEW,
        variables: { id: responseData.reviewId, input: { content: responseData.content, isPublic: responseData.isPublic } },
      });
      return data.reviewRespond?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to create response');
    }
  }
);

export const updateResponse = createAsyncThunk(
  'reputation/updateResponse',
  async ({ responseId, updateData }, { rejectWithValue }) => {
    try {
      // Keep REST — reviewRespond is for creating responses
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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
      const { data } = await apolloClient.query({
        query: GET_REVIEW_TEMPLATES,
        variables: {
          page: params?.page || 1,
          limit: params?.items || 20,
        },
        fetchPolicy: 'network-only',
      });
      return data.reviewTemplateList?.result || [];
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch response templates');
    }
  }
);

export const createResponseTemplate = createAsyncThunk(
  'reputation/createResponseTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_REVIEW_TEMPLATE,
        variables: { input: templateData },
      });
      return data.reviewTemplateCreate?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to create response template');
    }
  }
);

export const updateResponseTemplate = createAsyncThunk(
  'reputation/updateResponseTemplate',
  async ({ templateId, updateData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_REVIEW_TEMPLATE,
        variables: { id: templateId, input: updateData },
      });
      return data.reviewTemplateUpdate?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update response template');
    }
  }
);

export const deleteResponseTemplate = createAsyncThunk(
  'reputation/deleteResponseTemplate',
  async (templateId, { rejectWithValue }) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_REVIEW_TEMPLATE,
        variables: { id: templateId },
      });
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
      const { data } = await apolloClient.query({
        query: gql`query ReviewAnalyticsSummary($period: String) { reviewAnalyticsSummary(period: $period) { success result message } }`,
        variables: { period: params.period },
        fetchPolicy: 'network-only',
      });
      return data.reviewAnalyticsSummary?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchSentimentAnalysis = createAsyncThunk(
  'reputation/fetchSentimentAnalysis',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query ReviewAnalyticsSentiment($period: String) { reviewAnalyticsSentiment(period: $period) { success result message } }`,
        variables: { period: params.period },
        fetchPolicy: 'network-only',
      });
      return data.reviewAnalyticsSentiment?.result;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch sentiment analysis');
    }
  }
);

export const fetchReviewTrends = createAsyncThunk(
  'reputation/fetchReviewTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: gql`query ReviewAnalyticsByPlatform { reviewAnalyticsByPlatform { success result message } }`,
        fetchPolicy: 'network-only',
      });
      return data.reviewAnalyticsByPlatform?.result;
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

// Platform integration actions — Keep REST (no GraphQL resolvers)
export const fetchPlatforms = createAsyncThunk(
  'reputation/fetchPlatforms',
  async (_, { rejectWithValue }) => {
    try {
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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

// Auto response actions — Keep REST
export const updateAutoResponseSettings = createAsyncThunk(
  'reputation/updateAutoResponseSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const { default: request } = await import('@/request/request');
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
      const { default: request } = await import('@/request/request');
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
