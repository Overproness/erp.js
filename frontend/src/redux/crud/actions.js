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
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'list',
        payload: null,
      });

      let data = await request.list({ entity, options });

      if (data.success === true) {
        const result = {
          items: data.result || [],
          pagination: {
            current: parseInt(data.pagination?.page || options.page, 10),
            pageSize: options?.items || 10,
            total: parseInt(data.pagination?.count || 0, 10),
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
    },
  create:
    ({ entity, jsonData, withUpload = false }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'create',
        payload: null,
      });
      let data = null;
      if (withUpload) {
        // Handle file uploads - especially for documents
        if (entity === 'document') {
          data = await request.uploadDocument({ entity, jsonData });
        } else {
          data = await request.createAndUpload({ entity, jsonData });
        }
      } else {
        data = await request.create({ entity, jsonData });
      }

      if (data.success === true) {
        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
          keyState: 'create',
          payload: data.result,
        });

        dispatch({
          type: actionTypes.CURRENT_ITEM,
          payload: data.result,
        });
      } else {
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

      let data = await request.read({ entity, id });

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
    },
  update:
    ({ entity, id, jsonData, withUpload = false }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'update',
        payload: null,
      });

      let data = null;

      if (withUpload) {
        data = await request.updateAndUpload({ entity, id, jsonData });
      } else {
        data = await request.update({ entity, id, jsonData });
      }

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

      let data = await request.delete({ entity, id });

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
    },

  search:
    ({ entity, options = {} }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
        keyState: 'search',
        payload: null,
      });

      let data = await request.search({ entity, options });

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
        const data = await request.getAuditTrail({ entity, id, page, limit, filter });

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
