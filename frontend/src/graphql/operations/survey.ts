import { gql } from '@apollo/client';

export const GET_SURVEYS = gql`
  query GetSurveys($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    surveyList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SURVEY = gql`
  query GetSurvey($id: ID!) { surveyRead(id: $id) { success result message } }
`;

export const SEARCH_SURVEYS = gql`
  query SearchSurveys($q: String!, $fields: String) {
    surveySearch(q: $q, fields: $fields) { success result message }
  }
`;

export const SURVEY_ANALYTICS = gql`
  query SurveyAnalytics($id: ID!) {
    surveyAnalytics(id: $id) { success result message }
  }
`;

export const GET_SURVEY_RESPONSES = gql`
  query GetSurveyResponses($surveyId: ID!, $page: Int, $limit: Int) {
    surveyResponseList(surveyId: $surveyId, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SURVEY_RESPONSE = gql`
  query GetSurveyResponse($id: ID!) {
    surveyResponseRead(id: $id) { success result message }
  }
`;

export const CREATE_SURVEY = gql`
  mutation CreateSurvey($input: SurveyCreateInput!) {
    surveyCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SURVEY = gql`
  mutation UpdateSurvey($id: ID!, $input: SurveyUpdateInput!) {
    surveyUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SURVEY = gql`
  mutation DeleteSurvey($id: ID!) {
    surveyDelete(id: $id) { success result message }
  }
`;

export const PUBLISH_SURVEY = gql`
  mutation PublishSurvey($id: ID!) {
    surveyPublish(id: $id) { success result message }
  }
`;

export const CLOSE_SURVEY = gql`
  mutation CloseSurvey($id: ID!) {
    surveyClose(id: $id) { success result message }
  }
`;

export const DUPLICATE_SURVEY = gql`
  mutation DuplicateSurvey($id: ID!) {
    surveyDuplicate(id: $id) { success result message }
  }
`;

export const AI_GENERATE_SURVEY = gql`
  mutation AiGenerateSurvey($input: JSON!) {
    surveyAiGenerate(input: $input) { success result message }
  }
`;

export const AI_ANALYZE_SURVEY = gql`
  mutation AiAnalyzeSurvey($id: ID!) {
    surveyAiAnalyze(id: $id) { success result message }
  }
`;

export const SUBMIT_SURVEY_RESPONSE = gql`
  mutation SubmitSurveyResponse($input: SurveyResponseCreateInput!) {
    surveyResponseCreate(input: $input) { success result message }
  }
`;
