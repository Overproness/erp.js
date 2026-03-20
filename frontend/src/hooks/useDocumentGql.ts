import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_DOCUMENTS,
  GET_DOCUMENT,
  SEARCH_DOCUMENTS,
  ADVANCED_SEARCH_DOCUMENTS,
  DOCUMENT_VERSIONS,
  DOCUMENT_AUDIT_TRAIL,
  CREATE_DOCUMENT,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
  DOCUMENT_DOWNLOAD,
  DOCUMENT_CREATE_VERSION,
  DOCUMENT_REVERT,
  DOCUMENT_ESIGN,
  DOCUMENT_SHARE,
  DOCUMENT_ANALYZE,
  DOCUMENT_SUMMARIZE,
} from '../graphql/operations/document';

export const useDocuments = (options?: QueryHookOptions) =>
  useQuery(GET_DOCUMENTS, options);

export const useDocument = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_DOCUMENT, { ...options, variables: { id } });

export const useSearchDocuments = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_DOCUMENTS, { ...options, variables: { q } });

export const useAdvancedSearchDocuments = (options?: QueryHookOptions) =>
  useQuery(ADVANCED_SEARCH_DOCUMENTS, options);

export const useDocumentVersions = (id: string, options?: QueryHookOptions) =>
  useQuery(DOCUMENT_VERSIONS, { ...options, variables: { id } });

export const useDocumentAuditTrail = (id: string, options?: QueryHookOptions) =>
  useQuery(DOCUMENT_AUDIT_TRAIL, { ...options, variables: { id } });

export const useCreateDocument = (options?: MutationHookOptions) =>
  useMutation(CREATE_DOCUMENT, options);

export const useUpdateDocument = (options?: MutationHookOptions) =>
  useMutation(UPDATE_DOCUMENT, options);

export const useDeleteDocument = (options?: MutationHookOptions) =>
  useMutation(DELETE_DOCUMENT, options);

export const useDocumentDownload = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_DOWNLOAD, options);

export const useDocumentCreateVersion = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_CREATE_VERSION, options);

export const useDocumentRevert = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_REVERT, options);

export const useDocumentESign = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_ESIGN, options);

export const useDocumentShare = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_SHARE, options);

export const useDocumentAnalyze = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_ANALYZE, options);

export const useDocumentSummarize = (options?: MutationHookOptions) =>
  useMutation(DOCUMENT_SUMMARIZE, options);
