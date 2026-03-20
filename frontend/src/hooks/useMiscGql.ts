import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_SAVED_SEARCHES,
  GET_SAVED_SEARCH,
  CREATE_SAVED_SEARCH,
  UPDATE_SAVED_SEARCH,
  DELETE_SAVED_SEARCH,
  EXECUTE_SAVED_SEARCH,
  GET_SHARED_RESOURCES,
  GET_SHARED_RESOURCE,
  CREATE_SHARED_RESOURCE,
  UPDATE_SHARED_RESOURCE,
  DELETE_SHARED_RESOURCE,
  DATA_ENTRY_IMPORT,
  DATA_ENTRY_EXPORT,
  DATA_ENTRY_VALIDATE,
  DATA_ENTRY_TEMPLATE,
  DATA_ENTRY_HISTORY,
} from '../graphql/operations/misc';

// Saved Searches
export const useSavedSearches = (options?: QueryHookOptions) =>
  useQuery(GET_SAVED_SEARCHES, options);

export const useSavedSearch = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SAVED_SEARCH, { ...options, variables: { id } });

export const useCreateSavedSearch = (options?: MutationHookOptions) =>
  useMutation(CREATE_SAVED_SEARCH, options);

export const useUpdateSavedSearch = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SAVED_SEARCH, options);

export const useDeleteSavedSearch = (options?: MutationHookOptions) =>
  useMutation(DELETE_SAVED_SEARCH, options);

export const useExecuteSavedSearch = (options?: MutationHookOptions) =>
  useMutation(EXECUTE_SAVED_SEARCH, options);

// Shared Resources
export const useSharedResources = (options?: QueryHookOptions) =>
  useQuery(GET_SHARED_RESOURCES, options);

export const useSharedResource = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SHARED_RESOURCE, { ...options, variables: { id } });

export const useCreateSharedResource = (options?: MutationHookOptions) =>
  useMutation(CREATE_SHARED_RESOURCE, options);

export const useUpdateSharedResource = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SHARED_RESOURCE, options);

export const useDeleteSharedResource = (options?: MutationHookOptions) =>
  useMutation(DELETE_SHARED_RESOURCE, options);

// Data Entry
export const useDataEntryImport = (options?: MutationHookOptions) =>
  useMutation(DATA_ENTRY_IMPORT, options);

export const useDataEntryExport = (options?: MutationHookOptions) =>
  useMutation(DATA_ENTRY_EXPORT, options);

export const useDataEntryValidate = (options?: MutationHookOptions) =>
  useMutation(DATA_ENTRY_VALIDATE, options);

export const useDataEntryTemplate = (entity: string, options?: QueryHookOptions) =>
  useQuery(DATA_ENTRY_TEMPLATE, { ...options, variables: { entity } });

export const useDataEntryHistory = (options?: QueryHookOptions) =>
  useQuery(DATA_ENTRY_HISTORY, options);
