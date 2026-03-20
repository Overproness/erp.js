import { gql } from '@apollo/client';

// AI Assistant (Chat / Copilot)
export const AI_CHAT = gql`
  mutation AiChat($input: AiChatInput!) {
    aiChat(input: $input) { success result message }
  }
`;

export const AI_CHAT_HISTORY = gql`
  query AiChatHistory($sessionId: String, $page: Int, $limit: Int) {
    aiChatHistory(sessionId: $sessionId, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const AI_SUGGEST = gql`
  mutation AiSuggest($input: AiSuggestInput!) {
    aiSuggest(input: $input) { success result message }
  }
`;

export const AI_AUTOCOMPLETE = gql`
  mutation AiAutocomplete($input: AiAutocompleteInput!) {
    aiAutocomplete(input: $input) { success result message }
  }
`;

export const AI_SUMMARIZE = gql`
  mutation AiSummarize($input: AiSummarizeInput!) {
    aiSummarize(input: $input) { success result message }
  }
`;

export const AI_TRANSLATE = gql`
  mutation AiTranslate($input: AiTranslateInput!) {
    aiTranslate(input: $input) { success result message }
  }
`;

export const AI_GENERATE_EMAIL = gql`
  mutation AiGenerateEmail($input: AiEmailInput!) {
    aiGenerateEmail(input: $input) { success result message }
  }
`;

export const AI_ANALYZE_SENTIMENT = gql`
  mutation AiAnalyzeSentiment($text: String!) {
    aiAnalyzeSentiment(text: $text) { success result message }
  }
`;

// AI Data Processing
export const AI_PROCESS_DATA = gql`
  mutation AiProcessData($input: AiDataProcessInput!) {
    aiProcessData(input: $input) { success result message }
  }
`;

export const AI_EXTRACT_ENTITIES = gql`
  mutation AiExtractEntities($text: String!) {
    aiExtractEntities(text: $text) { success result message }
  }
`;

export const AI_CLASSIFY = gql`
  mutation AiClassify($input: AiClassifyInput!) {
    aiClassify(input: $input) { success result message }
  }
`;

export const AI_PREDICT = gql`
  mutation AiPredict($input: AiPredictInput!) {
    aiPredict(input: $input) { success result message }
  }
`;

// AI Enhanced features
export const AI_ENHANCE_CRM = gql`
  mutation AiEnhanceCrm($entityType: String!, $entityId: ID!, $action: String!) {
    aiEnhanceCrm(entityType: $entityType, entityId: $entityId, action: $action) {
      success result message
    }
  }
`;

export const AI_LEAD_SCORING = gql`
  mutation AiLeadScoring($clientId: ID!) {
    aiLeadScoring(clientId: $clientId) { success result message }
  }
`;

export const AI_DEAL_COACHING = gql`
  mutation AiDealCoaching($invoiceId: ID!) {
    aiDealCoaching(invoiceId: $invoiceId) { success result message }
  }
`;

export const AI_CHURN_PREDICTION = gql`
  mutation AiChurnPrediction($clientId: ID!) {
    aiChurnPrediction(clientId: $clientId) { success result message }
  }
`;

export const AI_OPTIMAL_CONTACT_TIME = gql`
  query AiOptimalContactTime($clientId: ID!) {
    aiOptimalContactTime(clientId: $clientId) { success result message }
  }
`;

// AI Preferences
export const GET_AI_PREFERENCES = gql`
  query GetAiPreferences {
    aiPreferencesRead { success result message }
  }
`;

export const UPDATE_AI_PREFERENCES = gql`
  mutation UpdateAiPreferences($input: AiPreferencesUpdateInput!) {
    aiPreferencesUpdate(input: $input) { success result message }
  }
`;

export const AI_PROVIDER_STATUS = gql`
  query AiProviderStatus {
    aiProviderStatus { success result message }
  }
`;

// AI Knowledge Base
export const GET_AI_KNOWLEDGE_BASES = gql`
  query GetAiKnowledgeBases($page: Int, $limit: Int) {
    aiKnowledgeBaseList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_AI_KNOWLEDGE_BASE = gql`
  query GetAiKnowledgeBase($id: ID!) {
    aiKnowledgeBaseRead(id: $id) { success result message }
  }
`;

export const CREATE_AI_KNOWLEDGE_BASE = gql`
  mutation CreateAiKnowledgeBase($input: AiKnowledgeBaseCreateInput!) {
    aiKnowledgeBaseCreate(input: $input) { success result message }
  }
`;

export const UPDATE_AI_KNOWLEDGE_BASE = gql`
  mutation UpdateAiKnowledgeBase($id: ID!, $input: AiKnowledgeBaseUpdateInput!) {
    aiKnowledgeBaseUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_AI_KNOWLEDGE_BASE = gql`
  mutation DeleteAiKnowledgeBase($id: ID!) {
    aiKnowledgeBaseDelete(id: $id) { success result message }
  }
`;

export const AI_KNOWLEDGE_BASE_QUERY = gql`
  mutation AiKnowledgeBaseQuery($id: ID!, $query: String!) {
    aiKnowledgeBaseQuery(id: $id, query: $query) { success result message }
  }
`;

export const AI_KNOWLEDGE_BASE_INGEST = gql`
  mutation AiKnowledgeBaseIngest($id: ID!, $input: JSON!) {
    aiKnowledgeBaseIngest(id: $id, input: $input) { success result message }
  }
`;
