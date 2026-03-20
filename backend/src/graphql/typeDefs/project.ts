// @ts-nocheck
const { gql } = require('graphql-tag');

const projectTypeDefs = gql`
  type Project {
    _id: ID!
    name: String!
    description: String
    status: String
    priority: String
    startDate: DateTime
    endDate: DateTime
    deadline: DateTime
    progress: Int
    budget: JSON
    tags: [String]
    teams: [JSON]
    members: [JSON]
    attachments: [JSON]
    settings: JSON
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    projectManager: ID
    companyID: ID
    created: DateTime
    updated: DateTime
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ProjectCreateInput {
    name: String!
    description: String
    status: String
    priority: String
    startDate: DateTime
    endDate: DateTime
    deadline: DateTime
    progress: Int
    budget: JSON
    tags: [String]
    teams: [JSON]
    members: [JSON]
    settings: JSON
  }

  input ProjectUpdateInput {
    name: String
    description: String
    status: String
    priority: String
    startDate: DateTime
    endDate: DateTime
    deadline: DateTime
    progress: Int
    budget: JSON
    tags: [String]
    teams: [JSON]
    members: [JSON]
    settings: JSON
  }

  extend type Query {
    projectRead(id: ID!): MutationResponse!
    projectList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
  }

  extend type Mutation {
    projectCreate(input: ProjectCreateInput!): MutationResponse!
    projectUpdate(id: ID!, input: ProjectUpdateInput!): MutationResponse!
  }
`;

module.exports = projectTypeDefs;
