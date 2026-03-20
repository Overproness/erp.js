import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_INVOICES,
  GET_ALL_INVOICES,
  GET_INVOICE,
  SEARCH_INVOICES,
  FILTER_INVOICES,
  INVOICE_SUMMARY,
  INVOICE_RECURRING_HISTORY,
  CREATE_INVOICE,
  UPDATE_INVOICE,
  DELETE_INVOICE,
  INVOICE_MAIL,
  INVOICE_GENERATE_RECURRING,
} from '../graphql/operations/invoice';

export const useInvoices = (options?: QueryHookOptions) =>
  useQuery(GET_INVOICES, options);

export const useAllInvoices = (options?: QueryHookOptions) =>
  useQuery(GET_ALL_INVOICES, options);

export const useInvoice = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_INVOICE, { ...options, variables: { id } });

export const useSearchInvoices = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_INVOICES, { ...options, variables: { q } });

export const useFilterInvoices = (options?: QueryHookOptions) =>
  useQuery(FILTER_INVOICES, options);

export const useInvoiceSummary = (options?: QueryHookOptions) =>
  useQuery(INVOICE_SUMMARY, options);

export const useInvoiceRecurringHistory = (id: string, options?: QueryHookOptions) =>
  useQuery(INVOICE_RECURRING_HISTORY, { ...options, variables: { id } });

export const useCreateInvoice = (options?: MutationHookOptions) =>
  useMutation(CREATE_INVOICE, options);

export const useUpdateInvoice = (options?: MutationHookOptions) =>
  useMutation(UPDATE_INVOICE, options);

export const useDeleteInvoice = (options?: MutationHookOptions) =>
  useMutation(DELETE_INVOICE, options);

export const useInvoiceMail = (options?: MutationHookOptions) =>
  useMutation(INVOICE_MAIL, options);

export const useInvoiceGenerateRecurring = (options?: MutationHookOptions) =>
  useMutation(INVOICE_GENERATE_RECURRING, options);
