import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_TRIGGER_RULES,
  GET_TRIGGER_RULE,
  TRIGGER_RULE_HISTORY,
  CREATE_TRIGGER_RULE,
  UPDATE_TRIGGER_RULE,
  DELETE_TRIGGER_RULE,
  ACTIVATE_TRIGGER_RULE,
  DEACTIVATE_TRIGGER_RULE,
  TEST_TRIGGER_RULE,
} from '../graphql/operations/trigger';

export const useTriggerRules = (options?: QueryHookOptions) =>
  useQuery(GET_TRIGGER_RULES, options);

export const useTriggerRule = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_TRIGGER_RULE, { ...options, variables: { id } });

export const useTriggerRuleHistory = (id: string, options?: QueryHookOptions) =>
  useQuery(TRIGGER_RULE_HISTORY, { ...options, variables: { id } });

export const useCreateTriggerRule = (options?: MutationHookOptions) =>
  useMutation(CREATE_TRIGGER_RULE, options);

export const useUpdateTriggerRule = (options?: MutationHookOptions) =>
  useMutation(UPDATE_TRIGGER_RULE, options);

export const useDeleteTriggerRule = (options?: MutationHookOptions) =>
  useMutation(DELETE_TRIGGER_RULE, options);

export const useActivateTriggerRule = (options?: MutationHookOptions) =>
  useMutation(ACTIVATE_TRIGGER_RULE, options);

export const useDeactivateTriggerRule = (options?: MutationHookOptions) =>
  useMutation(DEACTIVATE_TRIGGER_RULE, options);

export const useTestTriggerRule = (options?: MutationHookOptions) =>
  useMutation(TEST_TRIGGER_RULE, options);
