import * as actionTypes from './types';
import * as authService from '@/auth';
import { request } from '@/request';
import storePersist from '@/redux/storePersist';
import apolloClient from '@/graphql/client';
import { UPDATE_ADMIN, UPDATE_PROFILE } from '@/graphql/operations/auth';
import { subscriptionActions } from '@/redux/subscription/subscriptionSlice';

export const login =
  ({ loginData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.login({ loginData });
    
    if (data.success === true) {
      // Enhanced logging for debugging
      console.log('Login response data:', {
        onboardingComplete: data.result.onboardingComplete,
        typeOfFlag: typeof data.result.onboardingComplete,
        rawValue: data.result.onboardingComplete,
        role: data.result.role,
        userType: data.result.userType
      });

      // For Users (non-owners), onboarding is not required
      // Only CompanyOwners need onboarding
      let onboardingComplete = true;
      let needsOnboarding = false;

      if (data.result.role === 'owner' || data.result.userType === 'CompanyOwner') {
        // IMPORTANT: We use a strict comparison to ensure boolean interpretation
        // This forces false for anything except explicit true
        onboardingComplete = data.result.onboardingComplete === true;
        needsOnboarding = !onboardingComplete;
      }
      
      console.log('After role-based onboarding check:', {
        role: data.result.role,
        userType: data.result.userType,
        onboardingComplete,
        needsOnboarding
      });
      
      const auth_state = {
        current: {
          ...data.result,
          // Force the correct boolean values to ensure consistency
          onboardingComplete: onboardingComplete,
          needsOnboarding: needsOnboarding
        },
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      
      // Use storePersist consistently instead of directly accessing localStorage
      storePersist.set('auth', auth_state);
      storePersist.remove('isLogout');
      
      // If this is the first login after registration, retrieve company name
      const companyName = localStorage.getItem('company_name');
      if (companyName) {
        auth_state.current.companyName = companyName; 
      }
      
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: {
          ...data.result,
          onboardingComplete,
          needsOnboarding,
          companyName: companyName || ''
        },
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const register =
  ({ registerData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    
    // Extract company name before sending to API
    const { company_name, ...userData } = registerData;
    const companyName = company_name;
    
    const data = await authService.register({ registerData: userData });

    if (data.success === true) {
      // Store the company name for the onboarding process
      localStorage.setItem('company_name', companyName);
      
      // Return success and indicate need for onboarding
      dispatch({
        type: actionTypes.REGISTER_SUCCESS,
        payload: {
          needsOnboarding: true,
          companyName
        }
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const verify =
  ({ userId, emailToken }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.verify({ userId, emailToken });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      // Use storePersist consistently
      storePersist.set('auth', auth_state);
      storePersist.remove('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const resetPassword =
  ({ resetPasswordData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.resetPassword({ resetPasswordData });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      // Use storePersist consistently
      storePersist.set('auth', auth_state);
      storePersist.remove('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const logout = () => async (dispatch) => {
  // First dispatch loading action
  dispatch({
    type: actionTypes.REQUEST_LOADING,
  });

  try {
    // Clean up local storage directly first
    localStorage.removeItem('auth');
    localStorage.removeItem('persist:root');
    localStorage.removeItem('isLogout');
    
    // Then use storePersist to ensure Redux state is cleaned up
    storePersist.set('isLogout', true);
    storePersist.remove('auth');
    
    // Don't wait for server logout to complete - fire and forget
    // This prevents the user from getting stuck if server logout fails
    authService.logout();
    
    // Complete the logout action immediately
    dispatch({
      type: actionTypes.LOGOUT_SUCCESS,
    });
    dispatch(subscriptionActions.resetSubscription());
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Even if there's an error, we should still clear state and complete logout
    localStorage.removeItem('auth');
    localStorage.removeItem('persist:root');
    localStorage.removeItem('isLogout');
    
    storePersist.set('isLogout', true);
    storePersist.remove('auth');
    
    dispatch({
      type: actionTypes.LOGOUT_SUCCESS,
    });
    dispatch(subscriptionActions.resetSubscription());
  }
};

export const updateUserAction =
  ({ entity, jsonData }) =>
  async (dispatch) => {
    try {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });
      const { data: gqlData } = await apolloClient.mutate({
        mutation: UPDATE_ADMIN,
        variables: { id: jsonData._id, input: jsonData },
      });
      const data = gqlData.adminUpdate;

      if (data.success === true) {
        const auth_state = {
          current: {
            ...storePersist.get('auth').current,
            name: data.result.name,
          },
          isLoggedIn: true,
          isLoading: false,
          isSuccess: true,
        };
        storePersist.set('auth', auth_state);
        storePersist.remove('isLogout');
        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
          payload: data.result,
        });
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    } catch (error) {
      console.log(error);
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const updateProfile =
  ({ entity, jsonData }) =>
  async (dispatch) => {
    try {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });
      
      let data;
      if (jsonData.file) {
        // File uploads stay REST
        const formData = new FormData();
        for (const key in jsonData) {
          if (key === 'file') {
            formData.append('file', jsonData[key]);
          } else {
            formData.append(key, jsonData[key]);
          }
        }
        data = await request.upload({ entity, jsonData: formData });
      } else {
        // Use GraphQL for non-file updates
        const { data: gqlData } = await apolloClient.mutate({
          mutation: UPDATE_PROFILE,
          variables: { input: jsonData },
        });
        data = gqlData.updateProfile;
      }

      if (data.success === true) {
        const existingAuth = storePersist.get('auth') || {};
        const existingCurrent = existingAuth.current || {};
        
        const auth_state = {
          current: {
            ...existingCurrent,
            ...data.result,
          },
          isLoggedIn: true,
          isLoading: false,
          isSuccess: true,
        };
        
        storePersist.set('auth', auth_state);
        
        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
          payload: data.result,
        });
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    } catch (error) {
      console.log('Error updating profile:', error);
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const sendEmail = async ({ entity, dataToSubmit }) => {
  try {
    return await request.post({ entity, jsonData: dataToSubmit });
  } catch (error) {
    return error;
  }
};

export const forgotPassword = 
  ({ email }) => 
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    
    try {
      const data = await authService.forgotPassword({ email });
      
      if (data.success === true) {
        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
        });
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error in forgot password:', error);
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
      return { success: false, message: error.message };
    }
  };
