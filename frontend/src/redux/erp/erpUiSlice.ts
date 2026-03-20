import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface ErpUiState {
  currentItem: Record<string, unknown> | null;
  currentAction: string;
  currentEntity: string;
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
  isRecordPaymentModalOpen: boolean;
  isMailModalOpen: boolean;
}

const initialState: ErpUiState = {
  currentItem: null,
  currentAction: '',
  currentEntity: '',
  listParams: { entity: '', page: 1, pageSize: 10, sortBy: 'created', sortValue: 'desc' },
  searchQuery: '',
  filterParams: {},
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  isDeleteModalOpen: false,
  isReadModalOpen: false,
  isRecordPaymentModalOpen: false,
  isMailModalOpen: false,
};

const erpUiSlice = createSlice({
  name: 'erpUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setCurrentItem(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.currentItem = action.payload;
    },
    setCurrentAction(state, action: PayloadAction<string>) {
      state.currentAction = action.payload;
    },
    setCurrentEntity(state, action: PayloadAction<string>) {
      state.currentEntity = action.payload;
    },
    setListParams(state, action: PayloadAction<Partial<ErpUiState['listParams']>>) {
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
    closeUpdateModal(state) { state.isUpdateModalOpen = false; state.currentItem = null; },
    openDeleteModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isDeleteModalOpen = true;
      state.currentItem = action.payload;
    },
    closeDeleteModal(state) { state.isDeleteModalOpen = false; state.currentItem = null; },
    openReadModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isReadModalOpen = true;
      state.currentItem = action.payload;
    },
    closeReadModal(state) { state.isReadModalOpen = false; state.currentItem = null; },
    openRecordPaymentModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isRecordPaymentModalOpen = true;
      state.currentItem = action.payload;
    },
    closeRecordPaymentModal(state) { state.isRecordPaymentModalOpen = false; },
    openMailModal(state, action: PayloadAction<Record<string, unknown>>) {
      state.isMailModalOpen = true;
      state.currentItem = action.payload;
    },
    closeMailModal(state) { state.isMailModalOpen = false; },
  },
});

export const erpUiActions = erpUiSlice.actions;
export default erpUiSlice.reducer;

// Selectors
export const selectErpCurrentItem = (state: RootState) => state.erpUi?.currentItem;
export const selectErpCurrentAction = (state: RootState) => state.erpUi?.currentAction;
export const selectErpCurrentEntity = (state: RootState) => state.erpUi?.currentEntity;
export const selectErpListParams = (state: RootState) => state.erpUi?.listParams;
export const selectErpSearchQuery = (state: RootState) => state.erpUi?.searchQuery;
export const selectErpFilterParams = (state: RootState) => state.erpUi?.filterParams;
export const selectErpCreateModalOpen = (state: RootState) => state.erpUi?.isCreateModalOpen;
export const selectErpUpdateModalOpen = (state: RootState) => state.erpUi?.isUpdateModalOpen;
export const selectErpDeleteModalOpen = (state: RootState) => state.erpUi?.isDeleteModalOpen;
export const selectErpReadModalOpen = (state: RootState) => state.erpUi?.isReadModalOpen;
export const selectErpRecordPaymentModalOpen = (state: RootState) => state.erpUi?.isRecordPaymentModalOpen;
export const selectErpMailModalOpen = (state: RootState) => state.erpUi?.isMailModalOpen;
