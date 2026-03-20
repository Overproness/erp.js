import { gql } from '@apollo/client';

export const GET_URLS = gql`
  query GetUrls($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    urlList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_URL = gql`
  query GetUrl($id: ID!) { urlRead(id: $id) { success result message } }
`;

export const SEARCH_URLS = gql`
  query SearchUrls($q: String!, $fields: String) {
    urlSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const URL_SUMMARY = gql`
  query UrlSummary { urlSummary { success result message } }
`;

export const URL_ANALYTICS = gql`
  query UrlAnalytics($id: ID!, $period: String) {
    urlAnalytics(id: $id, period: $period) { success result message }
  }
`;

export const URL_CLICK_HISTORY = gql`
  query UrlClickHistory($id: ID!, $page: Int, $limit: Int) {
    urlClickHistory(id: $id, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_URL = gql`
  mutation CreateUrl($input: URLCreateInput!) {
    urlCreate(input: $input) { success result message }
  }
`;

export const UPDATE_URL = gql`
  mutation UpdateUrl($id: ID!, $input: URLUpdateInput!) {
    urlUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_URL = gql`
  mutation DeleteUrl($id: ID!) {
    urlDelete(id: $id) { success result message }
  }
`;

export const URL_GENERATE_QR = gql`
  mutation UrlGenerateQR($id: ID!) {
    urlGenerateQR(id: $id) { success result message }
  }
`;

// A/B Tests
export const GET_AB_TESTS = gql`
  query GetAbTests($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    abTestList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_AB_TEST = gql`
  query GetAbTest($id: ID!) { abTestRead(id: $id) { success result message } }
`;

export const AB_TEST_RESULTS = gql`
  query AbTestResults($id: ID!) { abTestResults(id: $id) { success result message } }
`;

export const CREATE_AB_TEST = gql`
  mutation CreateAbTest($input: ABTestCreateInput!) {
    abTestCreate(input: $input) { success result message }
  }
`;

export const UPDATE_AB_TEST = gql`
  mutation UpdateAbTest($id: ID!, $input: ABTestUpdateInput!) {
    abTestUpdate(id: $id, input: $input) { success result message }
  }
`;

export const START_AB_TEST = gql`
  mutation StartAbTest($id: ID!) {
    abTestStart(id: $id) { success result message }
  }
`;

export const STOP_AB_TEST = gql`
  mutation StopAbTest($id: ID!) {
    abTestStop(id: $id) { success result message }
  }
`;
