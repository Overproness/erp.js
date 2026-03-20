import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface UrlUiState {
  currentUrlId: string | null;
  filters: {
    status: string;
    tag: string;
    dateRange: [string, string] | null;
  };
  searchQuery: string;
  selectedUrls: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

const initialState: UrlUiState = {
  currentUrlId: null,
  filters: { status: 'all', tag: 'all', dateRange: null },
  searchQuery: '',
  selectedUrls: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 10,
};

const urlUiSlice = createSlice({
  name: 'urlUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setCurrentUrl(state, action: PayloadAction<string | null>) {
      state.currentUrlId = action.payload;
    },
    setFilters(state, action: PayloadAction<Partial<UrlUiState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedUrls(state, action: PayloadAction<string[]>) {
      state.selectedUrls = action.payload;
    },
    clearSelection(state) { state.selectedUrls = []; },
    setSort(state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    },
  },
});

export const urlUiActions = urlUiSlice.actions;
export default urlUiSlice.reducer;

// Selectors
export const selectUrlCurrentId = (state: RootState) => state.urlUi?.currentUrlId;
export const selectUrlUiFilters = (state: RootState) => state.urlUi?.filters;
export const selectUrlUiSearchQuery = (state: RootState) => state.urlUi?.searchQuery;
export const selectUrlUiSelectedUrls = (state: RootState) => state.urlUi?.selectedUrls;
export const selectUrlUiSort = (state: RootState) => ({ sortBy: state.urlUi?.sortBy, sortOrder: state.urlUi?.sortOrder });
export const selectUrlUiPage = (state: RootState) => state.urlUi?.page;
export const selectUrlUiPageSize = (state: RootState) => state.urlUi?.pageSize;
