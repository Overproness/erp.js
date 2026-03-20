import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_CLIENTS,
  GET_ALL_CLIENTS,
  GET_CLIENT,
  SEARCH_CLIENTS,
  FILTER_CLIENTS,
  CLIENT_SUMMARY,
  CREATE_CLIENT,
  UPDATE_CLIENT,
  DELETE_CLIENT,
  BULK_CREATE_CLIENTS,
  BULK_DELETE_CLIENTS,
  CALCULATE_LEAD_SCORE,
  RECALCULATE_ALL_LEAD_SCORES,
} from '../graphql/operations/client';

export const useClients = (options?: QueryHookOptions) =>
  useQuery(GET_CLIENTS, options);

export const useAllClients = (options?: QueryHookOptions) =>
  useQuery(GET_ALL_CLIENTS, options);

export const useClient = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_CLIENT, { ...options, variables: { id } });

export const useSearchClients = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_CLIENTS, { ...options, variables: { q } });

export const useFilterClients = (options?: QueryHookOptions) =>
  useQuery(FILTER_CLIENTS, options);

export const useClientSummary = (options?: QueryHookOptions) =>
  useQuery(CLIENT_SUMMARY, options);

export const useCreateClient = (options?: MutationHookOptions) =>
  useMutation(CREATE_CLIENT, options);

export const useUpdateClient = (options?: MutationHookOptions) =>
  useMutation(UPDATE_CLIENT, options);

export const useDeleteClient = (options?: MutationHookOptions) =>
  useMutation(DELETE_CLIENT, options);

export const useBulkCreateClients = (options?: MutationHookOptions) =>
  useMutation(BULK_CREATE_CLIENTS, options);

export const useBulkDeleteClients = (options?: MutationHookOptions) =>
  useMutation(BULK_DELETE_CLIENTS, options);

export const useCalculateLeadScore = (options?: MutationHookOptions) =>
  useMutation(CALCULATE_LEAD_SCORE, options);

export const useRecalculateAllLeadScores = (options?: MutationHookOptions) =>
  useMutation(RECALCULATE_ALL_LEAD_SCORES, options);
