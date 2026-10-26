import { gql } from '@apollo/client';

// Queries
export const GET_QUOTES = gql`
  query GetQuotes($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    quoteList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_QUOTE = gql`
  query GetQuote($id: ID!) { quoteRead(id: $id) { success result message } }
`;

export const SEARCH_QUOTES = gql`
  query SearchQuotes($q: String!, $fields: String) {
    quoteSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const QUOTE_SUMMARY = gql`
  query QuoteSummary { quoteSummary { success result message } }
`;

export const QUOTE_DELIVERY_HISTORY = gql`
  query QuoteDeliveryHistory($id: ID!) {
    quoteDeliveryHistory(id: $id) { success result message }
  }
`;

export const QUOTE_DELIVERY_STATUS = gql`
  query QuoteDeliveryStatus($id: ID!) {
    quoteDeliveryStatus(id: $id) { success result message }
  }
`;

// Mutations
export const CREATE_QUOTE = gql`
  mutation CreateQuote($input: JSON!) {
    quoteCreate(input: $input) { success result message }
  }
`;

export const UPDATE_QUOTE = gql`
  mutation UpdateQuote($id: ID!, $input: JSON!) {
    quoteUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_QUOTE = gql`
  mutation DeleteQuote($id: ID!) {
    quoteDelete(id: $id) { success result message }
  }
`;

export const QUOTE_MAIL = gql`
  mutation QuoteMail($id: ID!, $input: JSON) {
    quoteMail(id: $id, input: $input) { success result message }
  }
`;

export const QUOTE_SEND = gql`
  mutation QuoteSend($id: ID!) {
    quoteSend(id: $id) { success result message }
  }
`;

export const QUOTE_CONVERT = gql`
  mutation QuoteConvert($id: ID!) {
    quoteConvert(id: $id) { success result message }
  }
`;

export const QUOTE_SEND_BULK = gql`
  mutation QuoteSendBulk($ids: [ID!]!) {
    quoteSendBulk(ids: $ids) { success result message }
  }
`;
