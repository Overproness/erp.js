import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_SURVEYS,
  GET_SURVEY,
  SEARCH_SURVEYS,
  SURVEY_ANALYTICS,
  GET_SURVEY_RESPONSES,
  GET_SURVEY_RESPONSE,
  CREATE_SURVEY,
  UPDATE_SURVEY,
  DELETE_SURVEY,
  PUBLISH_SURVEY,
  CLOSE_SURVEY,
  DUPLICATE_SURVEY,
  AI_GENERATE_SURVEY,
  AI_ANALYZE_SURVEY,
  SUBMIT_SURVEY_RESPONSE,
} from '../graphql/operations/survey';

export const useSurveys = (options?: QueryHookOptions) =>
  useQuery(GET_SURVEYS, options);

export const useSurvey = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SURVEY, { ...options, variables: { id } });

export const useSearchSurveys = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_SURVEYS, { ...options, variables: { q } });

export const useSurveyAnalytics = (id: string, options?: QueryHookOptions) =>
  useQuery(SURVEY_ANALYTICS, { ...options, variables: { id } });

export const useSurveyResponses = (surveyId: string, options?: QueryHookOptions) =>
  useQuery(GET_SURVEY_RESPONSES, { ...options, variables: { surveyId } });

export const useSurveyResponse = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SURVEY_RESPONSE, { ...options, variables: { id } });

export const useCreateSurvey = (options?: MutationHookOptions) =>
  useMutation(CREATE_SURVEY, options);

export const useUpdateSurvey = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SURVEY, options);

export const useDeleteSurvey = (options?: MutationHookOptions) =>
  useMutation(DELETE_SURVEY, options);

export const usePublishSurvey = (options?: MutationHookOptions) =>
  useMutation(PUBLISH_SURVEY, options);

export const useCloseSurvey = (options?: MutationHookOptions) =>
  useMutation(CLOSE_SURVEY, options);

export const useDuplicateSurvey = (options?: MutationHookOptions) =>
  useMutation(DUPLICATE_SURVEY, options);

export const useAiGenerateSurvey = (options?: MutationHookOptions) =>
  useMutation(AI_GENERATE_SURVEY, options);

export const useAiAnalyzeSurvey = (options?: MutationHookOptions) =>
  useMutation(AI_ANALYZE_SURVEY, options);

export const useSubmitSurveyResponse = (options?: MutationHookOptions) =>
  useMutation(SUBMIT_SURVEY_RESPONSE, options);
