import { createSelector } from '@reduxjs/toolkit';

// Stable empty references to avoid re-render on every selector call
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

// Base selectors
const selectMarketingState = (state) => state.marketing || EMPTY_OBJECT;
const selectBehaviorState = (state) => state.behavior || EMPTY_OBJECT;
const selectRetargetingState = (state) => state.retargeting || EMPTY_OBJECT;

// Marketing campaign selectors
export const selectCampaigns = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.data || EMPTY_ARRAY
);

export const selectCampaignsLoading = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.loading
);

export const selectCampaignsError = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.error
);

export const selectCampaignsPagination = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.pagination
);

// Add this selector for pagination compatibility
export const selectPagination = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.pagination
);

export const selectCampaignsFilters = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.filters
);

// Add this selector for compatibility
export const selectFilters = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.filters
);

export const selectCampaignsSorting = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.sorting
);

// Add this selector for compatibility
export const selectSorting = createSelector(
  [selectMarketingState],
  (marketing) => marketing.campaigns?.sorting
);

export const selectCurrentCampaign = createSelector(
  [selectMarketingState],
  (marketing) => marketing.currentCampaign?.data
);

export const selectCurrentCampaignLoading = createSelector(
  [selectMarketingState],
  (marketing) => marketing.currentCampaign?.loading
);

export const selectCurrentCampaignError = createSelector(
  [selectMarketingState],
  (marketing) => marketing.currentCampaign?.error
);

export const selectSegments = createSelector(
  [selectMarketingState],
  (marketing) => marketing.segments?.data || EMPTY_ARRAY
);

export const selectSegmentsLoading = createSelector(
  [selectMarketingState],
  (marketing) => marketing.segments?.loading
);

export const selectSegmentsError = createSelector(
  [selectMarketingState],
  (marketing) => marketing.segments?.error
);

export const selectBulkOperationsLoading = createSelector(
  [selectMarketingState],
  (marketing) => marketing.bulkOperations?.loading
);

export const selectBulkOperationsError = createSelector(
  [selectMarketingState],
  (marketing) => marketing.bulkOperations?.error
);

export const selectBulkOperationsSuccess = createSelector(
  [selectMarketingState],
  (marketing) => marketing.bulkOperations?.success
);

export const selectSelectedCampaignIds = createSelector(
  [selectMarketingState],
  (marketing) => marketing.ui?.selectedCampaignIds || EMPTY_ARRAY
);

export const selectViewMode = createSelector(
  [selectMarketingState],
  (marketing) => marketing.ui?.viewMode || 'list'
);

export const selectShowFilters = createSelector(
  [selectMarketingState],
  (marketing) => marketing.ui?.showFilters || false
);

export const selectShowArchived = createSelector(
  [selectMarketingState],
  (marketing) => marketing.ui?.showArchived || false
);

// Filter active campaigns
export const selectActiveCampaigns = createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.filter(c => c.status === 'active')
);

// Filter draft campaigns
export const selectDraftCampaigns = createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.filter(c => c.status === 'draft')
);

// Filter completed campaigns
export const selectCompletedCampaigns = createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.filter(c => c.status === 'completed')
);

// Filter by type
export const selectCampaignsByType = (type) => createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.filter(c => c.type === type)
);

// Add the missing selector for filtered campaigns
export const selectFilteredCampaigns = createSelector(
  [selectCampaigns, selectCampaignsFilters, selectShowArchived],
  (campaigns, filters, showArchived) => {
    return campaigns.filter(campaign => {
      // Apply status filter
      if (filters?.status && campaign.status !== filters.status) {
        return false;
      }
      
      // Apply type filter
      if (filters?.type && campaign.type !== filters.type) {
        return false;
      }
      
      // Apply archived filter
      if (!showArchived && campaign.archived) {
        return false;
      }
      
      // Apply segment filter
      if (filters?.segmentId && !campaign.segments?.includes(filters.segmentId)) {
        return false;
      }
      
      // Apply search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return campaign.name.toLowerCase().includes(searchLower) ||
               campaign.description?.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }
);

// Behavior tracking selectors
export const selectBehaviorEvents = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.events?.data || EMPTY_ARRAY
);

export const selectBehaviorEventsLoading = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.events?.loading
);

export const selectBehaviorEventsError = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.events?.error
);

export const selectBehaviorEventsPagination = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.events?.pagination
);

export const selectUserHistory = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.userHistory?.data || EMPTY_OBJECT
);

export const selectUserHistoryForUser = (userId) => createSelector(
  [selectUserHistory],
  (userHistory) => userHistory[userId] || EMPTY_ARRAY
);

export const selectUserHistoryLoading = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.userHistory?.loading
);

export const selectUserHistoryError = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.userHistory?.error
);

export const selectTriggers = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.triggers?.data || EMPTY_ARRAY
);

export const selectTriggersLoading = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.triggers?.loading
);

export const selectTriggersError = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.triggers?.error
);

export const selectTriggersPagination = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.triggers?.pagination
);

export const selectCurrentTrigger = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.currentTrigger?.data
);

export const selectCurrentTriggerLoading = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.currentTrigger?.loading
);

export const selectCurrentTriggerError = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.currentTrigger?.error
);

export const selectEvaluationResult = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.evaluation?.result
);

export const selectEvaluationLoading = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.evaluation?.loading
);

export const selectEvaluationError = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.evaluation?.error
);

export const selectEventTypes = createSelector(
  [selectBehaviorState],
  (behavior) => behavior.eventTypes || EMPTY_ARRAY
);

// Filter active triggers
export const selectActiveTriggers = createSelector(
  [selectTriggers],
  (triggers) => triggers.filter(t => t.active)
);

// Retargeting selectors
export const selectRetargetingLists = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.lists?.data || EMPTY_ARRAY
);

export const selectRetargetingListsLoading = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.lists?.loading
);

export const selectRetargetingListsError = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.lists?.error
);

export const selectRetargetingListsPagination = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.lists?.pagination
);

export const selectCurrentRetargetingList = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.currentList?.data
);

export const selectCurrentRetargetingListLoading = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.currentList?.loading
);

export const selectCurrentRetargetingListError = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.currentList?.error
);

export const selectRetargetingCampaigns = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.campaigns?.data || EMPTY_ARRAY
);

export const selectRetargetingCampaignsLoading = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.campaigns?.loading
);

export const selectRetargetingCampaignsError = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.campaigns?.error
);

export const selectRetargetingCampaignsPagination = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.campaigns?.pagination
);

export const selectCurrentRetargetingCampaign = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.currentCampaign?.data
);

export const selectCurrentRetargetingCampaignLoading = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.currentCampaign?.loading
);

export const selectCurrentRetargetingCampaignError = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.currentCampaign?.error
);

export const selectRetargetingStatistics = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.statistics?.data || EMPTY_OBJECT
);

export const selectRetargetingStatisticsForCampaign = (campaignId) => createSelector(
  [selectRetargetingStatistics],
  (statistics) => statistics[campaignId]
);

export const selectRetargetingStatisticsLoading = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.statistics?.loading
);

export const selectRetargetingStatisticsError = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.statistics?.error
);

export const selectRetargetingPlatforms = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.platforms?.connections || EMPTY_OBJECT
);

export const selectRetargetingPlatformsSyncing = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.platforms?.syncing
);

export const selectRetargetingPlatformsError = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.platforms?.error
);

export const selectRetargetingPlatformsLastSyncTime = createSelector(
  [selectRetargetingState],
  (retargeting) => retargeting.platforms?.lastSyncTime
);

// Filter active retargeting campaigns
export const selectActiveRetargetingCampaigns = createSelector(
  [selectRetargetingCampaigns],
  (campaigns) => campaigns.filter(c => c.status === 'active')
);

// Filter by platform
export const selectRetargetingCampaignsByPlatform = (platform) => createSelector(
  [selectRetargetingCampaigns],
  (campaigns) => campaigns.filter(c => c.platforms.includes(platform))
);
