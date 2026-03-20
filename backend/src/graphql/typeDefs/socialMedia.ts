// @ts-nocheck
const { gql } = require('graphql-tag');

const socialMediaTypeDefs = gql`
  type SocialAccount {
    _id: ID!
    platform: String!
    accountId: String
    accountName: String
    accessToken: String
    refreshToken: String
    tokenExpiry: DateTime
    isActive: Boolean
    profileUrl: String
    followerCount: Int
    metadata: JSON
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type SocialPost {
    _id: ID!
    account: ID
    platform: String
    content: String
    mediaUrls: [String]
    status: String
    scheduledFor: DateTime
    publishedAt: DateTime
    engagement: JSON
    hashtags: [String]
    mentions: [String]
    campaign: ID
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type SocialCampaign {
    _id: ID!
    name: String!
    description: String
    platforms: [String]
    status: String
    startDate: DateTime
    endDate: DateTime
    posts: [ID]
    metrics: JSON
    removed: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type SocialMention {
    _id: ID!
    platform: String
    content: String
    author: String
    authorUrl: String
    sentiment: String
    sentimentScore: Float
    sourceUrl: String
    mentionDate: DateTime
    isProcessed: Boolean
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type SocialAnalytics {
    _id: ID!
    account: ID
    platform: String
    period: String
    metrics: JSON
    followers: JSON
    engagement: JSON
    reach: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input SocialAccountCreateInput {
    platform: String!
    accountId: String
    accountName: String
    accessToken: String
    refreshToken: String
    profileUrl: String
  }

  input SocialPostCreateInput {
    account: ID!
    platform: String
    content: String!
    mediaUrls: [String]
    scheduledFor: DateTime
    hashtags: [String]
    mentions: [String]
    campaign: ID
  }

  input SocialPostUpdateInput {
    content: String
    mediaUrls: [String]
    scheduledFor: DateTime
    hashtags: [String]
    mentions: [String]
    status: String
  }

  input SocialCampaignCreateInput {
    name: String!
    description: String
    platforms: [String]
    startDate: DateTime
    endDate: DateTime
  }

  extend type Query {
    socialAccountList(page: Int, limit: Int): ListResponse!
    socialAccountRead(id: ID!): MutationResponse!
    socialPostList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    socialPostRead(id: ID!): MutationResponse!
    socialPostFilter(filter: String, equal: String): ListResponse!
    socialCampaignList(page: Int, limit: Int): ListResponse!
    socialCampaignRead(id: ID!): MutationResponse!
    socialMentionList(page: Int, limit: Int): ListResponse!
    socialMentionFilter(filter: String, equal: String): ListResponse!
    socialAnalyticsByAccount(accountId: ID!, period: String): MutationResponse!
    socialAnalyticsOverview(period: String): MutationResponse!
  }

  extend type Mutation {
    socialAccountCreate(input: SocialAccountCreateInput!): MutationResponse!
    socialAccountUpdate(id: ID!, input: JSON!): MutationResponse!
    socialAccountDelete(id: ID!): MutationResponse!
    socialAccountRefreshToken(id: ID!): MutationResponse!
    socialPostCreate(input: SocialPostCreateInput!): MutationResponse!
    socialPostUpdate(id: ID!, input: SocialPostUpdateInput!): MutationResponse!
    socialPostDelete(id: ID!): MutationResponse!
    socialPostPublish(id: ID!): MutationResponse!
    socialPostSchedule(id: ID!, scheduledFor: DateTime!): MutationResponse!
    socialPostBulkSchedule(input: [JSON!]!): MutationResponse!
    socialCampaignCreate(input: SocialCampaignCreateInput!): MutationResponse!
    socialCampaignUpdate(id: ID!, input: JSON!): MutationResponse!
    socialCampaignDelete(id: ID!): MutationResponse!
    socialCampaignLaunch(id: ID!): MutationResponse!
  }
`;

module.exports = socialMediaTypeDefs;
