// @ts-nocheck
const { gql } = require('graphql-tag');

const workflowTypeDefs = gql`
  type WorkflowStep {
    name: String
    type: String
    config: JSON
    order: Int
    conditions: JSON
    actions: [JSON]
  }

  type Workflow {
    _id: ID!
    name: String!
    description: String
    steps: [WorkflowStep]
    trigger: JSON
    status: String
    isActive: Boolean
    category: String
    version: Int
    executionCount: Int
    lastExecutedAt: DateTime
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input WorkflowStepInput {
    name: String
    type: String
    config: JSON
    order: Int
    conditions: JSON
    actions: [JSON]
  }

  input WorkflowCreateInput {
    name: String!
    description: String
    steps: [WorkflowStepInput]
    trigger: JSON
    category: String
    isActive: Boolean
  }

  input WorkflowUpdateInput {
    name: String
    description: String
    steps: [WorkflowStepInput]
    trigger: JSON
    status: String
    isActive: Boolean
    category: String
  }

  extend type Query {
    workflowRead(id: ID!): MutationResponse!
    workflowList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    workflowListAll: ListResponse!
    workflowSearch(q: String!, fields: String): ListResponse!
    workflowFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    workflowCreate(input: WorkflowCreateInput!): MutationResponse!
    workflowUpdate(id: ID!, input: WorkflowUpdateInput!): MutationResponse!
    workflowDelete(id: ID!): MutationResponse!
  }
`;

module.exports = workflowTypeDefs;
