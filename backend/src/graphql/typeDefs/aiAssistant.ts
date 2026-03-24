// @ts-nocheck
const { gql } = require('graphql-tag');

const aiAssistantTypeDefs = gql`
  type AIConversation {
    _id: ID!
    userId: ID
    title: String
    messages: [JSON]
    context: JSON
    model: String
    status: String
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input AIMessageInput {
    content: String!
    role: String
    context: JSON
    model: String
  }

  extend type Query {
    aiAssistantList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    aiAssistantListAll: ListResponse!
    aiAssistantRead(id: ID!): MutationResponse!
    aiAssistantSearch(q: String!, fields: String): ListResponse!
    aiAssistantFilter(filter: String, equal: String): ListResponse!
    aiConversationList(page: Int, limit: Int): ListResponse!
    aiConversationRead(id: ID!): MutationResponse!
    aiConversationHistory(id: ID!): MutationResponse!
    aiSuggestions(context: String!, type: String): MutationResponse!
  }

  extend type Mutation {
    aiAssistantCreate(input: JSON): MutationResponse!
    aiAssistantUpdate(id: ID!, input: JSON): MutationResponse!
    aiAssistantDelete(id: ID!): MutationResponse!
    aiConversationCreate(input: JSON): MutationResponse!
    aiConversationSendMessage(id: ID!, input: AIMessageInput!): MutationResponse!
    aiConversationDelete(id: ID!): MutationResponse!
    aiConversationClear(id: ID!): MutationResponse!
    aiGenerateContent(input: JSON!): MutationResponse!
    aiAnalyzeText(input: JSON!): MutationResponse!
    aiSummarize(input: JSON!): MutationResponse!
    aiTranslate(input: JSON!): MutationResponse!
  }
`;

module.exports = aiAssistantTypeDefs;
