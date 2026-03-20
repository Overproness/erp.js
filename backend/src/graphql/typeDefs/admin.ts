// @ts-nocheck
const { gql } = require('graphql-tag');

const adminTypeDefs = gql`
  type Admin {
    _id: ID!
    email: String!
    name: String
    surname: String
    photo: String
    role: String
    enabled: Boolean
    onboardingComplete: Boolean
    companyName: String
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type User {
    _id: ID!
    email: String!
    name: String
    surname: String
    photo: String
    role: String
    enabled: Boolean
    permissions: UserPermissions
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type UserPermissions {
    create: Boolean
    read: Boolean
    update: Boolean
    delete: Boolean
    manageTeam: Boolean
    manageBilling: Boolean
    manageSettings: Boolean
    viewReports: Boolean
    manageDocuments: Boolean
    manageWorkflows: Boolean
  }

  input AdminUpdateInput {
    name: String
    surname: String
    photo: String
    role: String
    enabled: Boolean
    onboardingComplete: Boolean
    companyName: String
  }

  input UserCreateInput {
    email: String!
    name: String
    surname: String
    role: String
    permissions: UserPermissionsInput
  }

  input UserUpdateInput {
    name: String
    surname: String
    photo: String
    role: String
    enabled: Boolean
    permissions: UserPermissionsInput
  }

  input UserPermissionsInput {
    create: Boolean
    read: Boolean
    update: Boolean
    delete: Boolean
    manageTeam: Boolean
    manageBilling: Boolean
    manageSettings: Boolean
    viewReports: Boolean
    manageDocuments: Boolean
    manageWorkflows: Boolean
  }

  extend type Query {
    adminRead(id: ID!): MutationResponse!
    adminList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    userRead(id: ID!): MutationResponse!
    userList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    userSearch(q: String!, fields: String): ListResponse!
    userProfile: MutationResponse!
    userPermissions: MutationResponse!
  }

  extend type Mutation {
    adminUpdate(id: ID!, input: AdminUpdateInput!): MutationResponse!
    adminPasswordUpdate(id: ID!, input: JSON!): MutationResponse!
    adminCompleteSetup(input: JSON!): MutationResponse!
    updateProfilePassword(input: JSON!): MutationResponse!
    updateProfile(input: JSON!): MutationResponse!
    userCreate(input: UserCreateInput!): MutationResponse!
    userUpdate(id: ID!, input: UserUpdateInput!): MutationResponse!
    userDelete(id: ID!): MutationResponse!
  }
`;

module.exports = adminTypeDefs;
