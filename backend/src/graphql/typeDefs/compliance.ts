// @ts-nocheck
const { gql } = require('graphql-tag');

const complianceTypeDefs = gql`
  type ConsentRecord {
    _id: ID!
    client: ID
    consentType: String!
    status: String
    givenAt: DateTime
    expiresAt: DateTime
    revokedAt: DateTime
    purpose: String
    legalBasis: String
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type DataRetentionPolicy {
    _id: ID!
    name: String!
    entityType: String!
    retentionPeriod: Int
    retentionUnit: String
    action: String
    isActive: Boolean
    lastExecuted: DateTime
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ConsentRecordCreateInput {
    client: ID!
    consentType: String!
    purpose: String
    legalBasis: String
    expiresAt: DateTime
    metadata: JSON
  }

  input DataRetentionPolicyCreateInput {
    name: String!
    entityType: String!
    retentionPeriod: Int!
    retentionUnit: String!
    action: String!
    isActive: Boolean
  }

  extend type Query {
    consentRecordList(page: Int, limit: Int): ListResponse!
    consentRecordRead(id: ID!): MutationResponse!
    consentRecordByClient(clientId: ID!): ListResponse!
    dataRetentionPolicyList(page: Int, limit: Int): ListResponse!
    dataRetentionPolicyRead(id: ID!): MutationResponse!
    complianceReport(period: String): MutationResponse!
  }

  extend type Mutation {
    consentRecordCreate(input: ConsentRecordCreateInput!): MutationResponse!
    consentRecordRevoke(id: ID!): MutationResponse!
    consentRecordDelete(id: ID!): MutationResponse!
    dataRetentionPolicyCreate(input: DataRetentionPolicyCreateInput!): MutationResponse!
    dataRetentionPolicyUpdate(id: ID!, input: JSON!): MutationResponse!
    dataRetentionPolicyDelete(id: ID!): MutationResponse!
    dataRetentionPolicyExecute(id: ID!): MutationResponse!
    complianceExportUserData(clientId: ID!): MutationResponse!
    complianceDeleteUserData(clientId: ID!): MutationResponse!
  }
`;

module.exports = complianceTypeDefs;
