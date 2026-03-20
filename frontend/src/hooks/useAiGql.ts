import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  AI_CHAT,
  AI_CHAT_HISTORY,
  AI_SUGGEST,
  AI_AUTOCOMPLETE,
  AI_SUMMARIZE,
  AI_TRANSLATE,
  AI_GENERATE_EMAIL,
  AI_ANALYZE_SENTIMENT,
  AI_PROCESS_DATA,
  AI_EXTRACT_ENTITIES,
  AI_CLASSIFY,
  AI_PREDICT,
  AI_ENHANCE_CRM,
  AI_LEAD_SCORING,
  AI_DEAL_COACHING,
  AI_CHURN_PREDICTION,
  AI_OPTIMAL_CONTACT_TIME,
  GET_AI_PREFERENCES,
  UPDATE_AI_PREFERENCES,
  AI_PROVIDER_STATUS,
  GET_AI_KNOWLEDGE_BASES,
  GET_AI_KNOWLEDGE_BASE,
  CREATE_AI_KNOWLEDGE_BASE,
  UPDATE_AI_KNOWLEDGE_BASE,
  DELETE_AI_KNOWLEDGE_BASE,
  AI_KNOWLEDGE_BASE_QUERY,
  AI_KNOWLEDGE_BASE_INGEST,
} from '../graphql/operations/ai';

// Chat / Assistant
export const useAiChat = (options?: MutationHookOptions) =>
  useMutation(AI_CHAT, options);

export const useAiChatHistory = (options?: QueryHookOptions) =>
  useQuery(AI_CHAT_HISTORY, options);

export const useAiSuggest = (options?: MutationHookOptions) =>
  useMutation(AI_SUGGEST, options);

export const useAiAutocomplete = (options?: MutationHookOptions) =>
  useMutation(AI_AUTOCOMPLETE, options);

export const useAiSummarize = (options?: MutationHookOptions) =>
  useMutation(AI_SUMMARIZE, options);

export const useAiTranslate = (options?: MutationHookOptions) =>
  useMutation(AI_TRANSLATE, options);

export const useAiGenerateEmail = (options?: MutationHookOptions) =>
  useMutation(AI_GENERATE_EMAIL, options);

export const useAiAnalyzeSentiment = (options?: MutationHookOptions) =>
  useMutation(AI_ANALYZE_SENTIMENT, options);

// Data Processing
export const useAiProcessData = (options?: MutationHookOptions) =>
  useMutation(AI_PROCESS_DATA, options);

export const useAiExtractEntities = (options?: MutationHookOptions) =>
  useMutation(AI_EXTRACT_ENTITIES, options);

export const useAiClassify = (options?: MutationHookOptions) =>
  useMutation(AI_CLASSIFY, options);

export const useAiPredict = (options?: MutationHookOptions) =>
  useMutation(AI_PREDICT, options);

// Enhanced CRM
export const useAiEnhanceCrm = (options?: MutationHookOptions) =>
  useMutation(AI_ENHANCE_CRM, options);

export const useAiLeadScoring = (options?: MutationHookOptions) =>
  useMutation(AI_LEAD_SCORING, options);

export const useAiDealCoaching = (options?: MutationHookOptions) =>
  useMutation(AI_DEAL_COACHING, options);

export const useAiChurnPrediction = (options?: MutationHookOptions) =>
  useMutation(AI_CHURN_PREDICTION, options);

export const useAiOptimalContactTime = (clientId: string, options?: QueryHookOptions) =>
  useQuery(AI_OPTIMAL_CONTACT_TIME, { ...options, variables: { clientId } });

// Preferences
export const useAiPreferences = (options?: QueryHookOptions) =>
  useQuery(GET_AI_PREFERENCES, options);

export const useUpdateAiPreferences = (options?: MutationHookOptions) =>
  useMutation(UPDATE_AI_PREFERENCES, options);

export const useAiProviderStatus = (options?: QueryHookOptions) =>
  useQuery(AI_PROVIDER_STATUS, options);

// Knowledge Base
export const useAiKnowledgeBases = (options?: QueryHookOptions) =>
  useQuery(GET_AI_KNOWLEDGE_BASES, options);

export const useAiKnowledgeBase = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_AI_KNOWLEDGE_BASE, { ...options, variables: { id } });

export const useCreateAiKnowledgeBase = (options?: MutationHookOptions) =>
  useMutation(CREATE_AI_KNOWLEDGE_BASE, options);

export const useUpdateAiKnowledgeBase = (options?: MutationHookOptions) =>
  useMutation(UPDATE_AI_KNOWLEDGE_BASE, options);

export const useDeleteAiKnowledgeBase = (options?: MutationHookOptions) =>
  useMutation(DELETE_AI_KNOWLEDGE_BASE, options);

export const useAiKnowledgeBaseQuery = (options?: MutationHookOptions) =>
  useMutation(AI_KNOWLEDGE_BASE_QUERY, options);

export const useAiKnowledgeBaseIngest = (options?: MutationHookOptions) =>
  useMutation(AI_KNOWLEDGE_BASE_INGEST, options);
