// @ts-nocheck
const { gql } = require('graphql-tag');

const invoiceTypeDefs = gql`
  type InvoiceItem {
    itemName: String
    description: String
    quantity: Float
    price: Float
    total: Float
  }

  type Invoice {
    _id: ID!
    invoiceNumber: String
    client: ID
    items: [InvoiceItem]
    subTotal: Float
    taxRate: Float
    taxTotal: Float
    total: Float
    discount: Float
    currency: String
    status: String
    paymentStatus: String
    dueDate: DateTime
    issueDate: DateTime
    notes: String
    recurring: String
    recurringCount: Int
    isRecurring: Boolean
    pdfPath: String
    removed: Boolean
    enabled: Boolean
    owner: ID
    createdBy: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input InvoiceItemInput {
    itemName: String
    description: String
    quantity: Float
    price: Float
    total: Float
  }

  input InvoiceCreateInput {
    client: ID!
    items: [InvoiceItemInput]
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
    recurring: String
    isRecurring: Boolean
  }

  input InvoiceUpdateInput {
    client: ID
    items: [InvoiceItemInput]
    subTotal: Float
    taxRate: Float
    taxTotal: Float
    total: Float
    discount: Float
    currency: String
    status: String
    paymentStatus: String
    dueDate: DateTime
    issueDate: DateTime
    notes: String
    recurring: String
    isRecurring: Boolean
  }

  extend type Query {
    invoiceRead(id: ID!): MutationResponse!
    invoiceList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    invoiceListAll: ListResponse!
    invoiceSearch(q: String!, fields: String): ListResponse!
    invoiceFilter(filter: String, equal: String): ListResponse!
    invoiceSummary: MutationResponse!
    invoiceRecurringHistory(id: ID!): MutationResponse!
  }

  extend type Mutation {
    invoiceCreate(input: InvoiceCreateInput!): MutationResponse!
    invoiceUpdate(id: ID!, input: InvoiceUpdateInput!): MutationResponse!
    invoiceDelete(id: ID!): MutationResponse!
    invoiceBulkCreate(input: [InvoiceCreateInput!]!): MutationResponse!
    invoiceBulkDelete(ids: [ID!]!): MutationResponse!
    invoiceMail(id: ID!, input: JSON): MutationResponse!
    invoiceGenerateRecurring(id: ID!): MutationResponse!
  }
`;

module.exports = invoiceTypeDefs;
