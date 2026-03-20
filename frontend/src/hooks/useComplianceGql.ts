import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_CONSENT_RECORDS,
  GET_CONSENT_RECORD,
  CREATE_CONSENT_RECORD,
  UPDATE_CONSENT_RECORD,
  DELETE_CONSENT_RECORD,
  VERIFY_CONSENT,
  WITHDRAW_CONSENT,
  GET_DATA_RETENTION_POLICIES,
  GET_DATA_RETENTION_POLICY,
  CREATE_DATA_RETENTION_POLICY,
  UPDATE_DATA_RETENTION_POLICY,
  DELETE_DATA_RETENTION_POLICY,
  EXECUTE_DATA_RETENTION,
  GDPR_DATA_EXPORT,
  GDPR_DATA_DELETE,
  GET_AUDIT_TRAILS,
  GET_AUDIT_TRAIL,
  SEARCH_AUDIT_TRAILS,
  AUDIT_ENTITY_HISTORY,
  GENERATE_AUDIT_REPORT,
} from '../graphql/operations/compliance';

// Consent
export const useConsentRecords = (options?: QueryHookOptions) =>
  useQuery(GET_CONSENT_RECORDS, options);

export const useConsentRecord = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_CONSENT_RECORD, { ...options, variables: { id } });

export const useCreateConsentRecord = (options?: MutationHookOptions) =>
  useMutation(CREATE_CONSENT_RECORD, options);

export const useUpdateConsentRecord = (options?: MutationHookOptions) =>
  useMutation(UPDATE_CONSENT_RECORD, options);

export const useDeleteConsentRecord = (options?: MutationHookOptions) =>
  useMutation(DELETE_CONSENT_RECORD, options);

export const useVerifyConsent = (clientId: string, purpose: string, options?: QueryHookOptions) =>
  useQuery(VERIFY_CONSENT, { ...options, variables: { clientId, purpose } });

export const useWithdrawConsent = (options?: MutationHookOptions) =>
  useMutation(WITHDRAW_CONSENT, options);

// Data Retention
export const useDataRetentionPolicies = (options?: QueryHookOptions) =>
  useQuery(GET_DATA_RETENTION_POLICIES, options);

export const useDataRetentionPolicy = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_DATA_RETENTION_POLICY, { ...options, variables: { id } });

export const useCreateDataRetentionPolicy = (options?: MutationHookOptions) =>
  useMutation(CREATE_DATA_RETENTION_POLICY, options);

export const useUpdateDataRetentionPolicy = (options?: MutationHookOptions) =>
  useMutation(UPDATE_DATA_RETENTION_POLICY, options);

export const useDeleteDataRetentionPolicy = (options?: MutationHookOptions) =>
  useMutation(DELETE_DATA_RETENTION_POLICY, options);

export const useExecuteDataRetention = (options?: MutationHookOptions) =>
  useMutation(EXECUTE_DATA_RETENTION, options);

export const useGdprDataExport = (options?: MutationHookOptions) =>
  useMutation(GDPR_DATA_EXPORT, options);

export const useGdprDataDelete = (options?: MutationHookOptions) =>
  useMutation(GDPR_DATA_DELETE, options);

// Audit
export const useAuditTrails = (options?: QueryHookOptions) =>
  useQuery(GET_AUDIT_TRAILS, options);

export const useAuditTrail = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_AUDIT_TRAIL, { ...options, variables: { id } });

export const useSearchAuditTrails = (options?: QueryHookOptions) =>
  useQuery(SEARCH_AUDIT_TRAILS, options);

export const useAuditEntityHistory = (entityType: string, entityId: string, options?: QueryHookOptions) =>
  useQuery(AUDIT_ENTITY_HISTORY, { ...options, variables: { entityType, entityId } });

export const useGenerateAuditReport = (options?: MutationHookOptions) =>
  useMutation(GENERATE_AUDIT_REPORT, options);
