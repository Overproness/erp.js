import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_CAMPAIGNS,
  GET_CAMPAIGN,
  SEARCH_CAMPAIGNS,
  CAMPAIGN_ANALYTICS,
  CAMPAIGN_RECIPIENTS,
  CREATE_CAMPAIGN,
  UPDATE_CAMPAIGN,
  DELETE_CAMPAIGN,
  LAUNCH_CAMPAIGN,
  PAUSE_CAMPAIGN,
  RESUME_CAMPAIGN,
  CANCEL_CAMPAIGN,
  DUPLICATE_CAMPAIGN,
  SEND_TEST_CAMPAIGN,
  AI_GENERATE_CAMPAIGN,
} from '../graphql/operations/campaign';

export const useCampaigns = (options?: QueryHookOptions) =>
  useQuery(GET_CAMPAIGNS, options);

export const useCampaign = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_CAMPAIGN, { ...options, variables: { id } });

export const useSearchCampaigns = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_CAMPAIGNS, { ...options, variables: { q } });

export const useCampaignAnalytics = (id: string, options?: QueryHookOptions) =>
  useQuery(CAMPAIGN_ANALYTICS, { ...options, variables: { id } });

export const useCampaignRecipients = (id: string, options?: QueryHookOptions) =>
  useQuery(CAMPAIGN_RECIPIENTS, { ...options, variables: { id } });

export const useCreateCampaign = (options?: MutationHookOptions) =>
  useMutation(CREATE_CAMPAIGN, options);

export const useUpdateCampaign = (options?: MutationHookOptions) =>
  useMutation(UPDATE_CAMPAIGN, options);

export const useDeleteCampaign = (options?: MutationHookOptions) =>
  useMutation(DELETE_CAMPAIGN, options);

export const useLaunchCampaign = (options?: MutationHookOptions) =>
  useMutation(LAUNCH_CAMPAIGN, options);

export const usePauseCampaign = (options?: MutationHookOptions) =>
  useMutation(PAUSE_CAMPAIGN, options);

export const useResumeCampaign = (options?: MutationHookOptions) =>
  useMutation(RESUME_CAMPAIGN, options);

export const useCancelCampaign = (options?: MutationHookOptions) =>
  useMutation(CANCEL_CAMPAIGN, options);

export const useDuplicateCampaign = (options?: MutationHookOptions) =>
  useMutation(DUPLICATE_CAMPAIGN, options);

export const useSendTestCampaign = (options?: MutationHookOptions) =>
  useMutation(SEND_TEST_CAMPAIGN, options);

export const useAiGenerateCampaign = (options?: MutationHookOptions) =>
  useMutation(AI_GENERATE_CAMPAIGN, options);
