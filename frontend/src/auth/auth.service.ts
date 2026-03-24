import { API_BASE_URL } from '@/config/serverApiConfig';

import axios from 'axios';
import apolloClient from '@/graphql/client';
import { LOGIN, REGISTER, LOGOUT, FORGOT_PASSWORD, RESET_PASSWORD } from '@/graphql/operations/auth';
import errorHandler from '@/request/errorHandler';
import successHandler from '@/request/successHandler';
import storePersist from '@/redux/storePersist';

export const login = async ({ loginData }) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN,
      variables: { input: loginData },
    });

    const result = data.login;
    successHandler(
      { data: result, status: 200 },
      { notifyOnSuccess: false, notifyOnFailed: true }
    );
    return result;
  } catch (error) {
    return errorHandler(error);
  }
};

export const register = async ({ registerData }) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER,
      variables: { input: registerData },
    });

    const result = data.register;
    successHandler(
      { data: result, status: 200 },
      { notifyOnSuccess: true, notifyOnFailed: true }
    );
    return result;
  } catch (error) {
    console.error('Registration failed:', error.message);
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
    const { data } = await apolloClient.mutate({
      mutation: RESET_PASSWORD,
      variables: { input: resetPasswordData },
    });

    const result = data.resetPassword;
    successHandler(
      { data: result, status: 200 },
      { notifyOnSuccess: true, notifyOnFailed: true }
    );
    return result;
  } catch (error) {
    return errorHandler(error);
  }
};
export const logout = async () => {
  // Always clear local auth data first to ensure client-side logout happens
  storePersist.remove('auth');
  storePersist.remove('auth_token');
  localStorage.removeItem('auth');
  localStorage.removeItem('persist:root');

  // Clean up axios authorization headers right away
  delete axios.defaults.headers.common['Authorization'];

  try {
    const { data } = await apolloClient.mutate({ mutation: LOGOUT });
    const result = data.logout;
    if (result && result.success) {
      console.log('Server logout successful');
    }
    // Clear Apollo cache on logout
    await apolloClient.clearStore();
    return result || { success: true };
  } catch (error) {
    console.log('Logout failed on server, but local logout completed successfully');
    return { success: true, message: 'Logged out locally' };
  }
};

export const forgotPassword = async ({ email }) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: FORGOT_PASSWORD,
      variables: { input: { email } },
    });

    const result = data.forgetPassword;
    successHandler(
      { data: result, status: 200 },
      { notifyOnSuccess: true, notifyOnFailed: true }
    );
    return result;
  } catch (error) {
    return errorHandler(error);
  }
};
