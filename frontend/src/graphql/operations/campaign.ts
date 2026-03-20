import { gql } from '@apollo/client';

export const GET_CAMPAIGNS = gql`
  query GetCampaigns($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    campaignList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) { campaignRead(id: $id) { success result message } }
`;

export const SEARCH_CAMPAIGNS = gql`
  query SearchCampaigns($q: String!, $fields: String) {
    campaignSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const CAMPAIGN_ANALYTICS = gql`
  query CampaignAnalytics($id: ID!) {
    campaignAnalytics(id: $id) { success result message }
  }
`;

export const CAMPAIGN_RECIPIENTS = gql`
  query CampaignRecipients($id: ID!, $page: Int, $limit: Int) {
    campaignRecipients(id: $id, page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CampaignCreateInput!) {
    campaignCreate(input: $input) { success result message }
  }
`;

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: CampaignUpdateInput!) {
    campaignUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) {
    campaignDelete(id: $id) { success result message }
  }
`;

export const LAUNCH_CAMPAIGN = gql`
  mutation LaunchCampaign($id: ID!) {
    campaignLaunch(id: $id) { success result message }
  }
`;

export const PAUSE_CAMPAIGN = gql`
  mutation PauseCampaign($id: ID!) {
    campaignPause(id: $id) { success result message }
  }
`;

export const RESUME_CAMPAIGN = gql`
  mutation ResumeCampaign($id: ID!) {
    campaignResume(id: $id) { success result message }
  }
`;

export const CANCEL_CAMPAIGN = gql`
  mutation CancelCampaign($id: ID!) {
    campaignCancel(id: $id) { success result message }
  }
`;

export const DUPLICATE_CAMPAIGN = gql`
  mutation DuplicateCampaign($id: ID!) {
    campaignDuplicate(id: $id) { success result message }
  }
`;

export const SEND_TEST_CAMPAIGN = gql`
  mutation SendTestCampaign($id: ID!, $email: String!) {
    campaignSendTest(id: $id, email: $email) { success result message }
  }
`;

export const AI_GENERATE_CAMPAIGN = gql`
  mutation AiGenerateCampaign($input: JSON!) {
    campaignAiGenerate(input: $input) { success result message }
  }
`;
