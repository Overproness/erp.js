import { gql } from '@apollo/client';

// Social Accounts
export const GET_SOCIAL_ACCOUNTS = gql`
  query GetSocialAccounts($page: Int, $limit: Int) {
    socialAccountList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SOCIAL_ACCOUNT = gql`
  query GetSocialAccount($id: ID!) {
    socialAccountRead(id: $id) { success result message }
  }
`;

export const CREATE_SOCIAL_ACCOUNT = gql`
  mutation CreateSocialAccount($input: SocialAccountCreateInput!) {
    socialAccountCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SOCIAL_ACCOUNT = gql`
  mutation UpdateSocialAccount($id: ID!, $input: SocialAccountUpdateInput!) {
    socialAccountUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SOCIAL_ACCOUNT = gql`
  mutation DeleteSocialAccount($id: ID!) {
    socialAccountDelete(id: $id) { success result message }
  }
`;

export const CONNECT_SOCIAL_ACCOUNT = gql`
  mutation ConnectSocialAccount($platform: String!, $authCode: String!) {
    socialAccountConnect(platform: $platform, authCode: $authCode) {
      success result message
    }
  }
`;

export const DISCONNECT_SOCIAL_ACCOUNT = gql`
  mutation DisconnectSocialAccount($id: ID!) {
    socialAccountDisconnect(id: $id) { success result message }
  }
`;

export const REFRESH_SOCIAL_ACCOUNT = gql`
  mutation RefreshSocialAccount($id: ID!) {
    socialAccountRefresh(id: $id) { success result message }
  }
`;

// Social Posts
export const GET_SOCIAL_POSTS = gql`
  query GetSocialPosts($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    socialPostList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SOCIAL_POST = gql`
  query GetSocialPost($id: ID!) {
    socialPostRead(id: $id) { success result message }
  }
`;

export const SOCIAL_POST_ANALYTICS = gql`
  query SocialPostAnalytics($id: ID!) {
    socialPostAnalytics(id: $id) { success result message }
  }
`;

export const CREATE_SOCIAL_POST = gql`
  mutation CreateSocialPost($input: SocialPostCreateInput!) {
    socialPostCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SOCIAL_POST = gql`
  mutation UpdateSocialPost($id: ID!, $input: SocialPostUpdateInput!) {
    socialPostUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SOCIAL_POST = gql`
  mutation DeleteSocialPost($id: ID!) {
    socialPostDelete(id: $id) { success result message }
  }
`;

export const PUBLISH_SOCIAL_POST = gql`
  mutation PublishSocialPost($id: ID!) {
    socialPostPublish(id: $id) { success result message }
  }
`;

export const SCHEDULE_SOCIAL_POST = gql`
  mutation ScheduleSocialPost($id: ID!, $scheduledAt: DateTime!) {
    socialPostSchedule(id: $id, scheduledAt: $scheduledAt) { success result message }
  }
`;

export const AI_GENERATE_SOCIAL_POST = gql`
  mutation AiGenerateSocialPost($input: JSON!) {
    socialPostAiGenerate(input: $input) { success result message }
  }
`;

// Social Campaigns
export const GET_SOCIAL_CAMPAIGNS = gql`
  query GetSocialCampaigns($page: Int, $limit: Int) {
    socialCampaignList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_SOCIAL_CAMPAIGN = gql`
  query GetSocialCampaign($id: ID!) {
    socialCampaignRead(id: $id) { success result message }
  }
`;

export const CREATE_SOCIAL_CAMPAIGN = gql`
  mutation CreateSocialCampaign($input: SocialCampaignCreateInput!) {
    socialCampaignCreate(input: $input) { success result message }
  }
`;

export const UPDATE_SOCIAL_CAMPAIGN = gql`
  mutation UpdateSocialCampaign($id: ID!, $input: SocialCampaignUpdateInput!) {
    socialCampaignUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_SOCIAL_CAMPAIGN = gql`
  mutation DeleteSocialCampaign($id: ID!) {
    socialCampaignDelete(id: $id) { success result message }
  }
`;

// Social Mentions
export const GET_SOCIAL_MENTIONS = gql`
  query GetSocialMentions($page: Int, $limit: Int) {
    socialMentionList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const RESPOND_TO_MENTION = gql`
  mutation RespondToMention($id: ID!, $response: String!) {
    socialMentionRespond(id: $id, response: $response) { success result message }
  }
`;

export const AI_RESPOND_TO_MENTION = gql`
  mutation AiRespondToMention($id: ID!) {
    socialMentionAiRespond(id: $id) { success result message }
  }
`;
