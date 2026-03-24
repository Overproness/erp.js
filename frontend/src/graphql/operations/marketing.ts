import { gql } from '@apollo/client';

// Customer Segments
export const GET_CUSTOMER_SEGMENTS = gql`
  query GetCustomerSegments($page: Int, $limit: Int) {
    customerSegmentList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_CUSTOMER_SEGMENT = gql`
  query GetCustomerSegment($id: ID!) {
    customerSegmentRead(id: $id) { success result message }
  }
`;

export const CUSTOMER_SEGMENT_MEMBERS = gql`
  query CustomerSegmentMembers($id: ID!, $page: Int, $limit: Int) {
    customerSegmentMembers(id: $id, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_CUSTOMER_SEGMENT = gql`
  mutation CreateCustomerSegment($input: CustomerSegmentCreateInput!) {
    customerSegmentCreate(input: $input) { success result message }
  }
`;

export const UPDATE_CUSTOMER_SEGMENT = gql`
  mutation UpdateCustomerSegment($id: ID!, $input: CustomerSegmentUpdateInput!) {
    customerSegmentUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_CUSTOMER_SEGMENT = gql`
  mutation DeleteCustomerSegment($id: ID!) {
    customerSegmentDelete(id: $id) { success result message }
  }
`;

export const REFRESH_CUSTOMER_SEGMENT = gql`
  mutation RefreshCustomerSegment($id: ID!) {
    customerSegmentRefresh(id: $id) { success result message }
  }
`;

export const AI_SUGGEST_SEGMENTS = gql`
  mutation AiSuggestSegments {
    customerSegmentAiSuggest { success result message }
  }
`;

// Customer Follow-ups
export const GET_CUSTOMER_FOLLOWUPS = gql`
  query GetCustomerFollowUps($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    customerFollowUpList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_CUSTOMER_FOLLOWUP = gql`
  query GetCustomerFollowUp($id: ID!) {
    customerFollowUpRead(id: $id) { success result message }
  }
`;

export const CREATE_CUSTOMER_FOLLOWUP = gql`
  mutation CreateCustomerFollowUp($input: CustomerFollowUpCreateInput!) {
    customerFollowUpCreate(input: $input) { success result message }
  }
`;

export const UPDATE_CUSTOMER_FOLLOWUP = gql`
  mutation UpdateCustomerFollowUp($id: ID!, $input: CustomerFollowUpUpdateInput!) {
    customerFollowUpUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_CUSTOMER_FOLLOWUP = gql`
  mutation DeleteCustomerFollowUp($id: ID!) {
    customerFollowUpDelete(id: $id) { success result message }
  }
`;

export const COMPLETE_CUSTOMER_FOLLOWUP = gql`
  mutation CompleteCustomerFollowUp($id: ID!, $notes: String) {
    customerFollowUpComplete(id: $id, notes: $notes) { success result message }
  }
`;
