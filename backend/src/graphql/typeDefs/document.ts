// @ts-nocheck
const { gql } = require('graphql-tag');

const documentTypeDefs = gql`
  type DocumentVersion {
    version: Int
    content: JSON
    modifiedBy: ID
    modifiedAt: DateTime
    changeDescription: String
  }

  type Document {
    _id: ID!
    title: String!
    description: String
    content: JSON
    type: String
    category: String
    status: String
    tags: [String]
    fileUrl: String
    fileName: String
    fileSize: Int
    mimeType: String
    versions: [DocumentVersion]
    currentVersion: Int
    collaborators: [ID]
    permissions: JSON
    isTemplate: Boolean
    templateId: ID
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input DocumentCreateInput {
    title: String!
    description: String
    content: JSON
    type: String
    category: String
    tags: [String]
    isTemplate: Boolean
    templateId: ID
  }

  input DocumentUpdateInput {
    title: String
    description: String
    content: JSON
    type: String
    category: String
    status: String
    tags: [String]
  }

  extend type Query {
    documentRead(id: ID!): MutationResponse!
    documentList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    documentListAll: ListResponse!
    documentSearch(q: String!, fields: String): ListResponse!
    documentFilter(filter: String, equal: String): ListResponse!
    documentAdvancedSearch(input: JSON!): ListResponse!
    documentListVersions(id: ID!): ListResponse!
    documentGetVersion(id: ID!, version: Int!): MutationResponse!
    documentGetContent(id: ID!): MutationResponse!
    documentAuditTrail(id: ID!): ListResponse!
    documentListShareURLs(id: ID!): ListResponse!
  }

  extend type Mutation {
    documentCreate(input: JSON!): MutationResponse!
    documentUpdate(id: ID!, input: JSON!): MutationResponse!
    documentDelete(id: ID!): MutationResponse!
    documentBulkDelete(ids: [ID!]!): MutationResponse!
    documentDownload(id: ID!): MutationResponse!
    documentCreateVersion(id: ID!, input: JSON): MutationResponse!
    documentRevertToVersion(id: ID!, version: Int!): MutationResponse!
    documentRevertToOriginal(id: ID!): MutationResponse!
    documentEdit(id: ID!, input: JSON): MutationResponse!
    documentESign(id: ID!, input: JSON): MutationResponse!
    documentAnnotate(id: ID!, input: JSON): MutationResponse!
    documentAddCollaborator(id: ID!, userId: ID!): MutationResponse!
    documentAnalyze(id: ID!): MutationResponse!
    documentShare(id: ID!, input: JSON): MutationResponse!
    documentGenerateShareLink(id: ID!): MutationResponse!
    documentSuggestTags(id: ID!): MutationResponse!
    documentApplySuggestedTags(id: ID!, tags: [String!]!): MutationResponse!
    documentSummarize(id: ID!): MutationResponse!
    documentBulkImportFromURLs(urls: [String!]!): MutationResponse!
    documentCreateCompliance(id: ID!, input: JSON): MutationResponse!
    documentGetCompliance(id: ID!): MutationResponse!
  }
`;

module.exports = documentTypeDefs;
