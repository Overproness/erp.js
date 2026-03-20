import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_PAYMENTS,
  GET_PAYMENT,
  PAYMENT_SUMMARY,
  CREATE_PAYMENT,
  UPDATE_PAYMENT,
  DELETE_PAYMENT,
  PAYMENT_MAIL,
} from '../graphql/operations/payment';
import {
  GET_TAXES,
  GET_ALL_TAXES,
  GET_TAX,
  CREATE_TAX,
  UPDATE_TAX,
  DELETE_TAX,
  GET_PAYMENT_MODES,
  GET_ALL_PAYMENT_MODES,
  GET_PAYMENT_MODE,
  CREATE_PAYMENT_MODE,
  UPDATE_PAYMENT_MODE,
  DELETE_PAYMENT_MODE,
} from '../graphql/operations/financial';

// Payments
export const usePayments = (options?: QueryHookOptions) =>
  useQuery(GET_PAYMENTS, options);

export const usePayment = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_PAYMENT, { ...options, variables: { id } });

export const usePaymentSummary = (options?: QueryHookOptions) =>
  useQuery(PAYMENT_SUMMARY, options);

export const useCreatePayment = (options?: MutationHookOptions) =>
  useMutation(CREATE_PAYMENT, options);

export const useUpdatePayment = (options?: MutationHookOptions) =>
  useMutation(UPDATE_PAYMENT, options);

export const useDeletePayment = (options?: MutationHookOptions) =>
  useMutation(DELETE_PAYMENT, options);

export const usePaymentMail = (options?: MutationHookOptions) =>
  useMutation(PAYMENT_MAIL, options);

// Taxes
export const useTaxes = (options?: QueryHookOptions) =>
  useQuery(GET_TAXES, options);

export const useAllTaxes = (options?: QueryHookOptions) =>
  useQuery(GET_ALL_TAXES, options);

export const useTax = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_TAX, { ...options, variables: { id } });

export const useCreateTax = (options?: MutationHookOptions) =>
  useMutation(CREATE_TAX, options);

export const useUpdateTax = (options?: MutationHookOptions) =>
  useMutation(UPDATE_TAX, options);

export const useDeleteTax = (options?: MutationHookOptions) =>
  useMutation(DELETE_TAX, options);

// Payment Modes
export const usePaymentModes = (options?: QueryHookOptions) =>
  useQuery(GET_PAYMENT_MODES, options);

export const useAllPaymentModes = (options?: QueryHookOptions) =>
  useQuery(GET_ALL_PAYMENT_MODES, options);

export const usePaymentMode = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_PAYMENT_MODE, { ...options, variables: { id } });

export const useCreatePaymentMode = (options?: MutationHookOptions) =>
  useMutation(CREATE_PAYMENT_MODE, options);

export const useUpdatePaymentMode = (options?: MutationHookOptions) =>
  useMutation(UPDATE_PAYMENT_MODE, options);

export const useDeletePaymentMode = (options?: MutationHookOptions) =>
  useMutation(DELETE_PAYMENT_MODE, options);
