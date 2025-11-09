import { createSelector } from '@reduxjs/toolkit';

// Base selector
const selectUrlState = (state) => state.url?.urls ? state.url : state.url?.payload?.url || {};

// URL list selectors
export const selectUrls = createSelector(
  [selectUrlState],
  (urlState) => {
    // Handle nested payload shape (from action payload)
    if (urlState.payload && urlState.payload.url && urlState.payload.url.urls && Array.isArray(urlState.payload.url.urls.list)) {
      return urlState.payload.url.urls.list;
    }
    // Handle normal slice shape
    if (urlState.urls && Array.isArray(urlState.urls.list)) {
      return urlState.urls.list;
    }
    // Fallback
    return [];
  }
);

export const selectUrlsLoading = createSelector(
  [selectUrlState],
  (urlState) => urlState.urls?.loading || false
);

export const selectUrlsError = createSelector(
  [selectUrlState],
  (urlState) => urlState.urls?.error || null
);

export const selectCurrentUrl = createSelector(
  [selectUrlState],
  (urlState) => urlState.urls?.current || null
);

// Filter selectors
export const selectUrlFilters = createSelector(
  [selectUrlState],
  (urlState) => urlState.urls?.filters || {}
);

export const selectUrlPagination = createSelector(
  [selectUrlState],
  (urlState) => urlState.urls?.pagination || { current: 1, pageSize: 20, total: 0 }
);

export const selectUrlSorting = createSelector(
  [selectUrlState],
  (urlState) => ({
    sortBy: urlState.urls?.sortBy || 'created',
    sortOrder: urlState.urls?.sortOrder || 'desc'
  })
);

// Filtered URLs selector
export const selectFilteredUrls = createSelector(
  [selectUrls, selectUrlFilters],
  (urls, filters) => {
    if (!urls.length) return [];

    return urls.filter(url => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          url.originalUrl?.toLowerCase().includes(searchLower) ||
          url.shortCode?.toLowerCase().includes(searchLower) ||
          url.title?.toLowerCase().includes(searchLower) ||
          url.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (url.status !== filters.status) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (url.category !== filters.category) return false;
      }

      // Domain filter
      if (filters.domain) {
        try {
          const urlDomain = new URL(url.originalUrl).hostname;
          if (!urlDomain.includes(filters.domain)) return false;
        } catch {
          // Invalid URL format
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const urlTags = url.tags || [];
        const hasMatchingTag = filters.tags.some(tag => 
          urlTags.some(urlTag => urlTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }

      // Boolean filters
      if (filters.hasPassword !== null) {
        const hasPassword = !!url.isPasswordProtected;
        if (hasPassword !== filters.hasPassword) return false;
      }

      if (filters.hasClickLimit !== null) {
        const hasClickLimit = !!url.hasClickLimit;
        if (hasClickLimit !== filters.hasClickLimit) return false;
      }

      if (filters.hasExpiration !== null) {
        const hasExpiration = !!url.expirationDate;
        if (hasExpiration !== filters.hasExpiration) return false;
      }

      if (filters.hasUtmParams !== null) {
        const hasUtmParams = !!(url.utmSource || url.utmMedium || url.utmCampaign);
        if (hasUtmParams !== filters.hasUtmParams) return false;
      }

      // Date range filter
      if (filters.dateRange && filters.dateRange.length === 2) {
        const urlDate = new Date(url.created);
        const startDate = new Date(filters.dateRange[0]);
        const endDate = new Date(filters.dateRange[1]);
        
        if (urlDate < startDate || urlDate > endDate) return false;
      }

      return true;
    });
  }
);

// URLs by category selector
export const selectUrlsByCategory = createSelector(
  [selectUrls],
  (urls) => {
    const urlsByCategory = {};
    
    urls.forEach(url => {
      const category = url.category || 'uncategorized';
      if (!urlsByCategory[category]) {
        urlsByCategory[category] = [];
      }
      urlsByCategory[category].push(url);
    });

    return urlsByCategory;
  }
);

// URL statistics selectors
export const selectUrlStats = createSelector(
  [selectUrls],
  (urls) => {
    const stats = {
      total: urls.length,
      active: 0,
      inactive: 0,
      expired: 0,
      scheduled: 0,
      totalClicks: 0,
      passwordProtected: 0,
      withExpiration: 0,
      withClickLimit: 0
    };

    urls.forEach(url => {
      // Status counts
      switch (url.status) {
        case 'active':
          stats.active++;
          break;
        case 'inactive':
          stats.inactive++;
          break;
        case 'expired':
          stats.expired++;
          break;
        case 'scheduled':
          stats.scheduled++;
          break;
      }

      // Feature counts
      if (url.isPasswordProtected) stats.passwordProtected++;
      if (url.expirationDate) stats.withExpiration++;
      if (url.hasClickLimit) stats.withClickLimit++;
      
      // Total clicks
      stats.totalClicks += url.clickCount || 0;
    });

    return stats;
  }
);

// Analytics selectors
export const selectUrlAnalytics = createSelector(
  [selectUrlState],
  (urlState) => urlState.analytics?.data || {}
);

export const selectAnalyticsLoading = createSelector(
  [selectUrlState],
  (urlState) => urlState.analytics?.loading || false
);

export const selectAnalyticsError = createSelector(
  [selectUrlState],
  (urlState) => urlState.analytics?.error || null
);

export const selectAnalyticsDateRange = createSelector(
  [selectUrlState],
  (urlState) => urlState.analytics?.dateRange || { start: null, end: null }
);

export const selectUrlAnalyticsById = createSelector(
  [selectUrlAnalytics, (state, urlId) => urlId],
  (analytics, urlId) => analytics[urlId] || null
);

// A/B Test selectors
export const selectABTests = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.list || []
);

export const selectABTestsLoading = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.loading || false
);

export const selectABTestsError = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.error || null
);

export const selectABTestsPagination = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.pagination || { page: 1, pages: 1, count: 0, limit: 10 }
);

export const selectCurrentABTest = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.current || null
);

export const selectABTestResults = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.results || {}
);

export const selectABTestsSummary = createSelector(
  [selectUrlState],
  (urlState) => urlState.abTests?.summary || {
    totalTests: 0,
    activeTests: 0,
    completedTests: 0,
    draftTests: 0,
    recentTests: [],
    topPerformingTests: []
  }
);

export const selectABTestsRecent = createSelector(
  [selectABTestsSummary],
  (summary) => summary.recentTests || []
);

export const selectABTestsTopPerforming = createSelector(
  [selectABTestsSummary],
  (summary) => summary.topPerformingTests || []
);

// QR Code selectors
export const selectQRCode = createSelector(
  [selectUrlState],
  (urlState) => urlState.qrCode?.data || null
);

export const selectQRCodeLoading = createSelector(
  [selectUrlState],
  (urlState) => urlState.qrCode?.loading || false
);

export const selectQRCodeError = createSelector(
  [selectUrlState],
  (urlState) => urlState.qrCode?.error || null
);

// Bulk operation selectors
export const selectSelectedUrls = createSelector(
  [selectUrlState],
  (urlState) => urlState.bulk?.selectedIds || []
);

export const selectBulkLoading = createSelector(
  [selectUrlState],
  (urlState) => urlState.bulk?.loading || false
);

export const selectBulkError = createSelector(
  [selectUrlState],
  (urlState) => urlState.bulk?.error || null
);

export const selectLastBulkOperation = createSelector(
  [selectUrlState],
  (urlState) => urlState.bulk?.lastOperation || null
);

// Export selectors
export const selectExportData = createSelector(
  [selectUrlState],
  (urlState) => urlState.export?.data || null
);

export const selectExportLoading = createSelector(
  [selectUrlState],
  (urlState) => urlState.export?.loading || false
);

export const selectExportError = createSelector(
  [selectUrlState],
  (urlState) => urlState.export?.error || null
);

export const selectLastExport = createSelector(
  [selectUrlState],
  (urlState) => urlState.export?.lastExport || null
);

// UI state selectors
export const selectUrlUI = createSelector(
  [selectUrlState],
  (urlState) => urlState.ui || {}
);

export const selectSelectedUrlId = createSelector(
  [selectUrlUI],
  (ui) => ui.selectedUrl || null
);

export const selectViewMode = createSelector(
  [selectUrlUI],
  (ui) => ui.viewMode || 'table'
);

export const selectShowAnalytics = createSelector(
  [selectUrlUI],
  (ui) => ui.showAnalytics || false
);

export const selectShowFilters = createSelector(
  [selectUrlUI],
  (ui) => ui.showFilters || false
);

export const selectSidebarCollapsed = createSelector(
  [selectUrlUI],
  (ui) => ui.sidebarCollapsed || false
);

// Combined selectors for complex data
export const selectUrlsWithAnalytics = createSelector(
  [selectUrls, selectUrlAnalytics],
  (urls, analytics) => {
    return urls.map(url => ({
      ...url,
      analytics: analytics[url.id] || null
    }));
  }
);

export const selectActiveFiltersCount = createSelector(
  [selectUrlFilters],
  (filters) => {
    let count = 0;
    
    if (filters.search) count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.domain) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.hasPassword !== null) count++;
    if (filters.hasClickLimit !== null) count++;
    if (filters.hasExpiration !== null) count++;
    if (filters.hasUtmParams !== null) count++;
    if (filters.dateRange && filters.dateRange.length === 2) count++;

    return count;
  }
);

// Performance selectors
export const selectTopPerformingUrls = createSelector(
  [selectUrls],
  (urls) => {
    return [...urls]
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 10);
  }
);

export const selectRecentUrls = createSelector(
  [selectUrls],
  (urls) => {
    return [...urls]
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, 5);
  }
);

export const selectExpiringUrls = createSelector(
  [selectUrls],
  (urls) => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return urls.filter(url => {
      if (!url.expirationDate) return false;
      const expirationDate = new Date(url.expirationDate);
      return expirationDate > now && expirationDate <= nextWeek;
    });
  }
);
