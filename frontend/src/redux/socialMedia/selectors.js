import { createSelector } from '@reduxjs/toolkit';

const selectSocialMediaState = (state) => state.socialMedia || {};

// ===== Accounts Selectors =====
export const selectAccounts = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.accounts || {}
);

export const selectAccountsList = createSelector(
  [selectAccounts],
  (accounts) => accounts.list || []
);

export const selectIsAccountsLoading = createSelector(
  [selectAccounts],
  (accounts) => accounts.isLoading || false
);

export const selectAccountsError = createSelector(
  [selectAccounts],
  (accounts) => accounts.error
);

export const selectConnectedPlatforms = createSelector(
  [selectAccounts],
  (accounts) => accounts.connectedPlatforms || {}
);

// ===== Posts Selectors =====
export const selectPosts = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.posts || {}
);

export const selectPostsList = createSelector(
  [selectPosts],
  (posts) => posts.list || []
);

export const selectIsPostsLoading = createSelector(
  [selectPosts],
  (posts) => posts.isLoading || false
);

export const selectPostsError = createSelector(
  [selectPosts],
  (posts) => posts.error
);

// ===== Analytics Selectors =====
export const selectAnalytics = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.analytics || {}
);

export const selectIsAnalyticsLoading = createSelector(
  [selectAnalytics],
  (analytics) => analytics.isLoading || false
);

export const selectAnalyticsError = createSelector(
  [selectAnalytics],
  (analytics) => analytics.error
);

export const selectAnalyticsOverview = createSelector(
  [selectAnalytics],
  (analytics) => analytics.overview
);

export const selectAnalyticsPeriod = createSelector(
  [selectAnalytics],
  (analytics) => analytics.period
);

// ===== Campaigns Selectors =====
export const selectCampaigns = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.campaigns || {}
);

export const selectCampaignsList = createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.list || []
);

export const selectCurrentCampaign = createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.current
);

export const selectActiveCampaigns = createSelector(
  [selectCampaignsList],
  (campaigns) => campaigns.filter(campaign => campaign.status === 'active')
);

export const selectIsCampaignsLoading = createSelector(
  [selectCampaigns],
  (campaigns) => campaigns.isLoading || false
);

// ===== Mentions Selectors =====
export const selectMentions = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.mentions || {}
);

export const selectMentionsList = createSelector(
  [selectMentions],
  (mentions) => mentions.list || []
);

export const selectUnreadMentions = createSelector(
  [selectMentionsList],
  (mentions) => mentions.filter(mention => !mention.read)
);

// ===== Filters & Search Selectors =====
export const selectFilters = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.filters || {}
);

export const selectPostFilter = createSelector(
  [selectFilters],
  (filters) => filters.posts || 'all'
);

export const selectSearchQuery = createSelector(
  [selectSocialMediaState],
  (socialMedia) => socialMedia.searchQuery || ''
);

// ===== Filtered Data =====
export const selectFilteredPosts = createSelector(
  [selectPostsList, selectPostFilter, selectSearchQuery],
  (posts, filter, searchQuery) => {
    let filtered = posts;

    if (filter !== 'all') {
      filtered = filtered.filter(post => post.status === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(query) ||
        post.platform.toLowerCase().includes(query)
      );
    }

    return filtered;
  }
);
