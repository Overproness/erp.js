import { createSelector } from 'reselect';
import { determineSentiment, filterReviews, sortReviews } from '../../utils/reputation/reviewUtils';

// Base selectors - with safe defaults to prevent crashes when state is not initialized
const EMPTY_OBJ = {};
const selectReputationState = (state) => state.reputation || EMPTY_OBJ;
const selectReviewsState = (state) => state.reputation?.reviews || EMPTY_OBJ;
const selectLinksState = (state) => state.reputation?.links || EMPTY_OBJ;
const selectTemplatesState = (state) => state.reputation?.templates || EMPTY_OBJ;
const selectAnalyticsState = (state) => state.reputation?.analytics || EMPTY_OBJ;
const selectPlatformsState = (state) => state.reputation?.platforms || EMPTY_OBJ;
const selectUiState = (state) => state.reputation?.ui || EMPTY_OBJ;

// Derived selectors for reviews
export const selectReviews = createSelector(
  selectReviewsState,
  (reviewsState) => reviewsState.data
);

export const selectReviewsLoading = createSelector(
  selectReviewsState,
  (reviewsState) => reviewsState.loading
);

export const selectReviewsError = createSelector(
  selectReviewsState,
  (reviewsState) => reviewsState.error
);

export const selectReviewsPagination = createSelector(
  selectReviewsState,
  (reviewsState) => reviewsState.pagination
);

export const selectReviewsFilters = createSelector(
  selectReviewsState,
  (reviewsState) => reviewsState.filters
);

export const selectReviewsSort = createSelector(
  selectReviewsState,
  (reviewsState) => ({
    sortBy: reviewsState.sortBy,
    sortOrder: reviewsState.sortOrder
  })
);

export const selectFilteredReviews = createSelector(
  [selectReviews, selectReviewsFilters, selectReviewsSort],
  (reviews, filters, sort) => {
    const filtered = filterReviews(reviews, filters);
    return sortReviews(filtered, sort.sortBy, sort.sortOrder);
  }
);

// Derived selectors for review stats
export const selectReviewStats = createSelector(
  selectReviews,
  (reviews) => {
    // Default empty stats
    if (!reviews || !reviews.length) {
      return {
        total: 0,
        average: 0,
        distribution: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        },
        sentiment: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        responded: 0,
        responseRate: 0
      };
    }

    // Calculate statistics
    const total = reviews.length;
    let sum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    let responded = 0;

    reviews.forEach(review => {
      const rating = Math.round(review.rating || 0);
      
      // Sum for average calculation
      sum += rating;
      
      // Distribution
      if (rating >= 1 && rating <= 5) {
        distribution[rating] += 1;
      }
      
      // Sentiment
      if (review.sentiment) {
        sentiment[review.sentiment] += 1;
      } else if (rating) {
        // Derive sentiment from rating if not provided
        const derivedSentiment = determineSentiment(rating);
        sentiment[derivedSentiment] += 1;
      }
      
      // Response status
      if (review.responded) {
        responded += 1;
      }
    });

    return {
      total,
      average: total > 0 ? sum / total : 0,
      distribution,
      sentiment,
      responded,
      responseRate: total > 0 ? (responded / total) * 100 : 0
    };
  }
);

// Selectors for links
export const selectLinks = createSelector(
  selectLinksState,
  (linksState) => linksState.data
);

export const selectLinksLoading = createSelector(
  selectLinksState,
  (linksState) => linksState.loading
);

export const selectLinksError = createSelector(
  selectLinksState,
  (linksState) => linksState.error
);

// Selectors for templates
export const selectTemplates = createSelector(
  selectTemplatesState,
  (templatesState) => templatesState.data
);

export const selectTemplatesLoading = createSelector(
  selectTemplatesState,
  (templatesState) => templatesState.loading
);

export const selectTemplatesError = createSelector(
  selectTemplatesState,
  (templatesState) => templatesState.error
);

// Selectors for analytics
export const selectAnalyticsOverview = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.overview
);

export const selectAnalyticsSentiment = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.sentiment
);

export const selectAnalyticsTrends = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.trends
);

export const selectAnalyticsLoading = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.loading
);

export const selectAnalyticsError = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.error
);

// Selectors for platforms
export const selectAvailablePlatforms = createSelector(
  selectPlatformsState,
  (platformsState) => platformsState.available
);

export const selectConnectedPlatforms = createSelector(
  selectPlatformsState,
  (platformsState) => platformsState.connected
);

export const selectPlatformsLoading = createSelector(
  selectPlatformsState,
  (platformsState) => platformsState.loading
);

export const selectPlatformsError = createSelector(
  selectPlatformsState,
  (platformsState) => platformsState.error
);

export const selectPlatformSyncStatus = createSelector(
  selectPlatformsState,
  (platformsState) => platformsState.syncStatus
);

// UI state selectors
export const selectActiveTab = createSelector(
  selectUiState,
  (uiState) => uiState.activeTab
);

export const selectSelectedReviews = createSelector(
  selectUiState,
  (uiState) => uiState?.selectedReviews || []
);

export const selectNotifications = createSelector(
  selectUiState,
  (uiState) => uiState.notifications
);

// Additional derived selectors

// Get specific review by ID
export const makeSelectReviewById = () => 
  createSelector(
    [selectReviews, (_, reviewId) => reviewId],
    (reviews, reviewId) => reviews.find(review => review.id === reviewId)
  );

// Get reviews by platform
export const makeSelectReviewsByPlatform = () =>
  createSelector(
    [selectFilteredReviews, (_, platform) => platform],
    (reviews, platform) => reviews.filter(review => review.platform === platform)
  );

// Get reviews by rating range
export const makeSelectReviewsByRating = () =>
  createSelector(
    [selectFilteredReviews, (_, range) => range],
    (reviews, range) => {
      const [min, max] = range.split('-').map(Number);
      return reviews.filter(review => {
        const rating = Math.round(review.rating || 0);
        return rating >= min && rating <= max;
      });
    }
  );

// Get reviews by sentiment
export const makeSelectReviewsBySentiment = () =>
  createSelector(
    [selectFilteredReviews, (_, sentiment) => sentiment],
    (reviews, sentiment) => reviews.filter(review => {
      if (review.sentiment) {
        return review.sentiment === sentiment;
      } else if (review.rating) {
        return determineSentiment(review.rating) === sentiment;
      }
      return false;
    })
  );

// Get response templates by category
export const makeSelectTemplatesByCategory = () =>
  createSelector(
    [selectTemplates, (_, category) => category],
    (templates, category) => templates.filter(template => template.category === category)
  );

// Platform connectivity status
export const selectIsPlatformConnected = createSelector(
  [selectConnectedPlatforms, (_, platform) => platform],
  (connectedPlatforms, platformId) => connectedPlatforms.some(p => p.id === platformId)
);


// Add any missing selectors that might be referenced
export const selectAnalytics = selectAnalyticsState;

export const selectPlatforms = selectPlatformsState;

export const selectAnalyticsMetrics = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.metrics || {}
);

export const selectSentimentDistribution = createSelector(
  selectAnalyticsState,
  (analyticsState) => analyticsState.sentiment || { positive: 0, neutral: 0, negative: 0 }
);

export const selectAverageRating = createSelector(
  selectAnalyticsOverview,
  (overview) => overview?.averageRating || 0
);

export const selectResponseRate = createSelector(
  selectAnalyticsOverview,
  (overview) => overview?.responseRate || 0
);

export const selectDisconnectedPlatforms = createSelector(
  [selectAvailablePlatforms, selectConnectedPlatforms],
  (available, connected) => {
    const connectedIds = connected.map(p => p.id);
    return available.filter(p => !connectedIds.includes(p.id));
  }
);

export const selectReviewFilters = selectReviewsFilters;

// Review response selectors
export const selectResponses = createSelector(
  selectReputationState,
  (state) => state.responses?.data || []
);

export const selectResponseTemplates = createSelector(
  selectReputationState,
  (state) => state.responses?.templates || []
);

export const selectAutoResponseSettings = createSelector(
  selectReputationState,
  (state) => state.responses?.autoResponseSettings || {
    enabled: false,
    sentimentTriggers: ['positive', 'neutral', 'negative'],
    ratingTriggers: [1, 2, 3, 4, 5],
    defaultTemplateId: null
  }
);

export const selectResponsesByReview = createSelector(
  selectResponses,
  (responses) => {
    return responses.reduce((acc, response) => {
      if (response.reviewId) {
        acc[response.reviewId] = [...(acc[response.reviewId] || []), response];
      }
      return acc;
    }, {});
  }
);

// Review links selectors
export const selectReviewLinks = createSelector(
  selectReputationState,
  (state) => state.links || { loading: false, error: null, data: [] }
);

export const selectActiveReviewLink = createSelector(
  selectReputationState,
  (state) => state.links?.activeLink || null
);

// Selected reviews for bulk actions
export const selectSelectedReviewsForBulkActions = createSelector(
  selectReputationState,
  (state) => state.ui?.selectedReviews || []
);

export const selectBulkActionLoading = createSelector(
  selectReputationState,
  (state) => state.ui?.bulkActionLoading || false
);

// Export base selectors
export {
  selectAnalyticsState, selectLinksState, selectPlatformsState, selectReputationState,
  selectReviewsState, selectTemplatesState, selectUiState
};

