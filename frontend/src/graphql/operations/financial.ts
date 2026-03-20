import { gql } from '@apollo/client';

export const GET_TAXES = gql`
  query GetTaxes($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    taxesList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_ALL_TAXES = gql`
  query GetAllTaxes { taxesListAll { success result message } }
`;

export const GET_TAX = gql`
  query GetTax($id: ID!) { taxesRead(id: $id) { success result message } }
`;

export const CREATE_TAX = gql`
  mutation CreateTax($input: TaxesCreateInput!) {
    taxesCreate(input: $input) { success result message }
  }
`;

export const UPDATE_TAX = gql`
  mutation UpdateTax($id: ID!, $input: TaxesUpdateInput!) {
    taxesUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_TAX = gql`
  mutation DeleteTax($id: ID!) {
    taxesDelete(id: $id) { success result message }
  }
`;

export const GET_PAYMENT_MODES = gql`
  query GetPaymentModes($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    paymentModeList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_ALL_PAYMENT_MODES = gql`
  query GetAllPaymentModes { paymentModeListAll { success result message } }
`;

export const GET_PAYMENT_MODE = gql`
  query GetPaymentMode($id: ID!) { paymentModeRead(id: $id) { success result message } }
`;

export const CREATE_PAYMENT_MODE = gql`
  mutation CreatePaymentMode($input: PaymentModeCreateInput!) {
    paymentModeCreate(input: $input) { success result message }
  }
`;

export const UPDATE_PAYMENT_MODE = gql`
  mutation UpdatePaymentMode($id: ID!, $input: PaymentModeUpdateInput!) {
    paymentModeUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_PAYMENT_MODE = gql`
  mutation DeletePaymentMode($id: ID!) {
    paymentModeDelete(id: $id) { success result message }
  }
`;
