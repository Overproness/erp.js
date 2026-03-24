// @ts-nocheck
const { gql } = require('graphql-tag');

const dataEntryTypeDefs = gql`
  input DataEntryImportInput {
    entityType: String!
    data: [JSON!]!
    options: JSON
  }

  input DataEntryValidateInput {
    data: [JSON!]!
    module: String!
    options: JSON
  }

  extend type Query {
    dataEntryTemplates(entityType: String!): MutationResponse!
  }

  extend type Mutation {
    dataEntryImport(input: DataEntryImportInput!): MutationResponse!
    dataEntryBulkImport(input: DataEntryImportInput!): MutationResponse!
    dataEntryExport(entityType: String!, format: String, filters: JSON): MutationResponse!
    dataEntryImportFromUrl(entityType: String!, url: String!, options: JSON): MutationResponse!
    dataEntrySave(entityType: String!, data: [JSON!]!): MutationResponse!
    dataEntryValidate(input: DataEntryValidateInput!): MutationResponse!
  }
`;

module.exports = dataEntryTypeDefs;
