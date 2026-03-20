import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface ReputationUiState {
  activeTab: 'dashboard' | 'reviews' | 'links' | 'templates' | 'platforms';
  selectedReviews: string[];
  reviewFilters: {
    platform: string;
    rating: number | null;
    status: string;
    dateRange: [string, string] | null;
  };
  reviewSort: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  notifications: string[];
}

const initialState: ReputationUiState = {
  activeTab: 'dashboard',
  selectedReviews: [],
  reviewFilters: { platform: 'all', rating: null, status: 'all', dateRange: null },
  reviewSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  notifications: [],
};

const reputationUiSlice = createSlice({
  name: 'reputationUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setActiveTab(state, action: PayloadAction<ReputationUiState['activeTab']>) {
      state.activeTab = action.payload;
    },
    setSelectedReviews(state, action: PayloadAction<string[]>) {
      state.selectedReviews = action.payload;
    },
    toggleReviewSelection(state, action: PayloadAction<string>) {
      const idx = state.selectedReviews.indexOf(action.payload);
      if (idx >= 0) state.selectedReviews.splice(idx, 1);
      else state.selectedReviews.push(action.payload);
    },
    clearReviewSelection(state) { state.selectedReviews = []; },
    setReviewFilters(state, action: PayloadAction<Partial<ReputationUiState['reviewFilters']>>) {
      state.reviewFilters = { ...state.reviewFilters, ...action.payload };
    },
    setReviewSort(state, action: PayloadAction<Partial<ReputationUiState['reviewSort']>>) {
      state.reviewSort = { ...state.reviewSort, ...action.payload };
    },
    addNotification(state, action: PayloadAction<string>) {
      state.notifications.push(action.payload);
    },
    clearNotifications(state) { state.notifications = []; },
  },
});

export const reputationUiActions = reputationUiSlice.actions;
export default reputationUiSlice.reducer;

// Selectors
export const selectReputationActiveTab = (state: RootState) => state.reputationUi?.activeTab;
export const selectReputationSelectedReviews = (state: RootState) => state.reputationUi?.selectedReviews;
export const selectReputationReviewFilters = (state: RootState) => state.reputationUi?.reviewFilters;
export const selectReputationReviewSort = (state: RootState) => state.reputationUi?.reviewSort;
export const selectReputationNotifications = (state: RootState) => state.reputationUi?.notifications;
