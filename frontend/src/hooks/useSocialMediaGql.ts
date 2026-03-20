import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_SOCIAL_ACCOUNTS,
  GET_SOCIAL_ACCOUNT,
  CREATE_SOCIAL_ACCOUNT,
  UPDATE_SOCIAL_ACCOUNT,
  DELETE_SOCIAL_ACCOUNT,
  CONNECT_SOCIAL_ACCOUNT,
  DISCONNECT_SOCIAL_ACCOUNT,
  REFRESH_SOCIAL_ACCOUNT,
  GET_SOCIAL_POSTS,
  GET_SOCIAL_POST,
  SOCIAL_POST_ANALYTICS,
  CREATE_SOCIAL_POST,
  UPDATE_SOCIAL_POST,
  DELETE_SOCIAL_POST,
  PUBLISH_SOCIAL_POST,
  SCHEDULE_SOCIAL_POST,
  AI_GENERATE_SOCIAL_POST,
  GET_SOCIAL_CAMPAIGNS,
  GET_SOCIAL_CAMPAIGN,
  CREATE_SOCIAL_CAMPAIGN,
  UPDATE_SOCIAL_CAMPAIGN,
  DELETE_SOCIAL_CAMPAIGN,
  GET_SOCIAL_MENTIONS,
  RESPOND_TO_MENTION,
  AI_RESPOND_TO_MENTION,
} from '../graphql/operations/socialMedia';

// Accounts
export const useSocialAccounts = (options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_ACCOUNTS, options);

export const useSocialAccount = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_ACCOUNT, { ...options, variables: { id } });

export const useCreateSocialAccount = (options?: MutationHookOptions) =>
  useMutation(CREATE_SOCIAL_ACCOUNT, options);

export const useUpdateSocialAccount = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SOCIAL_ACCOUNT, options);

export const useDeleteSocialAccount = (options?: MutationHookOptions) =>
  useMutation(DELETE_SOCIAL_ACCOUNT, options);

export const useConnectSocialAccount = (options?: MutationHookOptions) =>
  useMutation(CONNECT_SOCIAL_ACCOUNT, options);

export const useDisconnectSocialAccount = (options?: MutationHookOptions) =>
  useMutation(DISCONNECT_SOCIAL_ACCOUNT, options);

export const useRefreshSocialAccount = (options?: MutationHookOptions) =>
  useMutation(REFRESH_SOCIAL_ACCOUNT, options);

// Posts
export const useSocialPosts = (options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_POSTS, options);

export const useSocialPost = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_POST, { ...options, variables: { id } });

export const useSocialPostAnalytics = (id: string, options?: QueryHookOptions) =>
  useQuery(SOCIAL_POST_ANALYTICS, { ...options, variables: { id } });

export const useCreateSocialPost = (options?: MutationHookOptions) =>
  useMutation(CREATE_SOCIAL_POST, options);

export const useUpdateSocialPost = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SOCIAL_POST, options);

export const useDeleteSocialPost = (options?: MutationHookOptions) =>
  useMutation(DELETE_SOCIAL_POST, options);

export const usePublishSocialPost = (options?: MutationHookOptions) =>
  useMutation(PUBLISH_SOCIAL_POST, options);

export const useScheduleSocialPost = (options?: MutationHookOptions) =>
  useMutation(SCHEDULE_SOCIAL_POST, options);

export const useAiGenerateSocialPost = (options?: MutationHookOptions) =>
  useMutation(AI_GENERATE_SOCIAL_POST, options);

// Social Campaigns
export const useSocialCampaigns = (options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_CAMPAIGNS, options);

export const useSocialCampaign = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_CAMPAIGN, { ...options, variables: { id } });

export const useCreateSocialCampaign = (options?: MutationHookOptions) =>
  useMutation(CREATE_SOCIAL_CAMPAIGN, options);

export const useUpdateSocialCampaign = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SOCIAL_CAMPAIGN, options);

export const useDeleteSocialCampaign = (options?: MutationHookOptions) =>
  useMutation(DELETE_SOCIAL_CAMPAIGN, options);

// Mentions
export const useSocialMentions = (options?: QueryHookOptions) =>
  useQuery(GET_SOCIAL_MENTIONS, options);

export const useRespondToMention = (options?: MutationHookOptions) =>
  useMutation(RESPOND_TO_MENTION, options);

export const useAiRespondToMention = (options?: MutationHookOptions) =>
  useMutation(AI_RESPOND_TO_MENTION, options);
