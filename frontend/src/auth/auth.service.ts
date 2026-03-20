import { API_BASE_URL } from '@/config/serverApiConfig';

import axios from 'axios';
import errorHandler from '@/request/errorHandler';
import successHandler from '@/request/successHandler';
import storePersist from '@/redux/storePersist';

export const login = async ({ loginData }) => {
  try {
    const response = await axios.post(
      API_BASE_URL + `login?timestamp=${new Date().getTime()}`,
      loginData
    );

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const register = async ({ registerData }) => {
  try {
    console.log('Sending registration request with data:', registerData);
    
    // Add a timestamp to prevent caching issues
    const response = await axios.post(
      API_BASE_URL + `register?timestamp=${new Date().getTime()}`, 
      registerData
    );

    const { status, data } = response;
    console.log('Registration response:', status, data);

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    return errorHandler(error);
  }
};

export const verify = async ({ userId, emailToken }) => {
  try {
    const response = await axios.get(API_BASE_URL + `verify/${userId}/${emailToken}`);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const resetPassword = async ({ resetPasswordData }) => {
  try {
    const response = await axios.post(API_BASE_URL + `resetpassword`, resetPasswordData);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};
export const logout = async () => {
  // Always clear local auth data first to ensure client-side logout happens
  // even if the server request fails
  storePersist.remove('auth');
  storePersist.remove('auth_token');
  localStorage.removeItem('auth');
  localStorage.removeItem('persist:root');
  
  // Clean up axios authorization headers right away
  delete axios.defaults.headers.common['Authorization'];
  
  try {
    // Create a separate axios instance that won't use interceptors
    const publicAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: { 
        'Content-Type': 'application/json',
        'X-Public-Request': 'true'
      }
    });
    
    // Timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Send a logout request without any auth headers
    const response = await publicAxios.post(
      `logout?timestamp=${timestamp}`, 
      {} // Empty body
    );
    
    // Only log success, don't show notifications for logout
    if (response.data && response.data.success) {
      console.log('Server logout successful');
    }
    
    return response.data || { success: true };  // Always return success
  } catch (error) {
    console.log('Logout failed on server, but local logout completed successfully');
    
    // Don't show error notification for logout failures - just log out locally
    return { success: true, message: 'Logged out locally' };
  }
};

export const forgotPassword = async ({ email }) => {
  try {
    const response = await axios.post(
      API_BASE_URL + `forgetpassword?timestamp=${new Date().getTime()}`,
      { email }
    );

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};
