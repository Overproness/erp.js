import { gql } from '@apollo/client';

// Queries
export const GET_INVOICES = gql`
  query GetInvoices($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    invoiceList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_ALL_INVOICES = gql`
  query GetAllInvoices { invoiceListAll { success result message } }
`;

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoiceRead(id: $id) { success result message }
  }
`;

export const SEARCH_INVOICES = gql`
  query SearchInvoices($q: String!, $fields: String) {
    invoiceSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const FILTER_INVOICES = gql`
  query FilterInvoices($filter: String, $equal: String) {
    invoiceFilter(filter: $filter, equal: $equal) { success result message }
  }
`;

export const INVOICE_SUMMARY = gql`
  query InvoiceSummary { invoiceSummary { success result message } }
`;

export const INVOICE_RECURRING_HISTORY = gql`
  query InvoiceRecurringHistory($id: ID!) {
    invoiceRecurringHistory(id: $id) { success result message }
  }
`;

// Mutations
export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: JSON!) {
    invoiceCreate(input: $input) { success result message }
  }
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: JSON!) {
    invoiceUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    invoiceDelete(id: $id) { success result message }
  }
`;

export const INVOICE_MAIL = gql`
  mutation InvoiceMail($id: ID!, $input: JSON) {
    invoiceMail(id: $id, input: $input) { success result message }
  }
`;

export const INVOICE_GENERATE_RECURRING = gql`
  mutation InvoiceGenerateRecurring($id: ID!) {
    invoiceGenerateRecurring(id: $id) { success result message }
  }
`;
