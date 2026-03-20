import { gql } from '@apollo/client';

export const GET_TRIGGER_RULES = gql`
  query GetTriggerRules($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    triggerRuleList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_TRIGGER_RULE = gql`
  query GetTriggerRule($id: ID!) {
    triggerRuleRead(id: $id) { success result message }
  }
`;

export const TRIGGER_RULE_HISTORY = gql`
  query TriggerRuleHistory($id: ID!, $page: Int, $limit: Int) {
    triggerRuleHistory(id: $id, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_TRIGGER_RULE = gql`
  mutation CreateTriggerRule($input: TriggerRuleCreateInput!) {
    triggerRuleCreate(input: $input) { success result message }
  }
`;

export const UPDATE_TRIGGER_RULE = gql`
  mutation UpdateTriggerRule($id: ID!, $input: TriggerRuleUpdateInput!) {
    triggerRuleUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_TRIGGER_RULE = gql`
  mutation DeleteTriggerRule($id: ID!) {
    triggerRuleDelete(id: $id) { success result message }
  }
`;

export const ACTIVATE_TRIGGER_RULE = gql`
  mutation ActivateTriggerRule($id: ID!) {
    triggerRuleActivate(id: $id) { success result message }
  }
`;

export const DEACTIVATE_TRIGGER_RULE = gql`
  mutation DeactivateTriggerRule($id: ID!) {
    triggerRuleDeactivate(id: $id) { success result message }
  }
`;

export const TEST_TRIGGER_RULE = gql`
  mutation TestTriggerRule($id: ID!, $input: JSON) {
    triggerRuleTest(id: $id, input: $input) { success result message }
  }
`;
