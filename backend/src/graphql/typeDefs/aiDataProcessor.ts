// @ts-nocheck
const { gql } = require('graphql-tag');

const aiDataProcessorTypeDefs = gql`
  type AIProcessingJob {
    _id: ID!
    type: String
    status: String
    inputData: JSON
    outputData: JSON
    model: String
    startedAt: DateTime
    completedAt: DateTime
    error: JSON
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input AIProcessingJobInput {
    type: String!
    inputData: JSON!
    model: String
    options: JSON
  }

  extend type Query {
    aiProcessingJobList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    aiProcessingJobRead(id: ID!): MutationResponse!
    aiProcessingJobFilter(filter: String, equal: String): ListResponse!
    aiProcessingJobStatus(id: ID!): MutationResponse!
  }

  extend type Mutation {
    aiProcessingJobCreate(input: AIProcessingJobInput!): MutationResponse!
    aiProcessingJobCancel(id: ID!): MutationResponse!
    aiProcessingJobRetry(id: ID!): MutationResponse!
    aiProcessingJobDelete(id: ID!): MutationResponse!
    aiProcessingBatchCreate(input: [AIProcessingJobInput!]!): MutationResponse!
    aiExtractEntities(input: JSON!): MutationResponse!
    aiClassifyDocument(input: JSON!): MutationResponse!
    aiDetectAnomalies(input: JSON!): MutationResponse!
    aiPredictTrend(input: JSON!): MutationResponse!
  }
`;

module.exports = aiDataProcessorTypeDefs;
