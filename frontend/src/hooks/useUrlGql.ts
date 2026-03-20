import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_URLS,
  GET_URL,
  SEARCH_URLS,
  URL_SUMMARY,
  URL_ANALYTICS,
  URL_CLICK_HISTORY,
  CREATE_URL,
  UPDATE_URL,
  DELETE_URL,
  URL_GENERATE_QR,
  GET_AB_TESTS,
  GET_AB_TEST,
  AB_TEST_RESULTS,
  CREATE_AB_TEST,
  UPDATE_AB_TEST,
  START_AB_TEST,
  STOP_AB_TEST,
} from '../graphql/operations/url';

export const useUrls = (options?: QueryHookOptions) =>
  useQuery(GET_URLS, options);

export const useUrlItem = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_URL, { ...options, variables: { id } });

export const useSearchUrls = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_URLS, { ...options, variables: { q } });

export const useUrlSummary = (options?: QueryHookOptions) =>
  useQuery(URL_SUMMARY, options);

export const useUrlAnalytics = (id: string, options?: QueryHookOptions) =>
  useQuery(URL_ANALYTICS, { ...options, variables: { id } });

export const useUrlClickHistory = (id: string, options?: QueryHookOptions) =>
  useQuery(URL_CLICK_HISTORY, { ...options, variables: { id } });

export const useCreateUrl = (options?: MutationHookOptions) =>
  useMutation(CREATE_URL, options);

export const useUpdateUrl = (options?: MutationHookOptions) =>
  useMutation(UPDATE_URL, options);

export const useDeleteUrl = (options?: MutationHookOptions) =>
  useMutation(DELETE_URL, options);

export const useUrlGenerateQR = (options?: MutationHookOptions) =>
  useMutation(URL_GENERATE_QR, options);

// A/B Tests
export const useAbTests = (options?: QueryHookOptions) =>
  useQuery(GET_AB_TESTS, options);

export const useAbTest = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_AB_TEST, { ...options, variables: { id } });

export const useAbTestResults = (id: string, options?: QueryHookOptions) =>
  useQuery(AB_TEST_RESULTS, { ...options, variables: { id } });

export const useCreateAbTest = (options?: MutationHookOptions) =>
  useMutation(CREATE_AB_TEST, options);

export const useUpdateAbTest = (options?: MutationHookOptions) =>
  useMutation(UPDATE_AB_TEST, options);

export const useStartAbTest = (options?: MutationHookOptions) =>
  useMutation(START_AB_TEST, options);

export const useStopAbTest = (options?: MutationHookOptions) =>
  useMutation(STOP_AB_TEST, options);
