// @ts-nocheck
const { gql } = require('graphql-tag');

const auditTypeDefs = gql`
  type AuditTrail {
    _id: ID!
    action: String!
    entityType: String!
    entityId: ID
    userId: ID
    userName: String
    changes: JSON
    previousValues: JSON
    newValues: JSON
    ipAddress: String
    userAgent: String
    metadata: JSON
    companyID: ID
    createdAt: DateTime
  }

  extend type Query {
    auditTrailList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    auditTrailRead(id: ID!): MutationResponse!
    auditTrailByEntity(entityType: String!, entityId: ID!): ListResponse!
    auditTrailByUser(userId: ID!, page: Int, limit: Int): ListResponse!
    auditTrailFilter(filter: String, equal: String): ListResponse!
    auditTrailSearch(q: String!, fields: String): ListResponse!
    auditTrailReport(period: String, entityType: String): MutationResponse!
  }
`;

module.exports = auditTypeDefs;
