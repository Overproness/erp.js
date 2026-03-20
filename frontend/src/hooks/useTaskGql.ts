import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_TASKS,
  GET_TASK,
  SEARCH_TASKS,
  FILTER_TASKS,
  TASK_SUMMARY,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  DELEGATE_TASK,
  REASSIGN_TASK,
  AI_PRIORITIZE_TASK,
  GET_REMINDERS,
  CREATE_REMINDER,
  UPDATE_REMINDER,
  DELETE_REMINDER,
} from '../graphql/operations/task';

export const useTasks = (options?: QueryHookOptions) =>
  useQuery(GET_TASKS, options);

export const useTask = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_TASK, { ...options, variables: { id } });

export const useSearchTasks = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_TASKS, { ...options, variables: { q } });

export const useFilterTasks = (options?: QueryHookOptions) =>
  useQuery(FILTER_TASKS, options);

export const useTaskSummary = (options?: QueryHookOptions) =>
  useQuery(TASK_SUMMARY, options);

export const useCreateTask = (options?: MutationHookOptions) =>
  useMutation(CREATE_TASK, options);

export const useUpdateTask = (options?: MutationHookOptions) =>
  useMutation(UPDATE_TASK, options);

export const useDeleteTask = (options?: MutationHookOptions) =>
  useMutation(DELETE_TASK, options);

export const useDelegateTask = (options?: MutationHookOptions) =>
  useMutation(DELEGATE_TASK, options);

export const useReassignTask = (options?: MutationHookOptions) =>
  useMutation(REASSIGN_TASK, options);

export const useAiPrioritizeTask = (options?: MutationHookOptions) =>
  useMutation(AI_PRIORITIZE_TASK, options);

// Reminders
export const useReminders = (options?: QueryHookOptions) =>
  useQuery(GET_REMINDERS, options);

export const useCreateReminder = (options?: MutationHookOptions) =>
  useMutation(CREATE_REMINDER, options);

export const useUpdateReminder = (options?: MutationHookOptions) =>
  useMutation(UPDATE_REMINDER, options);

export const useDeleteReminder = (options?: MutationHookOptions) =>
  useMutation(DELETE_REMINDER, options);
