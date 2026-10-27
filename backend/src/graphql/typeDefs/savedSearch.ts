// @ts-nocheck
const { gql } = require('graphql-tag');

const savedSearchTypeDefs = gql`
  extend type Query {
    savedSearchRead(id: ID!): MutationResponse!
    savedSearchList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    savedSearchListAll: ListResponse!
    savedSearchSearch(q: String!, fields: String): ListResponse!
    savedSearchFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    savedSearchCreate(input: JSON!): MutationResponse!
    savedSearchUpdate(id: ID!, input: JSON!): MutationResponse!
    savedSearchDelete(id: ID!): MutationResponse!
    savedSearchExecute(id: ID!): MutationResponse!
  }
`;

module.exports = savedSearchTypeDefs;
