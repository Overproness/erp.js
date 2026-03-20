import { request } from '@/request';
import * as actionTypes from './types';
import apolloClient from '@/graphql/client';
import { USER_PERMISSIONS } from '@/graphql/operations/auth';

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
      const { data: gqlData } = await apolloClient.query({
        query: USER_PERMISSIONS,
        fetchPolicy: 'network-only',
      });
      const data = gqlData.userPermissions;
      
      if (data.success === true) {
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
        dispatch({
          type: actionTypes.FETCH_PERMISSIONS_FAILURE,
          payload: errorMessage
        });
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
