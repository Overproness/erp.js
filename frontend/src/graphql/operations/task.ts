import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query GetTasks($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    taskList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: ID!) { taskRead(id: $id) { success result message } }
`;

export const SEARCH_TASKS = gql`
  query SearchTasks($q: String!, $fields: String) {
    taskSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const FILTER_TASKS = gql`
  query FilterTasks($filter: String, $equal: String) {
    taskFilter(filter: $filter, equal: $equal) { success result message }
  }
`;

export const TASK_SUMMARY = gql`
  query TaskSummary { taskSummary { success result message } }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: TaskCreateInput!) {
    taskCreate(input: $input) { success result message }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    taskUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    taskDelete(id: $id) { success result message }
  }
`;

export const DELEGATE_TASK = gql`
  mutation DelegateTask($id: ID!, $userId: ID!) {
    taskDelegate(id: $id, userId: $userId) { success result message }
  }
`;

export const REASSIGN_TASK = gql`
  mutation ReassignTask($id: ID!, $userId: ID!) {
    taskReassign(id: $id, userId: $userId) { success result message }
  }
`;

export const AI_PRIORITIZE_TASK = gql`
  mutation AiPrioritizeTask($id: ID!) {
    taskAiPrioritize(id: $id) { success result message }
  }
`;

// Reminders
export const GET_REMINDERS = gql`
  query GetReminders($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    reminderList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_REMINDER = gql`
  mutation CreateReminder($input: ReminderCreateInput!) {
    reminderCreate(input: $input) { success result message }
  }
`;

export const UPDATE_REMINDER = gql`
  mutation UpdateReminder($id: ID!, $input: ReminderUpdateInput!) {
    reminderUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_REMINDER = gql`
  mutation DeleteReminder($id: ID!) {
    reminderDelete(id: $id) { success result message }
  }
`;

export const ADD_TASK_COMMENT = gql`
  mutation AddTaskComment($id: ID!, $content: String!) {
    taskAddComment(id: $id, content: $content) { success result message }
  }
`;
