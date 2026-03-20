// @ts-nocheck
const { gql } = require('graphql-tag');

const commonTypeDefs = gql`
  scalar DateTime
  scalar JSON
  scalar Upload

  type PaginationInfo {
    page: Int!
    count: Int!
    pages: Int!
    total: Int
  }

  input PaginationInput {
    page: Int
    limit: Int
    sortBy: String
    sortValue: String
  }

  input FilterInput {
    field: String!
    value: String!
  }

  type MutationResponse {
    success: Boolean!
    result: JSON
    message: String!
  }

  type ListResponse {
    success: Boolean!
    result: [JSON]
    pagination: PaginationInfo
    message: String
  }

  type DeleteResponse {
    success: Boolean!
    result: JSON
    message: String!
  }

  type BatchResponse {
    success: Boolean!
    result: [JSON]
    message: String!
    count: Int
  }
`;

module.exports = commonTypeDefs;
