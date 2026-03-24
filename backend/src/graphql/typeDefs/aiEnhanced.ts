// @ts-nocheck
const { gql } = require('graphql-tag');

const aiEnhancedTypeDefs = gql`
  extend type Query {
    aiEnhancedAnalytics(entityType: String!, period: String): MutationResponse!
    aiEnhancedInsights(context: JSON): MutationResponse!
    aiEnhancedRecommendations(entityType: String!, entityId: ID): MutationResponse!
    aiEnhancedForecast(metric: String!, period: String): MutationResponse!
    aiEnhancedQueueStatus(queueId: ID): MutationResponse!
    aiEnhancedQueueStatistics: MutationResponse!
    aiEnhancedLearningStats: MutationResponse!
  }

  extend type Mutation {
    aiEnhancedProcessEntity(entityType: String!, entityId: ID!): MutationResponse!
    aiEnhancedBatchProcess(entityType: String!, ids: [ID!]!): MutationResponse!
    aiEnhancedOptimize(input: JSON!): MutationResponse!
    aiEnhancedAutoTag(entityType: String!, entityId: ID!): MutationResponse!
    aiEnhancedSentimentAnalysis(input: JSON!): MutationResponse!
    aiEnhancedLeadScoring(clientId: ID!): MutationResponse!
    aiEnhancedQueueMessage(input: JSON!): MutationResponse!
    aiEnhancedRecordFeedback(learningId: ID!, input: JSON!): MutationResponse!
  }
`;

module.exports = aiEnhancedTypeDefs;
