import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_REVIEWS,
  GET_REVIEW,
  SEARCH_REVIEWS,
  CREATE_REVIEW,
  UPDATE_REVIEW,
  DELETE_REVIEW,
  RESPOND_TO_REVIEW,
  AI_RESPOND_TO_REVIEW,
  AI_ANALYZE_REVIEW_SENTIMENT,
  SYNC_REVIEWS,
  GET_REVIEW_LINKS,
  CREATE_REVIEW_LINK,
  UPDATE_REVIEW_LINK,
  DELETE_REVIEW_LINK,
  GET_REVIEW_TEMPLATES,
  CREATE_REVIEW_TEMPLATE,
  UPDATE_REVIEW_TEMPLATE,
  DELETE_REVIEW_TEMPLATE,
  GET_REVIEW_RESPONSES,
  CREATE_REVIEW_RESPONSE,
  UPDATE_REVIEW_RESPONSE,
  DELETE_REVIEW_RESPONSE,
  GET_RETARGETING_CAMPAIGNS,
  GET_RETARGETING_CAMPAIGN,
  RETARGETING_ANALYTICS,
  CREATE_RETARGETING_CAMPAIGN,
  UPDATE_RETARGETING_CAMPAIGN,
  DELETE_RETARGETING_CAMPAIGN,
  LAUNCH_RETARGETING_CAMPAIGN,
  PAUSE_RETARGETING_CAMPAIGN,
} from '../graphql/operations/reputation';

// Reviews
export const useReviewsGql = (options?: QueryHookOptions) =>
  useQuery(GET_REVIEWS, options);

export const useReview = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_REVIEW, { ...options, variables: { id } });

export const useSearchReviews = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_REVIEWS, { ...options, variables: { q } });

export const useCreateReview = (options?: MutationHookOptions) =>
  useMutation(CREATE_REVIEW, options);

export const useUpdateReview = (options?: MutationHookOptions) =>
  useMutation(UPDATE_REVIEW, options);

export const useDeleteReview = (options?: MutationHookOptions) =>
  useMutation(DELETE_REVIEW, options);

export const useRespondToReview = (options?: MutationHookOptions) =>
  useMutation(RESPOND_TO_REVIEW, options);

export const useAiRespondToReview = (options?: MutationHookOptions) =>
  useMutation(AI_RESPOND_TO_REVIEW, options);

export const useAiAnalyzeReviewSentiment = (options?: MutationHookOptions) =>
  useMutation(AI_ANALYZE_REVIEW_SENTIMENT, options);

export const useSyncReviews = (options?: MutationHookOptions) =>
  useMutation(SYNC_REVIEWS, options);

// Review Links
export const useReviewLinks = (options?: QueryHookOptions) =>
  useQuery(GET_REVIEW_LINKS, options);

export const useCreateReviewLink = (options?: MutationHookOptions) =>
  useMutation(CREATE_REVIEW_LINK, options);

export const useUpdateReviewLink = (options?: MutationHookOptions) =>
  useMutation(UPDATE_REVIEW_LINK, options);

export const useDeleteReviewLink = (options?: MutationHookOptions) =>
  useMutation(DELETE_REVIEW_LINK, options);

// Review Templates
export const useReviewTemplates = (options?: QueryHookOptions) =>
  useQuery(GET_REVIEW_TEMPLATES, options);

export const useCreateReviewTemplate = (options?: MutationHookOptions) =>
  useMutation(CREATE_REVIEW_TEMPLATE, options);

export const useUpdateReviewTemplate = (options?: MutationHookOptions) =>
  useMutation(UPDATE_REVIEW_TEMPLATE, options);

export const useDeleteReviewTemplate = (options?: MutationHookOptions) =>
  useMutation(DELETE_REVIEW_TEMPLATE, options);

// Review Responses
export const useReviewResponsesGql = (options?: QueryHookOptions) =>
  useQuery(GET_REVIEW_RESPONSES, options);

export const useCreateReviewResponse = (options?: MutationHookOptions) =>
  useMutation(CREATE_REVIEW_RESPONSE, options);

export const useUpdateReviewResponse = (options?: MutationHookOptions) =>
  useMutation(UPDATE_REVIEW_RESPONSE, options);

export const useDeleteReviewResponse = (options?: MutationHookOptions) =>
  useMutation(DELETE_REVIEW_RESPONSE, options);

// Retargeting
export const useRetargetingCampaigns = (options?: QueryHookOptions) =>
  useQuery(GET_RETARGETING_CAMPAIGNS, options);

export const useRetargetingCampaign = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_RETARGETING_CAMPAIGN, { ...options, variables: { id } });

export const useRetargetingAnalytics = (id: string, options?: QueryHookOptions) =>
  useQuery(RETARGETING_ANALYTICS, { ...options, variables: { id } });

export const useCreateRetargetingCampaign = (options?: MutationHookOptions) =>
  useMutation(CREATE_RETARGETING_CAMPAIGN, options);

export const useUpdateRetargetingCampaign = (options?: MutationHookOptions) =>
  useMutation(UPDATE_RETARGETING_CAMPAIGN, options);

export const useDeleteRetargetingCampaign = (options?: MutationHookOptions) =>
  useMutation(DELETE_RETARGETING_CAMPAIGN, options);

export const useLaunchRetargetingCampaign = (options?: MutationHookOptions) =>
  useMutation(LAUNCH_RETARGETING_CAMPAIGN, options);

export const usePauseRetargetingCampaign = (options?: MutationHookOptions) =>
  useMutation(PAUSE_RETARGETING_CAMPAIGN, options);
