// @ts-nocheck
const { gql } = require('graphql-tag');

const copilotTypeDefs = gql`
  type CopilotSession {
    _id: ID!
    userId: ID
    context: JSON
    messages: [JSON]
    status: String
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CopilotPromptInput {
    message: String!
    context: JSON
    sessionId: ID
    action: String
  }

  extend type Query {
    copilotSessionList(page: Int, limit: Int): ListResponse!
    copilotSessionRead(id: ID!): MutationResponse!
    copilotSuggestions(context: JSON): MutationResponse!
    copilotContextualHelp(page: String, action: String): MutationResponse!
  }

  extend type Mutation {
    copilotSessionCreate: MutationResponse!
    copilotSendPrompt(input: CopilotPromptInput!): MutationResponse!
    copilotSessionDelete(id: ID!): MutationResponse!
    copilotSessionClear(id: ID!): MutationResponse!
    copilotGenerateAction(input: JSON!): MutationResponse!
    copilotApplySuggestion(sessionId: ID!, suggestionId: String!): MutationResponse!
  }
`;

module.exports = copilotTypeDefs;
