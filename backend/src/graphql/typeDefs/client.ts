// @ts-nocheck
const { gql } = require('graphql-tag');

const clientTypeDefs = gql`
  type Client {
    _id: ID!
    name: String
    customerType: String
    company: String
    managerName: String
    email: String
    phone: String
    address: String
    city: String
    state: String
    zipCode: String
    country: String
    website: String
    industry: String
    source: String
    referredBy: String
    status: String
    type: String
    notes: String
    tags: [String]
    customFields: JSON
    leadScore: Int
    touchpoints: [JSON]
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input ClientCreateInput {
    company: String
    managerName: String
    email: String
    phone: String
    address: String
    city: String
    state: String
    zipCode: String
    country: String
    website: String
    industry: String
    source: String
    referredBy: String
    status: String
    type: String
    notes: String
    tags: [String]
    customFields: JSON
  }

  input ClientUpdateInput {
    company: String
    managerName: String
    email: String
    phone: String
    address: String
    city: String
    state: String
    zipCode: String
    country: String
    website: String
    industry: String
    source: String
    referredBy: String
    status: String
    type: String
    notes: String
    tags: [String]
    customFields: JSON
    leadScore: Int
  }

  extend type Query {
    clientRead(id: ID!): MutationResponse!
    clientList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    clientListAll: ListResponse!
    clientSearch(q: String!, fields: String): ListResponse!
    clientFilter(filter: String, equal: String): ListResponse!
    clientSummary: MutationResponse!
  }

  extend type Mutation {
    clientCreate(input: JSON!): MutationResponse!
    clientUpdate(id: ID!, input: JSON!): MutationResponse!
    clientDelete(id: ID!): MutationResponse!
    clientBulkCreate(input: JSON!): MutationResponse!
    clientBulkUpdate(ids: [ID!]!, input: JSON!): MutationResponse!
    clientBulkDelete(ids: [ID!]!): MutationResponse!
    clientCalculateLeadScore(id: ID!): MutationResponse!
    clientRecalculateAllLeadScores: MutationResponse!
  }
`;

module.exports = clientTypeDefs;
