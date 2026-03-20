// @ts-nocheck
const { gql } = require('graphql-tag');

const taxesTypeDefs = gql`
  type Taxes {
    _id: ID!
    taxName: String!
    taxValue: Float!
    isDefault: Boolean
    enabled: Boolean
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input TaxesCreateInput {
    taxName: String!
    taxValue: Float!
    isDefault: Boolean
  }

  input TaxesUpdateInput {
    taxName: String
    taxValue: Float
    isDefault: Boolean
    enabled: Boolean
  }

  extend type Query {
    taxesRead(id: ID!): MutationResponse!
    taxesList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    taxesListAll: ListResponse!
    taxesSearch(q: String!, fields: String): ListResponse!
    taxesFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    taxesCreate(input: TaxesCreateInput!): MutationResponse!
    taxesUpdate(id: ID!, input: TaxesUpdateInput!): MutationResponse!
    taxesDelete(id: ID!): MutationResponse!
  }
`;

module.exports = taxesTypeDefs;
