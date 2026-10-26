// @ts-nocheck
const { gql } = require('graphql-tag');

const businessProcessTypeDefs = gql`
  type BusinessProcess {
    _id: ID!
    name: String!
    description: String
    processType: String
    status: String
    steps: [JSON]
    currentStep: Int
    assignedTo: ID
    priority: String
    dueDate: DateTime
    completedAt: DateTime
    metadata: JSON
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input BusinessProcessCreateInput {
    name: String!
    description: String
    processType: String
    steps: [JSON]
    assignedTo: ID
    priority: String
    dueDate: DateTime
  }

  input BusinessProcessUpdateInput {
    name: String
    description: String
    processType: String
    status: String
    steps: [JSON]
    currentStep: Int
    assignedTo: ID
    priority: String
    dueDate: DateTime
  }

  extend type Query {
    businessProcessRead(id: ID!): MutationResponse!
    businessProcessList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    businessProcessListAll: ListResponse!
    businessProcessSearch(q: String!, fields: String): ListResponse!
    businessProcessFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    businessProcessCreate(input: JSON!): MutationResponse!
    businessProcessUpdate(id: ID!, input: JSON!): MutationResponse!
    businessProcessDelete(id: ID!): MutationResponse!
    businessProcessAdvanceStep(id: ID!): MutationResponse!
    businessProcessComplete(id: ID!): MutationResponse!
  }
`;

module.exports = businessProcessTypeDefs;
