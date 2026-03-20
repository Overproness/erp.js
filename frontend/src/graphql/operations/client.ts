import { gql } from '@apollo/client';

// Queries
export const GET_CLIENTS = gql`
  query GetClients($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    clientList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_ALL_CLIENTS = gql`
  query GetAllClients {
    clientListAll { success result message }
  }
`;

export const GET_CLIENT = gql`
  query GetClient($id: ID!) {
    clientRead(id: $id) { success result message }
  }
`;

export const SEARCH_CLIENTS = gql`
  query SearchClients($q: String!, $fields: String) {
    clientSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const FILTER_CLIENTS = gql`
  query FilterClients($filter: String, $equal: String) {
    clientFilter(filter: $filter, equal: $equal) { success result message }
  }
`;

export const CLIENT_SUMMARY = gql`
  query ClientSummary {
    clientSummary { success result message }
  }
`;

// Mutations
export const CREATE_CLIENT = gql`
  mutation CreateClient($input: ClientCreateInput!) {
    clientCreate(input: $input) { success result message }
  }
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($id: ID!, $input: ClientUpdateInput!) {
    clientUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($id: ID!) {
    clientDelete(id: $id) { success result message }
  }
`;

export const BULK_CREATE_CLIENTS = gql`
  mutation BulkCreateClients($input: [ClientCreateInput!]!) {
    clientBulkCreate(input: $input) { success result message }
  }
`;

export const BULK_DELETE_CLIENTS = gql`
  mutation BulkDeleteClients($ids: [ID!]!) {
    clientBulkDelete(ids: $ids) { success result message }
  }
`;

export const CALCULATE_LEAD_SCORE = gql`
  mutation CalculateLeadScore($id: ID!) {
    clientCalculateLeadScore(id: $id) { success result message }
  }
`;

export const RECALCULATE_ALL_LEAD_SCORES = gql`
  mutation RecalculateAllLeadScores {
    clientRecalculateAllLeadScores { success result message }
  }
`;
