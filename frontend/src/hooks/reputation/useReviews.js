import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReviews,
  submitReview,
  updateReview,
  deleteReview,
  bulkUpdateReviews
} from '../../redux/reputation/reputationActions';
import {
  selectReviews,
  selectReviewsLoading,
  selectReviewsError,
  selectReviewFilters,
  selectFilteredReviews,
  selectReviewStats
} from '../../redux/reputation/reputationSelectors';
import { setReviewFilters, setSelectedReviews } from '../../redux/reputation/reputationSlice';
import { filterReviews, sortReviews } from '../../utils/reputation/reviewUtils';

/**
 * Custom hook for review data management
 */
export const useReviews = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = null,
    filters: initialFilters = {},
    sorting: initialSorting = { field: 'date', order: 'desc' }
  } = options;

  const dispatch = useDispatch();
  const reviews = useSelector(selectReviews);
  const loading = useSelector(selectReviewsLoading);
  const error = useSelector(selectReviewsError);
  const currentFilters = useSelector(selectReviewFilters);
  const filteredReviews = useSelector(selectFilteredReviews);
  const reviewStats = useSelector(selectReviewStats);

  const [localFilters, setLocalFilters] = useState({ ...currentFilters, ...initialFilters });
  const [sorting, setSorting] = useState(initialSorting);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch reviews on mount or when dependencies change
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchReviews({ filters: localFilters, ...sorting }));
    }
  }, [dispatch, autoFetch, JSON.stringify(localFilters), JSON.stringify(sorting)]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshReviews();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Apply local filtering and sorting
  const processedReviews = useMemo(() => {
    let result = [...reviews];
    
    // Apply filters
    result = filterReviews(result, localFilters);
    
    // Apply sorting
    result = sortReviews(result, sorting.field, sorting.order);
    
    return result;
  }, [reviews, localFilters, sorting]);

  // Refresh reviews
  const refreshReviews = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchReviews({ filters: localFilters, ...sorting })).unwrap();
    } catch (error) {
      console.error('Failed to refresh reviews:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, localFilters, sorting]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...localFilters, ...newFilters };
    setLocalFilters(updatedFilters);
    dispatch(setReviewFilters(updatedFilters));
  }, [dispatch, localFilters]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      platform: 'all',
      sentiment: 'all',
      rating: 'all',
      dateRange: 'all',
      search: ''
    };
    setLocalFilters(clearedFilters);
    dispatch(setReviewFilters(clearedFilters));
  }, [dispatch]);

  // Update sorting
  const updateSorting = useCallback((field, order) => {
    setSorting({ field, order });
  }, []);

  // Submit new review
  const submitNewReview = useCallback(async (reviewData) => {
    try {
      const result = await dispatch(submitReview(reviewData)).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Update existing review
  const updateExistingReview = useCallback(async (reviewId, updateData) => {
    try {
      const result = await dispatch(updateReview({ reviewId, updateData })).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Delete review
  const removeReview = useCallback(async (reviewId) => {
    try {
      await dispatch(deleteReview(reviewId)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Bulk operations
  const bulkActions = useMemo(() => ({
    async updateSelected(reviewIds, action, data) {
      try {
        const result = await dispatch(bulkUpdateReviews({ reviewIds, action, data })).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error };
      }
    },

    async deleteSelected(reviewIds) {
      try {
        const promises = reviewIds.map(id => dispatch(deleteReview(id)).unwrap());
        await Promise.all(promises);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },

    async markAsResponded(reviewIds) {
      return this.updateSelected(reviewIds, 'mark_responded', { responded: true });
    },

    async updateSentiment(reviewIds, sentiment) {
      return this.updateSelected(reviewIds, 'update_sentiment', { sentiment });
    }
  }), [dispatch]);

  // Search reviews
  const searchReviews = useCallback((query) => {
    updateFilters({ search: query });
  }, [updateFilters]);

  // Get reviews by criteria
  const getReviewsByCriteria = useCallback((criteria) => {
    return reviews.filter(review => {
      return Object.entries(criteria).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(review[key]);
        }
        return review[key] === value;
      });
    });
  }, [reviews]);

  // Get recent reviews
  const getRecentReviews = useCallback((days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return reviews.filter(review => new Date(review.createdAt) >= cutoffDate);
  }, [reviews]);

  // Get unresponded reviews
  const getUnrespondedReviews = useCallback(() => {
    return reviews.filter(review => !review.responded);
  }, [reviews]);

  // Get reviews requiring attention (low rating + negative sentiment)
  const getHighPriorityReviews = useCallback(() => {
    return reviews.filter(review => 
      review.rating <= 2 && review.sentiment === 'negative' && !review.responded
    );
  }, [reviews]);

  return {
    // Data
    reviews: processedReviews,
    allReviews: reviews,
    reviewStats,
    
    // State
    loading,
    error,
    refreshing,
    filters: localFilters,
    sorting,
    
    // Actions
    refreshReviews,
    updateFilters,
    clearFilters,
    updateSorting,
    searchReviews,
    
    // CRUD operations
    submitReview: submitNewReview,
    updateReview: updateExistingReview,
    deleteReview: removeReview,
    bulkActions,
    
    // Utility functions
    getReviewsByCriteria,
    getRecentReviews,
    getUnrespondedReviews,
    getHighPriorityReviews
  };
};

export default useReviews;
