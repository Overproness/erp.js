import { createSelector } from '@reduxjs/toolkit';

const selectAiState = (state) => state.ai;

// AI Assistants Selectors
export const selectAssistants = createSelector([selectAiState], (ai) => ai.assistants);

export const selectAssistantsList = createSelector(
  [selectAssistants],
  (assistants) => assistants.list
);

export const selectCurrentAssistant = createSelector(
  [selectAssistants],
  (assistants) => assistants.current
);

export const selectAssistantsLoading = createSelector(
  [selectAssistants],
  (assistants) => assistants.loading
);

export const selectAssistantsError = createSelector(
  [selectAssistants],
  (assistants) => assistants.error
);

export const selectAssistantsPagination = createSelector(
  [selectAssistants],
  (assistants) => assistants.pagination
);

// Chat Selectors
export const selectChat = createSelector([selectAiState], (ai) => ai.chat);

export const selectChatMessages = createSelector([selectChat], (chat) => chat.messages);

export const selectCurrentConversation = createSelector(
  [selectChat],
  (chat) => chat.currentConversation
);

export const selectChatLoading = createSelector([selectChat], (chat) => chat.loading);

export const selectChatTyping = createSelector([selectChat], (chat) => chat.typing);

export const selectChatError = createSelector([selectChat], (chat) => chat.error);

export const selectConversations = createSelector([selectChat], (chat) => chat.conversations);

export const selectChatConversations = createSelector(
  [selectChat],
  (chat) => chat.conversations || []
);

// Analytics Selectors
export const selectAnalytics = createSelector([selectAiState], (ai) => ai.analytics);

export const selectAnalyticsData = createSelector([selectAnalytics], (analytics) => analytics.data);

export const selectAnalyticsMetrics = createSelector(
  [selectAnalytics],
  (analytics) => analytics.metrics
);

export const selectUsageMetrics = createSelector(
  [selectAnalytics],
  (analytics) => analytics.usageMetrics
);

export const selectAnalyticsLoading = createSelector(
  [selectAnalytics],
  (analytics) => analytics.loading
);

export const selectAnalyticsError = createSelector(
  [selectAnalytics],
  (analytics) => analytics.error
);

// Suggestions Selectors
export const selectSuggestions = createSelector([selectAiState], (ai) => ai.suggestions);

export const selectCurrentSuggestions = createSelector(
  [selectSuggestions],
  (suggestions) => suggestions.list
);

export const selectSuggestionsLoading = createSelector(
  [selectSuggestions],
  (suggestions) => suggestions.loading
);

export const selectSuggestionsError = createSelector(
  [selectSuggestions],
  (suggestions) => suggestions.error
);

export const selectSuggestionsCategories = createSelector(
  [selectSuggestions],
  (suggestions) => suggestions.categories
);

// Analysis Selectors
export const selectAnalysis = createSelector([selectAiState], (ai) => ai.analysis);

export const selectAnalysisResults = createSelector(
  [selectAnalysis],
  (analysis) => analysis.results
);

export const selectCurrentAnalysis = createSelector(
  [selectAnalysis],
  (analysis) => analysis.currentAnalysis
);

export const selectAnalysisLoading = createSelector(
  [selectAnalysis],
  (analysis) => analysis.loading
);

export const selectAnalysisError = createSelector([selectAnalysis], (analysis) => analysis.error);

// Predictions Selectors
export const selectPredictions = createSelector([selectAiState], (ai) => ai.predictions);

export const selectPredictionResults = createSelector(
  [selectPredictions],
  (predictions) => predictions.results
);

export const selectCurrentPrediction = createSelector(
  [selectPredictions],
  (predictions) => predictions.currentPrediction
);

export const selectPredictionsLoading = createSelector(
  [selectPredictions],
  (predictions) => predictions.loading
);

export const selectPredictionsError = createSelector(
  [selectPredictions],
  (predictions) => predictions.error
);

// Knowledge Base Selectors
export const selectKnowledgeBase = createSelector([selectAiState], (ai) => ai.knowledgeBase);

export const selectKnowledgeBaseItems = createSelector(
  [selectKnowledgeBase],
  (knowledgeBase) => knowledgeBase.items
);

export const selectKnowledgeBaseLoading = createSelector(
  [selectKnowledgeBase],
  (knowledgeBase) => knowledgeBase.loading
);

export const selectKnowledgeBaseError = createSelector(
  [selectKnowledgeBase],
  (knowledgeBase) => knowledgeBase.error
);

export const selectKnowledgeBasePagination = createSelector(
  [selectKnowledgeBase],
  (knowledgeBase) => knowledgeBase.pagination
);

// Preferences Selectors
export const selectSettings = createSelector([selectAiState], (ai) => ai.settings);

export const selectUserPreferences = createSelector(
  [selectSettings],
  (settings) => settings.preferences
);

export const selectModelConfig = createSelector(
  [selectSettings],
  (settings) => settings.modelConfig
);

export const selectSettingsLoading = createSelector(
  [selectSettings],
  (settings) => settings.loading
);

export const selectSettingsError = createSelector([selectSettings], (settings) => settings.error);

// UI Selectors
export const selectAiUi = createSelector([selectAiState], (ai) => ai.ui);

export const selectChatOpen = createSelector([selectAiUi], (ui) => ui.chatOpen);

export const selectSidebarCollapsed = createSelector([selectAiUi], (ui) => ui.sidebarCollapsed);

export const selectActiveModule = createSelector([selectAiUi], (ui) => ui.activeModule);

export const selectSelectedContext = createSelector([selectAiUi], (ui) => ui.selectedContext);

export const selectNotifications = createSelector([selectAiUi], (ui) => ui.notifications);

// Data Processing Selectors
export const selectDataProcessing = createSelector([selectAiState], (ai) => ai.dataProcessing);

export const selectOCRResults = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.ocrResults
);

export const selectOCRLoading = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.ocrLoading
);

export const selectOCRError = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.ocrError
);

export const selectExtractionResults = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.extractionResults
);

export const selectExtractionLoading = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.extractionLoading
);

export const selectExtractionError = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.extractionError
);

export const selectExtractionTemplates = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.templates
);

export const selectTemplatesLoading = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.templatesLoading
);

export const selectTemplatesError = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.templatesError
);

export const selectWorkflows = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.workflows
);

export const selectWorkflowsLoading = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.workflowsLoading
);

export const selectWorkflowsError = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.workflowsError
);

export const selectCurrentWorkflow = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.currentWorkflow
);

export const selectProcessingStats = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.processingStats
);

export const selectProcessingStatsLoading = createSelector(
  [selectDataProcessing],
  (dataProcessing) => dataProcessing.processingStatsLoading
);

// Derived/Combined Selectors
export const selectEnabledAssistants = createSelector([selectAssistantsList], (assistants) =>
  assistants.filter((assistant) => assistant.enabled)
);

export const selectAssistantsByType = createSelector([selectAssistantsList], (assistants) => {
  return assistants.reduce((acc, assistant) => {
    if (!acc[assistant.type]) {
      acc[assistant.type] = [];
    }
    acc[assistant.type].push(assistant);
    return acc;
  }, {});
});

export const selectRecentConversations = createSelector([selectConversations], (conversations) =>
  conversations.slice(0, 10)
);

export const selectUnreadNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => !notification.read)
);

export const selectTotalUsageCost = createSelector(
  [selectUsageMetrics],
  (metrics) => metrics?.summary?.totalCost || 0
);

export const selectTotalTokensUsed = createSelector(
  [selectUsageMetrics],
  (metrics) => metrics?.summary?.totalTokens || 0
);

export const selectIsAnyLoading = createSelector(
  [
    selectAssistantsLoading,
    selectChatLoading,
    selectAnalyticsLoading,
    selectSuggestionsLoading,
    selectOCRLoading,
    selectExtractionLoading,
    selectTemplatesLoading,
    selectWorkflowsLoading,
  ],
  (...loadingStates) => loadingStates.some((loading) => loading)
);
