import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface MarketingUiState {
  activeModule: 'campaigns' | 'segments' | 'behavior' | 'retargeting';
  campaignFilters: {
    status: string;
    type: string;
    dateRange: [string, string] | null;
  };
  currentCampaignId: string | null;
  currentSegmentId: string | null;
  currentTriggerId: string | null;
  searchQuery: string;
}

const initialState: MarketingUiState = {
  activeModule: 'campaigns',
  campaignFilters: { status: 'all', type: 'all', dateRange: null },
  currentCampaignId: null,
  currentSegmentId: null,
  currentTriggerId: null,
  searchQuery: '',
};

const marketingUiSlice = createSlice({
  name: 'marketingUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setActiveModule(state, action: PayloadAction<MarketingUiState['activeModule']>) {
      state.activeModule = action.payload;
    },
    setCampaignFilters(state, action: PayloadAction<Partial<MarketingUiState['campaignFilters']>>) {
      state.campaignFilters = { ...state.campaignFilters, ...action.payload };
    },
    setCurrentCampaign(state, action: PayloadAction<string | null>) {
      state.currentCampaignId = action.payload;
    },
    setCurrentSegment(state, action: PayloadAction<string | null>) {
      state.currentSegmentId = action.payload;
    },
    setCurrentTrigger(state, action: PayloadAction<string | null>) {
      state.currentTriggerId = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const marketingUiActions = marketingUiSlice.actions;
export default marketingUiSlice.reducer;

// Selectors
export const selectMarketingActiveModule = (state: RootState) => state.marketingUi?.activeModule;
export const selectMarketingCampaignFilters = (state: RootState) => state.marketingUi?.campaignFilters;
export const selectMarketingCurrentCampaign = (state: RootState) => state.marketingUi?.currentCampaignId;
export const selectMarketingCurrentSegment = (state: RootState) => state.marketingUi?.currentSegmentId;
export const selectMarketingCurrentTrigger = (state: RootState) => state.marketingUi?.currentTriggerId;
export const selectMarketingSearchQuery = (state: RootState) => state.marketingUi?.searchQuery;
