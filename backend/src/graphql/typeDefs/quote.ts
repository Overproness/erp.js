// @ts-nocheck
const { gql } = require('graphql-tag');

const quoteTypeDefs = gql`
  type QuoteItem {
    itemName: String
    description: String
    quantity: Float
    price: Float
    total: Float
  }

  type Quote {
    _id: ID!
    quoteNumber: String
    client: ID
    items: [QuoteItem]
    subTotal: Float
    taxRate: Float
    taxTotal: Float
    total: Float
    discount: Float
    currency: String
    status: String
    dueDate: DateTime
    issueDate: DateTime
    notes: String
    converted: Boolean
    convertedInvoice: ID
    pdfPath: String
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input QuoteItemInput {
    itemName: String
    description: String
    quantity: Float
    price: Float
    total: Float
  }

  input QuoteCreateInput {
    client: ID!
    items: [QuoteItemInput]
    subTotal: Float
    taxRate: Float
    taxTotal: Float
    total: Float
    discount: Float
    currency: String
    status: String
    dueDate: DateTime
    issueDate: DateTime
    notes: String
  }

  input QuoteUpdateInput {
    client: ID
    items: [QuoteItemInput]
    subTotal: Float
    taxRate: Float
    taxTotal: Float
    total: Float
    discount: Float
    currency: String
    status: String
    dueDate: DateTime
    issueDate: DateTime
    notes: String
  }

  extend type Query {
    quoteRead(id: ID!): MutationResponse!
    quoteList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    quoteListAll: ListResponse!
    quoteSearch(q: String!, fields: String): ListResponse!
    quoteFilter(filter: String, equal: String): ListResponse!
    quoteSummary: MutationResponse!
    quoteDeliveryHistory(id: ID!): MutationResponse!
    quoteDeliveryStatus(id: ID!): MutationResponse!
  }

  extend type Mutation {
    quoteCreate(input: JSON!): MutationResponse!
    quoteUpdate(id: ID!, input: JSON!): MutationResponse!
    quoteDelete(id: ID!): MutationResponse!
    quoteBulkCreate(input: JSON!): MutationResponse!
    quoteBulkDelete(ids: [ID!]!): MutationResponse!
    quoteMail(id: ID!, input: JSON): MutationResponse!
    quoteSend(id: ID!): MutationResponse!
    quoteConvert(id: ID!): MutationResponse!
    quoteSendBulk(ids: [ID!]!): MutationResponse!
  }
`;

module.exports = quoteTypeDefs;
