import apolloClient from '@/graphql/client';
import {
    getCreateMutation,
    getDeleteMutation,
    getListQuery,
    getReadQuery,
    getUpdateMutation,
} from '@/graphql/operations/crudFactory';
import {
    CREATE_AB_TEST,
    GET_AB_TESTS,
    START_AB_TEST,
    STOP_AB_TEST,
    UPDATE_AB_TEST,
    URL_ANALYTICS,
    URL_GENERATE_QR,
} from '@/graphql/operations/url';
import { gql } from '@apollo/client';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunks for URL operations
export const fetchUrls = createAsyncThunk(
  'url/fetchUrls',
  async (options = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('url'),
        variables: {
          page: options.page || 1,
          limit: options.items || 20,
          sortBy: options.sortBy || 'createdAt',
          sortValue: options.sortValue || 'desc',
        },
        fetchPolicy: 'cache-first',
      });
      return data.urlList;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      return !getState().url?.list?.isLoading;
    },
  }
);

export const createUrl = createAsyncThunk(
  'url/createUrl',
  async (urlData, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getCreateMutation('url'),
        variables: { input: urlData },
      });
      return data.urlCreate;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUrl = createAsyncThunk(
  'url/updateUrl',
  async ({ id, urlData }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getUpdateMutation('url'),
        variables: { id, input: urlData },
      });
      return data.urlUpdate;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUrl = createAsyncThunk(
  'url/deleteUrl',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getDeleteMutation('url'),
        variables: { id },
      });
      return { id, ...data.urlDelete };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUrlDetails = createAsyncThunk(
  'url/fetchUrlDetails',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: getReadQuery('url'),
        variables: { id },
        fetchPolicy: 'cache-first',
      });
      return data.urlRead;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUrlAnalytics = createAsyncThunk(
  'url/fetchUrlAnalytics',
  async ({ urlId, dateRange }, { rejectWithValue }) => {
    try {
      if (!urlId) throw new Error('No urlId provided');
      let period;
      if (dateRange && dateRange.start && dateRange.end) {
        period = `${dateRange.start}_${dateRange.end}`;
      }
      const { data } = await apolloClient.query({
        query: URL_ANALYTICS,
        variables: { id: urlId, period },
        fetchPolicy: 'cache-first',
      });
      return { urlId, data: data.urlAnalytics };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const trackClick = createAsyncThunk(
  'url/trackClick',
  async ({ shortCode, metadata }, { rejectWithValue }) => {
    try {
      // Keep REST — tracking clicks has no GraphQL mutation
      const { request } = await import('@/request');
      const response = await request.create({
        entity: 'url/track',
        jsonData: { shortCode, metadata }
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const generateQRCode = createAsyncThunk(
  'url/generateQRCode',
  async ({ urlId }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: URL_GENERATE_QR,
        variables: { id: urlId },
      });
      return data.urlGenerateQR;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createABTest = createAsyncThunk(
  'url/createABTest',
  async (testData, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_AB_TEST,
        variables: { input: testData },
      });
      return data.abTestCreate;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchABTests = createAsyncThunk(
  'url/fetchABTests',
  async (options = {}, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_AB_TESTS,
        variables: {
          page: options.page || 1,
          limit: options.items || 20,
          sortBy: options.sortBy || 'createdAt',
          sortValue: options.sortValue || 'desc',
        },
        fetchPolicy: 'cache-first',
      });
      return data.abTestList;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      return !getState().url?.abTests?.isLoading;
    },
  }
);

export const bulkUpdateUrls = createAsyncThunk(
  'url/bulkUpdateUrls',
  async ({ ids, updateData }, { rejectWithValue }) => {
    try {
      // Keep REST — no GraphQL bulk update mutation
      const { request } = await import('@/request');
      const response = await request.create({
        entity: 'url/bulk-update',
        jsonData: { ids, updateData }
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkDeleteUrls = createAsyncThunk(
  'url/bulkDeleteUrls',
  async (ids, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: gql`mutation BulkDeleteUrls($ids: [ID!]!) { urlBulkDelete(ids: $ids) { success result message } }`,
        variables: { ids },
      });
      return { ids, ...data.urlBulkDelete };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Keep REST — analytics export returns file download
export const exportUrlAnalytics = createAsyncThunk(
  'url/exportUrlAnalytics',
  async ({ urlId, format = 'csv', startDate, endDate, includeRawClicks = false }, { rejectWithValue }) => {
    try {
      const { request } = await import('@/request');
      const result = await request.getAnalyticsExport({ urlId, format, startDate, endDate, includeRawClicks });
      return result;
    } catch (error) {
      return rejectWithValue(error.message || 'Export failed');
    }
  }
);

// --- A/B Test control thunks ---
export const startABTest = createAsyncThunk(
  'url/startABTest',
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: START_AB_TEST,
        variables: { id: testId },
      });
      return { testId, ...data.abTestStart };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to start test');
    }
  }
);

export const stopABTest = createAsyncThunk(
  'url/stopABTest',
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: STOP_AB_TEST,
        variables: { id: testId },
      });
      return { testId, ...data.abTestStop };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to stop test');
    }
  }
);

export const pauseABTest = createAsyncThunk(
  'url/pauseABTest',
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_AB_TEST,
        variables: { id: testId, input: { status: 'paused' } },
      });
      return { testId, ...data.abTestUpdate };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  // URL list management
  urls: {
    list: [],
    current: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      status: 'all',
      category: 'all',
      dateRange: null,
      tags: [],
      domain: '',
      hasPassword: null,
      hasClickLimit: null,
      hasExpiration: null,
      hasUtmParams: null
    },
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0
    },
    sortBy: 'created',
    sortOrder: 'desc'
  },

  // Analytics data
  analytics: {
    data: {},
    loading: false,
    error: null,
    dateRange: {
      start: null,
      end: null
    },
    realTimeEnabled: false
  },

  // A/B Testing
  abTests: {
    list: [],
    current: null,
    loading: false,
    error: null,
    results: {},
    summary: {
      totalTests: 0,
      activeTests: 0,
      completedTests: 0,
      draftTests: 0,
      recentTests: [],
      topPerformingTests: []
    },
    pagination: {
      page: 1,
      pages: 1,
      count: 0,
      limit: 10
    }
  },

  // QR Code generation
  qrCode: {
    data: null,
    loading: false,
    error: null
  },

  // Bulk operations
  bulk: {
    selectedIds: [],
    loading: false,
    error: null,
    lastOperation: null
  },

  // Export
  export: {
    loading: false,
    error: null,
    lastExport: null
  },

  // UI state
  ui: {
    selectedUrl: null,
    showAnalytics: false,
    showFilters: false,
    viewMode: 'table', // 'table' | 'grid' | 'list'
    sidebarCollapsed: false
  }
};

// URL slice
const urlSlice = createSlice({
  name: 'url',
  initialState,
  reducers: {
    // URL management actions
    setCurrentUrl: (state, action) => {
      state.urls.current = action.payload;
      state.ui.selectedUrl = action.payload?.id || null;
    },

    clearCurrentUrl: (state) => {
      state.urls.current = null;
      state.ui.selectedUrl = null;
    },

    // Filter actions
    updateFilters: (state, action) => {
      state.urls.filters = { ...state.urls.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.urls.filters = initialState.urls.filters;
    },

    // Pagination actions
    updatePagination: (state, action) => {
      state.urls.pagination = { ...state.urls.pagination, ...action.payload };
    },

    // Sorting actions
    updateSorting: (state, action) => {
      state.urls.sortBy = action.payload.sortBy;
      state.urls.sortOrder = action.payload.sortOrder;
    },

    // Bulk operations
    selectUrls: (state, action) => {
      state.bulk.selectedIds = action.payload;
    },

    selectAllUrls: (state) => {
      state.bulk.selectedIds = state.urls.list.map(url => url.id);
    },

    clearSelection: (state) => {
      state.bulk.selectedIds = [];
    },

    // Analytics actions
    setAnalyticsDateRange: (state, action) => {
      state.analytics.dateRange = action.payload;
    },

    toggleRealTimeAnalytics: (state) => {
      state.analytics.realTimeEnabled = !state.analytics.realTimeEnabled;
    },

    // UI actions
    setViewMode: (state, action) => {
      state.ui.viewMode = action.payload;
    },

    toggleSidebar: (state) => {
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    },

    toggleAnalytics: (state) => {
      state.ui.showAnalytics = !state.ui.showAnalytics;
    },

    toggleFilters: (state) => {
      state.ui.showFilters = !state.ui.showFilters;
    },

    // Reset actions
    resetUrlState: (state) => {
      return initialState;
    },

    resetAnalytics: (state) => {
      state.analytics = initialState.analytics;
    },

    clearExportState: (state) => {
      state.export = { loading: false, error: null, lastExport: null };
    }
  },
  extraReducers: (builder) => {
    // Fetch URLs
    builder
      .addCase(fetchUrls.pending, (state) => {
        state.urls.loading = true;
        state.urls.error = null;
      })
      .addCase(fetchUrls.fulfilled, (state, action) => {
        state.urls.loading = false;
        state.urls.list = action.payload.result || [];
        state.urls.pagination.total = action.payload.pagination?.total || 0;
        state.urls.pagination.current = action.payload.pagination?.current || 1;
      })
      .addCase(fetchUrls.rejected, (state, action) => {
        state.urls.loading = false;
        state.urls.error = action.payload;
      });

    // Create URL
    builder
      .addCase(createUrl.pending, (state) => {
        state.urls.loading = true;
        state.urls.error = null;
      })
      .addCase(createUrl.fulfilled, (state, action) => {
        state.urls.loading = false;
        if (action.payload.result) {
          state.urls.list.unshift(action.payload.result);
          state.urls.pagination.total += 1;
        }
      })
      .addCase(createUrl.rejected, (state, action) => {
        state.urls.loading = false;
        state.urls.error = action.payload;
      });

    // Update URL
    builder
      .addCase(updateUrl.pending, (state) => {
        state.urls.loading = true;
        state.urls.error = null;
      })
      .addCase(updateUrl.fulfilled, (state, action) => {
        state.urls.loading = false;
        if (action.payload.result) {
          const index = state.urls.list.findIndex(url => url.id === action.payload.result.id);
          if (index !== -1) {
            state.urls.list[index] = action.payload.result;
          }
          if (state.urls.current?.id === action.payload.result.id) {
            state.urls.current = action.payload.result;
          }
        }
      })
      .addCase(updateUrl.rejected, (state, action) => {
        state.urls.loading = false;
        state.urls.error = action.payload;
      });

    // Delete URL
    builder
      .addCase(deleteUrl.pending, (state) => {
        state.urls.loading = true;
        state.urls.error = null;
      })
      .addCase(deleteUrl.fulfilled, (state, action) => {
        state.urls.loading = false;
        state.urls.list = state.urls.list.filter(url => url.id !== action.payload.id);
        state.urls.pagination.total = Math.max(0, state.urls.pagination.total - 1);
        if (state.urls.current?.id === action.payload.id) {
          state.urls.current = null;
        }
        // Remove from selection if it was selected
        state.bulk.selectedIds = state.bulk.selectedIds.filter(id => id !== action.payload.id);
      })
      .addCase(deleteUrl.rejected, (state, action) => {
        state.urls.loading = false;
        state.urls.error = action.payload;
      });

    // Fetch URL details
    builder
      .addCase(fetchUrlDetails.pending, (state) => {
        state.urls.loading = true;
        state.urls.error = null;
      })
      .addCase(fetchUrlDetails.fulfilled, (state, action) => {
        state.urls.loading = false;
        state.urls.current = action.payload.result;
      })
      .addCase(fetchUrlDetails.rejected, (state, action) => {
        state.urls.loading = false;
        state.urls.error = action.payload;
      });

    // Fetch analytics
    builder
      .addCase(fetchUrlAnalytics.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchUrlAnalytics.fulfilled, (state, action) => {
        state.analytics.loading = false;
        // Store the full analytics result object for the urlId
        state.analytics.data[action.payload.urlId] = action.payload.data.result;
      })
      .addCase(fetchUrlAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      });

    // Generate QR Code
    builder
      .addCase(generateQRCode.pending, (state) => {
        state.qrCode.loading = true;
        state.qrCode.error = null;
      })
      .addCase(generateQRCode.fulfilled, (state, action) => {
        state.qrCode.loading = false;
        state.qrCode.data = action.payload.result;
      })
      .addCase(generateQRCode.rejected, (state, action) => {
        state.qrCode.loading = false;
        state.qrCode.error = action.payload;
      });

    // A/B Tests
    builder
      .addCase(fetchABTests.pending, (state) => {
        state.abTests.loading = true;
        state.abTests.error = null;
      })
      .addCase(fetchABTests.fulfilled, (state, action) => {
        state.abTests.loading = false;
        // The summary endpoint returns a summary object
        if (action.payload.result) {
          state.abTests.summary = action.payload.result;
          // For compatibility, set list to recentTests
          state.abTests.list = action.payload.result.recentTests || [];
          // Optionally, set pagination count to totalTests
          state.abTests.pagination.count = action.payload.result.totalTests || 0;
        }
      })
      .addCase(fetchABTests.rejected, (state, action) => {
        state.abTests.loading = false;
        state.abTests.error = action.payload;
      });

    builder
      .addCase(createABTest.pending, (state) => {
        state.abTests.loading = true;
        state.abTests.error = null;
      })
      .addCase(createABTest.fulfilled, (state, action) => {
        state.abTests.loading = false;
        if (action.payload.result) {
          state.abTests.list.unshift(action.payload.result);
          state.abTests.pagination.count += 1;
        }
      })
      .addCase(createABTest.rejected, (state, action) => {
        state.abTests.loading = false;
        state.abTests.error = action.payload;
      });

    // Bulk operations
    builder
      .addCase(bulkUpdateUrls.pending, (state) => {
        state.bulk.loading = true;
        state.bulk.error = null;
        state.bulk.lastOperation = 'update';
      })
      .addCase(bulkUpdateUrls.fulfilled, (state, action) => {
        state.bulk.loading = false;
        state.bulk.selectedIds = [];
        // Refresh the list to get updated data
      })
      .addCase(bulkUpdateUrls.rejected, (state, action) => {
        state.bulk.loading = false;
        state.bulk.error = action.payload;
      });

    builder
      .addCase(bulkDeleteUrls.pending, (state) => {
        state.bulk.loading = true;
        state.bulk.error = null;
        state.bulk.lastOperation = 'delete';
      })
      .addCase(bulkDeleteUrls.fulfilled, (state, action) => {
        state.bulk.loading = false;
        state.urls.list = state.urls.list.filter(url => !action.payload.ids.includes(url.id));
        state.urls.pagination.total = Math.max(0, state.urls.pagination.total - action.payload.ids.length);
        state.bulk.selectedIds = [];
      })
      .addCase(bulkDeleteUrls.rejected, (state, action) => {
        state.bulk.loading = false;
        state.bulk.error = action.payload;
      });

    // Export analytics
    builder
      .addCase(exportUrlAnalytics.pending, (state) => {
        state.export.loading = true;
        state.export.error = null;
        state.export.lastExport = null;
      })
      .addCase(exportUrlAnalytics.fulfilled, (state, action) => {
        state.export.loading = false;
        state.export.lastExport = action.payload;
      })
      .addCase(exportUrlAnalytics.rejected, (state, action) => {
        state.export.loading = false;
        state.export.error = action.payload;
      });

    // --- A/B Test control reducers ---
    builder
      .addCase(startABTest.pending, (state) => {
        state.abTests.loading = true;
        state.abTests.error = null;
      })
      .addCase(startABTest.fulfilled, (state, action) => {
        state.abTests.loading = false;
        // Update the test status in the list
        const idx = state.abTests.list.findIndex(t => t._id === action.payload.testId);
        if (idx !== -1 && action.payload.result) {
          state.abTests.list[idx] = { ...state.abTests.list[idx], ...action.payload.result };
        }
      })
      .addCase(startABTest.rejected, (state, action) => {
        state.abTests.loading = false;
        state.abTests.error = action.payload;
      });

    builder
      .addCase(stopABTest.pending, (state) => {
        state.abTests.loading = true;
        state.abTests.error = null;
      })
      .addCase(stopABTest.fulfilled, (state, action) => {
        state.abTests.loading = false;
        const idx = state.abTests.list.findIndex(t => t._id === action.payload.testId);
        if (idx !== -1 && action.payload.result) {
          state.abTests.list[idx] = { ...state.abTests.list[idx], ...action.payload.result };
        }
      })
      .addCase(stopABTest.rejected, (state, action) => {
        state.abTests.loading = false;
        state.abTests.error = action.payload;
      });

    builder
      .addCase(pauseABTest.pending, (state) => {
        state.abTests.loading = true;
        state.abTests.error = null;
      })
      .addCase(pauseABTest.fulfilled, (state, action) => {
        state.abTests.loading = false;
        const idx = state.abTests.list.findIndex(t => t._id === action.payload.testId);
        if (idx !== -1 && action.payload.result) {
          state.abTests.list[idx] = { ...state.abTests.list[idx], ...action.payload.result };
        }
      })
      .addCase(pauseABTest.rejected, (state, action) => {
        state.abTests.loading = false;
        state.abTests.error = action.payload;
      });
  }
});

// Export actions
export const {
  setCurrentUrl,
  clearCurrentUrl,
  updateFilters,
  clearFilters,
  updatePagination,
  updateSorting,
  selectUrls,
  selectAllUrls,
  clearSelection,
  setAnalyticsDateRange,
  toggleRealTimeAnalytics,
  setViewMode,
  toggleSidebar,
  toggleAnalytics,
  toggleFilters,
  resetUrlState,
  resetAnalytics,
  clearExportState
} = urlSlice.actions;

// Export reducer
export default urlSlice.reducer;