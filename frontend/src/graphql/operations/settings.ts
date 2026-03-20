import { gql } from '@apollo/client';

// Fragments
const PAGINATION_FRAGMENT = gql`
  fragment PaginationFields on PaginationInfo {
    page
    count
    pages
    total
  }
`;

// Queries
export const GET_SETTINGS = gql`
  ${PAGINATION_FRAGMENT}
  query GetSettings($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    settingList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success
      result
      pagination { ...PaginationFields }
      message
    }
  }
`;

export const GET_ALL_SETTINGS = gql`
  query GetAllSettings {
    settingListAll { success result message }
  }
`;

export const GET_SETTING = gql`
  query GetSetting($id: ID!) {
    settingRead(id: $id) { success result message }
  }
`;

export const GET_SETTING_BY_KEY = gql`
  query GetSettingByKey($settingKey: String!) {
    settingReadByKey(settingKey: $settingKey) { success result message }
  }
`;

export const SEARCH_SETTINGS = gql`
  query SearchSettings($q: String!, $fields: String) {
    settingSearch(q: $q, fields: $fields) { success result message }
  }
`;

// Mutations
export const CREATE_SETTING = gql`
  mutation CreateSetting($input: SettingCreateInput!) {
    settingCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SETTING = gql`
  mutation UpdateSetting($id: ID!, $input: SettingUpdateInput!) {
    settingUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SETTING = gql`
  mutation DeleteSetting($id: ID!) {
    settingDelete(id: $id) { success result message }
  }
`;

export const UPDATE_SETTING_BY_KEY = gql`
  mutation UpdateSettingByKey($settingKey: String!, $input: SettingUpdateInput!) {
    settingUpdateByKey(settingKey: $settingKey, input: $input) { success result message }
  }
`;

export const UPDATE_MANY_SETTINGS = gql`
  mutation UpdateManySettings($input: [SettingUpdateInput!]!) {
    settingUpdateMany(input: $input) { success result message }
  }
`;

export const TEST_OPENAI_KEY = gql`
  mutation TestOpenAIKey($key: String!) {
    settingTestOpenAIKey(key: $key) { success result message }
  }
`;

export const TEST_GEMINI_KEY = gql`
  mutation TestGeminiKey($key: String!) {
    settingTestGeminiKey(key: $key) { success result message }
  }
`;

export const TEST_CLAUDE_KEY = gql`
  mutation TestClaudeKey($key: String!) {
    settingTestClaudeKey(key: $key) { success result message }
  }
`;
