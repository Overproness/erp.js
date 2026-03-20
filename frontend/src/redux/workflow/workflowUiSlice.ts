import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface WorkflowUiState {
  currentWorkflowId: string | null;
  activeTab: 'list' | 'detail' | 'executions' | 'businessProcesses';
  filterStatus: string;
  searchQuery: string;
}

const initialState: WorkflowUiState = {
  currentWorkflowId: null,
  activeTab: 'list',
  filterStatus: 'all',
  searchQuery: '',
};

const workflowUiSlice = createSlice({
  name: 'workflowUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setCurrentWorkflow(state, action: PayloadAction<string | null>) {
      state.currentWorkflowId = action.payload;
    },
    setActiveTab(state, action: PayloadAction<WorkflowUiState['activeTab']>) {
      state.activeTab = action.payload;
    },
    setFilterStatus(state, action: PayloadAction<string>) {
      state.filterStatus = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const workflowUiActions = workflowUiSlice.actions;
export default workflowUiSlice.reducer;

// Selectors
export const selectWorkflowCurrentId = (state: RootState) => state.workflowUi?.currentWorkflowId;
export const selectWorkflowActiveTab = (state: RootState) => state.workflowUi?.activeTab;
export const selectWorkflowFilterStatus = (state: RootState) => state.workflowUi?.filterStatus;
export const selectWorkflowSearchQuery = (state: RootState) => state.workflowUi?.searchQuery;
