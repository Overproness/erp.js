import { gql } from '@apollo/client';

// Reviews
export const GET_REVIEWS = gql`
  query GetReviews($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    reviewList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_REVIEW = gql`
  query GetReview($id: ID!) { reviewRead(id: $id) { success result message } }
`;

export const SEARCH_REVIEWS = gql`
  query SearchReviews($q: String!, $fields: String) {
    reviewSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const CREATE_REVIEW = gql`
  mutation CreateReview($input: ReviewCreateInput!) {
    reviewCreate(input: $input) { success result message }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: ID!, $input: ReviewUpdateInput!) {
    reviewUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: ID!) {
    reviewDelete(id: $id) { success result message }
  }
`;

export const RESPOND_TO_REVIEW = gql`
  mutation RespondToReview($id: ID!, $response: String!) {
    reviewRespond(id: $id, response: $response) { success result message }
  }
`;

export const AI_RESPOND_TO_REVIEW = gql`
  mutation AiRespondToReview($id: ID!) {
    reviewAiRespond(id: $id) { success result message }
  }
`;

export const AI_ANALYZE_REVIEW_SENTIMENT = gql`
  mutation AiAnalyzeReviewSentiment($id: ID!) {
    reviewAiAnalyzeSentiment(id: $id) { success result message }
  }
`;

export const SYNC_REVIEWS = gql`
  mutation SyncReviews($platform: String!) {
    reviewSync(platform: $platform) { success result message }
  }
`;

// Review Links
export const GET_REVIEW_LINKS = gql`
  query GetReviewLinks($page: Int, $limit: Int) {
    reviewLinkList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_REVIEW_LINK = gql`
  mutation CreateReviewLink($input: ReviewLinkCreateInput!) {
    reviewLinkCreate(input: $input) { success result message }
  }
`;

export const UPDATE_REVIEW_LINK = gql`
  mutation UpdateReviewLink($id: ID!, $input: ReviewLinkUpdateInput!) {
    reviewLinkUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_REVIEW_LINK = gql`
  mutation DeleteReviewLink($id: ID!) {
    reviewLinkDelete(id: $id) { success result message }
  }
`;

// Review Templates
export const GET_REVIEW_TEMPLATES = gql`
  query GetReviewTemplates($page: Int, $limit: Int) {
    reviewTemplateList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_REVIEW_TEMPLATE = gql`
  mutation CreateReviewTemplate($input: ReviewTemplateCreateInput!) {
    reviewTemplateCreate(input: $input) { success result message }
  }
`;

export const UPDATE_REVIEW_TEMPLATE = gql`
  mutation UpdateReviewTemplate($id: ID!, $input: ReviewTemplateUpdateInput!) {
    reviewTemplateUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_REVIEW_TEMPLATE = gql`
  mutation DeleteReviewTemplate($id: ID!) {
    reviewTemplateDelete(id: $id) { success result message }
  }
`;

// Review Responses (saved)
export const GET_REVIEW_RESPONSES = gql`
  query GetReviewResponses($page: Int, $limit: Int) {
    reviewResponseList(page: $page, limit: $limit) {
      success result pagination { page count pages total } message
    }
  }
`;

export const CREATE_REVIEW_RESPONSE = gql`
  mutation CreateReviewResponse($input: ReviewResponseCreateInput!) {
    reviewResponseCreate(input: $input) { success result message }
  }
`;

export const UPDATE_REVIEW_RESPONSE = gql`
  mutation UpdateReviewResponse($id: ID!, $input: ReviewResponseUpdateInput!) {
    reviewResponseUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_REVIEW_RESPONSE = gql`
  mutation DeleteReviewResponse($id: ID!) {
    reviewResponseDelete(id: $id) { success result message }
  }
`;

// Retargeting
export const GET_RETARGETING_CAMPAIGNS = gql`
  query GetRetargetingCampaigns($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    retargetingCampaignList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_RETARGETING_CAMPAIGN = gql`
  query GetRetargetingCampaign($id: ID!) {
    retargetingCampaignRead(id: $id) { success result message }
  }
`;

export const RETARGETING_ANALYTICS = gql`
  query RetargetingAnalytics($id: ID!) {
    retargetingAnalytics(id: $id) { success result message }
  }
`;

export const CREATE_RETARGETING_CAMPAIGN = gql`
  mutation CreateRetargetingCampaign($input: RetargetingCampaignCreateInput!) {
    retargetingCampaignCreate(input: $input) { success result message }
  }
`;

export const UPDATE_RETARGETING_CAMPAIGN = gql`
  mutation UpdateRetargetingCampaign($id: ID!, $input: RetargetingCampaignUpdateInput!) {
    retargetingCampaignUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_RETARGETING_CAMPAIGN = gql`
  mutation DeleteRetargetingCampaign($id: ID!) {
    retargetingCampaignDelete(id: $id) { success result message }
  }
`;

export const LAUNCH_RETARGETING_CAMPAIGN = gql`
  mutation LaunchRetargetingCampaign($id: ID!) {
    retargetingCampaignLaunch(id: $id) { success result message }
  }
`;

export const PAUSE_RETARGETING_CAMPAIGN = gql`
  mutation PauseRetargetingCampaign($id: ID!) {
    retargetingCampaignPause(id: $id) { success result message }
  }
`;
