import { gql } from '@apollo/client';

/**
 * Dynamic GraphQL operation factory for generic CRUD entities.
 * Generates queries/mutations matching the backend's generateCRUDResolvers pattern:
 * {entity}List, {entity}Create, {entity}Read, {entity}Update, {entity}Delete, etc.
 */

export function getListQuery(entity: string) {
  return gql`
    query ${entity}List($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
      ${entity}List(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
        success result pagination { page count pages total } message
      }
    }
  `;
}

export function getListAllQuery(entity: string) {
  return gql`
    query ${entity}ListAll {
      ${entity}ListAll { success result message }
    }
  `;
}

export function getReadQuery(entity: string) {
  return gql`
    query ${entity}Read($id: ID!) {
      ${entity}Read(id: $id) { success result message }
    }
  `;
}

export function getSearchQuery(entity: string) {
  return gql`
    query ${entity}Search($q: String!, $fields: String) {
      ${entity}Search(q: $q, fields: $fields) { success result message }
    }
  `;
}

export function getFilterQuery(entity: string) {
  return gql`
    query ${entity}Filter($filter: JSON) {
      ${entity}Filter(filter: $filter) { success result message }
    }
  `;
}

export function getSummaryQuery(entity: string) {
  return gql`
    query ${entity}Summary {
      ${entity}Summary { success result message }
    }
  `;
}

export function getCreateMutation(entity: string) {
  return gql`
    mutation ${entity}Create($input: JSON!) {
      ${entity}Create(input: $input) { success result message }
    }
  `;
}

export function getUpdateMutation(entity: string) {
  return gql`
    mutation ${entity}Update($id: ID!, $input: JSON!) {
      ${entity}Update(id: $id, input: $input) { success result message }
    }
  `;
}

export function getDeleteMutation(entity: string) {
  return gql`
    mutation ${entity}Delete($id: ID!) {
      ${entity}Delete(id: $id) { success result message }
    }
  `;
}

export function getMailMutation(entity: string) {
  return gql`
    mutation ${entity}Mail($id: ID!, $input: JSON) {
      ${entity}Mail(id: $id, input: $input) { success result message }
    }
  `;
}

export function getConvertMutation(entity: string) {
  return gql`
    mutation ${entity}Convert($id: ID!) {
      ${entity}Convert(id: $id) { success result message }
    }
  `;
}
