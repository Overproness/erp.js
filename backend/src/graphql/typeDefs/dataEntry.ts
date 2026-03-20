// @ts-nocheck
const { gql } = require('graphql-tag');

const dataEntryTypeDefs = gql`
  input DataEntryImportInput {
    entityType: String!
    data: [JSON!]!
    options: JSON
  }

  extend type Query {
    dataEntryTemplates(entityType: String!): MutationResponse!
    dataEntryValidate(entityType: String!, data: [JSON!]!): MutationResponse!
  }

  extend type Mutation {
    dataEntryImport(input: DataEntryImportInput!): MutationResponse!
    dataEntryBulkImport(input: DataEntryImportInput!): MutationResponse!
    dataEntryExport(entityType: String!, format: String, filters: JSON): MutationResponse!
  }
`;

module.exports = dataEntryTypeDefs;
