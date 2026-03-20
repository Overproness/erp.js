// @ts-nocheck
const { gql } = require('graphql-tag');

const paymentModeTypeDefs = gql`
  type PaymentMode {
    _id: ID!
    name: String!
    description: String
    isDefault: Boolean
    enabled: Boolean
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input PaymentModeCreateInput {
    name: String!
    description: String
    isDefault: Boolean
  }

  input PaymentModeUpdateInput {
    name: String
    description: String
    isDefault: Boolean
    enabled: Boolean
  }

  extend type Query {
    paymentModeRead(id: ID!): MutationResponse!
    paymentModeList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    paymentModeListAll: ListResponse!
    paymentModeSearch(q: String!, fields: String): ListResponse!
    paymentModeFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    paymentModeCreate(input: PaymentModeCreateInput!): MutationResponse!
    paymentModeUpdate(id: ID!, input: PaymentModeUpdateInput!): MutationResponse!
    paymentModeDelete(id: ID!): MutationResponse!
  }
`;

module.exports = paymentModeTypeDefs;
