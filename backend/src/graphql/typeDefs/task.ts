// @ts-nocheck
const { gql } = require('graphql-tag');

const taskTypeDefs = gql`
  type Task {
    _id: ID!
    title: String!
    description: String
    status: String
    priority: String
    dueDate: DateTime
    startDate: DateTime
    completedDate: DateTime
    assignedTo: ID
    collaborators: [ID]
    tags: [String]
    project: ID
    parentTask: ID
    subtasks: [ID]
    estimatedHours: Float
    actualHours: Float
    progress: Int
    attachments: [JSON]
    comments: [JSON]
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input TaskCreateInput {
    title: String!
    description: String
    status: String
    priority: String
    dueDate: DateTime
    startDate: DateTime
    assignedTo: ID
    collaborators: [ID]
    tags: [String]
    project: ID
    parentTask: ID
    estimatedHours: Float
  }

  input TaskUpdateInput {
    title: String
    description: String
    status: String
    priority: String
    dueDate: DateTime
    startDate: DateTime
    completedDate: DateTime
    assignedTo: ID
    collaborators: [ID]
    tags: [String]
    project: ID
    estimatedHours: Float
    actualHours: Float
    progress: Int
  }

  extend type Query {
    taskRead(id: ID!): MutationResponse!
    taskList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    taskListAll: ListResponse!
    taskSearch(q: String!, fields: String): ListResponse!
    taskFilter(filter: String, equal: String): ListResponse!
    taskSummary: MutationResponse!
  }

  extend type Mutation {
    taskCreate(input: TaskCreateInput!): MutationResponse!
    taskUpdate(id: ID!, input: TaskUpdateInput!): MutationResponse!
    taskDelete(id: ID!): MutationResponse!
    taskBulkCreate(input: [TaskCreateInput!]!): MutationResponse!
    taskBulkUpdate(ids: [ID!]!, input: TaskUpdateInput!): MutationResponse!
    taskBulkDelete(ids: [ID!]!): MutationResponse!
    taskAddCollaborator(id: ID!, userId: ID!): MutationResponse!
    taskDelegate(id: ID!, userId: ID!): MutationResponse!
    taskReassign(id: ID!, userId: ID!): MutationResponse!
    taskAiPrioritize(id: ID!): MutationResponse!
    taskBatchUpdatePriorities(input: JSON!): MutationResponse!
    taskAddComment(id: ID!, content: String!): MutationResponse!
  }
`;

module.exports = taskTypeDefs;
