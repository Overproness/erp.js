import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_WORKFLOWS,
  GET_WORKFLOW,
  SEARCH_WORKFLOWS,
  WORKFLOW_ANALYTICS,
  CREATE_WORKFLOW,
  UPDATE_WORKFLOW,
  DELETE_WORKFLOW,
  ACTIVATE_WORKFLOW,
  DEACTIVATE_WORKFLOW,
  EXECUTE_WORKFLOW,
  DUPLICATE_WORKFLOW,
  GET_BUSINESS_PROCESSES,
  GET_BUSINESS_PROCESS,
  CREATE_BUSINESS_PROCESS,
  UPDATE_BUSINESS_PROCESS,
  DELETE_BUSINESS_PROCESS,
  ACTIVATE_BUSINESS_PROCESS,
  GET_WORKFLOW_EXECUTIONS,
  GET_WORKFLOW_EXECUTION,
  RETRY_WORKFLOW_EXECUTION,
  CANCEL_WORKFLOW_EXECUTION,
} from '../graphql/operations/workflow';

// Workflows
export const useWorkflows = (options?: QueryHookOptions) =>
  useQuery(GET_WORKFLOWS, options);

export const useWorkflow = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_WORKFLOW, { ...options, variables: { id } });

export const useSearchWorkflows = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_WORKFLOWS, { ...options, variables: { q } });

export const useWorkflowAnalytics = (id: string, options?: QueryHookOptions) =>
  useQuery(WORKFLOW_ANALYTICS, { ...options, variables: { id } });

export const useCreateWorkflow = (options?: MutationHookOptions) =>
  useMutation(CREATE_WORKFLOW, options);

export const useUpdateWorkflow = (options?: MutationHookOptions) =>
  useMutation(UPDATE_WORKFLOW, options);

export const useDeleteWorkflow = (options?: MutationHookOptions) =>
  useMutation(DELETE_WORKFLOW, options);

export const useActivateWorkflow = (options?: MutationHookOptions) =>
  useMutation(ACTIVATE_WORKFLOW, options);

export const useDeactivateWorkflow = (options?: MutationHookOptions) =>
  useMutation(DEACTIVATE_WORKFLOW, options);

export const useExecuteWorkflow = (options?: MutationHookOptions) =>
  useMutation(EXECUTE_WORKFLOW, options);

export const useDuplicateWorkflow = (options?: MutationHookOptions) =>
  useMutation(DUPLICATE_WORKFLOW, options);

// Business Processes
export const useBusinessProcesses = (options?: QueryHookOptions) =>
  useQuery(GET_BUSINESS_PROCESSES, options);

export const useBusinessProcess = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_BUSINESS_PROCESS, { ...options, variables: { id } });

export const useCreateBusinessProcess = (options?: MutationHookOptions) =>
  useMutation(CREATE_BUSINESS_PROCESS, options);

export const useUpdateBusinessProcess = (options?: MutationHookOptions) =>
  useMutation(UPDATE_BUSINESS_PROCESS, options);

export const useDeleteBusinessProcess = (options?: MutationHookOptions) =>
  useMutation(DELETE_BUSINESS_PROCESS, options);

export const useActivateBusinessProcess = (options?: MutationHookOptions) =>
  useMutation(ACTIVATE_BUSINESS_PROCESS, options);

// Workflow Executions
export const useWorkflowExecutions = (options?: QueryHookOptions) =>
  useQuery(GET_WORKFLOW_EXECUTIONS, options);

export const useWorkflowExecution = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_WORKFLOW_EXECUTION, { ...options, variables: { id } });

export const useRetryWorkflowExecution = (options?: MutationHookOptions) =>
  useMutation(RETRY_WORKFLOW_EXECUTION, options);

export const useCancelWorkflowExecution = (options?: MutationHookOptions) =>
  useMutation(CANCEL_WORKFLOW_EXECUTION, options);
