// @ts-nocheck
const { gql } = require('graphql-tag');

const aiPreferencesTypeDefs = gql`
  type AIUserPreference {
    _id: ID!
    userId: ID
    preferredModel: String
    temperature: Float
    maxTokens: Int
    language: String
    autoSuggest: Boolean
    customInstructions: String
    enabledFeatures: [String]
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input AIUserPreferenceInput {
    preferredModel: String
    temperature: Float
    maxTokens: Int
    language: String
    autoSuggest: Boolean
    customInstructions: String
    enabledFeatures: [String]
  }

  extend type Query {
    aiPreferencesRead: MutationResponse!
    aiPreferencesList(page: Int, limit: Int): ListResponse!
    aiAvailableModels: MutationResponse!
  }

  extend type Mutation {
    aiPreferencesUpdate(input: AIUserPreferenceInput!): MutationResponse!
    aiPreferencesReset: MutationResponse!
  }
`;

module.exports = aiPreferencesTypeDefs;
