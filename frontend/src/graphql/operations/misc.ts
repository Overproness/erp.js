import { gql } from '@apollo/client';

// CRM URLs (Saved searches, shared resources, data entry)
export const GET_SAVED_SEARCHES = gql`
  query GetSavedSearches($page: Int, $limit: Int) {
    savedSearchList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SAVED_SEARCH = gql`
  query GetSavedSearch($id: ID!) {
    savedSearchRead(id: $id) { success result message }
  }
`;

export const CREATE_SAVED_SEARCH = gql`
  mutation CreateSavedSearch($input: SavedSearchCreateInput!) {
    savedSearchCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SAVED_SEARCH = gql`
  mutation UpdateSavedSearch($id: ID!, $input: SavedSearchUpdateInput!) {
    savedSearchUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SAVED_SEARCH = gql`
  mutation DeleteSavedSearch($id: ID!) {
    savedSearchDelete(id: $id) { success result message }
  }
`;

export const EXECUTE_SAVED_SEARCH = gql`
  mutation ExecuteSavedSearch($id: ID!) {
    savedSearchExecute(id: $id) { success result message }
  }
`;

// Shared Resources
export const GET_SHARED_RESOURCES = gql`
  query GetSharedResources($page: Int, $limit: Int) {
    sharedResourceList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SHARED_RESOURCE = gql`
  query GetSharedResource($id: ID!) {
    sharedResourceRead(id: $id) { success result message }
  }
`;

export const CREATE_SHARED_RESOURCE = gql`
  mutation CreateSharedResource($input: SharedResourceCreateInput!) {
    sharedResourceCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SHARED_RESOURCE = gql`
  mutation UpdateSharedResource($id: ID!, $input: SharedResourceUpdateInput!) {
    sharedResourceUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SHARED_RESOURCE = gql`
  mutation DeleteSharedResource($id: ID!) {
    sharedResourceDelete(id: $id) { success result message }
  }
`;

// Data Entry (bulk import/export)
export const DATA_ENTRY_IMPORT = gql`
  mutation DataEntryImport($input: DataEntryImportInput!) {
    dataEntryImport(input: $input) { success result message }
  }
`;

export const DATA_ENTRY_EXPORT = gql`
  mutation DataEntryExport($input: DataEntryExportInput!) {
    dataEntryExport(input: $input) { success result message }
  }
`;

export const DATA_ENTRY_VALIDATE = gql`
  mutation DataEntryValidate($input: DataEntryValidateInput!) {
    dataEntryValidate(input: $input) { success result message }
  }
`;

export const DATA_ENTRY_TEMPLATE = gql`
  query DataEntryTemplate($entity: String!) {
    dataEntryTemplate(entity: $entity) { success result message }
  }
`;

export const DATA_ENTRY_HISTORY = gql`
  query DataEntryHistory($page: Int, $limit: Int) {
    dataEntryHistory(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;
