import { gql } from '@apollo/client';

// Workflows
export const GET_WORKFLOWS = gql`
  query GetWorkflows($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    workflowList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_WORKFLOW = gql`
  query GetWorkflow($id: ID!) { workflowRead(id: $id) { success result message } }
`;

export const SEARCH_WORKFLOWS = gql`
  query SearchWorkflows($q: String!, $fields: String) {
    workflowSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const WORKFLOW_ANALYTICS = gql`
  query WorkflowAnalytics($id: ID!) {
    workflowAnalytics(id: $id) { success result message }
  }
`;

export const CREATE_WORKFLOW = gql`
  mutation CreateWorkflow($input: WorkflowCreateInput!) {
    workflowCreate(input: $input) { success result message }
  }
`;

export const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflow($id: ID!, $input: WorkflowUpdateInput!) {
    workflowUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_WORKFLOW = gql`
  mutation DeleteWorkflow($id: ID!) {
    workflowDelete(id: $id) { success result message }
  }
`;

export const ACTIVATE_WORKFLOW = gql`
  mutation ActivateWorkflow($id: ID!) {
    workflowActivate(id: $id) { success result message }
  }
`;

export const DEACTIVATE_WORKFLOW = gql`
  mutation DeactivateWorkflow($id: ID!) {
    workflowDeactivate(id: $id) { success result message }
  }
`;

export const EXECUTE_WORKFLOW = gql`
  mutation ExecuteWorkflow($id: ID!, $input: JSON) {
    workflowExecute(id: $id, input: $input) { success result message }
  }
`;

export const DUPLICATE_WORKFLOW = gql`
  mutation DuplicateWorkflow($id: ID!) {
    workflowDuplicate(id: $id) { success result message }
  }
`;

export const TOGGLE_WORKFLOW_STATUS = gql`
  mutation ToggleWorkflowStatus($id: ID!, $input: JSON!) {
    workflowUpdate(id: $id, input: $input) { success result message }
  }
`;

export const TEST_WORKFLOW_CONDITION = gql`
  mutation TestWorkflowCondition($input: JSON!) {
    workflowTestCondition(input: $input) { success result message }
  }
`;

export const SIMULATE_WORKFLOW = gql`
  mutation SimulateWorkflow($id: ID!, $input: JSON) {
    workflowExecute(id: $id, input: $input) { success result message }
  }
`;

// Business Processes
export const GET_BUSINESS_PROCESSES = gql`
  query GetBusinessProcesses($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    businessProcessList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_BUSINESS_PROCESS = gql`
  query GetBusinessProcess($id: ID!) {
    businessProcessRead(id: $id) { success result message }
  }
`;

export const CREATE_BUSINESS_PROCESS = gql`
  mutation CreateBusinessProcess($input: BusinessProcessCreateInput!) {
    businessProcessCreate(input: $input) { success result message }
  }
`;

export const UPDATE_BUSINESS_PROCESS = gql`
  mutation UpdateBusinessProcess($id: ID!, $input: BusinessProcessUpdateInput!) {
    businessProcessUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_BUSINESS_PROCESS = gql`
  mutation DeleteBusinessProcess($id: ID!) {
    businessProcessDelete(id: $id) { success result message }
  }
`;

export const ACTIVATE_BUSINESS_PROCESS = gql`
  mutation ActivateBusinessProcess($id: ID!) {
    businessProcessActivate(id: $id) { success result message }
  }
`;

// Workflow Executions
export const GET_WORKFLOW_EXECUTIONS = gql`
  query GetWorkflowExecutions($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    workflowExecutionList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_WORKFLOW_EXECUTION = gql`
  query GetWorkflowExecution($id: ID!) {
    workflowExecutionRead(id: $id) { success result message }
  }
`;

export const RETRY_WORKFLOW_EXECUTION = gql`
  mutation RetryWorkflowExecution($id: ID!) {
    workflowExecutionRetry(id: $id) { success result message }
  }
`;

export const CANCEL_WORKFLOW_EXECUTION = gql`
  mutation CancelWorkflowExecution($id: ID!) {
    workflowExecutionCancel(id: $id) { success result message }
  }
`;
