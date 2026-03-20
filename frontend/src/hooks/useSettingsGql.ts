import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_SETTINGS,
  GET_ALL_SETTINGS,
  GET_SETTING,
  GET_SETTING_BY_KEY,
  SEARCH_SETTINGS,
  CREATE_SETTING,
  UPDATE_SETTING,
  DELETE_SETTING,
  UPDATE_SETTING_BY_KEY,
  TEST_OPENAI_KEY,
  TEST_GEMINI_KEY,
  TEST_CLAUDE_KEY,
} from '../graphql/operations/settings';

export const useSettings = (options?: QueryHookOptions) =>
  useQuery(GET_SETTINGS, options);

export const useAllSettings = (options?: QueryHookOptions) =>
  useQuery(GET_ALL_SETTINGS, options);

export const useSetting = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_SETTING, { ...options, variables: { id } });

export const useSettingByKey = (settingsKey: string, options?: QueryHookOptions) =>
  useQuery(GET_SETTING_BY_KEY, { ...options, variables: { settingsKey } });

export const useSearchSettings = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_SETTINGS, { ...options, variables: { q } });

export const useCreateSetting = (options?: MutationHookOptions) =>
  useMutation(CREATE_SETTING, options);

export const useUpdateSetting = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SETTING, options);

export const useDeleteSetting = (options?: MutationHookOptions) =>
  useMutation(DELETE_SETTING, options);

export const useUpdateSettingByKey = (options?: MutationHookOptions) =>
  useMutation(UPDATE_SETTING_BY_KEY, options);

export const useTestOpenaiKey = (options?: MutationHookOptions) =>
  useMutation(TEST_OPENAI_KEY, options);

export const useTestGeminiKey = (options?: MutationHookOptions) =>
  useMutation(TEST_GEMINI_KEY, options);

export const useTestClaudeKey = (options?: MutationHookOptions) =>
  useMutation(TEST_CLAUDE_KEY, options);
