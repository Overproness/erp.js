// @ts-nocheck
const { gql } = require('graphql-tag');

const paymentTypeDefs = gql`
  type Payment {
    _id: ID!
    paymentNumber: String
    client: ID
    invoice: ID
    amount: Float
    currency: String
    paymentMode: ID
    paymentDate: DateTime
    description: String
    notes: String
    status: String
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input PaymentCreateInput {
    client: ID!
    invoice: ID
    amount: Float!
    currency: String
    paymentMode: ID
    paymentDate: DateTime
    description: String
    notes: String
  }

  input PaymentUpdateInput {
    client: ID
    invoice: ID
    amount: Float
    currency: String
    paymentMode: ID
    paymentDate: DateTime
    description: String
    notes: String
    status: String
  }

  extend type Query {
    paymentRead(id: ID!): MutationResponse!
    paymentList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    paymentListAll: ListResponse!
    paymentSearch(q: String!, fields: String): ListResponse!
    paymentFilter(filter: String, equal: String): ListResponse!
    paymentSummary: MutationResponse!
  }

  extend type Mutation {
    paymentCreate(input: PaymentCreateInput!): MutationResponse!
    paymentUpdate(id: ID!, input: PaymentUpdateInput!): MutationResponse!
    paymentDelete(id: ID!): MutationResponse!
    paymentBulkCreate(input: [PaymentCreateInput!]!): MutationResponse!
    paymentBulkDelete(ids: [ID!]!): MutationResponse!
    paymentMail(id: ID!, input: JSON): MutationResponse!
  }
`;

module.exports = paymentTypeDefs;
