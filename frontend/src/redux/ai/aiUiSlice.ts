import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface AiUiState {
  currentAssistant: string | null;
  currentConversationId: string | null;
  chatTyping: boolean;
  activePanel: 'chat' | 'assistants' | 'knowledge' | 'analytics' | 'suggestions';
  selectedSuggestionCategory: string;
}

const initialState: AiUiState = {
  currentAssistant: null,
  currentConversationId: null,
  chatTyping: false,
  activePanel: 'chat',
  selectedSuggestionCategory: 'all',
};

const aiUiSlice = createSlice({
  name: 'aiUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setCurrentAssistant(state, action: PayloadAction<string | null>) {
      state.currentAssistant = action.payload;
    },
    setCurrentConversation(state, action: PayloadAction<string | null>) {
      state.currentConversationId = action.payload;
    },
    setChatTyping(state, action: PayloadAction<boolean>) {
      state.chatTyping = action.payload;
    },
    setActivePanel(state, action: PayloadAction<AiUiState['activePanel']>) {
      state.activePanel = action.payload;
    },
    setSelectedSuggestionCategory(state, action: PayloadAction<string>) {
      state.selectedSuggestionCategory = action.payload;
    },
  },
});

export const aiUiActions = aiUiSlice.actions;
export default aiUiSlice.reducer;

// Selectors
export const selectAiCurrentAssistant = (state: RootState) => state.aiUi?.currentAssistant;
export const selectAiCurrentConversation = (state: RootState) => state.aiUi?.currentConversationId;
export const selectAiChatTyping = (state: RootState) => state.aiUi?.chatTyping;
export const selectAiActivePanel = (state: RootState) => state.aiUi?.activePanel;
export const selectAiSuggestionCategory = (state: RootState) => state.aiUi?.selectedSuggestionCategory;
