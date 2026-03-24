import { gql } from '@apollo/client';

export const GET_DOCUMENTS = gql`
  query GetDocuments($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    documentList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_DOCUMENT = gql`
  query GetDocument($id: ID!) { documentRead(id: $id) { success result message } }
`;

export const SEARCH_DOCUMENTS = gql`
  query SearchDocuments($q: String!, $fields: String) {
    documentSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const ADVANCED_SEARCH_DOCUMENTS = gql`
  query AdvancedSearchDocuments($input: JSON!) {
    documentAdvancedSearch(input: $input) { success result message }
  }
`;

export const DOCUMENT_VERSIONS = gql`
  query DocumentVersions($id: ID!) {
    documentListVersions(id: $id) { success result message }
  }
`;

export const DOCUMENT_AUDIT_TRAIL = gql`
  query DocumentAuditTrail($id: ID!) {
    documentAuditTrail(id: $id) { success result message }
  }
`;

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($input: DocumentCreateInput!) {
    documentCreate(input: $input) { success result message }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($id: ID!, $input: DocumentUpdateInput!) {
    documentUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    documentDelete(id: $id) { success result message }
  }
`;

export const DOCUMENT_DOWNLOAD = gql`
  mutation DocumentDownload($id: ID!) {
    documentDownload(id: $id) { success result message }
  }
`;

export const DOCUMENT_CREATE_VERSION = gql`
  mutation DocumentCreateVersion($id: ID!, $input: JSON) {
    documentCreateVersion(id: $id, input: $input) { success result message }
  }
`;

export const DOCUMENT_REVERT = gql`
  mutation DocumentRevert($id: ID!, $version: Int!) {
    documentRevertToVersion(id: $id, version: $version) { success result message }
  }
`;

export const DOCUMENT_ESIGN = gql`
  mutation DocumentESign($id: ID!, $input: JSON) {
    documentESign(id: $id, input: $input) { success result message }
  }
`;

export const DOCUMENT_SHARE = gql`
  mutation DocumentShare($id: ID!, $input: JSON) {
    documentShare(id: $id, input: $input) { success result message }
  }
`;

export const DOCUMENT_ANALYZE = gql`
  mutation DocumentAnalyze($id: ID!) {
    documentAnalyze(id: $id) { success result message }
  }
`;

export const DOCUMENT_SUMMARIZE = gql`
  mutation DocumentSummarize($id: ID!) {
    documentSummarize(id: $id) { success result message }
  }
`;

export const DOCUMENT_GET_CONTENT = gql`
  query DocumentGetContent($id: ID!) {
    documentGetContent(id: $id) { success result message }
  }
`;

export const DOCUMENT_EDIT_CONTENT = gql`
  mutation DocumentEditContent($id: ID!, $input: JSON!) {
    documentEdit(id: $id, input: $input) { success result message }
  }
`;

export const DOCUMENT_REVERT_TO_ORIGINAL = gql`
  mutation DocumentRevertToOriginal($id: ID!) {
    documentRevertToOriginal(id: $id) { success result message }
  }
`;
