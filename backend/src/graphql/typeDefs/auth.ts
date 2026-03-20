// @ts-nocheck
const { gql } = require('graphql-tag');

const authTypeDefs = gql`
  type AuthResponse {
    success: Boolean!
    result: AuthResult
    message: String!
  }

  type AuthResult {
    token: String
    admin: AdminUser
  }

  type AdminUser {
    _id: ID!
    email: String!
    name: String
    surname: String
    photo: String
    role: String
    companyName: String
    companyID: String
    hasCompanySetup: Boolean
  }

  type TokenVerification {
    success: Boolean!
    result: AdminUser
    message: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String
    surname: String
    companyName: String
  }

  input ForgetPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    password: String!
    token: String!
  }

  extend type Query {
    verifyToken: TokenVerification!
  }

  extend type Mutation {
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    forgetPassword(input: ForgetPasswordInput!): MutationResponse!
    resetPassword(input: ResetPasswordInput!): MutationResponse!
    logout: MutationResponse!
  }
`;

module.exports = authTypeDefs;
