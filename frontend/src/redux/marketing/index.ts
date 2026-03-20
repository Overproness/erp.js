// Marketing Redux Module - Main exports

// Import reducers
import behaviorReducer from './behaviorSlice';
import campaignReducer from './campaignSlice';
import marketingReducer from './marketingSlice';
import retargetingReducer from './retargetingSlice';

// Export individual reducers
export { behaviorReducer, campaignReducer, marketingReducer, retargetingReducer };

export const marketingReducers = {
  marketing: marketingReducer,
  behavior: behaviorReducer,
  retargeting: retargetingReducer,
  campaigns: campaignReducer,
};

// Campaign Actions
export {
  bulkUpdateCampaigns,
  createABTest,
  createCampaign,
  deleteCampaign,
  duplicateCampaign,
  fetchABTestResults,
  fetchCampaignAnalytics,
  fetchCampaignById,
  // Async thunks
  fetchCampaigns,
  generateCampaignReport,
  optimizeCampaign,
  pauseCampaign,
  scheduleCampaign,
  startCampaign,
  updateABTestMetrics,
  updateCampaign,
} from './campaignSlice';

// Behavior Tracking Actions
export {
  clearCurrentTrigger,
  clearCurrentTriggerError,
  clearEvaluationError,
  clearEvaluationResults,
  clearEventsError,
  // Sync actions
  clearEventsHistory,
  clearTriggersError,
  clearUserHistory,
  clearUserHistoryError,
  createTrigger,
  deleteTrigger,
  evaluateTriggers,
  // Async thunks
  fetchBehaviorEvents,
  fetchBehaviorHistory,
  fetchTriggers,
  logBehaviorEvent,
  setCurrentTrigger,
  toggleTriggerStatus,
  updateTrigger,
} from './behaviorSlice';

// Retargeting Actions
export {
  clearAllStatistics,
  clearCampaignStatistics,
  clearCurrentList,
  clearCurrentListError, // Renamed to avoid conflict
  clearCurrentCampaign as clearCurrentRetargetingCampaign, // Renamed to avoid conflict
  clearCurrentCampaignError as clearCurrentRetargetingCampaignError,
  clearListsError,
  clearPlatformsError,
  clearCampaignsError as clearRetargetingCampaignsError, // Renamed to avoid conflict
  clearStatisticsError,
  createRetargetingCampaign,
  createRetargetingList,
  deleteRetargetingCampaign,
  deleteRetargetingList,
  fetchRetargetingCampaigns,
  // Async thunks
  fetchRetargetingLists,
  fetchRetargetingStatistics,
  launchRetargetingCampaign,
  pauseRetargetingCampaign,
  // Sync actions
  setCurrentList,
  setCurrentCampaign as setCurrentRetargetingCampaign,
  setPlatformConnection,
  syncPlatformAudiences,
  updateRetargetingCampaign,
  updateRetargetingList,
} from './retargetingSlice';
