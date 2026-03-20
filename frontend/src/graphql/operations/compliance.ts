import { gql } from '@apollo/client';

// Consent Records
export const GET_CONSENT_RECORDS = gql`
  query GetConsentRecords($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    consentRecordList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_CONSENT_RECORD = gql`
  query GetConsentRecord($id: ID!) {
    consentRecordRead(id: $id) { success result message }
  }
`;

export const CREATE_CONSENT_RECORD = gql`
  mutation CreateConsentRecord($input: ConsentRecordCreateInput!) {
    consentRecordCreate(input: $input) { success result message }
  }
`;

export const UPDATE_CONSENT_RECORD = gql`
  mutation UpdateConsentRecord($id: ID!, $input: ConsentRecordUpdateInput!) {
    consentRecordUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_CONSENT_RECORD = gql`
  mutation DeleteConsentRecord($id: ID!) {
    consentRecordDelete(id: $id) { success result message }
  }
`;

export const VERIFY_CONSENT = gql`
  query VerifyConsent($clientId: ID!, $purpose: String!) {
    consentVerify(clientId: $clientId, purpose: $purpose) { success result message }
  }
`;

export const WITHDRAW_CONSENT = gql`
  mutation WithdrawConsent($id: ID!) {
    consentWithdraw(id: $id) { success result message }
  }
`;

// Data Retention Policies
export const GET_DATA_RETENTION_POLICIES = gql`
  query GetDataRetentionPolicies($page: Int, $limit: Int) {
    dataRetentionPolicyList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_DATA_RETENTION_POLICY = gql`
  query GetDataRetentionPolicy($id: ID!) {
    dataRetentionPolicyRead(id: $id) { success result message }
  }
`;

export const CREATE_DATA_RETENTION_POLICY = gql`
  mutation CreateDataRetentionPolicy($input: DataRetentionPolicyCreateInput!) {
    dataRetentionPolicyCreate(input: $input) { success result message }
  }
`;

export const UPDATE_DATA_RETENTION_POLICY = gql`
  mutation UpdateDataRetentionPolicy($id: ID!, $input: DataRetentionPolicyUpdateInput!) {
    dataRetentionPolicyUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_DATA_RETENTION_POLICY = gql`
  mutation DeleteDataRetentionPolicy($id: ID!) {
    dataRetentionPolicyDelete(id: $id) { success result message }
  }
`;

export const EXECUTE_DATA_RETENTION = gql`
  mutation ExecuteDataRetention($id: ID!) {
    dataRetentionPolicyExecute(id: $id) { success result message }
  }
`;

export const GDPR_DATA_EXPORT = gql`
  mutation GdprDataExport($clientId: ID!) {
    complianceGdprExport(clientId: $clientId) { success result message }
  }
`;

export const GDPR_DATA_DELETE = gql`
  mutation GdprDataDelete($clientId: ID!) {
    complianceGdprDelete(clientId: $clientId) { success result message }
  }
`;

// Audit Trail
export const GET_AUDIT_TRAILS = gql`
  query GetAuditTrails($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    auditTrailList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_AUDIT_TRAIL = gql`
  query GetAuditTrail($id: ID!) {
    auditTrailRead(id: $id) { success result message }
  }
`;

export const SEARCH_AUDIT_TRAILS = gql`
  query SearchAuditTrails($input: AuditSearchInput!) {
    auditTrailSearch(input: $input) { success result message }
  }
`;

export const AUDIT_ENTITY_HISTORY = gql`
  query AuditEntityHistory($entityType: String!, $entityId: ID!) {
    auditEntityHistory(entityType: $entityType, entityId: $entityId) {
      success result message
    }
  }
`;

export const GENERATE_AUDIT_REPORT = gql`
  mutation GenerateAuditReport($input: JSON) {
    auditGenerateReport(input: $input) { success result message }
  }
`;
