import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface CrudUiState {
  currentItem: Record<string, unknown> | null;
  currentAction: string;
  listParams: {
    entity: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortValue: string;
  };
  searchQuery: string;
  filterParams: Record<string, string>;
  isCreateModalOpen: boolean;
  isUpdateModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isReadModalOpen: boolean;
}

const initialState: CrudUiState = {
  currentItem: null,
  currentAction: '',
  listParams: { entity: '', page: 1, pageSize: 10, sortBy: 'created', sortValue: 'desc' },
  searchQuery: '',
  filterParams: {},
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  isDeleteModalOpen: false,
  isReadModalOpen: false,
};

const crudSlice = createSlice({
  name: 'crudUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setCurrentItem(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.currentItem = action.payload;
    },
    setCurrentAction(state, action: PayloadAction<string>) {
      state.currentAction = action.payload;
    },
    setListParams(state, action: PayloadAction<Partial<CrudUiState['listParams']>>) {
      state.listParams = { ...state.listParams, ...action.payload };
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setFilterParams(state, action: PayloadAction<Record<string, string>>) {
      state.filterParams = action.payload;
    },
    openCreateModal(state) { state.isCreateModalOpen = true; },
    closeCreateModal(state) { state.isCreateModalOpen = false; },
    openUpdateModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isUpdateModalOpen = true;
      state.currentItem = action.payload;
    },
    closeUpdateModal(state) {
      state.isUpdateModalOpen = false;
      state.currentItem = null;
    },
    openDeleteModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isDeleteModalOpen = true;
      state.currentItem = action.payload;
    },
    closeDeleteModal(state) {
      state.isDeleteModalOpen = false;
      state.currentItem = null;
    },
    openReadModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isReadModalOpen = true;
      state.currentItem = action.payload;
    },
    closeReadModal(state) {
      state.isReadModalOpen = false;
      state.currentItem = null;
    },
  },
});

export const crudUiActions = crudSlice.actions;
export default crudSlice.reducer;

// Selectors
export const selectCrudCurrentItem = (state: RootState) => state.crudUi?.currentItem;
export const selectCrudCurrentAction = (state: RootState) => state.crudUi?.currentAction;
export const selectCrudListParams = (state: RootState) => state.crudUi?.listParams;
export const selectCrudSearchQuery = (state: RootState) => state.crudUi?.searchQuery;
export const selectCrudFilterParams = (state: RootState) => state.crudUi?.filterParams;
export const selectCrudCreateModalOpen = (state: RootState) => state.crudUi?.isCreateModalOpen;
export const selectCrudUpdateModalOpen = (state: RootState) => state.crudUi?.isUpdateModalOpen;
export const selectCrudDeleteModalOpen = (state: RootState) => state.crudUi?.isDeleteModalOpen;
export const selectCrudReadModalOpen = (state: RootState) => state.crudUi?.isReadModalOpen;
