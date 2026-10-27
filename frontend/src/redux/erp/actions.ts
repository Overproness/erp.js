import apolloClient from '@/graphql/client';
import {
    getConvertMutation,
    getCreateMutation,
    getDeleteMutation,
    getFilterQuery,
    getListQuery,
    getMailMutation,
    getReadQuery,
    getSearchQuery,
    getSummaryQuery,
    getUpdateMutation,
} from '@/graphql/operations/crudFactory';
import { DOCUMENT_ANALYZE, DOCUMENT_AUDIT_TRAIL, DOCUMENT_REVERT, DOCUMENT_REVERT_TO_ORIGINAL } from '@/graphql/operations/document';
import { handleCustomRequest } from '@/request/customRequests';
import downloadDocument from '@/request/downloadDocument';
import * as actionTypes from './types';

export const erp = {
  resetState: () => (dispatch) => {
    dispatch({
      type: actionTypes.RESET_STATE,
    });
  },
  resetAction:
    ({ actionType }) =>
    (dispatch) => {
      dispatch({
        type: actionTypes.RESET_ACTION,
        keyState: actionType,
        payload: null,
      });
    },
  currentItem:
    ({ data }) =>
    (dispatch) => {
      dispatch({
        type: actionTypes.CURRENT_ITEM,
        payload: { ...data },
      });
    },
  currentAction:
    ({ actionType, data }) =>
    (dispatch) => {
      dispatch({
        type: actionTypes.CURRENT_ACTION,
        keyState: actionType,
        payload: { ...data },
      });
    },
  list:
    ({ entity, options = { page: 1, items: 10 } }) =>
    async (dispatch, getState) => {
      // Prevent duplicate in-flight requests
      const { erp: erpState } = getState();
      if (erpState.list.isLoading) return;

      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'list',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.query({
          query: getListQuery(entity),
          variables: {
            page: options.page || 1,
            limit: options.items || 10,
            sortBy: options.sortBy || 'createdAt',
            sortValue: options.sortValue || 'desc',
          },
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        });
        const data = gqlData?.[`${entity}List`];
        if (data && data.success === true) {
          const rawItems = Array.isArray(data.result)
            ? data.result
            : Array.isArray(data.result?.items)
            ? data.result.items
            : [];
          const pagination = data.result?.pagination || data.pagination;
          const result = {
            items: rawItems,
            pagination: {
              current: parseInt(pagination?.current || pagination?.page || 1, 10),
              pageSize: options?.items || pagination?.pageSize || 10,
              total: parseInt(pagination?.total || pagination?.count || rawItems.length, 10),
            },
          };
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'list',
            payload: result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'list',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'list',
          payload: null,
        });
      }
    },
  create:
    ({ entity, jsonData }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'create',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.mutate({
          mutation: getCreateMutation(entity),
          variables: { input: jsonData },
        });
        const data = gqlData[`${entity}Create`];

        if (data && data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'create',
            payload: data.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });
          return { success: true };
        } else {
          throw new Error(data?.message || `Failed to create ${entity}`);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || `Failed to create ${entity}`;

        if (error.response?.status === 413 || errorMessage.includes('file size')) {
          const sizeError =
            'File size exceeds the maximum allowed limit (50MB). Please upload a smaller file.';
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'create',
            payload: { error: sizeError },
          });
          throw new Error(sizeError);
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'create',
            payload: { error: errorMessage },
          });
          throw error;
        }
      }
    },
  recordPayment:
    ({ entity, jsonData }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'recordPayment',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.mutate({
          mutation: getCreateMutation(entity),
          variables: { input: jsonData },
        });
        const data = gqlData[`${entity}Create`];

        if (data && data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'recordPayment',
            payload: data.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result.invoice,
          });
          return { success: true };
        } else {
          throw new Error(data?.message || 'Failed to record payment');
        }
      } catch (error) {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'recordPayment',
          payload: null,
        });
        throw error;
      }
    },
  read:
    ({ entity, id }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'read',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.query({
          query: getReadQuery(entity),
          variables: { id },
          fetchPolicy: 'cache-first',
        });
        const data = gqlData[`${entity}Read`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'read',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'read',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'read',
          payload: null,
        });
      }
    },
  update:
    ({ entity, id, jsonData }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'update',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.mutate({
          mutation: getUpdateMutation(entity),
          variables: { id, input: jsonData },
        });
        const data = gqlData[`${entity}Update`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'update',
            payload: data.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'update',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'update',
          payload: null,
        });
      }
    },

  delete:
    ({ entity, id }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.RESET_ACTION,
        keyState: 'delete',
      });
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'delete',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.mutate({
          mutation: getDeleteMutation(entity),
          variables: { id },
        });
        const data = gqlData[`${entity}Delete`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'delete',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'delete',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'delete',
          payload: null,
        });
      }
    },

  search:
    ({ entity, options }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'search',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.query({
          query: getSearchQuery(entity),
          variables: { q: options.q || '', fields: options.fields },
          fetchPolicy: 'cache-first',
        });
        const data = gqlData[`${entity}Search`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'search',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'search',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'search',
          payload: null,
        });
      }
    },

  advancedSearch:
    ({ entity, options }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'advancedSearch',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.query({
          query: getFilterQuery(entity),
          variables: { filter: options },
          fetchPolicy: 'cache-first',
        });
        const data = gqlData[`${entity}Filter`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'advancedSearch',
            payload: {
              result: data.result,
              pagination: data.pagination,
            },
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'advancedSearch',
            payload: null,
          });
        }
      } catch (error) {
        console.error('Advanced search error:', error);
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'advancedSearch',
          payload: { error: error.message || 'Search failed' },
        });
      }
    },

  summary:
    ({ entity, options }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'summary',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.query({
          query: getSummaryQuery(entity),
          fetchPolicy: 'cache-first',
        });
        const data = gqlData[`${entity}Summary`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'summary',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'summary',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'summary',
          payload: null,
        });
      }
    },

  mail:
    ({ entity, jsonData }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'mail',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.mutate({
          mutation: getMailMutation(entity),
          variables: { id: jsonData.id, input: jsonData },
        });
        const data = gqlData[`${entity}Mail`];

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'mail',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'mail',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'mail',
          payload: null,
        });
      }
    },

  convert:
    ({ entity, id }) =>
    async () => {
      await apolloClient.mutate({
        mutation: getConvertMutation(entity),
        variables: { id },
      });
    },

  downloadDocument:
    ({ entity, id }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'download',
        payload: null,
      });

      try {
        const response = await downloadDocument({ entity, id });

        if (response && response.status === 200) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'download',
            payload: { success: true },
          });
          return { success: true };
        } else {
          throw new Error(response?.message || 'Download failed');
        }
      } catch (error) {
        console.error('Download error:', error);
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'download',
          payload: error.message || 'Download failed',
        });
        throw error;
      }
    },

  revertToOriginal:
    ({ entity, id }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'revert',
        payload: null,
      });

      try {
        // Use GraphQL mutation for reverting to original
        const { data: gqlData } = await apolloClient.mutate({
          mutation: DOCUMENT_REVERT_TO_ORIGINAL,
          variables: { id },
        });
        const data = gqlData.documentRevertToOriginal;

        if (data && data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'revert',
            payload: data.result,
          });

          // Also update the current item to reflect changes
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });

          return { success: true, result: data.result };
        } else {
          const errorMessage = data?.message || 'Failed to revert to original document';
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'revert',
            payload: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Revert failed';
        console.error('Error reverting document to original:', error);

        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'revert',
          payload: errorMessage,
        });
        throw error;
      }
    },

  revertToVersion:
    ({ entity, id, versionNumber }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'revert',
        payload: null,
      });

      try {
        // For version 0, use revertToOriginal instead
        if (versionNumber === 0) {
          return dispatch(erp.revertToOriginal({ entity, id }));
        }

        // Parse version number to ensure it's a valid integer
        const numVersion = parseInt(versionNumber, 10);
        if (isNaN(numVersion) || numVersion < 1) {
          throw new Error('Invalid version number. Must be a positive integer.');
        }

        const { data: gqlData } = await apolloClient.mutate({
          mutation: DOCUMENT_REVERT,
          variables: { id, version: numVersion },
        });
        const data = gqlData.documentRevertToVersion;

        if (data && data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'revert',
            payload: data.result,
          });

          // Also update the current item to reflect changes
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });

          return { success: true, result: data.result };
        } else {
          const errorMessage = data?.message || 'Failed to revert document';
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'revert',
            payload: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Revert failed';
        console.error('Error reverting document to version:', error);

        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'revert',
          payload: errorMessage,
        });
        throw error;
      }
    },

  analyzeDocument:
    ({ entity, id }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.ANALYZE_ERP_ITEM_REQUEST,
        payload: null,
      });

      try {
        // Use GraphQL mutation for document analysis
        const { data: gqlData } = await apolloClient.mutate({
          mutation: DOCUMENT_ANALYZE,
          variables: { id },
        });
        const data = gqlData.documentAnalyze;

        if (data && data.success === true) {
          dispatch({
            type: actionTypes.ANALYZE_ERP_ITEM_SUCCESS,
            payload: data.result,
          });
          return { success: true, result: data.result };
        } else {
          const errorMessage = data?.message || 'Failed to analyze document';
          dispatch({
            type: actionTypes.ANALYZE_ERP_ITEM_FAILURE,
            payload: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Analysis failed';
        dispatch({
          type: actionTypes.ANALYZE_ERP_ITEM_FAILURE,
          payload: errorMessage,
        });
        throw error;
      }
    },
  getAuditTrail:
    ({ entity, id, page = 1, limit = 20, filter = {} }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'auditTrail',
        payload: null,
      });

      try {
        const { data: gqlData } = await apolloClient.query({
          query: DOCUMENT_AUDIT_TRAIL,
          variables: { id },
        });
        const data = gqlData.documentAuditTrail;

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'auditTrail',
            payload: {
              result: data.result,
              pagination: data.pagination,
            },
          });
          return { success: true, result: data.result, pagination: data.pagination };
        } else {
          const errorMessage = data?.message || 'Failed to get audit trail';
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'auditTrail',
            payload: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'Failed to get audit trail';
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'auditTrail',
          payload: errorMessage,
        });
        throw error;
      }
    },

  custom:
    ({ entity, customAction, jsonData }) =>
    async (dispatch) => {
      const actionKey = customAction;

      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: actionKey,
        payload: null,
      });

      try {
        const data = await handleCustomRequest({ entity, customAction, jsonData });

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: actionKey,
            payload: data.result,
          });

          // Refresh the list or current item after a successful operation
          if (jsonData.teamId) {
            dispatch(erp.read({ entity, id: jsonData.teamId }));
          }

          return { success: true, result: data.result };
        } else {
          const errorMessage = data?.message || `Failed to execute ${customAction}`;
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: actionKey,
            payload: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || `Failed to execute ${customAction}`;
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: actionKey,
          payload: errorMessage,
        });
        throw error;
      }
    },
};
