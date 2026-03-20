import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface SettingsUiState {
  activeTab: string;
  isDirty: boolean;
  lastSavedAt: string | null;
}

const initialState: SettingsUiState = {
  activeTab: 'general',
  isDirty: false,
  lastSavedAt: null,
};

const settingsUiSlice = createSlice({
  name: 'settingsUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
    setDirty(state, action: PayloadAction<boolean>) {
      state.isDirty = action.payload;
    },
    markSaved(state) {
      state.isDirty = false;
      state.lastSavedAt = new Date().toISOString();
    },
  },
});

export const settingsUiActions = settingsUiSlice.actions;
export default settingsUiSlice.reducer;

// Selectors
export const selectSettingsActiveTab = (state: RootState) => state.settingsUi?.activeTab;
export const selectSettingsIsDirty = (state: RootState) => state.settingsUi?.isDirty;
export const selectSettingsLastSavedAt = (state: RootState) => state.settingsUi?.lastSavedAt;
