import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface SocialMediaUiState {
  activeTab: 'accounts' | 'posts' | 'mentions' | 'campaigns' | 'analytics';
  filters: {
    posts: string;
    platform: string;
    dateRange: [string, string] | null;
  };
  searchQuery: string;
  selectedPosts: string[];
}

const initialState: SocialMediaUiState = {
  activeTab: 'accounts',
  filters: { posts: 'all', platform: 'all', dateRange: null },
  searchQuery: '',
  selectedPosts: [],
};

const socialMediaUiSlice = createSlice({
  name: 'socialMediaUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setActiveTab(state, action: PayloadAction<SocialMediaUiState['activeTab']>) {
      state.activeTab = action.payload;
    },
    setFilters(state, action: PayloadAction<Partial<SocialMediaUiState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedPosts(state, action: PayloadAction<string[]>) {
      state.selectedPosts = action.payload;
    },
    togglePostSelection(state, action: PayloadAction<string>) {
      const idx = state.selectedPosts.indexOf(action.payload);
      if (idx >= 0) state.selectedPosts.splice(idx, 1);
      else state.selectedPosts.push(action.payload);
    },
    clearSelection(state) { state.selectedPosts = []; },
  },
});

export const socialMediaUiActions = socialMediaUiSlice.actions;
export default socialMediaUiSlice.reducer;

// Selectors
export const selectSocialMediaActiveTab = (state: RootState) => state.socialMediaUi?.activeTab;
export const selectSocialMediaFilters = (state: RootState) => state.socialMediaUi?.filters;
export const selectSocialMediaSearchQuery = (state: RootState) => state.socialMediaUi?.searchQuery;
export const selectSocialMediaSelectedPosts = (state: RootState) => state.socialMediaUi?.selectedPosts;
