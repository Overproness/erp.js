import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_CUSTOMER_SEGMENTS,
  GET_CUSTOMER_SEGMENT,
  CUSTOMER_SEGMENT_MEMBERS,
  CREATE_CUSTOMER_SEGMENT,
  UPDATE_CUSTOMER_SEGMENT,
  DELETE_CUSTOMER_SEGMENT,
  REFRESH_CUSTOMER_SEGMENT,
  AI_SUGGEST_SEGMENTS,
  GET_CUSTOMER_FOLLOWUPS,
  GET_CUSTOMER_FOLLOWUP,
  CREATE_CUSTOMER_FOLLOWUP,
  UPDATE_CUSTOMER_FOLLOWUP,
  DELETE_CUSTOMER_FOLLOWUP,
  COMPLETE_CUSTOMER_FOLLOWUP,
} from '../graphql/operations/marketing';

// Segments
export const useCustomerSegments = (options?: QueryHookOptions) =>
  useQuery(GET_CUSTOMER_SEGMENTS, options);

export const useCustomerSegment = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_CUSTOMER_SEGMENT, { ...options, variables: { id } });

export const useCustomerSegmentMembers = (id: string, options?: QueryHookOptions) =>
  useQuery(CUSTOMER_SEGMENT_MEMBERS, { ...options, variables: { id } });

export const useCreateCustomerSegment = (options?: MutationHookOptions) =>
  useMutation(CREATE_CUSTOMER_SEGMENT, options);

export const useUpdateCustomerSegment = (options?: MutationHookOptions) =>
  useMutation(UPDATE_CUSTOMER_SEGMENT, options);

export const useDeleteCustomerSegment = (options?: MutationHookOptions) =>
  useMutation(DELETE_CUSTOMER_SEGMENT, options);

export const useRefreshCustomerSegment = (options?: MutationHookOptions) =>
  useMutation(REFRESH_CUSTOMER_SEGMENT, options);

export const useAiSuggestSegments = (options?: MutationHookOptions) =>
  useMutation(AI_SUGGEST_SEGMENTS, options);

// Follow-ups
export const useCustomerFollowUps = (options?: QueryHookOptions) =>
  useQuery(GET_CUSTOMER_FOLLOWUPS, options);

export const useCustomerFollowUp = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_CUSTOMER_FOLLOWUP, { ...options, variables: { id } });

export const useCreateCustomerFollowUp = (options?: MutationHookOptions) =>
  useMutation(CREATE_CUSTOMER_FOLLOWUP, options);

export const useUpdateCustomerFollowUp = (options?: MutationHookOptions) =>
  useMutation(UPDATE_CUSTOMER_FOLLOWUP, options);

export const useDeleteCustomerFollowUp = (options?: MutationHookOptions) =>
  useMutation(DELETE_CUSTOMER_FOLLOWUP, options);

export const useCompleteCustomerFollowUp = (options?: MutationHookOptions) =>
  useMutation(COMPLETE_CUSTOMER_FOLLOWUP, options);
