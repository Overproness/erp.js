import apolloClient from '@/graphql/client';
import { getCreateMutation, getDeleteMutation, getListQuery, getReadQuery, getSearchQuery, getUpdateMutation } from '@/graphql/operations/crudFactory';
import { DOCUMENT_AUDIT_TRAIL } from '@/graphql/operations/document';
import { request } from '@/request';
import * as actionTypes from './types';

export const crud = {
  resetState:
    (props = {}) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.RESET_STATE,
      });
    },
  resetAction:
    ({ actionType }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.RESET_ACTION,
        keyState: actionType,
        payload: null,
      });
    },
  currentItem:
    ({ data }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.CURRENT_ITEM,
        payload: { ...data },
      });
    },
  currentAction:
    ({ actionType, data }) =>
    async (dispatch) => {
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
      const { crud: crudState } = getState();
      if (crudState.list.isLoading) return;

      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'list',
        payload: null,
      });

      try {
        const { data } = await apolloClient.query({
          query: getListQuery(entity),
          variables: {
            page: options.page || 1,
            limit: options.items || 10,
            sortBy: options.sortBy,
            sortValue: options.sortValue,
          },
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        });

        const queryResult = data?.[`${entity}List`];
        if (queryResult?.success) {
          const rawItems = Array.isArray(queryResult.result)
            ? queryResult.result
            : Array.isArray(queryResult.result?.items)
            ? queryResult.result.items
            : [];
          const pagination = queryResult.pagination || queryResult.result?.pagination;
          const result = {
            items: rawItems,
            pagination: {
              current: parseInt(pagination?.page || pagination?.current || options.page || 1, 10),
              pageSize: options?.items || pagination?.pageSize || 10,
              total: parseInt(pagination?.count || pagination?.total || rawItems.length, 10),
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
    ({ entity, jsonData, withUpload = false }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'create',
        payload: null,
      });

      try {
        let result;
        if (withUpload) {
          // File uploads stay REST
          if (entity === 'document') {
            result = await request.uploadDocument({ entity, jsonData });
          } else {
            result = await request.createAndUpload({ entity, jsonData });
          }
        } else {
          const { data } = await apolloClient.mutate({
            mutation: getCreateMutation(entity),
            variables: { input: jsonData },
          });
          result = data?.[`${entity}Create`];
        }

        if (result?.success) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'create',
            payload: result.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: result.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'create',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'create',
          payload: null,
        });
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
        const { data } = await apolloClient.query({
          query: getReadQuery(entity),
          variables: { id },
          fetchPolicy: 'cache-first',
        });

        const result = data?.[`${entity}Read`];
        if (result?.success) {
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: result.result,
          });
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'read',
            payload: result.result,
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
    ({ entity, id, jsonData, withUpload = false }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'update',
        payload: null,
      });

      try {
        let result;
        if (withUpload) {
          // File uploads stay REST
          result = await request.updateAndUpload({ entity, id, jsonData });
        } else {
          const { data } = await apolloClient.mutate({
            mutation: getUpdateMutation(entity),
            variables: { id, input: jsonData },
          });
          result = data?.[`${entity}Update`];
        }

        if (result?.success) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'update',
            payload: result.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: result.result,
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
        const { data } = await apolloClient.mutate({
          mutation: getDeleteMutation(entity),
          variables: { id },
        });

        const result = data?.[`${entity}Delete`];
        if (result?.success) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'delete',
            payload: result.result,
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
    ({ entity, options = {} }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'search',
        payload: null,
      });

      try {
        const { data } = await apolloClient.query({
          query: getSearchQuery(entity),
          variables: { q: options.q || '', fields: options.fields },
          fetchPolicy: 'cache-first',
        });

        const result = data?.[`${entity}Search`];
        if (result?.success) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'search',
            payload: result.result,
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

  // Special handler for document downloads
  downloadDocument:
    ({ entity, id }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'download',
        payload: null,
      });

      try {
        let response = await request.downloadDocument({ entity, id });

        if (response && response.status === 200) {
          // Get content type from response
          const contentType = response.headers['content-type'];

          // Extract filename from headers if available
          let filename = `${entity}-${id}`;
          let fileExtension = '';

          // Try to get filename from Content-Disposition header
          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }

          // Try to get file extension from X-File-Extension header
          if (response.headers['x-file-extension']) {
            fileExtension = response.headers['x-file-extension'];
            // Only add extension if filename doesn't already have it
            if (!filename.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`)) {
              filename = `${filename}.${fileExtension}`;
            }
          }

          // Create a download link and trigger it
          const url = window.URL.createObjectURL(
            new Blob([response.data], { type: contentType || 'application/octet-stream' })
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'download',
            payload: { success: true },
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'download',
            payload: null,
          });
        }
      } catch (error) {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'download',
          payload: null,
        });
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
              pagination: data.pagination || {
                current: page,
                pageSize: limit,
                total: data.result?.length || 0,
              },
            },
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'auditTrail',
            payload: null,
          });
        }
      } catch (error) {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          keyState: 'auditTrail',
          payload: null,
        });
      }
    },
};
