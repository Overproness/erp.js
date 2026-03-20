import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  VERIFY_TOKEN,
  GET_ADMIN,
  GET_ADMIN_LIST,
  GET_USER,
  GET_USER_LIST,
  SEARCH_USERS,
  LOGIN,
  REGISTER,
  LOGOUT,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  UPDATE_ADMIN,
  COMPLETE_SETUP,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
} from '../graphql/operations/auth';

export const useVerifyToken = (options?: QueryHookOptions) =>
  useQuery(VERIFY_TOKEN, options);

export const useAdmin = (options?: QueryHookOptions) =>
  useQuery(GET_ADMIN, options);

export const useAdminList = (options?: QueryHookOptions) =>
  useQuery(GET_ADMIN_LIST, options);

export const useUser = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_USER, { ...options, variables: { id } });

export const useUserList = (options?: QueryHookOptions) =>
  useQuery(GET_USER_LIST, options);

export const useSearchUsers = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_USERS, { ...options, variables: { q } });

export const useLogin = (options?: MutationHookOptions) =>
  useMutation(LOGIN, options);

export const useRegister = (options?: MutationHookOptions) =>
  useMutation(REGISTER, options);

export const useLogout = (options?: MutationHookOptions) =>
  useMutation(LOGOUT, options);

export const useForgotPassword = (options?: MutationHookOptions) =>
  useMutation(FORGOT_PASSWORD, options);

export const useResetPassword = (options?: MutationHookOptions) =>
  useMutation(RESET_PASSWORD, options);

export const useUpdateAdmin = (options?: MutationHookOptions) =>
  useMutation(UPDATE_ADMIN, options);

export const useCompleteSetup = (options?: MutationHookOptions) =>
  useMutation(COMPLETE_SETUP, options);

export const useCreateUser = (options?: MutationHookOptions) =>
  useMutation(CREATE_USER, options);

export const useUpdateUser = (options?: MutationHookOptions) =>
  useMutation(UPDATE_USER, options);

export const useDeleteUser = (options?: MutationHookOptions) =>
  useMutation(DELETE_USER, options);
