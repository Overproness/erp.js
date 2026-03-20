// @ts-nocheck
const { gql } = require('graphql-tag');

const workflowExecutionTypeDefs = gql`
  type WorkflowExecution {
    _id: ID!
    workflow: ID
    status: String
    startedAt: DateTime
    completedAt: DateTime
    currentStep: Int
    stepResults: [JSON]
    error: JSON
    triggeredBy: ID
    triggerType: String
    input: JSON
    output: JSON
    duration: Int
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  extend type Query {
    workflowExecutionRead(id: ID!): MutationResponse!
    workflowExecutionList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    workflowExecutionFilter(filter: String, equal: String): ListResponse!
    workflowExecutionByWorkflow(workflowId: ID!, page: Int, limit: Int): ListResponse!
  }

  extend type Mutation {
    workflowExecutionDelete(id: ID!): MutationResponse!
  }
`;

module.exports = workflowExecutionTypeDefs;
