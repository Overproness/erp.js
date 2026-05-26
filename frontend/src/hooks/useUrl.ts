import {
  bulkDeleteUrls,
  bulkUpdateUrls,
  clearSelection,
  createUrl,
  deleteUrl,
  fetchUrlDetails,
  fetchUrls,
  selectBulkLoading,
  selectCurrentUrl,
  selectFilteredUrls,
  selectSelectedUrls,
  selectUrlFilters,
  selectUrlPagination,
  selectUrls,
  selectUrlsError,
  selectUrlsLoading,
  selectUrlStats,
  updateFilters,
  updatePagination,
  updateUrl,
} from '@/redux/url';
import { message } from '@/components/ui';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useUrlManagement = () => {
  const dispatch = useDispatch();

  // Only use specific selectors, never the root state!
  const urlsRaw = useSelector(selectUrls);
  const filteredUrlsRaw = useSelector(selectFilteredUrls);
  const currentUrl = useSelector(selectCurrentUrl);
  const isLoading = useSelector(selectUrlsLoading);
  const error = useSelector(selectUrlsError);
  const filters = useSelector(selectUrlFilters);
  const pagination = useSelector(selectUrlPagination);
  const stats = useSelector(selectUrlStats);
  const selectedUrls = useSelector(selectSelectedUrls);
  const bulkLoading = useSelector(selectBulkLoading);

  // Always extract the array of URLs from urlsRaw (handle action payload shape)
  const urls = useMemo(() => {
    // If coming from an action payload, dig into .payload.url.urls.list
    if (
      urlsRaw &&
      typeof urlsRaw === 'object' &&
      urlsRaw.type === 'url/selectUrls' &&
      urlsRaw.payload &&
      urlsRaw.payload.url &&
      urlsRaw.payload.url.urls &&
      Array.isArray(urlsRaw.payload.url.urls.list)
    ) {
      return urlsRaw.payload.url.urls.list;
    }
    // If urlsRaw is the urls slice, dig into .urls.list
    if (urlsRaw && urlsRaw.urls && Array.isArray(urlsRaw.urls.list)) {
      return urlsRaw.urls.list;
    }
    // If urlsRaw is already an array
    if (Array.isArray(urlsRaw)) return urlsRaw;
    // If urlsRaw is an object with a list property
    if (urlsRaw && Array.isArray(urlsRaw.list)) return urlsRaw.list;
    return [];
  }, [urlsRaw]);

  const filteredUrls = useMemo(
    () => (Array.isArray(filteredUrlsRaw) ? filteredUrlsRaw : []),
    [filteredUrlsRaw]
  );

  // Actions
  const refreshUrls = useCallback(
    (options = {}) => {
      return dispatch(fetchUrls({ ...filters, ...pagination, ...options }));
    },
    [dispatch, filters, pagination]
  );

  const createNewUrl = useCallback(
    async (urlData) => {
      try {
        const result = await dispatch(createUrl(urlData)).unwrap();
        message.success('URL created successfully');
        return result;
      } catch (error) {
        message.error(error.message || 'Failed to create URL');
        throw error;
      }
    },
    [dispatch]
  );

  const updateExistingUrl = useCallback(
    async (id, urlData) => {
      try {
        const result = await dispatch(updateUrl({ id, urlData })).unwrap();
        message.success('URL updated successfully');
        return result;
      } catch (error) {
        message.error(error.message || 'Failed to update URL');
        throw error;
      }
    },
    [dispatch]
  );

  const deleteExistingUrl = useCallback(
    async (id) => {
      try {
        const result = await dispatch(deleteUrl(id)).unwrap();
        message.success('URL deleted successfully');
        return result;
      } catch (error) {
        message.error(error.message || 'Failed to delete URL');
        throw error;
      }
    },
    [dispatch]
  );

  const getUrlDetails = useCallback(
    async (id) => {
      try {
        const result = await dispatch(fetchUrlDetails(id)).unwrap();
        return result;
      } catch (error) {
        message.error(error.message || 'Failed to fetch URL details');
        throw error;
      }
    },
    [dispatch]
  );

  const updateUrlFilters = useCallback(
    (newFilters) => {
      dispatch(updateFilters(newFilters));
    },
    [dispatch]
  );

  const updateUrlPagination = useCallback(
    (newPagination) => {
      dispatch(updatePagination(newPagination));
    },
    [dispatch]
  );

  const performBulkUpdate = useCallback(
    async (updateData) => {
      if (selectedUrls.length === 0) {
        message.warning('Please select URLs to update');
        return;
      }

      try {
        const result = await dispatch(
          bulkUpdateUrls({
            ids: selectedUrls,
            updateData,
          })
        ).unwrap();
        message.success(`${selectedUrls.length} URLs updated successfully`);
        dispatch(clearSelection());
        return result;
      } catch (error) {
        message.error(error.message || 'Failed to update URLs');
        throw error;
      }
    },
    [dispatch, selectedUrls]
  );

  const performBulkDelete = useCallback(async () => {
    if (selectedUrls.length === 0) {
      message.warning('Please select URLs to delete');
      return;
    }

    try {
      const result = await dispatch(bulkDeleteUrls(selectedUrls)).unwrap();
      message.success(`${selectedUrls.length} URLs deleted successfully`);
      dispatch(clearSelection());
      return result;
    } catch (error) {
      message.error(error.message || 'Failed to delete URLs');
      throw error;
    }
  }, [dispatch, selectedUrls]);

  return {
    // Data
    urls,
    filteredUrls,
    currentUrl,
    stats,
    selectedUrls,

    // State
    isLoading,
    bulkLoading,
    error,
    filters,
    pagination,

    // Actions
    refreshUrls,
    createUrl: createNewUrl,
    updateUrl: updateExistingUrl,
    deleteUrl: deleteExistingUrl,
    getUrl: getUrlDetails,
    updateFilters: updateUrlFilters,
    updatePagination: updateUrlPagination,
    bulkUpdate: performBulkUpdate,
    bulkDelete: performBulkDelete,
  };
};
