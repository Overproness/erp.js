import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_QUOTES,
  GET_QUOTE,
  SEARCH_QUOTES,
  QUOTE_SUMMARY,
  QUOTE_DELIVERY_HISTORY,
  QUOTE_DELIVERY_STATUS,
  CREATE_QUOTE,
  UPDATE_QUOTE,
  DELETE_QUOTE,
  QUOTE_MAIL,
  QUOTE_SEND,
  QUOTE_CONVERT,
  QUOTE_SEND_BULK,
} from '../graphql/operations/quote';

export const useQuotes = (options?: QueryHookOptions) =>
  useQuery(GET_QUOTES, options);

export const useQuote = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_QUOTE, { ...options, variables: { id } });

export const useSearchQuotes = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_QUOTES, { ...options, variables: { q } });

export const useQuoteSummary = (options?: QueryHookOptions) =>
  useQuery(QUOTE_SUMMARY, options);

export const useQuoteDeliveryHistory = (id: string, options?: QueryHookOptions) =>
  useQuery(QUOTE_DELIVERY_HISTORY, { ...options, variables: { id } });

export const useQuoteDeliveryStatus = (id: string, options?: QueryHookOptions) =>
  useQuery(QUOTE_DELIVERY_STATUS, { ...options, variables: { id } });

export const useCreateQuote = (options?: MutationHookOptions) =>
  useMutation(CREATE_QUOTE, options);

export const useUpdateQuote = (options?: MutationHookOptions) =>
  useMutation(UPDATE_QUOTE, options);

export const useDeleteQuote = (options?: MutationHookOptions) =>
  useMutation(DELETE_QUOTE, options);

export const useQuoteMail = (options?: MutationHookOptions) =>
  useMutation(QUOTE_MAIL, options);

export const useQuoteSend = (options?: MutationHookOptions) =>
  useMutation(QUOTE_SEND, options);

export const useQuoteConvert = (options?: MutationHookOptions) =>
  useMutation(QUOTE_CONVERT, options);

export const useQuoteSendBulk = (options?: MutationHookOptions) =>
  useMutation(QUOTE_SEND_BULK, options);
