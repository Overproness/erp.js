// @ts-nocheck
const { gql } = require('graphql-tag');

const urlTypeDefs = gql`
  type URLEntry {
    _id: ID!
    originalUrl: String!
    shortCode: String!
    shortUrl: String
    title: String
    description: String
    tags: [String]
    campaign: ID
    clickCount: Int
    uniqueClickCount: Int
    lastClickedAt: DateTime
    expiresAt: DateTime
    isActive: Boolean
    password: String
    maxClicks: Int
    customSlug: String
    qrCode: String
    utmSource: String
    utmMedium: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input URLCreateInput {
    originalUrl: String!
    title: String
    description: String
    tags: [String]
    campaign: ID
    expiresAt: DateTime
    password: String
    maxClicks: Int
    customSlug: String
    utmSource: String
    utmMedium: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
  }

  input URLUpdateInput {
    originalUrl: String
    title: String
    description: String
    tags: [String]
    campaign: ID
    expiresAt: DateTime
    isActive: Boolean
    password: String
    maxClicks: Int
    utmSource: String
    utmMedium: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
  }

  extend type Query {
    urlRead(id: ID!): MutationResponse!
    urlList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    urlListAll: ListResponse!
    urlSearch(q: String!, fields: String): ListResponse!
    urlFilter(filter: String, equal: String): ListResponse!
    urlSummary: MutationResponse!
    urlAnalytics(id: ID!, period: String): MutationResponse!
    urlClickHistory(id: ID!, page: Int, limit: Int): ListResponse!
  }

  extend type Mutation {
    urlCreate(input: URLCreateInput!): MutationResponse!
    urlUpdate(id: ID!, input: URLUpdateInput!): MutationResponse!
    urlDelete(id: ID!): MutationResponse!
    urlBulkCreate(input: [URLCreateInput!]!): MutationResponse!
    urlBulkDelete(ids: [ID!]!): MutationResponse!
    urlGenerateQR(id: ID!): MutationResponse!
    urlDeactivate(id: ID!): MutationResponse!
    urlActivate(id: ID!): MutationResponse!
  }
`;

module.exports = urlTypeDefs;
