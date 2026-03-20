import { gql } from '@apollo/client';

export const GET_PAYMENTS = gql`
  query GetPayments($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    paymentList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_PAYMENT = gql`
  query GetPayment($id: ID!) { paymentRead(id: $id) { success result message } }
`;

export const PAYMENT_SUMMARY = gql`
  query PaymentSummary { paymentSummary { success result message } }
`;

export const CREATE_PAYMENT = gql`
  mutation CreatePayment($input: PaymentCreateInput!) {
    paymentCreate(input: $input) { success result message }
  }
`;

export const UPDATE_PAYMENT = gql`
  mutation UpdatePayment($id: ID!, $input: PaymentUpdateInput!) {
    paymentUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_PAYMENT = gql`
  mutation DeletePayment($id: ID!) {
    paymentDelete(id: $id) { success result message }
  }
`;

export const PAYMENT_MAIL = gql`
  mutation PaymentMail($id: ID!, $input: JSON) {
    paymentMail(id: $id, input: $input) { success result message }
  }
`;
