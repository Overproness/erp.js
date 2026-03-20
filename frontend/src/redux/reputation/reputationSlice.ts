import { createSlice } from '@reduxjs/toolkit';
import {
  fetchReviews,
  submitReview,
  updateReview,
  deleteReview,
  fetchReviewLinks,
  createReviewLink,
  updateReviewLink,
  deleteReviewLink,
  fetchResponseTemplates,
  createResponse,
  fetchAnalytics,
  fetchPlatforms,
  connectPlatform,
  disconnectPlatform,
  syncPlatforms,
  fetchSentimentAnalysis,
  fetchReviewTrends,
  exportReviews
} from './reputationActions';

const initialState = {
  // Review data
  reviews: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // Review links
  links: {
    data: [],
    loading: false,
    error: null
  },
  
  // Response templates
  templates: {
    data: [],
    loading: false,
    error: null
  },
  
  // Analytics data
  analytics: {
    loading: false,
    error: null,
    overview: {
      totalReviews: 0,
      averageRating: 0,
      responseRate: 0
    },
    sentiment: {
      positive: 0,
      neutral: 0,
      negative: 0
    },
    trends: {
      reviewTrends: [],
      sentimentTrends: []
    },
    metrics: {
      platformBreakdown: []
    }
  },
  
  // Platform integrations
  platforms: {
    available: [],
    connected: [],
    loading: false,
    error: null,
    syncStatus: {
      isSyncing: false,
      lastSync: null,
      errors: []
    }
  },
  
  // UI state
  ui: {
    activeTab: 'dashboard',
    notifications: [],
    selectedReviews: []
  }
};

const reputationSlice = createSlice({
  name: 'reputation',
  initialState,
  reducers: {
    // UI state actions
    setActiveTab: (state, action) => {
      state.ui.activeTab = action.payload;
    },
    selectReview: (state, action) => {
      state.ui.selectedReviews.push(action.payload);
    },
    deselectReview: (state, action) => {
      state.ui.selectedReviews = state.ui.selectedReviews.filter(id => id !== action.payload);
    },
    clearSelectedReviews: (state) => {
      state.ui.selectedReviews = [];
    },
    addNotification: (state, action) => {
      state.ui.notifications.push(action.payload);
    },
    clearNotification: (state, action) => {
      state.ui.notifications = state.ui.notifications.filter(n => n.id !== action.payload);
    },
    
    // Filter and sort actions
    setReviewFilters: (state, action) => {
      state.reviews.filters = action.payload;
    },
    setReviewSort: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.reviews.sortBy = sortBy;
      state.reviews.sortOrder = sortOrder;
    },
    setReviewPagination: (state, action) => {
      state.reviews.pagination = {
        ...state.reviews.pagination,
        ...action.payload
      };
    },
    
    // Clear state actions
    clearReviewsError: (state) => {
      state.reviews.error = null;
    },
    clearLinksError: (state) => {
      state.links.error = null;
    },
    clearTemplatesError: (state) => {
      state.templates.error = null;
    },
    clearAnalyticsError: (state) => {
      state.analytics.error = null;
    },
    clearPlatformsError: (state) => {
      state.platforms.error = null;
    },

    // Selected reviews
    setSelectedReviews: (state, action) => {
      state.ui = {
        ...state.ui,
        selectedReviews: action.payload
      };
    },

    // Response settings
    updateAutoResponseSettings: (state, action) => {
      state.responses = {
        ...state.responses,
        autoResponseSettings: {
          ...state.responses.autoResponseSettings,
          ...action.payload
        }
      };
    },

    // Review links
    setActiveReviewLink: (state, action) => {
      state.links = {
        ...state.links,
        activeLink: action.payload
      };
    }
  },
  extraReducers: (builder) => {
    // Reviews
    builder.addCase(fetchReviews.pending, (state) => {
      state.reviews.loading = true;
      state.reviews.error = null;
    });
    builder.addCase(fetchReviews.fulfilled, (state, action) => {
      state.reviews.loading = false;
      state.reviews.data = action.payload.reviews;
      state.reviews.pagination = action.payload.pagination;
    });
    builder.addCase(fetchReviews.rejected, (state, action) => {
      state.reviews.loading = false;
      state.reviews.error = action.payload || 'Failed to fetch reviews';
    });
    
    // Submit review
    builder.addCase(submitReview.fulfilled, (state, action) => {
      state.reviews.data.unshift(action.payload);
    });
    
    // Update review
    builder.addCase(updateReview.fulfilled, (state, action) => {
      const index = state.reviews.data.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.reviews.data[index] = action.payload;
      }
    });
    
    // Delete review
    builder.addCase(deleteReview.fulfilled, (state, action) => {
      state.reviews.data = state.reviews.data.filter(r => r.id !== action.payload);
    });
    
    // Links
    builder.addCase(fetchReviewLinks.pending, (state) => {
      state.links.loading = true;
      state.links.error = null;
    });
    builder.addCase(fetchReviewLinks.fulfilled, (state, action) => {
      state.links.loading = false;
      state.links.data = action.payload;
    });
    builder.addCase(fetchReviewLinks.rejected, (state, action) => {
      state.links.loading = false;
      state.links.error = action.payload || 'Failed to fetch review links';
    });
    
    // Create link
    builder.addCase(createReviewLink.fulfilled, (state, action) => {
      state.links.data.unshift(action.payload);
    });
    
    // Update link
    builder.addCase(updateReviewLink.fulfilled, (state, action) => {
      const index = state.links.data.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.links.data[index] = action.payload;
      }
    });
    
    // Delete link
    builder.addCase(deleteReviewLink.fulfilled, (state, action) => {
      state.links.data = state.links.data.filter(l => l.id !== action.payload);
    });
    
    // Templates
    builder.addCase(fetchResponseTemplates.pending, (state) => {
      state.templates.loading = true;
      state.templates.error = null;
    });
    builder.addCase(fetchResponseTemplates.fulfilled, (state, action) => {
      state.templates.loading = false;
      state.templates.data = action.payload;
    });
    builder.addCase(fetchResponseTemplates.rejected, (state, action) => {
      state.templates.loading = false;
      state.templates.error = action.payload || 'Failed to fetch templates';
    });
    
    // Analytics
    builder.addCase(fetchAnalytics.pending, (state) => {
      state.analytics.loading = true;
      state.analytics.error = null;
    });
    builder.addCase(fetchAnalytics.fulfilled, (state, action) => {
      state.analytics.loading = false;
      state.analytics.overview = action.payload;
    });
    builder.addCase(fetchAnalytics.rejected, (state, action) => {
      state.analytics.loading = false;
      state.analytics.error = action.payload || 'Failed to fetch analytics';
    });

    // Sentiment analysis
    builder.addCase(fetchSentimentAnalysis.pending, (state) => {
      state.analytics.loading = true;
      state.analytics.error = null;
    });
    builder.addCase(fetchSentimentAnalysis.fulfilled, (state, action) => {
      state.analytics.loading = false;
      state.analytics.sentiment = action.payload;
    });
    builder.addCase(fetchSentimentAnalysis.rejected, (state, action) => {
      state.analytics.loading = false;
      state.analytics.error = action.payload || 'Failed to fetch sentiment analysis';
    });

    // Review trends
    builder.addCase(fetchReviewTrends.pending, (state) => {
      state.analytics.loading = true;
      state.analytics.error = null;
    });
    builder.addCase(fetchReviewTrends.fulfilled, (state, action) => {
      state.analytics.loading = false;
      state.analytics.trends = action.payload;
    });
    builder.addCase(fetchReviewTrends.rejected, (state, action) => {
      state.analytics.loading = false;
      state.analytics.error = action.payload || 'Failed to fetch review trends';
    });

    // Export reviews
    builder.addCase(exportReviews.pending, (state) => {
      state.analytics.exporting = true;
      state.analytics.exportError = null;
    });
    builder.addCase(exportReviews.fulfilled, (state) => {
      state.analytics.exporting = false;
    });
    builder.addCase(exportReviews.rejected, (state, action) => {
      state.analytics.exporting = false;
      state.analytics.exportError = action.payload || 'Failed to export reviews';
    });
    
    // Platforms
    builder.addCase(fetchPlatforms.pending, (state) => {
      state.platforms.loading = true;
      state.platforms.error = null;
    });
    builder.addCase(fetchPlatforms.fulfilled, (state, action) => {
      state.platforms.loading = false;
      state.platforms.available = action.payload.available;
      state.platforms.connected = action.payload.connected;
    });
    builder.addCase(fetchPlatforms.rejected, (state, action) => {
      state.platforms.loading = false;
      state.platforms.error = action.payload || 'Failed to fetch platforms';
    });
    
    // Connect platform
    builder.addCase(connectPlatform.fulfilled, (state, action) => {
      state.platforms.connected.push(action.payload);
    });
    
    // Disconnect platform
    builder.addCase(disconnectPlatform.fulfilled, (state, action) => {
      state.platforms.connected = state.platforms.connected.filter(p => p.id !== action.payload);
    });
    
    // Sync platforms
    builder.addCase(syncPlatforms.pending, (state) => {
      state.platforms.syncStatus = {
        ...state.platforms.syncStatus,
        isSyncing: true
      };
    });
    builder.addCase(syncPlatforms.fulfilled, (state, action) => {
      state.platforms.syncStatus = {
        isSyncing: false,
        lastSync: new Date().toISOString(),
        results: action.payload
      };
    });
    builder.addCase(syncPlatforms.rejected, (state, action) => {
      state.platforms.syncStatus = {
        isSyncing: false,
        error: action.payload
      };
    });
  }
});

export const { 
  setActiveTab,
  selectReview,
  deselectReview,
  clearSelectedReviews,
  addNotification,
  clearNotification,
  setReviewFilters,
  setReviewSort,
  setReviewPagination,
  clearReviewsError,
  clearLinksError,
  clearTemplatesError,
  clearAnalyticsError,
  clearPlatformsError,
  setSelectedReviews,
  updateAutoResponseSettings,
  setActiveReviewLink
} = reputationSlice.actions;

export default reputationSlice.reducer;
