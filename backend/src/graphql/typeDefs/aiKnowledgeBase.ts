// @ts-nocheck
const { gql } = require('graphql-tag');

const aiKnowledgeBaseTypeDefs = gql`
  type KnowledgeBaseEntry {
    _id: ID!
    title: String!
    content: String
    category: String
    tags: [String]
    source: String
    sourceUrl: String
    embedding: [Float]
    metadata: JSON
    isPublic: Boolean
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input KnowledgeBaseEntryCreateInput {
    title: String!
    content: String!
    category: String
    tags: [String]
    source: String
    sourceUrl: String
    isPublic: Boolean
  }

  input KnowledgeBaseEntryUpdateInput {
    title: String
    content: String
    category: String
    tags: [String]
    isPublic: Boolean
  }

  extend type Query {
    aiKnowledgeBaseList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    aiKnowledgeBaseRead(id: ID!): MutationResponse!
    aiKnowledgeBaseSearch(q: String!, limit: Int): ListResponse!
    aiKnowledgeBaseByCategory(category: String!): ListResponse!
    aiKnowledgeBaseSemanticSearch(query: String!, limit: Int): ListResponse!
  }

  extend type Mutation {
    aiKnowledgeBaseCreate(input: KnowledgeBaseEntryCreateInput!): MutationResponse!
    aiKnowledgeBaseUpdate(id: ID!, input: KnowledgeBaseEntryUpdateInput!): MutationResponse!
    aiKnowledgeBaseDelete(id: ID!): MutationResponse!
    aiKnowledgeBaseBulkImport(input: [KnowledgeBaseEntryCreateInput!]!): MutationResponse!
    aiKnowledgeBaseReindex: MutationResponse!
  }
`;

module.exports = aiKnowledgeBaseTypeDefs;
