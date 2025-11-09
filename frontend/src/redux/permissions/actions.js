import { request } from '@/request';
import * as actionTypes from './types';

export const permissions = {
  fetch: () => async (dispatch, getState) => {
    const { auth } = getState();
    const currentUser = auth.current;

    // CompanyOwners don't need permissions - they have full access
    if (currentUser && currentUser.role === 'owner') {
      dispatch({
        type: actionTypes.SET_PERMISSIONS,
        payload: { 
          permissions: {}, 
          isOwner: true,
          role: currentUser.role,
          email: currentUser.email,
          name: currentUser.name,
          userId: currentUser._id
        }
      });
      return;
    }

    dispatch({
      type: actionTypes.FETCH_PERMISSIONS_REQUEST
    });

    try {
      const data = await request.get('/user/permissions');
      
      if (data.success === true) {
        console.log('Permissions loaded:', data.result.permissions);
        
        dispatch({
          type: actionTypes.FETCH_PERMISSIONS_SUCCESS,
          payload: {
            permissions: data.result.permissions || {},
            isOwner: data.result.isOwner || false,
            role: data.result.role,
            email: data.result.email,
            name: data.result.name,
            userId: data.result.userId
          }
        });
      } else {
        const errorMessage = data.message || 'Failed to fetch permissions';
        
        if (data.permissionError || data.statusCode === 403) {
          dispatch({
            type: actionTypes.FETCH_PERMISSIONS_FAILURE,
            payload: 'Access denied: Unable to fetch user permissions'
          });
        } else if (data.authError || data.statusCode === 401) {
          dispatch({
            type: actionTypes.FETCH_PERMISSIONS_FAILURE,
            payload: 'Authentication required: Please login again'
          });
        } else {
          dispatch({
            type: actionTypes.FETCH_PERMISSIONS_FAILURE,
            payload: errorMessage
          });
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      
      const errorMessage = error.message || 'Failed to fetch permissions';
      
      dispatch({
        type: actionTypes.FETCH_PERMISSIONS_FAILURE,
        payload: errorMessage
      });
    }
  },

  clear: () => (dispatch) => {
    dispatch({
      type: actionTypes.CLEAR_PERMISSIONS
    });
  },

  set: (permissions, isOwner = false) => (dispatch) => {
    dispatch({
      type: actionTypes.SET_PERMISSIONS,
      payload: { permissions, isOwner }
    });
  },

  // Helper to check if user has specific permission
  hasPermission: (permission) => (dispatch, getState) => {
    const { permissions: permState, auth } = getState();
    
    // CompanyOwners have all permissions
    if (permState.isOwner || auth.current?.role === 'owner') {
      return true;
    }

    // Check object-based permissions
    if (permState.permissions && typeof permState.permissions === 'object') {
      return permState.permissions[permission] === true;
    }

    // Fallback to array-based permissions
    return Array.isArray(permState.permissions) && permState.permissions.includes(permission);
  }
};
